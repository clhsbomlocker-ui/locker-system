import { initializeApp } from "firebase/app"
import { getAuth } from "firebase/auth"
import { getFirestore } from "firebase/firestore"
import { getStorage } from "firebase/storage"

const firebaseConfig = {
  apiKey: "AIzaSyBIuTJIj6vkMcerk16Rzll1FtT5ciTZulY",
  authDomain: "clhs-bom-locker.firebaseapp.com",
  projectId: "clhs-bom-locker",
  storageBucket: "clhs-bom-locker.firebasestorage.app",
  messagingSenderId: "86208175190",
  appId: "1:86208175190:web:a5ab067120742f85c92ff7",
  measurementId: "G-CPQGZS6YRS",
}

// Initialize Firebase
const app = initializeApp(firebaseConfig)

// Initialize Firebase services
export const auth = getAuth(app)
export const db = getFirestore(app)
export const storage = getStorage(app)

export default app
