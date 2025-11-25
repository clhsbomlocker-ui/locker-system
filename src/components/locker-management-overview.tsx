 import { useState, useEffect } from "react"
import { Button } from "@/src/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/src/components/ui/card"
import { Download } from "lucide-react"
import { collection, query, onSnapshot } from "firebase/firestore"
import { db } from "@/src/lib/firebase"
import type { Locker } from "@/src/lib/types"

export function LockerManagementOverview() {
  const [lockers, setLockers] = useState<Locker[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const q = query(collection(db, "lockers"))
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const lockerList: Locker[] = []

      snapshot.forEach((doc) => {
        lockerList.push({
          id: doc.id,
          ...doc.data(),
        } as Locker)
      })

      setLockers(lockerList)
      setLoading(false)
    })

    return () => unsubscribe()
  }, [])

  const safeToDate = (value: any): string => {
    if (!value) return ""
    if (value.toDate) return value.toDate().toLocaleString() // Firestore Timestamp
    if (typeof value === "string" || typeof value === "number")
      return new Date(value).toLocaleString()
    return ""
  }

  const parseSafeInt = (value: any): number => {
    const n = parseInt(value)
    return isNaN(n) ? 0 : n
  }

  const downloadCSV = (by: "form" | "number") => {
    let rows = lockers

    if (by === "number") {
      rows = [...lockers].sort((a, b) => parseSafeInt(a.number) - parseSafeInt(b.number))
    }

    const header = ["Locker Number", "Row", "Column", "Occupied", "Student ID", "Assigned At", "Broken", "Remarks"]

    const csv = [header.join(",")]
      .concat(
        rows.map((l) =>
          [
            l.number,
            l.row,
            l.column,
            l.isOccupied ? "Yes" : "No",
            l.studentId || "",
            safeToDate(l.assignedAt),
            l.isBroken ? "Yes" : "No",
            l.brokenRemarks || "",
          ].join(",")
        )
      )
      .join("\n")

    const blob = new Blob([csv], { type: "text/csv" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `locker-list-by-${by}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Locker Management Overview</CardTitle>
      </CardHeader>

      <CardContent>
        <div className="flex justify-between items-center mb-4">
          <span className="font-semibold">
            Registered Lockers ({lockers.length})
          </span>

          <div className="flex gap-2">
            <Button variant="outline" onClick={() => downloadCSV("form")}>
              Download by Form
              <Download className="ml-2 h-4 w-4" />
            </Button>

            <Button variant="outline" onClick={() => downloadCSV("number")}>
              Download by Number
              <Download className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full text-sm border">
            <thead>
              <tr>
                <th className="border px-2 py-1">Locker Number</th>
                <th className="border px-2 py-1">Row</th>
                <th className="border px-2 py-1">Column</th>
                <th className="border px-2 py-1">Occupied</th>
                <th className="border px-2 py-1">Student ID</th>
                <th className="border px-2 py-1">Assigned At</th>
                <th className="border px-2 py-1">Broken</th>
                <th className="border px-2 py-1">Remarks</th>
              </tr>
            </thead>

            <tbody>
              {lockers.map((locker) => (
                <tr key={locker.id}>
                  <td className="border px-2 py-1">{locker.number}</td>
                  <td className="border px-2 py-1">{locker.row}</td>
                  <td className="border px-2 py-1">{locker.column}</td>
                  <td className="border px-2 py-1">
                    {locker.isOccupied ? "Yes" : "No"}
                  </td>
                  <td className="border px-2 py-1">{locker.studentId || ""}</td>
                  <td className="border px-2 py-1">{safeToDate(locker.assignedAt)}</td>
                  <td className="border px-2 py-1">
                    {locker.isBroken ? "Yes" : "No"}
                  </td>
                  <td className="border px-2 py-1">{locker.brokenRemarks || ""}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {loading && <div className="text-center py-4">Loading lockers...</div>}
      </CardContent>
    </Card>
  )
}
