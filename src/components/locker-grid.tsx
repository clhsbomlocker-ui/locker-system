"use client"

import { useState, useEffect } from "react"
import { Button } from "@/src/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/src/components/ui/card"
import { Badge } from "@/src/components/ui/badge"
import { Tooltip, TooltipTrigger, TooltipContent } from "@/src/components/ui/tooltip"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/src/components/ui/dialog"
import { Alert, AlertDescription } from "@/src/components/ui/alert"
import { Textarea } from "@/src/components/ui/textarea"
import { User, MapPin, Calendar, PenTool, Trash2 } from "lucide-react"
import { collection, query, onSnapshot, doc, setDoc, updateDoc, deleteDoc, where, getDocs, getDoc, orderBy, limit } from "firebase/firestore"
import { db } from "@/src/lib/firebase"
import { useAuth } from "./auth-provider"
import type { Locker, Student, LockerAssignment } from "@/src/lib/types"

interface LockerGridProps {
  selectedStudent?: Student | null
  onAssignmentComplete?: () => void
}

export function LockerGrid({ selectedStudent, onAssignmentComplete }: LockerGridProps) {
  const [lockers, setLockers] = useState<Locker[]>([])
  const [assignments, setAssignments] = useState<LockerAssignment[]>([])
  const [selectedLocker, setSelectedLocker] = useState<Locker | null>(null)
  const [assignedStudent, setAssignedStudent] = useState<Student | null>(null)
  const [currentAssignment, setCurrentAssignment] = useState<LockerAssignment | null>(null)
  const [loading, setLoading] = useState(true)
  const [assigning, setAssigning] = useState(false)
  const [removing, setRemoving] = useState(false)
  const [error, setError] = useState("")
  const [addingRow, setAddingRow] = useState(false)
  const [addingColumn, setAddingColumn] = useState(false)
  const [removingRow, setRemovingRow] = useState(false)
  const [removingColumn, setRemovingColumn] = useState(false)
  const { user } = useAuth() // Added auth check

  // Broken locker UI state
  const [markingBroken, setMarkingBroken] = useState(false)
  const [brokenTarget, setBrokenTarget] = useState<Locker | null>(null)
  const [brokenRemarks, setBrokenRemarks] = useState("")
  const [savingBroken, setSavingBroken] = useState(false)

  const initializeLockers = async () => {
    const lockersToCreate: Locker[] = []

    for (let row = 1; row <= 6; row++) {
      lockersToCreate.push({
        id: `locker_${1000 + row}`,
        number: `${1000 + row}`,
        row,
        column: 0,
        isOccupied: false,
      })
    }

    for (let col = 1; col <= 10; col++) {
      lockersToCreate.push({
        id: `locker_${1006 + col}`,
        number: `${1006 + col}`,
        row: 0,
        column: col,
        isOccupied: false,
      })
    }

    for (const locker of lockersToCreate) {
      try {
        // Only create the locker if it doesn't exist, don't overwrite existing ones
        const lockerRef = doc(db, "lockers", locker.id)
        const lockerSnap = await getDoc(lockerRef)

        if (!lockerSnap.exists()) {
          await setDoc(lockerRef, locker)
        }
        // If locker exists, don't update it to preserve isOccupied status
      } catch (error) {
        console.error("Error creating locker:", error)
      }
    }
  }

  useEffect(() => {
    if (!user) {
      setLoading(false)
      return
    }

    initializeLockers()

    const lockersQuery = query(collection(db, "lockers"))
    const unsubscribeLockers = onSnapshot(
      lockersQuery,
      (querySnapshot) => {
        const lockersData: Locker[] = []
        querySnapshot.forEach((doc) => {
          const data = doc.data()
          // Ensure isOccupied is properly typed as boolean
          const lockerData = {
            id: doc.id,
            ...data,
            isOccupied: Boolean(data.isOccupied), // Ensure it's a boolean
            isBroken: Boolean((data as any).isBroken),
            brokenRemarks: (data as any).brokenRemarks || "",
          } as Locker
          lockersData.push(lockerData)
        })
        setLockers(lockersData.sort((a, b) => Number.parseInt(a.number) - Number.parseInt(b.number)))
      },
      (error) => {
        console.error("Firestore permission error in lockers:", error)
        if (error.code === "permission-denied") {
          setError("Access denied. Please check your authentication.")
        }
      },
    )

    const assignmentsQuery = query(collection(db, "assignments"))
    const unsubscribeAssignments = onSnapshot(
      assignmentsQuery,
      (querySnapshot) => {
        const assignmentsData: LockerAssignment[] = []
        querySnapshot.forEach((doc) => {
          assignmentsData.push({ id: doc.id, ...doc.data() } as LockerAssignment)
        })
        setAssignments(assignmentsData)
        setLoading(false)
      },
      (error) => {
        console.error("[v0] Firestore permission error in assignments:", error)
        if (error.code === "permission-denied") {
          setError("Access denied. Please check your authentication.")
        }
        setLoading(false)
      },
    )

    return () => {
      unsubscribeLockers()
      unsubscribeAssignments()
    }
  }, [user]) // Added user dependency

  const getLockerStatus = (locker: Locker) => {
    // Check the isOccupied field directly from the locker data
    return locker.isOccupied ? "occupied" : "available"
  }

  const getAssignedStudent = async (locker: Locker) => {
    const assignment = assignments.find((a) => a.lockerId === locker.id)
    if (!assignment) {
      return null
    }

    try {
      // Get all responses and find the one with matching document ID
      const responsesQuery = query(collection(db, "responses"))
      const querySnapshot = await getDocs(responsesQuery)

      // Find the response document with matching ID
      const responseDoc = querySnapshot.docs.find((doc) => doc.id === assignment.studentId)

      if (responseDoc) {
        const responseData = responseDoc.data()

        // Extract student data from the nested structure
        const studentData = responseData.data?.studentData || responseData.studentData || responseData

        if (studentData) {
          return {
            id: responseDoc.id,
            name: studentData.name,
            schoolNumber: studentData.schoolNumber,
            class: studentData.class,
            contactNumber: studentData.contactNumber,
            createdAt: studentData.createdAt,
          } as Student
        }
      }

    } catch (error) {
      console.error("[v0] Error fetching student:", error)
    }
    return null
  }

  const handleLockerClick = async (locker: Locker) => {
    // If admin is in "mark broken" mode, open broken remark dialog
    if (markingBroken) {
      setBrokenTarget(locker)
      setBrokenRemarks(locker.brokenRemarks || "")
      setSelectedLocker(locker)
      return
    }

    // If locker is already marked broken and admin is NOT in marking mode:
    // Open the broken dialog so admin can view/edit remarks or clear the broken state.
    if (locker.isBroken) {
      setBrokenTarget(locker)
      setBrokenRemarks(locker.brokenRemarks || "")
      setSelectedLocker(locker)
      return
    }

    setSelectedLocker(locker)
    if (getLockerStatus(locker) === "occupied") {
      const student = await getAssignedStudent(locker)
      const assignment = assignments.find((a) => a.lockerId === locker.id)
      setAssignedStudent(student)
      setCurrentAssignment(assignment || null)
    }
  }

  const handleAssignLocker = async () => {
    if (!selectedLocker || !selectedStudent) return

    setAssigning(true)
    setError("")

    try {
      const assignmentId = `assignment_${Date.now()}_${selectedLocker.id}`
      const assignmentData = {
        id: assignmentId,
        lockerId: selectedLocker.id,
        studentId: selectedStudent.id,
        assignedAt: new Date(),
        signatureId: null,
        signatureUrl: null,
        signatureCompletedAt: null,
      }

      // create assignment
      await setDoc(doc(db, "assignments", assignmentId), assignmentData)

      // update locker as occupied
      await updateDoc(doc(db, "lockers", selectedLocker.id), {
        isOccupied: true,
        studentId: selectedStudent.id,
        assignedAt: new Date(),
      })

      // reset UI
      setSelectedLocker(null)
      onAssignmentComplete?.()
    } catch (error: any) {
      console.error("Failed to assign locker:", error)
      setError(error.message || "Failed to assign locker")
    } finally {
      setAssigning(false)
    }
  }

  const handleSaveBroken = async () => {
    if (!brokenTarget) return
    setSavingBroken(true)
    setError("")
    try {
      await updateDoc(doc(db, "lockers", brokenTarget.id), {
        isBroken: true,
        brokenRemarks: brokenRemarks || null,
      })
      // refresh local states
      setBrokenTarget(null)
      setSelectedLocker(null)
      setMarkingBroken(false)
    } catch (error: any) {
      console.error("Failed to mark locker broken:", error)
      setError(error.message || "Failed to mark locker broken")
    } finally {
      setSavingBroken(false)
    }
  }

  const handleClearBroken = async () => {
    if (!brokenTarget) return
    setSavingBroken(true)
    setError("")
    try {
      await updateDoc(doc(db, "lockers", brokenTarget.id), {
        isBroken: false,
        brokenRemarks: null,
      })
      setBrokenTarget(null)
      setSelectedLocker(null)
    } catch (error: any) {
      console.error("Failed to clear broken state:", error)
      setError(error.message || "Failed to clear broken state")
    } finally {
      setSavingBroken(false)
    }
  }

  const handleRemoveStudent = async () => {
    if (!selectedLocker || !currentAssignment) return

    setRemoving(true)
    setError("")

    try {

      // Delete the assignment document from Firestore
      await deleteDoc(doc(db, "assignments", currentAssignment.id))

      // Update the locker to mark it as available
      await updateDoc(doc(db, "lockers", selectedLocker.id), {
        isOccupied: false,
        studentId: null,
        assignedAt: null,
      })

      // Delete associated signatures from Firestore
      try {
        const signaturesQuery = query(
          collection(db, "signatures"),
          where("studentId", "==", currentAssignment.studentId),
          where("lockerId", "==", selectedLocker.id),
        )
        const signatureSnapshot = await getDocs(signaturesQuery)

        if (!signatureSnapshot.empty) {
          const deletePromises = signatureSnapshot.docs.map((doc) => deleteDoc(doc.ref))
          await Promise.all(deletePromises)
        } else {
        }
      } catch (signatureError) {
        console.error("[ERROR] Failed to delete signatures:", signatureError)
        // Don't fail the whole operation if signature removal fails
        setError("Student removed but signature cleanup failed. Please contact admin.")
      }

      // Reset local state
      setAssignedStudent(null)
      setCurrentAssignment(null)
      setSelectedLocker(null)

      onAssignmentComplete?.()
    } catch (error: any) {
      console.error("[ERROR] Failed to remove student:", error)
      setError(error.message || "Failed to remove student from locker")
    } finally {
      setRemoving(false)
    }
  }

  const handleAddRow = async () => {
    setAddingRow(true)
    setError("")

    try {
      const rowLockers = lockers.filter((l) => l.row > 0 && l.column === 0)
      const maxRowLocker = rowLockers.reduce((max, locker) => (locker.row > max.row ? locker : max), rowLockers[0])

      const newRowNumber = maxRowLocker.row + 1
      const newLockerNumber = 1000 + newRowNumber

      const newLocker: Locker = {
        id: `locker_${newLockerNumber}`,
        number: `${newLockerNumber}`,
        row: newRowNumber,
        column: 0,
        isOccupied: false,
      }

      await setDoc(doc(db, "lockers", newLocker.id), newLocker)
    } catch (error: any) {
      console.error("Error adding new row:", error)
      setError(error.message || "Failed to add new row")
    } finally {
      setAddingRow(false)
    }
  }

  const handleRemoveRow = async () => {
    setRemovingRow(true)
    setError("")

    try {
      const rowLockers = lockers.filter((l) => l.row > 0 && l.column === 0)
      if (rowLockers.length <= 1) {
        setError("Cannot remove the last remaining row")
        return
      }

      const maxRowLocker = rowLockers.reduce((max, locker) => (locker.row > max.row ? locker : max), rowLockers[0])

      // Check if the last row locker is occupied
      if (getLockerStatus(maxRowLocker) === "occupied") {
        setError("Cannot remove an occupied locker. Please remove the student first.")
        return
      }

      await deleteDoc(doc(db, "lockers", maxRowLocker.id))
    } catch (error: any) {
      console.error("Error removing row:", error)
      setError(error.message || "Failed to remove row")
    } finally {
      setRemovingRow(false)
    }
  }

  const handleAddColumn = async () => {
    setAddingColumn(true)
    setError("")

    try {
      const columnLockers = lockers.filter((l) => l.row === 0 && l.column > 0)
      const maxColumnLocker = columnLockers.reduce(
        (max, locker) => (locker.column > max.column ? locker : max),
        columnLockers[0],
      )

      const newColumnNumber = maxColumnLocker.column + 1
      const newLockerNumber = 1006 + newColumnNumber

      const newLocker: Locker = {
        id: `locker_${newLockerNumber}`,
        number: `${newLockerNumber}`,
        row: 0,
        column: newColumnNumber,
        isOccupied: false,
      }

      await setDoc(doc(db, "lockers", newLocker.id), newLocker)
    } catch (error: any) {
      console.error("Error adding new column:", error)
      setError(error.message || "Failed to add new column")
    } finally {
      setAddingColumn(false)
    }
  }

  const handleRemoveColumn = async () => {
    setRemovingColumn(true)
    setError("")

    try {
      const columnLockers = lockers.filter((l) => l.row === 0 && l.column > 0)
      if (columnLockers.length <= 1) {
        setError("Cannot remove the last remaining column")
        return
      }

      const maxColumnLocker = columnLockers.reduce(
        (max, locker) => (locker.column > max.column ? locker : max),
        columnLockers[0],
      )

      // Check if the last column locker is occupied
      if (getLockerStatus(maxColumnLocker) === "occupied") {
        setError("Cannot remove an occupied locker. Please remove the student first.")
        return
      }

      await deleteDoc(doc(db, "lockers", maxColumnLocker.id))
    } catch (error: any) {
      console.error("Error removing column:", error)
      setError(error.message || "Failed to remove column")
    } finally {
      setRemovingColumn(false)
    }
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center py-8">Loading locker grid...</div>
        </CardContent>
      </Card>
    )
  }

  const rowLockers = lockers.filter((l) => l.row > 0 && l.column === 0)
  const columnLockers = lockers.filter((l) => l.row === 0 && l.column > 0)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Locker Grid</h3>
        <div className="flex gap-4 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-green-500 rounded"></div>
            <span>Available</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-red-500 rounded"></div>
            <span>Occupied</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-yellow-500 rounded"></div>
            <span>Broken</span>
          </div>
        </div>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Lockers</CardTitle>
            <div className="flex gap-2">
              <Button onClick={handleRemoveRow} disabled={removingRow || rowLockers.length <= 1} size="sm" variant="outline">
                {removingRow ? "Removing..." : "Remove Row"}
              </Button>
              <Button onClick={handleAddRow} disabled={addingRow} size="sm" variant="outline">
                {addingRow ? "Adding..." : "Add Row"}
              </Button>
              <Button
                onClick={handleRemoveColumn}
                disabled={removingColumn || columnLockers.length <= 1}
                size="sm"
                variant="outline"
              >
                {removingColumn ? "Removing..." : "Remove Column"}
              </Button>
              <Button onClick={handleAddColumn} disabled={addingColumn} size="sm" variant="outline">
                {addingColumn ? "Adding..." : "Add Column"}
              </Button>

              <Button
                onClick={() => {
                  setMarkingBroken((v) => !v)
                  // cancel any partial broken target when toggling off
                  if (markingBroken) {
                    setBrokenTarget(null)
                    setSelectedLocker(null)
                    setBrokenRemarks("")
                  }
                }}
                size="sm"
                variant={markingBroken ? "destructive" : "secondary"}
                className="ml-2"
              >
                {markingBroken ? "Cancel Marking" : "Mark Broken"}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-auto">
            <table className="min-w-full border-collapse">
              <tbody>
                {rowLockers.length > 0 ? (
                  (() => {
                    const rows = rowLockers.length
                    const colsForColumns = Math.ceil(columnLockers.length / rows)
                    return Array.from({ length: rows }).map((_, i) => {
                      return (
                        <tr key={i} className="align-top">
                          {/* First column: row locker */}
                          <td className="px-0 ">
                            {rowLockers[i] ? (
                              <Button
                                variant="outline"
                                className={`h-16 w-20 m-0 flex flex-col items-center justify-center ${
                                  rowLockers[i].isBroken
                                    ? "bg-yellow-100 border-yellow-300 hover:bg-yellow-200"
                                    : getLockerStatus(rowLockers[i]) === "occupied"
                                    ? "bg-red-100 border-red-300 hover:bg-red-200"
                                    : "bg-green-100 border-green-300 hover:bg-green-200"
                                } ${markingBroken || rowLockers[i].isBroken || (selectedStudent && getLockerStatus(rowLockers[i]) === "available") ? "cursor-pointer" : ""}`}
                                onClick={() => handleLockerClick(rowLockers[i])}
                                disabled={!(markingBroken || rowLockers[i].isBroken || getLockerStatus(rowLockers[i]) === "occupied" || (selectedStudent && getLockerStatus(rowLockers[i]) === "available"))}
                              >
                                <span className="font-medium text-sm">{rowLockers[i].number}</span>
                                {rowLockers[i].isBroken ? (
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <span className="inline-flex items-center">
                                        <Badge
                                          variant="destructive"
                                          aria-label="Broken"
                                          className="text-[10px] sm:text-xs overflow-hidden truncate"
                                        >
                                          Broken
                                        </Badge>
                                      </span>
                                    </TooltipTrigger>
                                    <TooltipContent side="top" className="max-w-xs">
                                      <div className="text-sm">
                                        <div className="font-semibold mb-1">Broken — Reason</div>
                                        <div className="whitespace-pre-wrap text-xs text-muted-foreground">
                                          {rowLockers[i].brokenRemarks || "Reason not provided"}
                                        </div>
                                      </div>
                                    </TooltipContent>
                                  </Tooltip>
                                ) : (
                                  <Badge
                                    variant={getLockerStatus(rowLockers[i]) === "occupied" ? "destructive" : "secondary"}
                                    aria-label={getLockerStatus(rowLockers[i]) === "occupied" ? "Occupied" : "Available"}
                                    className="text-[10px] sm:text-xs overflow-hidden truncate"
                                  >
                                    {getLockerStatus(rowLockers[i]) === "occupied" ? "Occupied" : "Available"}
                                  </Badge>
                                )}
                              </Button>
                            ) : (
                              <div className="h-14 w-16" />
                            )}
                          </td>

                          {/* Additional columns populated from columnLockers */}
                          {Array.from({ length: colsForColumns }).map((_, colIndex) => {
                            const idx = colIndex * rows + i
                            const locker = columnLockers[idx]
                            return (
                              <td className="p-0" key={colIndex}>
                                {locker ? (
                                  <Button
                                    variant="outline"
                                    className={`h-16 w-20 m-0 flex flex-col items-center justify-center ${
                                      locker.isBroken
                                        ? "bg-yellow-100 border-yellow-300 hover:bg-yellow-200"
                                        : getLockerStatus(locker) === "occupied"
                                        ? "bg-red-100 border-red-300 hover:bg-red-200"
                                        : "bg-green-100 border-green-300 hover:bg-green-200"
                                    } ${markingBroken || locker.isBroken || (selectedStudent && getLockerStatus(locker) === "available") ? "cursor-pointer" : ""}`}
                                    onClick={() => handleLockerClick(locker)}
                                    disabled={!(markingBroken || locker.isBroken || getLockerStatus(locker) === "occupied" || (selectedStudent && getLockerStatus(locker) === "available"))}
                                  >
                                    <span className="font-medium text-sm">{locker.number}</span>
                                    {locker.isBroken ? (
                                      <Tooltip>
                                        <TooltipTrigger asChild>
                                          <span className="inline-flex items-center">
                                            <Badge
                                              variant="destructive"
                                              aria-label="Broken"
                                              className="text-[10px] sm:text-xs overflow-hidden truncate"
                                            >
                                              Broken
                                            </Badge>
                                          </span>
                                        </TooltipTrigger>
                                        <TooltipContent side="top" className="max-w-xs">
                                          <div className="text-sm">
                                            <div className="font-semibold mb-1">Broken — Reason</div>
                                            <div className="whitespace-pre-wrap text-xs text-muted-foreground">
                                              {locker.brokenRemarks || "Reason not provided"}
                                            </div>
                                          </div>
                                        </TooltipContent>
                                      </Tooltip>
                                    ) : (
                                      <Badge
                                        variant={getLockerStatus(locker) === "occupied" ? "destructive" : "secondary"}
                                        aria-label={getLockerStatus(locker) === "occupied" ? "Occupied" : "Available"}
                                        className="text-[10px] sm:text-xs overflow-hidden truncate"
                                      >
                                        {getLockerStatus(locker) === "occupied" ? "Occupied" : "Available"}
                                      </Badge>
                                    )}
                                  </Button>
                                ) : (
                                  <div className="h-14 w-16" />
                                )}
                              </td>
                            )
                          })}
                        </tr>
                      )
                    })
                  })()
                ) : (
                  <tr>
                    <td className="p-1">No lockers</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      

      <Dialog open={!!selectedLocker} onOpenChange={() => { setSelectedLocker(null); setBrokenTarget(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {selectedLocker && brokenTarget ? "Mark Locker Broken" : selectedLocker && getLockerStatus(selectedLocker) === "occupied" ? "Locker Details" : "Assign Locker"}
            </DialogTitle>
            <DialogDescription>{selectedLocker ? `Locker ${selectedLocker.number}` : ""}</DialogDescription>
          </DialogHeader>

          {selectedLocker && brokenTarget ? (
            <div className="space-y-4">
              <div className="bg-yellow-50 p-4 rounded-lg">
                <h4 className="font-medium mb-2">Broken Locker: {brokenTarget.number}</h4>
                <p className="text-sm mb-2">Click Save to mark this locker as broken, or "Clear Broken" to mark it fixed.</p>
                <Textarea value={brokenRemarks} onChange={(e) => setBrokenRemarks((e.target as HTMLTextAreaElement).value)} placeholder="Describe the reason / remarks" />
              </div>

              <div className="flex gap-2">
                <Button onClick={handleSaveBroken} disabled={savingBroken} className="flex-1">
                  {savingBroken ? "Saving..." : "Save"}
                </Button>
                <Button variant="outline" onClick={() => { setBrokenTarget(null); setSelectedLocker(null); setBrokenRemarks(""); }}>
                  Cancel
                </Button>
                {brokenTarget.isBroken && (
                  <Button variant="destructive" onClick={handleClearBroken} disabled={savingBroken}>
                    {savingBroken ? "Processing..." : "Clear Broken"}
                  </Button>
                )}
              </div>
            </div>
          ) : selectedLocker && getLockerStatus(selectedLocker) === "available" && selectedStudent ? (
            <div className="space-y-4">
              <div className="bg-blue-50 p-4 rounded-lg">
                <h4 className="font-medium mb-2">Assign to Student:</h4>
                <p className="text-sm">
                  <strong>{selectedStudent.name}</strong>
                  <br />
                  School Number: {selectedStudent.schoolNumber}
                  <br />
                  Class: {selectedStudent.class}
                </p>
              </div>

                <div className="flex gap-2">
                <Button onClick={handleAssignLocker} disabled={assigning} className="flex-1">
                  {assigning ? "Assigning..." : "Assign Locker"}
                </Button>
                <Button variant="outline" onClick={() => setSelectedLocker(null)}>
                  Cancel
                </Button>
              </div>
            </div>
          ) : selectedLocker && getLockerStatus(selectedLocker) === "occupied" ? (
            <div className="space-y-4">
              {assignedStudent ? (
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-medium mb-2">Assigned Student:</h4>
                  <div className="space-y-1 text-sm">
                    <p>
                      <strong>{assignedStudent.name}</strong>
                    </p>
                    <p>School Number: {assignedStudent.schoolNumber}</p>
                    <p>Class: {assignedStudent.class}</p>
                    <p>Contact: {assignedStudent.contactNumber}</p>
                    <div className="flex items-center gap-1 mt-2">
                      <Calendar className="h-4 w-4" />
                      <span>
                        Assigned:{" "}
                        {currentAssignment?.assignedAt
                          ? (currentAssignment.assignedAt as any)?.toDate
                            ? new Date((currentAssignment.assignedAt as any).toDate()).toLocaleDateString()
                            : currentAssignment.assignedAt instanceof Date
                              ? currentAssignment.assignedAt.toLocaleDateString()
                              : "Unknown"
                          : "Unknown"}
                      </span>
                    </div>
                    {selectedLocker.isBroken && (
                      <div className="mt-2">
                        <Badge variant="destructive">Broken</Badge>
                        {selectedLocker.brokenRemarks && <div className="text-sm text-muted-foreground mt-1">Remarks: {selectedLocker.brokenRemarks}</div>}
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-medium mb-2">Loading student information...</h4>
                </div>
              )}

              {currentAssignment?.signatureUrl ? (
                <div className="bg-green-50 p-4 rounded-lg">
                  <div className="flex items-center gap-2 text-green-800 mb-2">
                    <PenTool className="h-4 w-4" />
                    <span className="font-medium">Signature Completed</span>
                  </div>
                  <img
                    src={currentAssignment.signatureUrl || "/placeholder.svg"}
                    alt="Student Signature"
                    className="max-w-full h-20 border border-green-200 rounded bg-white"
                  />
                </div>
              ) : null}

              <div className="flex gap-2">
                <Button
                  variant="destructive"
                  onClick={handleRemoveStudent}
                  disabled={removing}
                  className="flex items-center gap-2 flex-1"
                >
                  <Trash2 className="h-4 w-4" />
                  {removing ? "Removing..." : "Remove Student"}
                </Button>
                <Button variant="outline" onClick={() => setSelectedLocker(null)}>
                  Close
                </Button>
              </div>
            </div>
          ) : (
            <div className="text-center py-4">
              <Badge
                variant="secondary"
                title="Available for assignment"
                aria-label="Available for assignment"
                className="text-[10px] sm:text-xs overflow-hidden truncate"
              >
                Available for assignment
              </Badge>
            </div>
          )}
        </DialogContent>
      </Dialog>

    </div>
  )
}
