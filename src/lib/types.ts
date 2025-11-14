import { Timestamp } from "firebase/firestore"

export interface Student {
  id: string
  name: string
  schoolNumber: string
  class: string
  contactNumber: string
  createdAt: Timestamp | Date
  formId?: string
}

export interface Locker {
  id: string
  number: string
  row: number
  column: number
  isOccupied: boolean
  studentId?: string
  assignedAt?: Timestamp | Date
  isBroken?: boolean
  brokenRemarks?: string
}

export interface LockerAssignment {
  id: string
  lockerId: string
  studentId: string
  assignedAt: Timestamp | Date
  signatureUrl?: string
  signatureCompletedAt?: Timestamp | Date
}

export interface RegistrationForm {
  id: string
  title: string
  description: string
  isActive: boolean
  createdAt: Timestamp | Date
  shareableLink: string
}

export interface FormResponse {
  id: string
  formId: string
  studentData: Student
  submittedAt: Timestamp | Date
}
