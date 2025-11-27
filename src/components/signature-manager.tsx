import React, { useState, useRef } from "react";
import { Button } from "@/src/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/src/components/ui/card";
import { Input } from "@/src/components/ui/input";
import { Label } from "@/src/components/ui/label";
import { Textarea } from "@/src/components/ui/textarea";
import { PenTool, Save, Download, Trash2 } from "lucide-react";
import { Checkbox } from "@/src/components/ui/checkbox";
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle } from "@/src/components/ui/dialog";

/**
 * Props needed:
 * selectedStudent = {
 *   name,
 *   schoolNumber,
 *   class,
 *   contactNumber
 * }
 */
export function SignatureManager({ selectedStudent }) {
  const [signatures, setSignatures] = useState([
    { id: 1, name: "Student Agreement", description: "Standard student locker agreement", createdAt: "2025-01-15" },
    { id: 2, name: "Parent Consent", description: "Parental consent for locker usage", createdAt: "2025-01-10" },
  ]);

  const [newSignature, setNewSignature] = useState({
    name: "",
    description: "",
  });

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [agreed, setAgreed] = useState(false);

  // student can only sign after admin assigns locker
  const [signMode, setSignMode] = useState(false);

  // =========================
  // Signature Canvas Logic
  // =========================
  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    setIsDrawing(true);
    const rect = canvas.getBoundingClientRect();
    const x = ((e.clientX - rect.left) * (canvas.width / rect.width));
    const y = ((e.clientY - rect.top) * (canvas.height / rect.height));

    ctx.beginPath();
    ctx.lineJoin = "round";
    ctx.lineCap = "round";
    ctx.lineWidth = 2;
    ctx.moveTo(x, y);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = ((e.clientX - rect.left) * (canvas.width / rect.width));
    const y = ((e.clientY - rect.top) * (canvas.height / rect.height));

    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => setIsDrawing(false);

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  };

  const saveSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const link = document.createElement("a");
    link.download = `${selectedStudent?.name ?? "signature"}.png`;
    link.href = canvas.toDataURL();
    link.click();
  };

  // =========================
  // Template Functions
  // =========================
  const handleAddSignature = () => {
    if (!newSignature.name.trim()) return;

    const signature = {
      id: Date.now(),
      name: newSignature.name,
      description: newSignature.description,
      createdAt: new Date().toISOString().split("T")[0],
    };
    setSignatures([...signatures, signature]);
    setNewSignature({ name: "", description: "" });
  };

  const handleDeleteSignature = (id: number) => {
    setSignatures(signatures.filter((s) => s.id !== id));
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Signature Management</h2>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* ========== LEFT — TEMPLATE ========== */}
        <Card>
          <CardHeader>
            <CardTitle className="flex gap-2 items-center">
              <PenTool className="h-5 w-5" /> Signature Templates
            </CardTitle>
            <CardDescription>Create and manage signature templates</CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            <div className="space-y-1">
              <Label>Template Name</Label>
              <Input
                value={newSignature.name}
                onChange={(e) => setNewSignature({ ...newSignature, name: e.target.value })}
              />
            </div>

            <div className="space-y-1">
              <Label>Description</Label>
              <Textarea
                value={newSignature.description}
                onChange={(e) => setNewSignature({ ...newSignature, description: e.target.value })}
              />
            </div>

            <Button className="w-full" onClick={handleAddSignature}>
              <Save className="h-4 w-4 mr-2" /> Add Template
            </Button>

            <div className="mt-6 space-y-2">
              <h4 className="font-medium">Existing Templates</h4>

              {signatures.map((sig) => (
                <div key={sig.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="font-medium">{sig.name}</p>
                    <p className="text-sm text-gray-600">{sig.description}</p>
                    <p className="text-xs text-gray-400">Created: {sig.createdAt}</p>
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDeleteSignature(sig.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* ========== RIGHT — SIGNATURE PANEL ========== */}
        <Card>
          <CardHeader>
            <CardTitle className="flex gap-2 items-center">
              <PenTool className="h-5 w-5" /> Digital Signature
            </CardTitle>
            <CardDescription>Assign locker → student signs</CardDescription>
          </CardHeader>

          <CardContent className="space-y-5">

            {/* Student info from locker grid */}
            {selectedStudent ? (
              <div className="p-3 border rounded bg-gray-50">
                <p><b>Name:</b> {selectedStudent.name}</p>
                <p><b>School No:</b> {selectedStudent.schoolNumber}</p>
                <p><b>Class:</b> {selectedStudent.class}</p>
                <p><b>Contact:</b> {selectedStudent.contactNumber}</p>
              </div>
            ) : (
              <div className="text-gray-500 text-sm">
                🔐 Assign locker first — then student will sign here.
              </div>
            )}

            {/* Button to start signing */}
            <Button
              disabled={!selectedStudent}
              onClick={() => setSignMode(true)}
              className="w-full"
            >
              Let Student Sign
            </Button>

            {signMode && (
              <>
                {/* ======== RENTAL RULES (UNCHANGED) ======== */}
                <Dialog>
                  <DialogTrigger asChild>
                    <Button variant="outline" className="w-full">
                      锺灵中学学生储物柜租用规则（必读）
                    </Button>
                  </DialogTrigger>

                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>锺灵中学学生储物柜租用规则</DialogTitle>
                    </DialogHeader>

                    {/* DO NOT TOUCH: your original rules */}
                    <div className="mt-2 max-h-60 overflow-auto text-sm leading-relaxed">
                      <ol className="list-decimal ml-5 space-y-2">
                        <li>本校储物柜提供学生在课余时间收放简便物件之用。</li>
                        <li>本校对因使用储物柜所造成的损失，不承担任何责任。</li>
                        <li>学生不可以收放任何贵重的物品于储物柜内。</li>
                        <li>学生不可以存放任何违禁物件（包括手机）。</li>
                        <li>学生只能在上课前、休息时间和放学后使用储物柜，违规者将被记一个小过。</li>
                        <li>物件存放好后，切记随身携带储物柜的钥匙。</li>
                        <li>学生必须自备储物柜的锁头及钥匙，学校不承担任何责任。</li>
                        <li>学校可以随时展开行动，突击检查储物柜，学生不能拒绝接受检查。</li>
                        <li>
                          清理要求：
                          <ol className="list-lower-alpha ml-5 mt-1">
                            <li>初中二、初中三、高中一和高中二的租用储物柜者必须在归还课本后清理该储物柜，不遗留任何物件。</li>
                            <li>高中三的租用储物柜者必须在毕业典礼前一个星期清理该储物柜，不遗留任何物件。</li>
                          </ol>
                        </li>
                        <li>租用储物柜者必须签署租用合约及遵守使用规则。</li>
                        <li>租用储物柜者，必须在签约时一次过缴清租金。</li>
                        <li>储物柜若有损坏，学生须付修理损坏之费用。</li>
                        <li>租期未满者，半途欲终止租约者，租金一律不退还。</li>
                        <li>学校有权在任何时候增添租用条规。</li>
                      </ol>
                    </div>

                    <div className="flex gap-2 mt-4">
                      <Checkbox
                        id="agree-rules"
                        checked={agreed}
                        onCheckedChange={(v) => setAgreed(Boolean(v))}
                      />
                      <label htmlFor="agree-rules" className="text-sm">
                        我已阅读并同意上述储物柜租用规则
                      </label>
                    </div>
                  </DialogContent>
                </Dialog>

                {/* SIGNATURE PAD */}
                <div className="border-2 border-dashed rounded-lg p-4">
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

                <div className="flex gap-3">
                  <Button variant="outline" className="flex-1" onClick={clearCanvas}>
                    Clear
                  </Button>
                  <Button disabled={!agreed} className="flex-1" onClick={saveSignature}>
                    <Download className="h-4 w-4 mr-2" /> Save Signature
                  </Button>
                </div>
              </>
            )}
          </CardContent>
        </Card>

      </div>
    </div>
  );
}
