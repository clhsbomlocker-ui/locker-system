# Locker — Local Development Setup

Short guide to get this project running locally.

## Prerequisites

- Node.js 18+ (LTS recommended)  
- npm or pnpm (project includes both package-lock.json and pnpm-lock.yaml)  
- A Firebase project (to provide API keys / config)

## Quick start

1. Clone the repo
```bash
git clone https://github.com/acwz09/Locker.git
cd Locker
```

2. Install dependencies
```bash
# with npm
npm install

# or with pnpm
pnpm install
```

3. Provide Firebase config (recommended)
- Create a file named `.env.local` at the repo root and add the following variables (replace values with your Firebase project values):
```bash
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_auth_domain
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_storage_bucket
VITE_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
VITE_FIREBASE_APP_ID=your_app_id
VITE_FIREBASE_MEASUREMENT_ID=your_measurement_id
```
- Ensure `.env.local` is ignored by git (add to `.gitignore` if needed).

4. Update `src/lib/firebase.ts` to read env variables (example)
```ts
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
}
```
Note: Vite exposes env vars that start with `VITE_` via `import.meta.env`.

5. Run the dev server
```bash
npm run dev
# or
pnpm dev
```
Open the URL shown by Vite (usually http://localhost:5173).

6. Build / preview
```bash
npm run build
npm run preview
# or with pnpm
pnpm build
pnpm preview
```

## Notes & troubleshooting

- If Firebase services fail to initialize, confirm `.env.local` values are correct and restart the dev server.  
- The project currently contains a direct firebase config in `src/lib/firebase.ts`. Moving to env vars (as shown above) avoids committing keys to git.  
- API routes: see `src/api/lockers/route.ts`.  
- Static assets are in `public/`.

## Contributing / Commit

- Add `.env.local` to `.gitignore` before committing.  
- Follow the existing TypeScript + React patterns used in `src/`.
