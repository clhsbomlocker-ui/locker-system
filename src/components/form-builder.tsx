"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/src/components/ui/button"
import { Input } from "@/src/components/ui/input"
import { Label } from "@/src/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/src/components/ui/card"
import { Alert, AlertDescription } from "@/src/components/ui/alert"
import { Textarea } from "@/src/components/ui/textarea"
import { Switch } from "@/src/components/ui/switch"
import { Badge } from "@/src/components/ui/badge"
import { Checkbox } from "@/src/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/src/components/ui/select"
import { Separator } from "@/src/components/ui/separator"
import { Copy, Eye, Share, Plus, Edit, Trash2, FileText } from "lucide-react"
import { collection, addDoc, onSnapshot, doc, updateDoc, deleteDoc, serverTimestamp } from "firebase/firestore"
import { db } from "@/src/lib/firebase"
import { useAuth } from "./auth-provider"

interface FormField {
  id: string
  label: string
  type: 'text' | 'number' | 'email' | 'tel' | 'select'
  required: boolean
  options?: string[]
}

interface RegistrationForm {
  id: string // Firestore document ID
  title: string
  description: string
  isActive: boolean
  createdAt: any
  fields?: FormField[]
}

export function FormBuilder() {
  const [forms, setForms] = useState<RegistrationForm[]>([])
  const [formConfig, setFormConfig] = useState<{
    title: string
    description: string
    isActive: boolean
    fields: FormField[]
  }>({
    title: "Student Locker Registration",
    description: "Please fill out this form to register for a locker assignment.",
    isActive: true,
    fields: [
      { id: 'name', label: 'Student Name', type: 'text', required: true },
      { id: 'schoolNumber', label: 'School Number', type: 'text', required: true },
      { id: 'class', label: 'Class/Grade', type: 'text', required: true },
      { id: 'contact', label: 'Contact Number', type: 'tel', required: true },
    ],
  })
  const [loading, setLoading] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [editingForm, setEditingForm] = useState<RegistrationForm | null>(null)
  const [createdForm, setCreatedForm] = useState<any>(null)
  const [error, setError] = useState("")
  const [view, setView] = useState<'list' | 'create' | 'edit'>('list')
  const { user } = useAuth()

  // Load existing forms
  useEffect(() => {
    if (!user) return
    
    const unsubscribe = onSnapshot(
      collection(db, "forms"),
      (querySnapshot) => {
        const formsData: RegistrationForm[] = []
        querySnapshot.forEach((doc) => {
          const formData = doc.data()
          
          formsData.push({ 
            id: doc.id, // Firestore document ID
            title: formData.title,
            description: formData.description,
            isActive: formData.isActive,
            createdAt: formData.createdAt,
            fields: formData.fields || [
              { id: 'name', label: 'Student Name', type: 'text', required: true },
              { id: 'schoolNumber', label: 'School Number', type: 'text', required: true },
              { id: 'class', label: 'Class/Grade', type: 'text', required: true },
              { id: 'contact', label: 'Contact Number', type: 'tel', required: true },
            ]
          } as RegistrationForm)
        })
        setForms(formsData.sort((a, b) => new Date(b.createdAt.toDate()).getTime() - new Date(a.createdAt.toDate()).getTime()))
      },
      (error) => {
        console.error("Error loading forms:", error)
      }
    )

    return () => unsubscribe()
  }, [user])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormConfig((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleSwitchChange = (checked: boolean) => {
    setFormConfig((prev) => ({
      ...prev,
      isActive: checked,
    }))
  }

  const generateShareableLink = (form: RegistrationForm) => {
    // Use Firestore document ID for the shareable link
    return `${window.location.origin}/register/${form.id}`
  }

  const handleCreateForm = async () => {
    setError("")
    setLoading(true)

    try {
      if (!user) {
        throw new Error("You must be signed in to create a form")
      }

      const payload = {
        title: formConfig.title,
        description: formConfig.description,
        isActive: formConfig.isActive,
        fields: formConfig.fields,
        createdAt: serverTimestamp(),
        createdBy: user.uid,
      }

      const docRef = await addDoc(collection(db, "forms"), payload)

      setCreatedForm({
        id: docRef.id, // Use Firestore document ID
        ...formConfig,
      })
      setView('list')
    } catch (error: any) {
      console.error("Create form error:", error)
      // surface Firestore error code if present
      const message = error?.message || (error?.code ? `${error.code}` : "Failed to create form")
      setError(message)
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateForm = async () => {
    if (!editingForm) return
    
    setError("")
    setLoading(true)

    try {
      await updateDoc(doc(db, "forms", editingForm.id), {
        title: formConfig.title,
        description: formConfig.description,
        isActive: formConfig.isActive,
        fields: formConfig.fields,
      })

      setView('list')
      setEditingForm(null)
      resetForm()
    } catch (error: any) {
      setError(error.message || "Failed to update form")
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteForm = async (formId: string) => {
    if (!user) {
      alert("You must be logged in to delete forms")
      return
    }

    if (!window.confirm("Are you sure you want to delete this form? This action cannot be undone.")) {
      return
    }

    try {
      setDeletingId(formId)
      const docRef = doc(db, "forms", formId)
      await deleteDoc(docRef)
    } catch (error: any) {
      console.error("Error deleting form:", error)
      
      if (error.code === 'permission-denied') {
        alert("Permission denied: You don't have permission to delete this form")
      } else if (error.code === 'not-found') {
        alert("Form not found: This form may have already been deleted")
      } else {
        alert(`Error deleting form: ${error.message}\nCode: ${error.code || 'unknown'}`)
      }
      
      setError(error.message || "Failed to delete form")
    } finally {
      setDeletingId(null)
    }
  }

  const startEditForm = (form: RegistrationForm) => {
    setEditingForm(form)
    setFormConfig({
      title: form.title,
      description: form.description,
      isActive: form.isActive,
      fields: form.fields || [
        { id: 'name', label: 'Student Name', type: 'text', required: true },
        { id: 'schoolNumber', label: 'School Number', type: 'text', required: true },
        { id: 'class', label: 'Class/Grade', type: 'text', required: true },
        { id: 'contact', label: 'Contact Number', type: 'tel', required: true },
      ],
    })
    setView('edit')
  }

  const resetForm = () => {
    setFormConfig({
      title: "Student Locker Registration",
      description: "Please fill out this form to register for a locker assignment.",
      isActive: true,
      fields: [
        { id: 'name', label: 'Student Name', type: 'text', required: true },
        { id: 'schoolNumber', label: 'School Number', type: 'text', required: true },
        { id: 'class', label: 'Class/Grade', type: 'text', required: true },
        { id: 'contact', label: 'Contact Number', type: 'tel', required: true },
      ],
    })
    setEditingForm(null)
    setCreatedForm(null)
    setError("")
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
  }

  const addField = () => {
    const newField: FormField = {
      id: `field_${Date.now()}`,
      label: 'New Field',
      type: 'text',
      required: false,
    }
    setFormConfig(prev => ({
      ...prev,
      fields: [...prev.fields, newField]
    }))
  }

  const removeField = (fieldId: string) => {
    setFormConfig(prev => ({
      ...prev,
      fields: prev.fields.filter(field => field.id !== fieldId)
    }))
  }

  const updateField = (fieldId: string, updates: Partial<FormField>) => {
    setFormConfig(prev => ({
      ...prev,
      fields: prev.fields.map(field => 
        field.id === fieldId ? { ...field, ...updates } : field
      )
    }))
  }

  // Forms List View
  if (view === 'list') {
    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <h2 className="text-xl font-semibold">Registration Forms ({forms.length})</h2>
          <Button onClick={() => { resetForm(); setView('create') }} className="w-full sm:w-auto">
            <Plus className="h-4 w-4 mr-2" />
            Create New Form
          </Button>
        </div>

        {forms.length === 0 ? (
          <Card>
            <CardContent className="p-6">
              <div className="text-center text-gray-500 py-8">
                <FileText className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p className="text-lg font-medium mb-2">No forms created yet</p>
                <p className="text-sm mb-4">Create your first registration form to start collecting student data.</p>
                <Button onClick={() => { resetForm(); setView('create') }}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create First Form
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {forms.map((form) => (
              <Card key={form.id}>
                <CardHeader>
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-lg">{form.title}</CardTitle>
                      <CardDescription className="mt-1">{form.description}</CardDescription>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <Badge variant={form.isActive ? "default" : "secondary"}>
                        {form.isActive ? "Active" : "Inactive"}
                      </Badge>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="sm" onClick={() => copyToClipboard(generateShareableLink(form))}>
                          <Copy className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => window.open(generateShareableLink(form), "_blank")}>
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => startEditForm(form)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => handleDeleteForm(form.id)}
                          disabled={deletingId === form.id}
                        >
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-sm text-gray-600 space-y-2">
                    <div>
                      <p className="font-medium mb-1">Shareable Link:</p>
                      <code className="text-xs bg-gray-100 px-2 py-1 rounded break-all block">
                        {generateShareableLink(form)}
                      </code>
                    </div>
                    <p>Created: {new Date(form.createdAt.toDate()).toLocaleDateString()}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    )
  }

  // Create/Edit Form View
  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <CardTitle className="flex items-center gap-2">
              {view === 'edit' ? <Edit className="h-5 w-5" /> : <Plus className="h-5 w-5" />}
              {view === 'edit' ? 'Edit Registration Form' : 'Create Registration Form'}
            </CardTitle>
            <CardDescription>
              {view === 'edit' 
                ? 'Update your existing form configuration' 
                : 'Build a custom form to collect student information for locker assignments'
              }
            </CardDescription>
          </div>
          <Button variant="outline" onClick={() => { setView('list'); resetForm() }} className="w-full sm:w-auto">
            Back to Forms
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Basic Form Information */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 mb-4">
            <div className="h-8 w-1 bg-primary rounded-full"></div>
            <h3 className="text-lg font-semibold">Basic Information</h3>
          </div>

          <div className="grid grid-cols-1 gap-4">
            <div className="space-y-2">
              <Label htmlFor="title" className="text-sm font-medium">
                Form Title <span className="text-red-500">*</span>
              </Label>
              <Input
                id="title"
                name="title"
                value={formConfig.title}
                onChange={handleInputChange}
                placeholder="e.g., Student Locker Registration 2025"
                className="h-10"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description" className="text-sm font-medium">
                Description
              </Label>
              <Textarea
                id="description"
                name="description"
                value={formConfig.description}
                onChange={handleInputChange}
                placeholder="Describe what this form is for and any important instructions..."
                rows={3}
                className="resize-none"
              />
            </div>

            <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
              <div className="space-y-1">
                <Label htmlFor="isActive" className="text-sm font-medium cursor-pointer">
                  Form Status
                </Label>
                <p className="text-xs text-muted-foreground">
                  {formConfig.isActive ? 'Students can submit responses' : 'Form is disabled and not accepting responses'}
                </p>
              </div>
              <Switch
                id="isActive"
                checked={formConfig.isActive}
                onCheckedChange={handleSwitchChange}
                className="data-[state=checked]:bg-green-500"
              />
            </div>
          </div>
        </div>

        <Separator />

        {/* Form Fields Section */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-semibold text-lg">Form Fields</h4>
              <p className="text-sm text-muted-foreground">Customize the fields students will fill out</p>
            </div>
            <Button type="button" variant="outline" size="sm" onClick={addField}>
              <Plus className="h-4 w-4 mr-2" />
              Add Field
            </Button>
          </div>

          <Separator />

          <div className="space-y-4">
            {formConfig.fields.map((field, index) => (
              <Card key={field.id} className="border-l-4 border-l-primary/20 hover:border-l-primary/40 transition-colors">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-muted-foreground">#{index + 1}</span>
                        <Badge
                          variant="secondary"
                          title={field.type}
                          aria-label={field.type}
                          className="text-[10px] sm:text-xs overflow-hidden truncate"
                        >
                          {field.type}
                        </Badge>
                        {field.required && (
                          <Badge
                            variant="destructive"
                            title="Required"
                            aria-label="Required"
                            className="text-[10px] sm:text-xs overflow-hidden truncate"
                          >
                            Required
                          </Badge>
                        )}
                      </div>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeField(field.id)}
                      disabled={formConfig.fields.length <= 1}
                      className="text-red-500 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor={`field-label-${field.id}`} className="text-sm font-medium">
                        Field Label
                      </Label>
                      <Input
                        id={`field-label-${field.id}`}
                        value={field.label}
                        onChange={(e) => updateField(field.id, { label: e.target.value })}
                        placeholder="Enter field label"
                        className="h-9"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor={`field-type-${field.id}`} className="text-sm font-medium">
                        Field Type
                      </Label>
                      <Select
                        value={field.type}
                        onValueChange={(value) => updateField(field.id, { type: value as FormField['type'] })}
                      >
                        <SelectTrigger className="h-9">
                          <SelectValue placeholder="Select field type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="text">Text</SelectItem>
                          <SelectItem value="number">Number</SelectItem>
                          <SelectItem value="email">Email</SelectItem>
                          <SelectItem value="tel">Phone</SelectItem>
                          <SelectItem value="select">Select Dropdown</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {field.type === 'select' && (
                    <div className="space-y-2">
                      <Label htmlFor={`field-options-${field.id}`} className="text-sm font-medium">
                        Options (comma-separated)
                      </Label>
                      <Input
                        id={`field-options-${field.id}`}
                        value={field.options?.join(', ') || ''}
                        onChange={(e) => updateField(field.id, { options: e.target.value.split(',').map(s => s.trim()).filter(s => s) })}
                        placeholder="Option 1, Option 2, Option 3"
                        className="h-9"
                      />
                      <p className="text-xs text-muted-foreground">
                        Enter options separated by commas. These will appear as dropdown choices.
                      </p>
                    </div>
                  )}

                  <div className="flex items-center space-x-3 pt-2">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id={`field-required-${field.id}`}
                        checked={field.required}
                        onCheckedChange={(checked) => updateField(field.id, { required: checked as boolean })}
                      />
                      <Label
                        htmlFor={`field-required-${field.id}`}
                        className="text-sm font-medium cursor-pointer"
                      >
                        Required field
                      </Label>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {formConfig.fields.length === 0 && (
            <Card className="border-dashed">
              <CardContent className="p-8 text-center">
                <div className="text-muted-foreground">
                  <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p className="text-lg font-medium mb-2">No fields configured</p>
                  <p className="text-sm mb-4">Add your first field to start building the form.</p>
                  <Button type="button" variant="outline" onClick={addField}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add First Field
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        <Button 
          onClick={view === 'edit' ? handleUpdateForm : handleCreateForm} 
          disabled={loading} 
          className="w-full"
        >
          {loading 
            ? (view === 'edit' ? "Updating Form..." : "Creating Form...") 
            : (view === 'edit' ? "Update Form" : "Create Form")
          }
        </Button>
      </CardContent>
    </Card>
  )
}
