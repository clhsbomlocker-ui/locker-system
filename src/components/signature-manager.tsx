import React, { useState, useRef } from "react";
import { Button } from "@/src/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/src/components/ui/card";
import { Input } from "@/src/components/ui/input";
import { Label } from "@/src/components/ui/label";
import { Textarea } from "@/src/components/ui/textarea";
import { PenTool, Save, Download, Trash2 } from "lucide-react";
import { Checkbox } from "@/src/components/ui/checkbox";
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/src/components/ui/dialog";

export function SignatureManager() {
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

  const handleAddSignature = () => {
    if (newSignature.name.trim()) {
      const signature = {
        id: Date.now(),
        name: newSignature.name,
        description: newSignature.description,
        createdAt: new Date().toISOString().split('T')[0],
      };
      setSignatures([...signatures, signature]);
      setNewSignature({ name: "", description: "" });
    }
  };

  const handleDeleteSignature = (id: number) => {
    setSignatures(signatures.filter(sig => sig.id !== id));
  };

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    setIsDrawing(true);
    ctx.beginPath();
    ctx.moveTo(e.nativeEvent.offsetX, e.nativeEvent.offsetY);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.lineTo(e.nativeEvent.offsetX, e.nativeEvent.offsetY);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
  };

  const saveSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const link = document.createElement('a');
    link.download = 'signature.png';
    link.href = canvas.toDataURL();
    link.click();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Signature Management</h2>
          <p className="text-gray-600">Manage digital signatures for locker agreements</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Signature Templates */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PenTool className="h-5 w-5" />
              Signature Templates
            </CardTitle>
            <CardDescription>
              Create and manage signature templates for different purposes
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="template-name">Template Name</Label>
              <Input
                id="template-name"
                placeholder="e.g., Student Agreement"
                value={newSignature.name}
                onChange={(e) => setNewSignature({ ...newSignature, name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="template-description">Description</Label>
              <Textarea
                id="template-description"
                placeholder="Describe the purpose of this signature template"
                value={newSignature.description}
                onChange={(e) => setNewSignature({ ...newSignature, description: e.target.value })}
              />
            </div>
            <Button onClick={handleAddSignature} className="w-full">
              <Save className="h-4 w-4 mr-2" />
              Add Template
            </Button>

            <div className="space-y-2 mt-6">
              <h4 className="font-medium">Existing Templates</h4>
              {signatures.map((signature) => (
                <div key={signature.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="font-medium">{signature.name}</p>
                    <p className="text-sm text-gray-600">{signature.description}</p>
                    <p className="text-xs text-gray-500">Created: {signature.createdAt}</p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDeleteSignature(signature.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Signature Pad */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PenTool className="h-5 w-5" />
              Digital Signature Pad
            </CardTitle>
            <CardDescription>
              Capture digital signatures for agreements
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Rules modal trigger */}
            <div className="mb-2">
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="outline" className="w-full">
                    锺灵中学学生储物柜租用规则
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>锺灵中学学生储物柜租用规则</DialogTitle>
                  </DialogHeader>

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

                  <div className="flex items-center gap-2 mt-4">
                    <Checkbox id="agree-rules" checked={agreed} onCheckedChange={(v) => setAgreed(Boolean(v))} />
                    <label htmlFor="agree-rules" className="text-sm">我已阅读并同意上述储物柜租用规则</label>
                  </div>

                  <div className="mt-4">
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
                      <canvas
                        ref={canvasRef}
                        width={400}
                        height={200}
                        className="border border-gray-200 rounded cursor-crosshair"
                        onMouseDown={startDrawing}
                        onMouseMove={draw}
                        onMouseUp={stopDrawing}
                        onMouseLeave={stopDrawing}
                        style={{ width: '100%', height: '200px' }}
                      />
                    </div>
                  </div>

                  <DialogFooter>
                    <div className="flex w-full gap-2">
                      <Button onClick={clearCanvas} variant="outline" className="flex-1">
                        Clear
                      </Button>
                      <Button onClick={saveSignature} className="flex-1" disabled={!agreed}>
                        <Download className="h-4 w-4 mr-2" />
                        Save Signature
                      </Button>
                    </div>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
            <div className="flex gap-2">
              <Button onClick={clearCanvas} variant="outline" className="flex-1">
                Clear
              </Button>
              <Button onClick={saveSignature} className="flex-1" disabled={!agreed}>
                <Download className="h-4 w-4 mr-2" />
                Save Signature
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
