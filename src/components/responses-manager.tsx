"use client"

import { useState, useEffect } from "react"
import { Button } from "@/src/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/src/components/ui/card"
import { Input } from "@/src/components/ui/input"
import { Badge } from "@/src/components/ui/badge"
import { Checkbox } from "@/src/components/ui/checkbox"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/src/components/ui/alert-dialog"
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
  const { user } = useAuth() // Added auth check
  const [assignedMap, setAssignedMap] = useState<Record<string, string>>({})

  // Ensure these variables are accessible in all functions below
  // ...existing code...

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
        console.error("[v0] Firestore permission error in responses:", error)
        setLoading(false)
      },
    )

    return () => unsubscribe()
  }, [user]) // Added user dependency

  // Listen for assignments and build a quick lookup of responseId -> lockerId
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
        console.error("[v0] Firestore permission error in assignments listener:", error)
      },
    )
    return () => unsubscribe()
  }, [])

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

  // Helper to resolve contact value regardless of stored field name
  const getContact = (response: FormResponse) => {
    const sd = response.studentData as any
    return sd.contactNumber || sd.contact || sd.phone || sd.mobile || ""
  }

  const exportToCSV = () => {
    // Build row objects so we can sort by numeric locker number (unassigned go last)
    const rowObjects = filteredResponses.map((response: FormResponse) => {
      const lockerId = assignedMap[response.id] || ""
      const lockerNo = lockerId ? lockerId.replace("locker_", "") : "no rent"
      const lockerNum = lockerNo === "no rent" ? Number.POSITIVE_INFINITY : parseInt(lockerNo, 10)
      return {
        lockerNo,
        lockerNum,
        name: response.studentData.name,
        cls: response.studentData.class,
        schoolNumber: response.studentData.schoolNumber,
      }
    })

    // Sort by numeric locker number ascending; unassigned ("no rent" -> Infinity) will land at the end
    rowObjects.sort((a, b) => a.lockerNum - b.lockerNum)

    // Map to CSV rows and assign NO. based on sorted order
    const rows = rowObjects.map((r, idx) => [
      (idx + 1).toString(),
      r.lockerNo,
      r.name,
      r.cls,
      r.schoolNumber,
    ])

    const header = ["NO.", "LOCKER NO.", "NAME", "CLASS", "SCHOOL NUMBER"]

    // CSV safe quoting for fields containing commas/quotes/newlines
    const csvContent = [header, ...rows]
      .map((row) =>
        row
          .map((field) => {
            const escaped = String(field ?? "").replace(/"/g, '""')
            return `"${escaped}"`
          })
          .join(","),
      )
      .join("\n")

    const blob = new Blob([csvContent], { type: "text/csv" })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `student_responses_${new Date().toISOString().split("T")[0]}.csv`
    a.click()
    window.URL.revokeObjectURL(url)
  }

  const deleteResponse = async (responseId: string) => {
    try {
      setDeleting(true)
      await deleteDoc(doc(db, "responses", responseId))
    } catch (error) {
      console.error("Error deleting response:", error)
      alert(`Error deleting response: ${error}`)
    } finally {
      setDeleting(false)
    }
  }

  const deleteMultipleResponses = async (responseIds: string[]) => {
    try {
      setDeleting(true)
      const batch = writeBatch(db)
      
      responseIds.forEach((id) => {
        batch.delete(doc(db, "responses", id))
      })
      
      await batch.commit()
      setSelectedResponses(new Set())
    } catch (error) {
      console.error("Error deleting responses:", error)
      alert(`Error deleting responses: ${error}`)
    } finally {
      setDeleting(false)
    }
  }

  const deleteAllResponses = async () => {
  const allIds = filteredResponses.map((response: FormResponse) => response.id)
  await deleteMultipleResponses(allIds)
  }

  const deleteSelectedResponses = async () => {
    const selectedIds = Array.from(selectedResponses)
    await deleteMultipleResponses(selectedIds)
  }

  const toggleSelectResponse = (responseId: string) => {
    const newSelected = new Set(selectedResponses)
    if (newSelected.has(responseId)) {
      newSelected.delete(responseId)
    } else {
      newSelected.add(responseId)
    }
    setSelectedResponses(newSelected)
  }

  const toggleSelectAll = () => {
    if (selectedResponses.size === filteredResponses.length) {
      setSelectedResponses(new Set())
    } else {
      const allIds = filteredResponses.map((response: FormResponse) => response.id)
      setSelectedResponses(new Set(allIds))
    }
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center py-8">Loading responses...</div>
        </CardContent>
      </Card>
    )
  }

  return (
    <React.Fragment>
      <div className="space-y-6">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <h2 className="text-xl font-semibold">Form Responses ({responses.length})</h2>
            {filteredResponses.length > 0 && (
              <div className="flex items-center gap-2">
              <Checkbox
                checked={selectedResponses.size === filteredResponses.length && filteredResponses.length > 0}
                onCheckedChange={toggleSelectAll}
                aria-label="Select all responses"
              />
                <span className="text-sm text-gray-600">
                  {selectedResponses.size > 0 ? `${selectedResponses.size} selected` : "Select all"}
                </span>
            </div>
          )}
        </div>
          <div className="flex flex-col sm:flex-row gap-2 w-full lg:w-auto">
            {selectedResponses.size > 0 && (
              <Button
                variant="destructive"
                size="sm"
                disabled={deleting}
                onClick={() => {
                  if (window.confirm(`Are you sure you want to delete ${selectedResponses.size} selected response${selectedResponses.size > 1 ? 's' : ''}? This action cannot be undone.`)) {
                    deleteSelectedResponses()
                  }
                }}
                className="w-full sm:w-auto"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete Selected ({selectedResponses.size})
              </Button>
            )}
            {filteredResponses.length > 0 && (
              <Button
                variant="destructive"
                size="sm"
                disabled={deleting}
                onClick={() => {
                  if (window.confirm(`Are you sure you want to delete all ${filteredResponses.length} response${filteredResponses.length > 1 ? 's' : ''}? This action cannot be undone.`)) {
                    deleteAllResponses()
                  }
                }}
                className="w-full sm:w-auto"
              >
                <Trash className="h-4 w-4 mr-2" />
                Delete All
              </Button>
            )}
            <div className="relative w-full sm:w-auto">
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search by name, school number, or class..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 w-full sm:w-64"
            />
          </div>
            <Button variant="outline" onClick={exportToCSV} disabled={filteredResponses.length === 0}>
              <Download className="h-4 w-4 mr-2" />
              Export CSV
            </Button>
        </div>
      </div>

      {filteredResponses.length === 0 ? (
        <Card>
          <CardContent className="p-6">
            <div className="text-center text-gray-500 py-8">
              {searchTerm
                ? "No responses match your search."
                : "No responses yet. Share your registration form to start collecting data."}
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {filteredResponses.map((response: FormResponse) => (
            <Card key={response.id}>
              <CardHeader>
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <Checkbox
                      checked={selectedResponses.has(response.id)}
                      onCheckedChange={() => toggleSelectResponse(response.id)}
                      aria-label={`Select response from ${response.studentData.name}`}
                      className="flex-shrink-0"
                    />
                    <CardTitle className="text-lg truncate">{response.studentData.name}</CardTitle>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <Badge
                      variant="secondary"
                      title={new Date(response.submittedAt.toDate()).toLocaleString()}
                      aria-label={new Date(response.submittedAt.toDate()).toLocaleString()}
                      className="hidden sm:inline-flex text-[10px] sm:text-xs overflow-hidden truncate"
                    >
                      {new Date(response.submittedAt.toDate()).toLocaleDateString()}
                    </Badge>
                    <Badge
                      variant="secondary"
                      title={new Date(response.submittedAt.toDate()).toLocaleString()}
                      aria-label={new Date(response.submittedAt.toDate()).toLocaleString()}
                      className="sm:hidden text-[10px] overflow-hidden truncate"
                    >
                      {new Date(response.submittedAt.toDate()).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </Badge>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      disabled={deleting}
                      onClick={() => {
                        if (window.confirm(`Are you sure you want to delete the response from ${response.studentData.name}? This action cannot be undone.`)) {
                          deleteResponse(response.id)
                        }
                      }}
                    >
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="grid grid-cols-1 gap-3">
                    <div className="flex items-start gap-3 p-2 bg-gray-50 rounded-lg">
                      <Hash className="h-5 w-5 text-gray-400 flex-shrink-0 mt-0.5" />
                      <div className="min-w-0 flex-1">
                        <div className="text-sm font-medium text-gray-600">School Number</div>
                        <div className="text-base font-semibold break-all">{response.studentData.schoolNumber}</div>
                      </div>
                    </div>

                    <div className="flex items-start gap-3 p-2 bg-gray-50 rounded-lg">
                      <GraduationCap className="h-5 w-5 text-gray-400 flex-shrink-0 mt-0.5" />
                      <div className="min-w-0 flex-1">
                        <div className="text-sm font-medium text-gray-600">Class</div>
                        <div className="text-base font-semibold break-all">{response.studentData.class}</div>
                      </div>
                    </div>

                    <div className="flex items-start gap-3 p-2 bg-gray-50 rounded-lg">
                      <Phone className="h-5 w-5 text-gray-400 flex-shrink-0 mt-0.5" />
                      <div className="min-w-0 flex-1">
                        <div className="text-sm font-medium text-gray-600">Contact</div>
                        <div className="text-base font-semibold break-all">{getContact(response)}</div>
                      </div>
                    </div>

                    <div className="flex items-start gap-3 p-2 bg-gray-50 rounded-lg">
                      <User className="h-5 w-5 text-gray-400 flex-shrink-0 mt-0.5" />
                      <div className="min-w-0 flex-1">
                        <div className="text-sm font-medium text-gray-600">Status</div>
                        {assignedMap[response.id] ? (
                          <Badge variant="secondary" className="mt-1">Assigned — {assignedMap[response.id].replace("locker_", "")}</Badge>
                        ) : (
                          <Badge variant="outline" className="mt-1">Pending Assignment</Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
    </React.Fragment>
}
