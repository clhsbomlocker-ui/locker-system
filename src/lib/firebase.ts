import { initializeApp } from "firebase/app"
import { getAuth } from "firebase/auth"
import { getFirestore } from "firebase/firestore"
import { getStorage } from "firebase/storage"

const firebaseConfig = {
  apiKey: "AIzaSyAODrWCLvQoQs9cwCEKakyoENUeArL21-w",
  authDomain: "clhsbomlocker-8382b.firebaseapp.com",
  projectId: "clhsbomlocker-8382b",
  storageBucket: "clhsbomlocker-8382b.firebasestorage.app",
  messagingSenderId: "17916640649",
  appId: "1:17916640649:web:c886c175a817d618383558",
  measurementId: "G-BFFHFGE3DY"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig)

// Initialize Firebase services
export const auth = getAuth(app)
export const db = getFirestore(app)
export const storage = getStorage(app)

export default app
