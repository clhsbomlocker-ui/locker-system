import React, { useState, useRef } from "react";
import { Button } from "@/src/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/src/components/ui/card";
import { Input } from "@/src/components/ui/input";
import { Label } from "@/src/components/ui/label";
import { Textarea } from "@/src/components/ui/textarea";
import { PenTool, Save, Download, Trash2 } from "lucide-react";

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
            <div className="flex gap-2">
              <Button onClick={clearCanvas} variant="outline" className="flex-1">
                Clear
              </Button>
              <Button onClick={saveSignature} className="flex-1">
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
