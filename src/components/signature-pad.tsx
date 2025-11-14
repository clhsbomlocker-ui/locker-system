"use client"

import type React from "react"

import { useRef, useEffect, useState } from "react"
import { Button } from "@/src/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/src/components/ui/card"
import { Alert, AlertDescription } from "@/src/components/ui/alert"
import { PenTool, RotateCcw, Save, Download } from "lucide-react"

interface SignaturePadProps {
  onSignatureSave?: (signatureDataUrl: string) => void
  width?: number
  height?: number
  disabled?: boolean
}

export function SignaturePad({ onSignatureSave, width = 400, height = 200, disabled = false }: SignaturePadProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [isDrawing, setIsDrawing] = useState(false)
  const [hasSignature, setHasSignature] = useState(false)
  const [lastPoint, setLastPoint] = useState<{ x: number; y: number } | null>(null)

  // refs to keep latest values for native event handlers
  const isDrawingRef = useRef(isDrawing)
  const lastPointRef = useRef(lastPoint)

  useEffect(() => {
    isDrawingRef.current = isDrawing
  }, [isDrawing])

  useEffect(() => {
    lastPointRef.current = lastPoint
  }, [lastPoint])

  // keep aspect ratio from provided width/height
  const aspect = height > 0 && width > 0 ? height / width : 0.5

  // Initialize and resize canvas to container width with DPR scaling. Preserve content across resizes.
  useEffect(() => {
    const canvas = canvasRef.current
    const container = containerRef.current
    if (!canvas || !container) return

    const dpr = typeof window !== "undefined" ? window.devicePixelRatio || 1 : 1

    const resizeCanvas = () => {
      const rect = container.getBoundingClientRect()
      // Use CSS pixels for desired size (not scaled by DPR)
      const cssWidth = Math.max(100, Math.floor(rect.width))
      const cssHeight = Math.max(80, Math.floor(cssWidth * aspect))

      // Save previous drawing into an offscreen canvas at CSS pixel dimensions
      let prevCanvas: HTMLCanvasElement | null = null
      try {
        prevCanvas = document.createElement("canvas")
        prevCanvas.width = cssWidth
        prevCanvas.height = cssHeight
        const prevCtx = prevCanvas.getContext("2d")
        if (prevCtx) {
          // draw existing visible canvas content into prevCanvas
          prevCtx.fillStyle = "#ffffff"
          prevCtx.fillRect(0, 0, cssWidth, cssHeight)
          // draw using drawImage with CSS-sized source
          prevCtx.drawImage(canvas, 0, 0, cssWidth, cssHeight)
        }
      } catch (e) {
        prevCanvas = null
      }

      // Set backing store size (actual pixels)
      canvas.width = Math.round(cssWidth * dpr)
      canvas.height = Math.round(cssHeight * dpr)

      // Ensure canvas fills the aspect box via CSS
      canvas.style.width = "100%"
      canvas.style.height = "100%"

      const ctx = canvas.getContext("2d")
      if (!ctx) return

      // Reset transforms then scale by DPR so drawing coordinates (in CSS pixels) map correctly
      ctx.setTransform(1, 0, 0, 1, 0, 0)
      ctx.scale(dpr, dpr)

      // drawing styles (use CSS-pixel widths)
      ctx.strokeStyle = "#000000"
      ctx.lineWidth = 2
      ctx.lineCap = "round"
      ctx.lineJoin = "round"

      // Clear background in CSS pixel space
      ctx.fillStyle = "#ffffff"
      ctx.fillRect(0, 0, cssWidth, cssHeight)

      // Restore previous content if any (draw from prevCanvas which is CSS-pixel sized)
      if (prevCanvas) {
        try {
          ctx.drawImage(prevCanvas, 0, 0, cssWidth, cssHeight)
        } catch (e) {
          // ignore drawing errors
        }
      }
    }

    // Initial resize
    resizeCanvas()

    // Use ResizeObserver to handle container width changes (responsive)
    let ro: ResizeObserver | null = null
    if (typeof ResizeObserver !== "undefined") {
      ro = new ResizeObserver(() => {
        resizeCanvas()
      })
      ro.observe(container)
    }

    // Cleanup
    return () => {
      if (ro && container) ro.unobserve(container)
    }
  }, [aspect])

  const getEventPos = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas) return { x: 0, y: 0 }

    const rect = canvas.getBoundingClientRect()
    // compute scale from CSS pixels to backing store pixels
    const scaleX = canvas.width / rect.width
    const scaleY = canvas.height / rect.height

    let clientX = 0
    let clientY = 0

    if ("touches" in e) {
      const touch = (e as React.TouchEvent<HTMLCanvasElement>).touches[0] || (e as React.TouchEvent<HTMLCanvasElement>).changedTouches[0]
      if (touch) {
        clientX = touch.clientX
        clientY = touch.clientY
      }
    } else {
      const me = e as React.MouseEvent<HTMLCanvasElement>
      clientX = me.clientX
      clientY = me.clientY
    }

    // Map to backing-store pixel coordinates so drawing uses the same space as canvas.width/height
    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY,
    }
  }

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (disabled) return
    // If this is a touch event, don't call preventDefault here because
    // touch handling is performed by native non-passive listeners below.
    const isTouch = "touches" in e
    if (!isTouch) {
      e.preventDefault()
    }
    setIsDrawing(true)
    isDrawingRef.current = true
    const pos = getEventPos(e)
    setLastPoint(pos)
    lastPointRef.current = pos
  }

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawingRef.current || disabled) return
    const isTouch = "touches" in e
    if (!isTouch) {
      e.preventDefault()
    }
    const canvas = canvasRef.current
    const ctx = canvas?.getContext("2d")
    if (!canvas || !ctx || !lastPointRef.current) return

    const currentPos = getEventPos(e)

    // Draw using backing-store pixel coordinates
    ctx.save()
    // draw in backing-store space: reset transform
    ctx.setTransform(1, 0, 0, 1, 0, 0)
    const dpr = typeof window !== "undefined" ? window.devicePixelRatio || 1 : 1
    ctx.lineWidth = 2 * dpr
    ctx.lineCap = "round"
    ctx.lineJoin = "round"
    ctx.strokeStyle = "#000000"
    ctx.beginPath()
    ctx.moveTo(lastPointRef.current.x, lastPointRef.current.y)
    ctx.lineTo(currentPos.x, currentPos.y)
    ctx.stroke()
    ctx.restore()

    setLastPoint(currentPos)
    lastPointRef.current = currentPos
    setHasSignature(true)
  }

  const stopDrawing = () => {
    setIsDrawing(false)
    isDrawingRef.current = false
    setLastPoint(null)
    lastPointRef.current = null
  }

  const clearSignature = () => {
    const canvas = canvasRef.current
    const ctx = canvas?.getContext("2d")
    if (!canvas || !ctx) return

    // Clear using backing-store pixel dimensions to avoid blurring
    const rect = canvas.getBoundingClientRect()
    const cssWidth = Math.max(100, Math.floor(rect.width))
    const cssHeight = Math.max(80, Math.floor(cssWidth * aspect))
    const dpr = typeof window !== "undefined" ? window.devicePixelRatio || 1 : 1

    ctx.setTransform(1, 0, 0, 1, 0, 0)
    // Clear whole backing store
    ctx.clearRect(0, 0, Math.round(cssWidth * dpr), Math.round(cssHeight * dpr))
    // Fill white background in backing-store pixels
    ctx.fillStyle = "#ffffff"
    ctx.fillRect(0, 0, Math.round(cssWidth * dpr), Math.round(cssHeight * dpr))
    setHasSignature(false)
  }

  const saveSignature = () => {
    const canvas = canvasRef.current
    if (!canvas || !hasSignature) return

    // Export at current backing store resolution to preserve quality
    const dataUrl = canvas.toDataURL("image/png")
    onSignatureSave?.(dataUrl)
  }

  const downloadSignature = () => {
    const canvas = canvasRef.current
    if (!canvas || !hasSignature) return

    const dataUrl = canvas.toDataURL("image/png")
    const link = document.createElement("a")
    link.download = `signature_${new Date().toISOString().split("T")[0]}.png`
    link.href = dataUrl
    link.click()
  }

  // Attach non-passive native touch listeners so preventDefault can be called without warnings.
  // We add these listeners with passive: false and draw directly using refs to avoid stale closures.
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const handleTouchStart = (ev: TouchEvent) => {
      if ((ev as any).target && (ev as any).target.disabled) return
      ev.preventDefault()
      const pos = getEventPos(ev as any)
      isDrawingRef.current = true
      lastPointRef.current = pos
      setIsDrawing(true)
      setLastPoint(pos)
    }

    const handleTouchMove = (ev: TouchEvent) => {
      if (!isDrawingRef.current) return
      ev.preventDefault()
      const currentPos = getEventPos(ev as any)
      const ctx = canvas.getContext("2d")
      if (!ctx || !lastPointRef.current) return

      ctx.save()
      ctx.setTransform(1, 0, 0, 1, 0, 0)
      const dpr = typeof window !== "undefined" ? window.devicePixelRatio || 1 : 1
      ctx.lineWidth = 2 * dpr
      ctx.lineCap = "round"
      ctx.lineJoin = "round"
      ctx.strokeStyle = "#000000"
      ctx.beginPath()
      ctx.moveTo(lastPointRef.current.x, lastPointRef.current.y)
      ctx.lineTo(currentPos.x, currentPos.y)
      ctx.stroke()
      ctx.restore()

      lastPointRef.current = currentPos
      setLastPoint(currentPos)
      setHasSignature(true)
    }

    const handleTouchEnd = (ev: TouchEvent) => {
      ev.preventDefault()
      isDrawingRef.current = false
      setIsDrawing(false)
      lastPointRef.current = null
      setLastPoint(null)
    }

    canvas.addEventListener("touchstart", handleTouchStart, { passive: false })
    canvas.addEventListener("touchmove", handleTouchMove, { passive: false })
    canvas.addEventListener("touchend", handleTouchEnd, { passive: false })
    canvas.addEventListener("touchcancel", handleTouchEnd, { passive: false })

    return () => {
      canvas.removeEventListener("touchstart", handleTouchStart)
      canvas.removeEventListener("touchmove", handleTouchMove)
      canvas.removeEventListener("touchend", handleTouchEnd)
      canvas.removeEventListener("touchcancel", handleTouchEnd)
    }
  }, [getEventPos])

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <PenTool className="h-5 w-5" />
          Digital Signature
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div ref={containerRef} className="border-2 border-dashed border-gray-300 rounded-lg p-4 bg-gray-50">
          {/* aspect box: padding-bottom defines height from width to avoid layout loops */}
          <div className="relative w-full" style={{ paddingBottom: `${Math.max(30, Math.round(aspect * 100))}%` }}>
            <canvas
              ref={canvasRef}
              className="absolute inset-0 w-full h-full border border-gray-300 rounded bg-white cursor-crosshair"
              onMouseDown={startDrawing}
              onMouseMove={draw}
              onMouseUp={stopDrawing}
              onMouseLeave={stopDrawing}
            />
          </div>
        </div>

        <Alert>
          <PenTool className="h-4 w-4" />
          <AlertDescription>
            Please sign in the box above using your mouse or finger on touch devices.
          </AlertDescription>
        </Alert>

        <div className="flex gap-2">
          <Button variant="outline" onClick={clearSignature} disabled={!hasSignature || disabled}>
            <RotateCcw className="h-4 w-4 mr-2" />
            Clear
          </Button>
          <Button variant="outline" onClick={downloadSignature} disabled={!hasSignature || disabled}>
            <Download className="h-4 w-4 mr-2" />
            Download
          </Button>
          <Button onClick={saveSignature} disabled={!hasSignature || disabled} className="flex-1">
            <Save className="h-4 w-4 mr-2" />
            Save Signature
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

