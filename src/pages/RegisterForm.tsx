import React from "react"
import { useParams } from "react-router-dom"
import { StudentRegistrationForm } from "../components/student-registration-form"

export default function RegisterFormPage() {
  const params = useParams<{ formId?: string }>()
  const formId = params.formId ?? "default"

  return <StudentRegistrationForm formId={formId} />
}
