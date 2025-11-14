#!/usr/bin/env node
/**
 * migrate-responses.js
 *
 * Usage:
 * 1. Install firebase-admin: npm install firebase-admin
 * 2. Provide a service account JSON and set GOOGLE_APPLICATION_CREDENTIALS to its path,
 *    or place it at ./serviceAccountKey.json
 * 3. Run a dry-run first to preview changes:
 *    node scripts/migrate-responses.js --dry
 * 4. Then run for real:
 *    node scripts/migrate-responses.js
 *
 * What it does:
 * - Iterates all documents in the "responses" collection
 * - Normalizes studentData into the canonical shape:
 *   { name, schoolNumber, class, contactNumber, createdAt, rawData }
 * - Updates each document (or prints changes in dry-run)
 *
 * IMPORTANT: Back up your database or test on a copy before running.
 */

const admin = require("firebase-admin")
const argv = require("minimist")(process.argv.slice(2))

const DRY_RUN = !!argv.dry

const serviceAccountPath = process.env.GOOGLE_APPLICATION_CREDENTIALS || "./serviceAccountKey.json"

try {
  const svc = require(serviceAccountPath)
  admin.initializeApp({
    credential: admin.credential.cert(svc),
  })
} catch (err) {
  console.error("Failed to load service account key. Set GOOGLE_APPLICATION_CREDENTIALS or place serviceAccountKey.json in repo root.")
  console.error(err.message)
  process.exit(1)
}

const db = admin.firestore()

function normalizeStudentData(sd = {}) {
  // Accept both nested Firestore Timestamps and plain values - preserve createdAt if present
  const createdAt = sd.createdAt || sd.created_at || sd.timestamp || null

  const normalized = {
    name: sd.name || sd.fullName || sd.studentName || sd.student || "",
    schoolNumber: sd.schoolNumber || sd.studentId || sd.id || sd.schoolNo || "",
    class: sd.class || sd.grade || sd.className || "",
    contactNumber: sd.contactNumber || sd.contact || sd.phone || sd.mobile || "",
    createdAt: createdAt,
    rawData: sd, // keep original for debugging
  }

  return normalized
}

async function migrate() {
  console.log(`Starting migration (dryRun=${DRY_RUN})...`)

  const colRef = db.collection("responses")
  const snapshot = await colRef.get()

  console.log(`Found ${snapshot.size} response documents`)

  let updated = 0
  let skipped = 0
  let failed = 0

  for (const docSnap of snapshot.docs) {
    const docRef = docSnap.ref
    const data = docSnap.data() || {}
    const sd = data.studentData || {}

    const normalized = normalizeStudentData(sd)

    // Compare current vs normalized to avoid unnecessary writes
    const needsUpdate =
      (sd.name !== normalized.name) ||
      (sd.schoolNumber !== normalized.schoolNumber) ||
      (sd.class !== normalized.class) ||
      (sd.contactNumber !== normalized.contactNumber) ||
      (!sd.rawData) // ensure rawData exists

    if (!needsUpdate) {
      skipped++
      continue
    }

    console.log(`Document: ${docRef.id}`)
    console.log("  Before:", JSON.stringify(sd, null, 2))
    console.log("  After: ", JSON.stringify(normalized, null, 2))

    if (DRY_RUN) {
      updated++
      continue
    }

    try {
      await docRef.update({
        studentData: normalized,
      })
      updated++
    } catch (err) {
      failed++
      console.error(`Failed to update ${docRef.id}:`, err.message)
    }
  }

  console.log("Migration complete.")
  console.log(`  updated: ${updated}`)
  console.log(`  skipped: ${skipped}`)
  console.log(`  failed:  ${failed}`)

  process.exit(failed > 0 ? 2 : 0)
}

migrate().catch((err) => {
  console.error("Migration error:", err)
  process.exit(1)
})
