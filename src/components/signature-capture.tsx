"use client"

import { useState, useEffect } from "react"
import { Button } from "@/src/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/src/components/ui/card"
import { Alert, AlertDescription } from "@/src/components/ui/alert"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/src/components/ui/dialog"
import { CheckCircle, PenTool, User } from "lucide-react"
import { SignaturePad } from "./signature-pad"
import { doc, updateDoc, addDoc, collection } from "firebase/firestore"
import { db } from "@/src/lib/firebase"
import type { Student, LockerAssignment } from "@/src/lib/types"

interface SignatureCaptureProps {
  student: Student
  assignment: LockerAssignment | null // Allow null assignment for pre-assignment signatures
  onComplete?: (signatureUrl?: string) => void // Pass signature URL to parent
  onCancel?: () => void // Add cancel callback
  autoOpen?: boolean
  requireSignature?: boolean // Add prop to require signature before proceeding
}

export function SignatureCaptureDialog({
  student,
  assignment,
  onComplete,
  onCancel,
  autoOpen = false,
  requireSignature = false,
}: SignatureCaptureProps) {
  const [open, setOpen] = useState(autoOpen)
  const [loading, setLoading] = useState(false)
  const [completed, setCompleted] = useState(false)
  const [error, setError] = useState("")
  const [showRules, setShowRules] = useState(false)

  useEffect(() => {
    if (autoOpen) {
      setOpen(true)
    }
  }, [autoOpen])

  const handleSignatureSave = async (signatureDataUrl: string) => {
    setLoading(true)
    setError("")

    try {
      const signatureData = {
        studentId: student.id,
        studentName: student.name,
        studentSchoolNumber: student.schoolNumber,
        signatureBase64: signatureDataUrl,
        createdAt: new Date(),
        lockerId: assignment?.lockerId || null,
        assignmentId: assignment?.id || null,
      }

      const signatureDoc = await addDoc(collection(db, "signatures"), signatureData)

      if (assignment) {
        await updateDoc(doc(db, "assignments", assignment.id), {
          signatureId: signatureDoc.id,
          signatureBase64: signatureDataUrl,
          signatureCompletedAt: new Date(),
        })
      }

      setCompleted(true)
      setTimeout(() => {
        setOpen(false)
        onComplete?.(signatureDataUrl)
      }, 2000)
    } catch (error: any) {
      console.error("[v0] Signature save error:", error)
      setError(error.message || "Failed to save signature")
    } finally {
      setLoading(false)
    }
  }

  const handleCancel = () => {
    setOpen(false)
    onCancel?.()
  }

  if (completed) {
    return (
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <div className="mx-auto bg-green-600 rounded-full w-16 h-16 flex items-center justify-center mb-4">
              <CheckCircle className="h-8 w-8 text-white" />
            </div>
            <DialogTitle className="text-center text-green-800">Signature Saved!</DialogTitle>
            <DialogDescription className="text-center">
              The digital signature has been successfully captured and stored.
            </DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <>
      {!autoOpen && (
        <Button onClick={() => setOpen(true)} className="flex items-center gap-2">
          <PenTool className="h-4 w-4" />
          Capture Signature
        </Button>
      )}

      <Dialog open={open} onOpenChange={requireSignature ? undefined : setOpen}>
        <DialogContent className="max-w-7xl w-[95vw]">
          <DialogHeader>
            <DialogTitle>Digital Signature Capture</DialogTitle>
            <DialogDescription>
              {requireSignature
                ? "Student signature is required to complete the locker assignment."
                : "Please have the student sign below to complete the locker assignment."}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div>
              <div className="flex justify-end">
                <Button variant="outline" onClick={() => setShowRules(true)}>
                  Rules and Regulations
                </Button>
              </div>

              <Dialog open={showRules} onOpenChange={setShowRules}>
                <DialogContent className="max-w-3xl">
                  <DialogHeader>
                    <DialogTitle className="text-base text-center" style={{ fontFamily: 'KaiTi, \"楷体\", serif' }}>
                      锺灵中学学生储物柜租用规则
                    </DialogTitle>
                  </DialogHeader>

                  <div className="p-4">
                    <div className="text-sm space-y-2 leading-relaxed" style={{ fontFamily: 'KaiTi, \"楷体\", serif' }}>
                      <p>1. 本校储物柜提供学生在课余时间收放简便物件之用。</p>
                      <p>2. 本校对因使用储物柜所造成的损失，不承担任何责任。</p>
                      <p>3. 学生不可以收放任何贵重的物品于储物柜内。</p>
                      <p>4. 学生不可以存放任何违禁物件 (包括手机)。</p>
                      <p>5. 学生只能在上课前，休息时间和放学后使用储物柜，违规者将被记一个小过。</p>
                      <p>6. 物件存放好后，切记随身携带储物柜的钥匙。</p>
                      <p>7. 学生必须自备储物柜的锁头及钥匙，学校不承担任何责任。</p>
                      <p>8. 学校可以随时展开行动，突击检查储物柜，学生不能拒绝接受检查。</p>
                      <p>9. a. 初中二、初中三、高中一和高中二的租用储物柜者必须在归还课本后清理该储物柜，不遗留任何物件。<br/>     b. 高中三的租用储物柜者必须在毕业典礼前一个星期清理该储物柜，不遗留任何物件。</p>
                      <p>10. 租用储物柜者必须签署租用合约及遵守使用规则。</p>
                      <p>11. 租用储物柜者，必须在签约时一次过缴清租金。</p>
                      <p>12. 储物柜若有损坏，学生须付修理损坏之费用。</p>
                      <p>13. 租期未满者，半途欲终止租约者，租金一律不退还。</p>
                      <p>14. 学校有权在任何时候增添租用条规。</p>
                    </div>

                    <div className="flex justify-end mt-4">
                      <Button variant="ghost" onClick={() => setShowRules(false)}>
                        Close
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            <SignaturePad onSignatureSave={handleSignatureSave} disabled={loading} />

            {loading && (
              <Alert>
                <AlertDescription>Saving signature...</AlertDescription>
              </Alert>
            )}

            {requireSignature && onCancel && (
              <div className="flex justify-end">
                <Button variant="outline" onClick={handleCancel} disabled={loading}>
                  Cancel Assignment
                </Button>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
