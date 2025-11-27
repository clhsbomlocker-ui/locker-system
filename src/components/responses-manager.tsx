"use client"

import { useState, useEffect } from "react"
import { Button } from "@/src/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/src/components/ui/card"
import { Input } from "@/src/components/ui/input"
import { Badge } from "@/src/components/ui/badge"
import { Checkbox } from "@/src/components/ui/checkbox"
import { Search, Download, User, Phone, GraduationCap, Hash, Trash2, Trash } from "lucide-react"
import { collection, query, orderBy, onSnapshot, deleteDoc, doc, writeBatch } from "firebase/firestore"
import { db } from "@/src/lib/firebase"
import { useAuth } from "./auth-provider"

interface FormResponse {
  id: string
  formId: string
  studentData: {
    name: string
    schoolNumber: string
    class: string
    contactNumber: string
    createdAt: any
  }
  submittedAt: any
}

export function ResponsesManager() {
  const [responses, setResponses] = useState<FormResponse[]>([])
  const [filteredResponses, setFilteredResponses] = useState<FormResponse[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [loading, setLoading] = useState(true)
  const [selectedResponses, setSelectedResponses] = useState<Set<string>>(new Set())
  const [deleting, setDeleting] = useState(false)
  const { user } = useAuth()
  const [assignedMap, setAssignedMap] = useState<Record<string, string>>({})

  // Load form responses
  useEffect(() => {
    if (!user) {
      setLoading(false)
      return
    }

    const q = query(collection(db, "responses"), orderBy("submittedAt", "desc"))

    const unsubscribe = onSnapshot(
      q,
      (querySnapshot) => {
        const responsesData: FormResponse[] = []
        querySnapshot.forEach((doc) => {
          responsesData.push({ id: doc.id, ...doc.data() } as FormResponse)
        })
        setResponses(responsesData)
        setFilteredResponses(responsesData)
        setLoading(false)
      },
      (error) => {
        console.error("Firestore error:", error)
        setLoading(false)
      },
    )

    return () => unsubscribe()
  }, [user])

  // Load locker assignments
  useEffect(() => {
    const q = query(collection(db, "assignments"))
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const map: Record<string, string> = {}
        snapshot.forEach((doc) => {
          const data = doc.data() as any
          if (data.studentId) {
            map[data.studentId] = data.lockerId || ""
          }
        })
        setAssignedMap(map)
      },
      (error) => {
        console.error("Assignments error:", error)
      },
    )
    return () => unsubscribe()
  }, [])

  // Search filter
  useEffect(() => {
    if (searchTerm) {
      const filtered = responses.filter(
        (response: FormResponse) =>
          response.studentData.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          response.studentData.schoolNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
          response.studentData.class.toLowerCase().includes(searchTerm.toLowerCase()),
      )
      setFilteredResponses(filtered)
    } else {
      setFilteredResponses(responses)
    }
  }, [searchTerm, responses])

  const getContact = (response: FormResponse) => {
    const sd = response.studentData as any
    return sd.contactNumber || sd.contact || sd.phone || sd.mobile || ""
  }

  // Export CSV
  const exportToCSV = () => {
    const rowObjects = filteredResponses.map((response: FormResponse) => {
      const lockerId = assignedMap[response.id] || ""
      const lockerNo = lockerId ? lockerId.replace("locker_", "") : "NO RENT"
      const lockerNum = lockerNo === "NO RENT" ? Number.POSITIVE_INFINITY : parseInt(lockerNo, 10)
      return {
        lockerNo,
        lockerNum,
        name: response.studentData.name,
        cls: response.studentData.class,
        schoolNumber: response.studentData.schoolNumber,
      }
    })

    rowObjects.sort((a, b) => a.lockerNum - b.lockerNum)

    const rows = rowObjects.map((r, idx) => [
      (idx + 1).toString(),
      r.lockerNo,
      r.name,
      r.cls,
      r.schoolNumber,
    ])

    const header = ["NO.", "LOCKER NO.", "NAME", "CLASS", "SCHOOL NUMBER"]

    const csv = [header, ...rows]
      .map((row) => row.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(","))
      .join("\n")

    const blob = new Blob([csv], { type: "text/csv" })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `responses_${new Date().toISOString().split("T")[0]}.csv`
    a.click()
    window.URL.revokeObjectURL(url)
  }

  // Delete one
  const deleteResponse = async (id: string) => {
    try {
      setDeleting(true)
      await deleteDoc(doc(db, "responses", id))
    } finally {
      setDeleting(false)
    }
  }

  // Delete many
  const deleteMultiple = async (ids: string[]) => {
    try {
      setDeleting(true)
      const batch = writeBatch(db)
      ids.forEach((id) => batch.delete(doc(db, "responses", id)))
      await batch.commit()
      setSelectedResponses(new Set())
    } finally {
      setDeleting(false)
    }
  }

  const deleteAll = () => deleteMultiple(filteredResponses.map((r) => r.id))
  const deleteSelected = () => deleteMultiple([...selectedResponses])

  const toggleSelect = (id: string) => {
    const next = new Set(selectedResponses)
    next.has(id) ? next.delete(id) : next.add(id)
    setSelectedResponses(next)
  }

  const toggleAll = () => {
    if (selectedResponses.size === filteredResponses.length) {
      setSelectedResponses(new Set())
    } else {
      setSelectedResponses(new Set(filteredResponses.map((r) => r.id)))
    }
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6 text-center">Loading responses...</CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex flex-col lg:flex-row justify-between gap-4">
        <div className="flex items-center gap-4">
          <h2 className="text-xl font-semibold">
            Form Responses ({responses.length})
          </h2>

          {filteredResponses.length > 0 && (
            <div className="flex items-center gap-2">
              <Checkbox
                checked={
                  selectedResponses.size === filteredResponses.length &&
                  filteredResponses.length > 0
                }
                onCheckedChange={toggleAll}
              />
              <span className="text-sm text-gray-600">
                {selectedResponses.size > 0
                  ? `${selectedResponses.size} selected`
                  : "Select All"}
              </span>
            </div>
          )}
        </div>

        {/* CONTROLS */}
        <div className="flex flex-col sm:flex-row gap-2">
          {selectedResponses.size > 0 && (
            <Button
              variant="destructive"
              size="sm"
              disabled={deleting}
              onClick={() =>
                confirm(`Delete ${selectedResponses.size}?`) && deleteSelected()
              }
            >
              <Trash2 className="mr-2 h-4 w-4" /> Delete Selected
            </Button>
          )}

          {filteredResponses.length > 0 && (
            <Button
              variant="destructive"
              size="sm"
              disabled={deleting}
              onClick={() =>
                confirm(`Delete ALL ${filteredResponses.length}?`) && deleteAll()
              }
            >
              <Trash className="mr-2 h-4 w-4" /> Delete All
            </Button>
          )}

          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search name / school no / class..."
              className="pl-10 sm:w-64"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <Button
            variant="outline"
            onClick={exportToCSV}
            disabled={filteredResponses.length === 0}
          >
            <Download className="mr-2 h-4 w-4" /> Export CSV
          </Button>
        </div>
      </div>

      {/* EMPTY STATE */}
      {filteredResponses.length === 0 ? (
        <Card>
          <CardContent className="p-6 text-center text-gray-500">
            {searchTerm
              ? "No results match your search."
              : "No form responses yet."}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {filteredResponses.map((r) => (
            <Card key={r.id}>
              <CardHeader>
                <div className="flex justify-between items-center gap-4">
                  <div className="flex gap-2 items-center">
                    <Checkbox
                      checked={selectedResponses.has(r.id)}
                      onCheckedChange={() => toggleSelect(r.id)}
                    />
                    <CardTitle>{r.studentData.name}</CardTitle>
                  </div>

                  <div className="flex gap-2 items-center">
                    <Badge variant="secondary">
                      {new Date(r.submittedAt.toDate()).toLocaleDateString()}
                    </Badge>

                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() =>
                        confirm(`Delete ${r.studentData.name}?`) &&
                        deleteResponse(r.id)
                      }
                    >
                      <Trash2 className="text-red-500" />
                    </Button>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="space-y-3">
                <InfoRow icon={Hash} label="School Number" value={r.studentData.schoolNumber} />
                <InfoRow icon={GraduationCap} label="Class" value={r.studentData.class} />
                <InfoRow icon={Phone} label="Contact" value={getContact(r)} />

                <div className="flex items-start gap-3 p-2 bg-gray-50 rounded-lg">
                  <User className="h-5 w-5 text-gray-400 mt-0.5" />
                  <div className="flex-1">
                    <div className="text-sm text-gray-600">Locker Status</div>
                    {assignedMap[r.id] ? (
                      <Badge variant="secondary">
                        Assigned — {assignedMap[r.id].replace("locker_", "")}
                      </Badge>
                    ) : (
                      <Badge variant="outline">Pending Assignment</Badge>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

function InfoRow({ icon: Icon, label, value }: any) {
  return (
    <div className="flex items-start gap-3 p-2 bg-gray-50 rounded-lg">
      <Icon className="h-5 w-5 text-gray-400 mt-0.5" />
      <div className="flex-1">
        <div className="text-sm text-gray-600">{label}</div>
        <div className="text-base font-medium break-all">{value}</div>
      </div>
    </div>
  )
}

