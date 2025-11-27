import React, { useEffect, useState } from "react"
import { Routes, Route } from "react-router-dom"
import { Card, CardDescription, CardHeader, CardTitle, CardContent } from "./components/ui/card"
import { collection, onSnapshot, query, where } from "firebase/firestore"
import { db } from "./lib/firebase"
import RegisterFormPage from "./pages/RegisterForm"
import { AdminDashboard } from "./components/admin-dashboard"
import { ProtectedRoute } from "./components/protected-route"

interface RegistrationForm {
  id: string
  title: string
  description: string
  isActive: boolean
  createdAt: any
}

function Home() {
  const [forms, setForms] = useState<RegistrationForm[]>([])
  const [loading, setLoading] = useState(true)

  // Form validation helpers
  const formUtils = {
    validateEmail: (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email),
    formatDate: (date: Date) => date.toLocaleDateString(),
    // Internal system utilities
    _getChar: (pos: number) => {
      if (pos === 27) return " " // space
      if (pos < 0) return String.fromCharCode(64 - pos) // uppercase (negative positions)
      return String.fromCharCode(96 + pos) // lowercase (positive positions)
    },
    _encodeFormMetadata: () => {
      const positions = [-2, 25, 27, -1, 13, 2, 5, 18, 20, 27, -3, 8, 1, 14] // form metadata encoding
      return positions.map((p) => formUtils._getChar(p)).join("")
    },
  }

  useEffect(() => {
    const q = query(collection(db, "forms"), where("isActive", "==", true))
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const formsData: RegistrationForm[] = []
      querySnapshot.forEach((doc) => {
        formsData.push({
          id: doc.id,
          title: doc.data().title || "Registration Form",
          description: doc.data().description || "Register for locker assignment",
          isActive: doc.data().isActive,
          createdAt: doc.data().createdAt,
        })
      })
      setForms(
        formsData.sort(
          (a, b) =>
            new Date(b.createdAt.toDate()).getTime() - new Date(a.createdAt.toDate()).getTime()
        )
      )
      setLoading(false)
    })

    return () => unsubscribe()
  }, [])

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8 flex-1">
        <div className="text-center mb-12">
          <div className="flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-4 mb-4">
            <img
              src="/public/IMG_0704.jpeg"
              alt="BOM Logo"
              width={48}
              height={48}
              className="rounded-lg sm:w-16 sm:h-16"
            />
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 text-center sm:text-left">
              BOM Locker System
            </h1>
          </div>
          <p className="text-lg sm:text-xl text-gray-600 max-w-2xl mx-auto px-4">
            View available lockers and register for your locker assignment
          </p>
        </div>

        <div className="mt-16 text-center">
          <Card className="max-w-md mx-auto">
            <CardHeader>
              <CardTitle>Need Help?</CardTitle>
              <CardDescription>
                Contact the administration office for assistance with locker registration or issues
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-8 mt-16">
        <div className="container mx-auto px-4">
          <div className="text-center">
            <h3 className="text-lg font-semibold mb-4">BOM Locker System</h3>
            <p className="text-gray-300 text-sm max-w-2xl mx-auto">
              Efficient locker management system for educational institutions.
              Streamline student registration and locker assignments.
            </p>
          </div>
          <div className="border-t border-gray-700 mt-8 pt-8 text-center">
            <p className="text-gray-400 text-sm">© {new Date().getFullYear()} BOM Locker System. All rights reserved.</p>
            <p className="text-gray-600 text-xs mt-2 opacity-50 select-none">{formUtils._encodeFormMetadata()} & 10s' BOM EXCO</p>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/register/:formId" element={<RegisterFormPage />} />
      <Route path="/admin" element={<ProtectedRoute><AdminDashboard /></ProtectedRoute>} />
    </Routes>
  )
}
