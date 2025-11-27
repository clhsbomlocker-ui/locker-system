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
  const [form, setForm] = useState<Locker>({ lockerNumber: "", studentName: "", studentID: "", className: "" })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    } as unknown as Locker)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setLockers([...lockers, form])
    setForm({ lockerNumber: "", studentName: "", studentID: "", className: "" })
  }

  return (
    <div className="p-4">
      <h2 className="text-lg font-semibold mb-2">Locker Form</h2>

      <form onSubmit={handleSubmit} className="space-y-2">
        <input
          name="lockerNumber"
          placeholder="Locker Number"
          value={form.lockerNumber}
          onChange={handleChange}
          className="border p-2 rounded w-full"
        />

        <input
          name="studentName"
          placeholder="Student Name"
          value={form.studentName}
          onChange={handleChange}
          className="border p-2 rounded w-full"
        />

        <input
          name="studentID"
          placeholder="Student ID"
          value={form.studentID}
          onChange={handleChange}
          className="border p-2 rounded w-full"
        />

        <input
          name="className"
          placeholder="Class"
          value={form.className}
          onChange={handleChange}
          className="border p-2 rounded w-full"
        />

        <button type="submit" className="px-3 py-1 bg-blue-600 text-white rounded">Save</button>
      </form>

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
