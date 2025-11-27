import React, { useRef, useState } from "react";
import { Button } from "@/src/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/src/components/ui/card";
import { Checkbox } from "@/src/components/ui/checkbox";
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle } from "@/src/components/ui/dialog";
import { Download, PenTool } from "lucide-react";

export function SignatureManager({ selectedStudent }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [signMode, setSignMode] = useState(false);

  // store signed record
  const [signedRecord, setSignedRecord] = useState(null);

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
    if (!canvasRef.current || !selectedStudent) return;

    const signature = canvasRef.current.toDataURL("image/png");

    const record = {
      name: selectedStudent.name,
      schoolNumber: selectedStudent.schoolNumber,
      class: selectedStudent.class,
      contactNumber: selectedStudent.contactNumber,
      signedAt: new Date().toLocaleString(),
      signature,
    };

    setSignedRecord(record);
    setSignMode(false);
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold flex gap-2 items-center">
        <PenTool className="h-5 w-5" /> Signature
      </h2>

      <Card>
        <CardHeader>
          <CardTitle>学生签署储物柜合约</CardTitle>
        </CardHeader>

        <CardContent className="space-y-5">

          {/* ================= INFO ================== */}
          {!selectedStudent && (
            <div className="text-gray-600">
              🔐 Assign the locker first — then student can sign.
            </div>
          )}

          {selectedStudent && !signedRecord && (
            <div className="p-3 border rounded bg-gray-50">
              <p><b>姓名:</b> {selectedStudent.name}</p>
              <p><b>学号:</b> {selectedStudent.schoolNumber}</p>
              <p><b>班级:</b> {selectedStudent.class}</p>
              <p><b>联络号码:</b> {selectedStudent.contactNumber}</p>
            </div>
          )}

          {/* ================= OPEN SIGN MODE ================== */}
          {selectedStudent && !signedRecord && (
            <Button className="w-full" onClick={() => setSignMode(true)}>
              开始签署
            </Button>
          )}

          {/* ================= SIGN MODE ================== */}
          {signMode && (
            <>
              {/* ================= 租用规则 ================= */}
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

                  <div className="mt-2 max-h-64 overflow-auto text-sm leading-relaxed">
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
                          <li>初中二、初中三、高中一和高中二的租用储物柜者必须在归还课本后清理该储物柜。</li>
                          <li>高中三的租用储物柜者必须在毕业典礼前一个星期清理该储物柜。</li>
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

              {/* ================= SIGNATURE CANVAS ================= */}
              <div className="border-2 border-dashed rounded-lg p-4">
                <canvas
                  ref={canvasRef}
                  width={400}
                  height={200}
                  className="border rounded cursor-crosshair"
                  onMouseDown={startDrawing}
                  onMouseMove={draw}
                  onMouseUp={stopDrawing}
                  onMouseLeave={stopDrawing}
                  style={{ width: "100%", height: "200px" }}
                />
              </div>

              <div className="flex gap-3">
                <Button variant="outline" className="flex-1" onClick={clearCanvas}>
                  清除签名
                </Button>
                <Button disabled={!agreed} className="flex-1" onClick={saveSignature}>
                  <Download className="h-4 w-4 mr-2" /> 完成签署
                </Button>
              </div>
            </>
          )}

          {/* ================= FINAL RECORD ================== */}
          {signedRecord && (
            <div className="space-y-3 border p-4 rounded bg-green-50">
              <p className="font-semibold text-green-700">✔ 已签署储物柜合约</p>
              <p><b>姓名:</b> {signedRecord.name}</p>
              <p><b>学号:</b> {signedRecord.schoolNumber}</p>
              <p><b>班级:</b> {signedRecord.class}</p>
              <p><b>联络号码:</b> {signedRecord.contactNumber}</p>
              <p><b>时间:</b> {signedRecord.signedAt}</p>

              <img
                src={signedRecord.signature}
                alt="Signature"
                className="border rounded w-full bg-white"
              />
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
