"use client"

import { useState } from "react"

type Locker = {
  lockerNumber: string
  studentName: string
  studentID: string
  className: string
}

export function LockerManagementOverview(): JSX.Element {
  const [lockers, setLockers] = useState<Locker[]>([])

  return (
    <div className="p-4">
      {/* Locker form removed per request - creation/edits handled elsewhere */}

      <h3 className="mt-6 text-md font-medium">Locker Table</h3>
      <div className="overflow-auto mt-2">
        <table className="w-full border-collapse">
          <thead>
            <tr>
              <th className="border px-2 py-1 text-left">Locker</th>
              <th className="border px-2 py-1 text-left">Student ID</th>
              <th className="border px-2 py-1 text-left">Name</th>
              <th className="border px-2 py-1 text-left">Class</th>
            </tr>
          </thead>
          <tbody>
            {lockers.map((lk, i) => (
              <tr key={i}>
                <td className="border px-2 py-1">{lk.lockerNumber}</td>
                <td className="border px-2 py-1">{lk.studentID}</td>
                <td className="border px-2 py-1">{lk.studentName}</td>
                <td className="border px-2 py-1">{lk.className}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
