"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/src/components/ui/button"
import { Input } from "@/src/components/ui/input"
import { Label } from "@/src/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/src/components/ui/card"
import { Alert, AlertDescription } from "@/src/components/ui/alert"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/src/components/ui/select"
import { User, Phone, GraduationCap, Hash, CheckCircle, AlertCircle } from "lucide-react"
import { collection, addDoc, doc, getDoc } from "firebase/firestore"
import { db } from "@/src/lib/firebase"

interface FormField {
  id: string
  label: string
  type: 'text' | 'number' | 'email' | 'tel' | 'select'
  required: boolean
  options?: string[]
}

interface FormConfig {
  id: string
  title: string
  description: string
  isActive: boolean
  fields: FormField[]
}

interface StudentRegistrationFormProps {
  formId?: string
}

export function StudentRegistrationForm({ formId = "default" }: StudentRegistrationFormProps) {
  const [formConfig, setFormConfig] = useState<FormConfig | null>(null)
  const [formData, setFormData] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState("")
  const [loadingForm, setLoadingForm] = useState(true)

  // Load form configuration
  useEffect(() => {
    const loadForm = async () => {
      if (formId === "default") {
        // Default form configuration
        setFormConfig({
          id: "default",
          title: "Student Registration",
          description: "Fill out this form to register",
          isActive: true,
          fields: [
            { id: 'name', label: 'Full Name', type: 'text', required: true },
            { id: 'schoolNumber', label: 'School Number', type: 'text', required: true },
            { id: 'class', label: 'Class', type: 'text', required: true },
            { id: 'contactNumber', label: 'Contact Number', type: 'tel', required: true },
          ]
        })
        setLoadingForm(false)
        return
      }

      try {
        const docRef = doc(db, "forms", formId)
        const docSnap = await getDoc(docRef)

        if (docSnap.exists()) {
          const data = docSnap.data()
          setFormConfig({
            id: docSnap.id,
            title: data.title || "Student Registration",
            description: data.description || "Fill out this form to register",
            isActive: data.isActive !== false,
            fields: data.fields?.map((field: FormField) => {
              if (field.id === 'class' && field.label.toLowerCase().includes("grade")) {
                return { ...field, label: 'Class' }
              }
              return field
            }) || [
              { id: 'name', label: 'Full Name', type: 'text', required: true },
              { id: 'schoolNumber', label: 'School Number', type: 'text', required: true },
              { id: 'class', label: 'Class', type: 'text', required: true },
              { id: 'contactNumber', label: 'Contact Number', type: 'tel', required: true },
            ]
          })
        } else {
          setError("Form not found or is no longer available")
        }
      } catch (error) {
        console.error("Error loading form:", error)
        setError("Failed to load form configuration")
      } finally {
        setLoadingForm(false)
      }
    }

    loadForm()
  }, [formId])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleSelectChange = (fieldId: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [fieldId]: value,
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setLoading(true)

    try {
      if (!formConfig) {
        throw new Error("Form configuration not loaded")
      }

      // Validate required fields
      const missingFields = formConfig.fields
        .filter(field => field.required)
        .filter(field => !formData[field.id]?.trim())

      if (missingFields.length > 0) {
        throw new Error(`Please fill in all required fields: ${missingFields.map(f => f.label).join(', ')}`)
      }

      // Normalize submitted fields to canonical studentData shape before saving.
      // This ensures varying field IDs created by the form builder (e.g. `contact` vs `contactNumber`)
      // are mapped consistently in Firestore.
      const sd = formData as Record<string, any>

      const studentData = {
        name: sd.name || sd.fullName || sd.studentName || sd.student || "",
        schoolNumber: sd.schoolNumber || sd.studentId || sd.id || sd.schoolNo || "",
        class: sd.class || sd.grade || sd.className || "",
        contactNumber: sd.contactNumber || sd.contact || sd.phone || sd.mobile || "",
        createdAt: new Date(),
        // Keep original submission for debugging / backwards-compatibility
        rawData: sd,
      }

      await addDoc(collection(db, "responses"), {
        formId: formConfig.id,
        studentData,
        submittedAt: new Date(),
      })

      setSubmitted(true)
    } catch (error: any) {
      setError(error.message || "Failed to submit registration")
    } finally {
      setLoading(false)
    }
  }

  if (loadingForm) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p>Loading form...</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (error && !formConfig) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-red-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="p-8 text-center">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <CardTitle className="text-red-800 mb-2">Error</CardTitle>
            <Alert variant="destructive" className="mb-4">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
            <Button 
              variant="outline" 
              onClick={() => window.location.href = '/'}
              className="w-full"
            >
              Return to Home
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!formConfig || !formConfig.isActive) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="p-8 text-center">
            <AlertCircle className="h-12 w-12 text-gray-500 mx-auto mb-4" />
            <CardTitle className="text-gray-800 mb-2">Form Unavailable</CardTitle>
            <p className="text-gray-600 mb-4">This registration form is currently not accepting responses.</p>
            <Button 
              variant="outline" 
              onClick={() => window.location.href = '/'}
              className="w-full"
            >
              Return to Home
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-md text-center">
          <CardHeader>
            <div className="mx-auto bg-green  -600 rounded-full w-16 h-16 flex items-center justify-center mb-4">
              <CheckCircle className="h-8 w-8 text-white" />
            </div>
            <CardTitle className="text-2xl text-green-800">Registration Submitted!</CardTitle>
            <CardDescription>
              Thank you for registering. Please wait for further notices sent in the announcement group.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="bg-green-50 p-4 rounded-lg mb-4">
              <p className="text-sm text-green-700 mb-2">
                <strong>Next Steps:</strong>
                <p>Things to prepare before the actual registration day:</p>
                <br />
                1. A Padlock
                <br />
                2. RM30
              </p>
              </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto bg-blue-600 rounded-full w-16 h-16 flex items-center justify-center mb-4">
            <GraduationCap className="h-8 w-8 text-white" />
          </div>
          <CardTitle className="text-2xl">{formConfig.title}</CardTitle>
          <CardDescription>{formConfig.description}</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {formConfig.fields.map((field) => (
              <div key={field.id} className="space-y-2">
                <Label htmlFor={field.id}>
                  {field.label} {field.required && <span className="text-red-500">*</span>}
                </Label>

                {field.type === 'select' ? (
                  <Select
                    value={formData[field.id] || ""}
                    onValueChange={(value) => handleSelectChange(field.id, value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={`Select ${field.label.toLowerCase()}`} />
                    </SelectTrigger>
                    <SelectContent>
                      {field.options?.map((option) => (
                        <SelectItem key={option} value={option}>
                          {option}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <div className="relative">
                    {field.type === 'text' && <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />}
                    {field.type === 'number' && <Hash className="absolute left-3 top-3 h-4 w-4 text-gray-400" />}
                    {field.type === 'email' && <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />}
                    {field.type === 'tel' && <Phone className="absolute left-3 top-3 h-4 w-4 text-gray-400" />}
                    <Input
                      id={field.id}
                      name={field.id}
                      type={field.type}
                      placeholder={`Enter your ${field.label.toLowerCase()}`}
                      value={formData[field.id] || ""}
                      onChange={handleInputChange}
                      className={['text', 'number', 'email', 'tel'].includes(field.type) ? "pl-10" : ""}
                      required={field.required}
                    />
                  </div>
                )}
              </div>
            ))}

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Submitting..." : "Submit Registration"}
            </Button>

            <p className="text-xs text-gray-500 text-center">
              * Required fields. Your information will be used only for locker assignment purposes.
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
