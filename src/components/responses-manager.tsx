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
  formId?: string
  studentData?: any
  rawData?: any
  data?: any
  submittedAt?: any
}

const findValueRecursive = (obj: any, keys: string[]): any => {
  if (!obj || typeof obj !== "object") return undefined
  for (const k of keys) {
    if (Object.prototype.hasOwnProperty.call(obj, k)) return obj[k]
  }
  for (const v of Object.values(obj)) {
    const found = findValueRecursive(v, keys)
    if (found !== undefined) return found
  }
  return undefined
}

const resolveStudentRobust = (response: FormResponse) => {
  const rd: any = response as any
  const roots = [rd.studentData, rd.rawData, rd.data?.studentData, rd.data?.rawData, rd.data, rd]
  const findAcrossRoots = (keys: string[]) => {
    for (const root of roots) {
      const found = findValueRecursive(root, keys)
      if (found !== undefined) return found
    }
    return undefined
  }
  const name = findAcrossRoots(["name", "fullName", "displayName"]) || ""
  const schoolNumber = findAcrossRoots(["schoolNumber", "school_number", "schoolNo", "studentNumber"]) || ""
  const cls = findAcrossRoots(["class", "className", "form", "grade"]) || ""
  const contact = findAcrossRoots(["contactNumber", "contact", "phone", "mobile"]) || ""
  return { name, schoolNumber, class: cls, contact }
}

export function ResponsesManager() {
  const [responses, setResponses] = useState<FormResponse[]>([])
  const [filteredResponses, setFilteredResponses] = useState<FormResponse[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [loading, setLoading] = useState(true)
  const [selectedResponses, setSelectedResponses] = useState<Set<string>>(new Set())
  const [deleting, setDeleting] = useState(false)
  const [assignedMap, setAssignedMap] = useState<Record<string, string>>({})
  const { user } = useAuth()

  useEffect(() => {
    if (!user) { setLoading(false); return }
    const q = query(collection(db, "responses"), orderBy("submittedAt", "desc"))
    const unsub = onSnapshot(q, (snapshot) => {
      const arr: FormResponse[] = []
      snapshot.forEach((d) => arr.push({ id: d.id, ...d.data() } as FormResponse))
      setResponses(arr)
      setFilteredResponses(arr)
      setLoading(false)
    }, (err) => { console.error("Error loading responses:", err); setLoading(false) })
    return () => unsub()
  }, [user])

  useEffect(() => {
    const q = query(collection(db, "assignments"))
    const unsub = onSnapshot(q, (snapshot) => {
      const map: Record<string, string> = {}
      snapshot.forEach((d) => { const data = d.data() as any; if (data.studentId) map[data.studentId] = data.lockerId || "" })
      setAssignedMap(map)
    })
    return () => unsub()
  }, [])

  useEffect(() => {
    if (!searchTerm) { setFilteredResponses(responses); return }
    const term = searchTerm.toLowerCase()
    setFilteredResponses(responses.filter((res) => {
      const s = resolveStudentRobust(res)
      return s.name.toLowerCase().includes(term) || s.schoolNumber.toLowerCase().includes(term) || s.class.toLowerCase().includes(term)
    }))
  }, [searchTerm, responses])

  const exportToCSV = () => {
    const arr = filteredResponses.map((res) => {
      const s = resolveStudentRobust(res)
      const lockerId = assignedMap[res.id] || ""
      const lockerNo = lockerId ? lockerId.replace("locker_", "") : "No Rent"
      const lockerNumber = parseInt(lockerNo, 10)
      return { lockerNo, lockerNumber: isNaN(lockerNumber) ? 999999 : lockerNumber, ...s }
    })
    arr.sort((a, b) => a.lockerNumber - b.lockerNumber)
    const header = ["NO", "LOCKER", "NAME", "CLASS", "SCHOOL NUMBER"]
    const rows = arr.map((r, i) => [i + 1, r.lockerNo, r.name, r.class, r.schoolNumber])
    const csv = [header, ...rows].map((row) => row.map((v) => +"\""+$`{String(v).replace(/"/g, '""')}+"\""`).join(",")).join("\n")
    const blob = new Blob([csv], { type: "text/csv" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a"); a.href = url; a.download = "responses.csv"; a.click()
    URL.revokeObjectURL(url)
  }

  const deleteResponse = async (id: string) => {
    try { setDeleting(true); await deleteDoc(doc(db, "responses", id)) }
    catch (err) { console.error("Failed to delete response", err) }
    finally { setDeleting(false) }
  }

  const deleteMultiple = async (ids: string[]) => {
    try { setDeleting(true); const batch = writeBatch(db); ids.forEach((id) => batch.delete(doc(db, "responses", id))); await batch.commit(); setSelectedResponses(new Set()) }
    catch (err) { console.error("Failed to delete responses", err) }
    finally { setDeleting(false) }
  }

  const deleteAllResponses = () => { if (!confirm("Delete ALL responses? This cannot be undone.")) return; deleteMultiple(responses.map((r) => r.id)) }
  const toggleSelect = (id: string) => { const set = new Set(selectedResponses); set.has(id) ? set.delete(id) : set.add(id); setSelectedResponses(set) }
  const toggleSelectAll = () => { selectedResponses.size === filteredResponses.length ? setSelectedResponses(new Set()) : setSelectedResponses(new Set(filteredResponses.map((r) => r.id))) }

  if (loading) return <Card><CardContent className="p-6 text-center">Loading...</CardContent></Card>

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center flex-wrap gap-3">
        <h2 className="text-xl font-semibold">Form Responses ({responses.length})</h2>
        <div className="flex gap-2 flex-wrap items-center">
          {filteredResponses.length > 0 && (<><Checkbox checked={selectedResponses.size === filteredResponses.length} onCheckedChange={toggleSelectAll} /><span>{selectedResponses.size} selected</span></>)}
          {selectedResponses.size > 0 && (<Button variant="destructive" size="sm" disabled={deleting} onClick={() => { if (confirm("Delete selected responses?")) deleteMultiple([...selectedResponses]) }}><Trash2 className="h-4 w-4" /> Delete Selected</Button>)}
          <Button variant="destructive" size="sm" onClick={deleteAllResponses} disabled={deleting}><Trash className="h-4 w-4 mr-1" /> Delete All</Button>
          <div className="relative"><Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" /><Input className="pl-10" placeholder="Search name, class, number..." value={searchTerm} onChange={(e) => setSearchTerm((e.target as HTMLInputElement).value)} /></div>
          <Button onClick={exportToCSV}><Download className="h-4 w-4 mr-1" /> Export CSV</Button>
        </div>
      </div>
      {filteredResponses.length === 0 && (<Card><CardContent className="p-6 text-center text-gray-500">No responses found.</CardContent></Card>)}
      <div className="grid gap-3">
        {filteredResponses.map((res) => {
          const s = resolveStudentRobust(res)
          const timestamp = res.submittedAt?.toDate ? res.submittedAt.toDate() : res.submittedAt ? new Date(res.submittedAt) : null
          const miniDate = timestamp ? timestamp.toLocaleDateString("en-US", { month: "short", day: "numeric" }) : ""
          return (
            <Card key={res.id}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-3"><Checkbox checked={selectedResponses.has(res.id)} onCheckedChange={() => toggleSelect(res.id)} /><CardTitle>{s.name || "(No Name)"}</CardTitle></div>
                  <div className="flex items-center gap-2"><Badge>{miniDate}</Badge><Button variant="ghost" size="sm" onClick={() => { if (confirm("Delete this response?")) deleteResponse(res.id) }}><Trash2 className="h-4 w-4 text-red-500" /></Button></div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-start gap-3 p-2 bg-gray-50 rounded-lg"><Hash className="h-5 w-5 text-gray-400" /><div><div className="text-sm text-gray-600">School Number</div><div className="font-semibold">{s.schoolNumber}</div></div></div>
                <div className="flex items-start gap-3 p-2 bg-gray-50 rounded-lg"><GraduationCap className="h-5 w-5 text-gray-400" /><div><div className="text-sm text-gray-600">Class</div><div className="font-semibold">{s.class}</div></div></div>
                <div className="flex items-start gap-3 p-2 bg-gray-50 rounded-lg"><Phone className="h-5 w-5 text-gray-400" /><div><div className="text-sm text-gray-600">Contact</div><div className="font-semibold">{s.contact}</div></div></div>
                <div className="flex items-start gap-3 p-2 bg-gray-50 rounded-lg"><User className="h-5 w-5 text-gray-400" /><div><div className="text-sm text-gray-600">Status</div>{assignedMap[res.id] ? <Badge variant="secondary">Assigned  {assignedMap[res.id].replace("locker_", "")}</Badge> : <Badge variant="outline">Pending Assignment</Badge>}</div></div>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
