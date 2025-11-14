"use client"

import { useState } from "react"
import { StudentSearch } from "./student-search"
import { LockerGrid } from "./locker-grid"
import type { Student } from "@/src/lib/types"

export function LockerManager() {
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null)

  const handleAssignmentComplete = () => {
    setSelectedStudent(null)
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 order-2 lg:order-1">
          <StudentSearch onStudentSelect={setSelectedStudent} selectedStudent={selectedStudent} />
        </div>
        <div className="lg:col-span-2 order-1 lg:order-2">
          <LockerGrid selectedStudent={selectedStudent} onAssignmentComplete={handleAssignmentComplete} />
        </div>
      </div>
    </div>
  )
}
