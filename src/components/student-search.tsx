"use client"

import { useState, useEffect } from "react"
import { Button } from "@/src/components/ui/button"
import { Input } from "@/src/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/src/components/ui/card"
import { Badge } from "@/src/components/ui/badge"
import { Search, User, Hash, GraduationCap, Phone, X } from "lucide-react"
import { collection, query, onSnapshot } from "firebase/firestore"
import { db } from "@/src/lib/firebase"
import type { Student } from "@/src/lib/types"
import { useAuth } from "./auth-provider"

interface StudentSearchProps {
  onStudentSelect: (student: Student | null) => void
  selectedStudent?: Student | null
}

export function StudentSearch({ onStudentSelect, selectedStudent }: StudentSearchProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [students, setStudents] = useState<Student[]>([])
  const [filteredStudents, setFilteredStudents] = useState<Student[]>([])
  const [loading, setLoading] = useState(false)
  const { user } = useAuth() // Added auth check

  useEffect(() => {
    if (!user) {
      return
    }

    // Listen to form responses to get student data
    const q = query(collection(db, "responses"))
    const unsubscribe = onSnapshot(
      q,
      (querySnapshot) => {
        const studentsData: Student[] = []
        querySnapshot.forEach((doc) => {
          const data = doc.data()
          studentsData.push({
            id: doc.id,
            ...data.studentData,
          } as Student)
        })
        setStudents(studentsData)
      },
      (error) => {
        console.error("[v0] Firestore permission error in student search:", error)
      },
    )

    return () => unsubscribe()
  }, [user]) // Added user dependency

  useEffect(() => {
    if (searchTerm) {
      setLoading(true)
      const filtered = students.filter(
        (student) =>
          student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          student.schoolNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
          student.class.toLowerCase().includes(searchTerm.toLowerCase()),
      )
      setFilteredStudents(filtered)
      setLoading(false)
    } else {
      setFilteredStudents([])
    }
  }, [searchTerm, students])

  const handleStudentSelect = (student: Student) => {
    onStudentSelect(student)
    setSearchTerm("")
    setFilteredStudents([])
  }

  const handleClearSelection = () => {
    onStudentSelect(null)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Student Search</h3>
        {selectedStudent && (
          <Button variant="outline" size="sm" onClick={handleClearSelection}>
            <X className="h-4 w-4 mr-2" />
            Clear Selection
          </Button>
        )}
      </div>

      {selectedStudent ? (
        <Card className="border-blue-200 bg-blue-50">
          <CardHeader>
            <CardTitle className="text-base text-blue-800">Selected Student</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-blue-600" />
                <span className="font-medium">{selectedStudent.name}</span>
              </div>
              <div className="flex items-center gap-2">
                <Hash className="h-4 w-4 text-blue-600" />
                <span className="text-sm">School Number: {selectedStudent.schoolNumber}</span>
              </div>
              <div className="flex items-center gap-2">
                <GraduationCap className="h-4 w-4 text-blue-600" />
                <span className="text-sm">Class: {selectedStudent.class}</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-blue-600" />
                <span className="text-sm">Contact: {selectedStudent.contactNumber}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search by name, school number, or class..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          {loading && (
            <Card>
              <CardContent className="p-4">
                <div className="text-center text-gray-500">Searching...</div>
              </CardContent>
            </Card>
          )}

          {searchTerm && !loading && filteredStudents.length === 0 && (
            <Card>
              <CardContent className="p-4">
                <div className="text-center text-gray-500">No students found matching your search.</div>
              </CardContent>
            </Card>
          )}

          {filteredStudents.length > 0 && (
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {filteredStudents.map((student) => (
                <Card
                  key={student.id}
                  className="cursor-pointer hover:bg-gray-50"
                  onClick={() => handleStudentSelect(student)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium">{student.name}</h4>
                        <div className="flex items-center gap-4 text-sm text-gray-600">
                          <span>#{student.schoolNumber}</span>
                          <span>{student.class}</span>
                        </div>
                      </div>
                      <Badge variant="outline">Select</Badge>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
