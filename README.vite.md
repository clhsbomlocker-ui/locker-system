# Locker (Vite scaffold)

This repository now includes a minimal Vite + React + TypeScript scaffold to help migrate parts of the Next.js app into a client-side application.

Quick start (from the repo root):

- Use the separate package manifest `package.vite.json` for the Vite app. You can copy its contents into your real `package.json` or use it as a reference.

To run locally (recommended):

1. Create a new package.json or merge `package.vite.json` into your existing `package.json`.
2. Install dependencies: `pnpm install` or `npm install`.
3. Start dev server: `pnpm dev` or `npm run dev`.

Notes:
- This is a scaffold only — your original Next.js app remains intact under the same repository. Move components you want into `src/` and update imports as needed.
- If you want I can merge `package.vite.json` into the main `package.json` and add lockfile changes; say the word and I will do it.
