"use client";
import React, { useState, useRef } from "react";
import { Button } from "@/src/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/src/components/ui/card";
import { Checkbox } from "@/src/components/ui/checkbox";
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle } from "@/src/components/ui/dialog";

// Props:
// selectedStudent = { name, schoolNumber, class, contactNumber }
export default function StudentSignature({ selectedStudent }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);

  const [agreed, setAgreed] = useState(false);
  const [signedRecord, setSignedRecord] = useState<any>(null);

  // canvas events
  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    setIsDrawing(true);
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left) * (canvas.width / rect.width);
    const y = (e.clientY - rect.top) * (canvas.height / rect.height);

    ctx.beginPath();
    ctx.lineWidth = 2;
    ctx.lineJoin = "round";
    ctx.lineCap = "round";
    ctx.moveTo(x, y);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left) * (canvas.width / rect.width);
    const y = (e.clientY - rect.top) * (canvas.height / rect.height);

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

    const dataURL = canvas.toDataURL();

    const record = {
      ...selectedStudent,
      signature: dataURL,
      time: new Date().toISOString(),
    };

    setSignedRecord(record);

    // download PNG
    const link = document.createElement("a");
    link.download = `${selectedStudent?.name ?? "signature"}.png`;
    link.href = dataURL;
    link.click();
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Locker Signature</h1>

      {/* NO STUDENT SELECTED */}
      {!selectedStudent && (
        <div className="p-4 text-center text-gray-500 border rounded">
          🚫 Assign a student first.
        </div>
      )}

      {/* STUDENT DETAIL */}
      {selectedStudent && (
        <Card>
          <CardHeader>
            <CardTitle>Student Details</CardTitle>
          </CardHeader>

          <CardContent className="space-y-2">
            <p><b>Name:</b> {selectedStudent.name}</p>
            <p><b>School No:</b> {selectedStudent.schoolNumber}</p>
            <p><b>Class:</b> {selectedStudent.class}</p>
            <p><b>Contact:</b> {selectedStudent.contactNumber}</p>
          </CardContent>
        </Card>
      )}

      {/* SHOW SIGNATURE UI */}
      {selectedStudent && (
        <Card>
          <CardHeader>
            <CardTitle>签署合约</CardTitle>
            <CardDescription>学生须阅读条规 + 同意 + 签名</CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            {/* RULES */}
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

                <div className="max-h-72 overflow-auto text-sm space-y-2 leading-relaxed mt-3">
                  <ol className="list-decimal ml-6 space-y-2">
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
                      <ol className="list-lower-alpha ml-5 space-y-1">
                        <li>初中二、初中三、高中一和高中二的租用储物柜者必须在归还课本后清理该储物柜。</li>
                        <li>高中三须在毕业典礼前一星期清理储物柜。</li>
                      </ol>
                    </li>
                    <li>租用储物柜者必须签署租用合约并遵守使用规则。</li>
                    <li>签约时必须一次过缴清租金。</li>
                    <li>若储物柜损坏，须支付修理费用。</li>
                    <li>租期未满终止租约者，租金不退还。</li>
                    <li>学校有权增添租用条规。</li>
                  </ol>
                </div>

                <div className="flex gap-2 mt-4">
                  <Checkbox
                    id="agree"
                    checked={agreed}
                    onCheckedChange={(v) => setAgreed(Boolean(v))}
                  />
                  <label htmlFor="agree">
                    我已阅读并同意上述储物柜租用规则
                  </label>
                </div>
              </DialogContent>
            </Dialog>

            {/* SIGN PAD */}
            <div className="border border-gray-300 p-3 rounded-lg">
              <canvas
                ref={canvasRef}
                width={450}
                height={200}
                className="border rounded w-full cursor-crosshair"
                onMouseDown={startDrawing}
                onMouseMove={draw}
                onMouseUp={stopDrawing}
                onMouseLeave={stopDrawing}
              />
            </div>

            <div className="flex gap-3">
              <Button variant="outline" onClick={clearCanvas} className="flex-1">
                Clear
              </Button>
              <Button disabled={!agreed} onClick={saveSignature} className="flex-1">
                ✔ Save Signature
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* SHOW SIGNED RECORD */}
      {signedRecord && (
        <Card className="border-green-500">
          <CardHeader>
            <CardTitle>📦 Signed Record Saved</CardTitle>
          </CardHeader>

          <CardContent className="space-y-2">
            <p><b>Student:</b> {signedRecord.name}</p>
            <p><b>School No:</b> {signedRecord.schoolNumber}</p>
            <p><b>Time:</b> {signedRecord.time}</p>

            <img
              src={signedRecord.signature}
              alt="Signature"
              className="border w-full mt-2 rounded"
            />
          </CardContent>
        </Card>
      )}
    </div>
  );
}

