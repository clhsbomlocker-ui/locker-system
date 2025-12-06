import React, { useState, useRef } from "react";
import { Button } from "@/src/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/src/components/ui/card";
import { Input } from "@/src/components/ui/input";
import { Label } from "@/src/components/ui/label";
import { Checkbox } from "@/src/components/ui/checkbox";
import { PenTool, Download } from "lucide-react";
import { db, storage } from "@/src/lib/firebase";
import { doc, setDoc, updateDoc } from "firebase/firestore";
import { ref as storageRef, uploadString, getDownloadURL } from "firebase/storage";

export function LockerAgreement() {
  const [assignedLocker, setAssignedLocker] = useState<string | null>(null);
  const [studentDetails, setStudentDetails] = useState({
    name: "",
    class: "",
    studentId: "",
  });
  const [agreed, setAgreed] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);

  // Simulate admin assigning a locker
  const assignLocker = () => {
    setAssignedLocker("L-102");
    setStudentDetails({
      name: "张三",
      class: "高一(2)班",
      studentId: "20251101",
    });
  };

  // Drawing logic
  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    setIsDrawing(true);
    ctx.beginPath();
    ctx.moveTo(e.nativeEvent.offsetX, e.nativeEvent.offsetY);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.lineTo(e.nativeEvent.offsetX, e.nativeEvent.offsetY);
    ctx.stroke();
  };

  const stopDrawing = () => setIsDrawing(false);

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  };

  const saveSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const link = document.createElement("a");
    link.download = "signature.png";
    link.href = canvas.toDataURL();
    link.click();
  };

  return (
    <div className="space-y-6 p-4" style={{ fontFamily: "Kaiti, serif" }}>
      {!assignedLocker ? (
        <Button onClick={assignLocker}>Admin Assign Locker</Button>
      ) : (
        <>
          <Card>
            <CardHeader>
              <CardTitle>储物柜分配</CardTitle>
              <CardDescription>学生储物柜详情</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <p><strong>储物柜编号：</strong>{assignedLocker}</p>
              <p><strong>学生姓名：</strong>{studentDetails.name}</p>
              <p><strong>班级：</strong>{studentDetails.class}</p>
              <p><strong>学号：</strong>{studentDetails.studentId}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>储物柜租用规则</CardTitle>
              <CardDescription>请阅读并同意以下条款</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              <ol className="list-decimal ml-6 space-y-2">
                <li>本校储物柜提供学生在课余时间收放简便物件之用。</li>
                <li>本校对因使用储物柜所造成的损失，不承担任何责任。</li>
                <li>学生不可以收放任何贵重的物品于储物柜内。</li>
                <li>学生不可以存放任何违禁物件 (包括手机)。</li>
                <li>学生只能在上课前，休息时间和放学后使用储物柜，违规者将被记一个小过。</li>
                <li>物件存放好后，切记随身携带储物柜的钥匙。</li>
                <li>学生必须自备储物柜的锁头及钥匙，学校不承担任何责任。</li>
                <li>学校可以随时展开行动，突击检查储物柜，学生不能拒绝接受检查。</li>
                <li>
                  a. 初中二、初中三、高中一和高中二的租用储物柜者必须在归还课本后清理该储物柜，不遗留任何物件。
                  <br />
                  b. 高中三的租用储物柜者必须在毕业典礼前一个星期清理该储物柜，不遗留任何物件。
                </li>
                <li>租用储物柜者必须签署租用合约及遵守使用规则。</li>
                <li>租用储物柜者，必须在签约时一次过缴清租金。</li>
                <li>储物柜若有损坏，学生须付修理损坏之费用。</li>
                <li>租期未满者，半途欲终止租约者，租金一律不退还。</li>
                <li>学校有权在任何时候增添租用条规。</li>
              </ol>

              <div className="flex items-center gap-2 mt-2">
                <Checkbox
                  id="agree"
                  checked={agreed}
                  onCheckedChange={(checked) => setAgreed(!!checked)}
                />
                <Label htmlFor="agree">我已阅读并同意以上储物柜租用规则</Label>
              </div>

              {agreed && (
                <div className="mt-4">
                  <h4 className="font-medium mb-2">学生签名</h4>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-2">
                    <canvas
                      ref={canvasRef}
                      width={400}
                      height={200}
                      className="border border-gray-200 rounded cursor-crosshair"
                      onMouseDown={startDrawing}
                      onMouseMove={draw}
                      onMouseUp={stopDrawing}
                      onMouseLeave={stopDrawing}
                      style={{ width: "100%", height: "200px" }}
                    />
                  </div>
                  <div className="flex gap-2 mt-2">
                    <Button onClick={clearCanvas} variant="outline" className="flex-1">
                      清除
                    </Button>
                    <Button onClick={saveSignature} className="flex-1">
                      <Download className="h-4 w-4 mr-2" />
                      保存签名
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}

interface SignatureCaptureProps {
  assignmentId: string;
  lockerId: string;
  studentId: string;
  studentName?: string;
  onSaved?: (url: string) => void;
}

export function SignatureCapture({ assignmentId, lockerId, studentId, studentName, onSaved }: SignatureCaptureProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [saving, setSaving] = useState(false);

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    setIsDrawing(true);
    ctx.beginPath();
    ctx.moveTo(e.nativeEvent.offsetX, e.nativeEvent.offsetY);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.lineTo(e.nativeEvent.offsetX, e.nativeEvent.offsetY);
    ctx.stroke();
  };

  const stopDrawing = () => setIsDrawing(false);

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  };

  const saveSignature = async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    setSaving(true);
    try {
      const dataUrl = canvas.toDataURL("image/png");
      // upload to storage
      const sigId = `sig_${Date.now()}_${assignmentId}`;
      const sRef = storageRef(storage, `signatures/${sigId}.png`);
      await uploadString(sRef, dataUrl, "data_url");
      const url = await getDownloadURL(sRef);

      // write signature doc
      await setDoc(doc(db, "signatures", sigId), {
        id: sigId,
        assignmentId,
        lockerId,
        studentId,
        studentName: studentName || null,
        signatureUrl: url,
        createdAt: new Date(),
      });

      // update assignment
      await updateDoc(doc(db, "assignments", assignmentId), {
        signatureId: sigId,
        signatureUrl: url,
        signatureCompletedAt: new Date(),
      });

      onSaved?.(url);
    } catch (error) {
      console.error("Failed to save signature:", error);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-2">
      <div className="text-sm">请在下方签名以完成合约</div>
      <div className="border-2 border-dashed border-gray-300 rounded-lg p-2">
        <canvas
          ref={canvasRef}
          width={600}
          height={200}
          className="border border-gray-200 rounded cursor-crosshair"
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          style={{ width: "100%", height: "200px" }}
        />
      </div>
      <div className="flex gap-2">
        <Button variant="outline" onClick={clearCanvas} disabled={saving} className="flex-1">清除</Button>
        <Button onClick={saveSignature} className="flex-1" disabled={saving}>
          <Download className="h-4 w-4 mr-2" />
          {saving ? "保存中..." : "提交签名"}
        </Button>
      </div>
    </div>
  );
}
