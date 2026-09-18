import React, { useState, useRef, useEffect, useCallback } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Crop, ZoomIn, ZoomOut, RotateCw, Check, X, Move, Sparkles, RefreshCw } from "lucide-react";

export interface ImageCropperModalProps {
  isOpen: boolean;
  onClose: () => void;
  imageSrc: string;
  title?: string;
  aspectRatio?: number; // width / height, e.g. 3/4 = 0.75, 1/1 = 1, undefined for free
  onCropComplete: (croppedDataUrl: string) => void;
}

export function ImageCropperModal({
  isOpen,
  onClose,
  imageSrc,
  title = "Crop & Adjust Image",
  aspectRatio: initialAspect = 0.78, // default 3.9:5 (portrait ratio standard for resumes)
  onCropComplete,
}: ImageCropperModalProps) {
  const [aspect, setAspect] = useState<number | null>(initialAspect);
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStart = useRef({ x: 0, y: 0 });
  const panStart = useRef({ x: 0, y: 0 });

  const imageRef = useRef<HTMLImageElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [imageLoaded, setImageLoaded] = useState(false);

  // Reset state on open or imageSrc change
  useEffect(() => {
    if (isOpen) {
      setZoom(1);
      setRotation(0);
      setPan({ x: 0, y: 0 });
      setAspect(initialAspect);
      setImageLoaded(false);
    }
  }, [isOpen, imageSrc, initialAspect]);

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
    dragStart.current = { x: e.clientX, y: e.clientY };
    panStart.current = { ...pan };
  };

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDragging) return;
    const dx = e.clientX - dragStart.current.x;
    const dy = e.clientY - dragStart.current.y;
    setPan({
      x: panStart.current.x + dx,
      y: panStart.current.y + dy,
    });
  }, [isDragging]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY * -0.002;
    setZoom((prev) => Math.min(3.5, Math.max(0.5, prev + delta)));
  };

  const handleApplyCrop = () => {
    if (!imageRef.current || !containerRef.current) return;

    const img = imageRef.current;
    const container = containerRef.current;

    const containerRect = container.getBoundingClientRect();
    const cropWidth = aspect ? Math.min(containerRect.width * 0.8, containerRect.height * 0.8 * aspect) : containerRect.width * 0.8;
    const cropHeight = aspect ? cropWidth / aspect : containerRect.height * 0.8;

    // High-resolution canvas
    const canvas = document.createElement("canvas");
    const outputWidth = 600;
    const outputHeight = Math.round(aspect ? outputWidth / aspect : (outputWidth * cropHeight) / cropWidth);
    canvas.width = outputWidth;
    canvas.height = outputHeight;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";

    // Clear background
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, outputWidth, outputHeight);

    // Calculate transforms
    const scaleFactor = outputWidth / cropWidth;

    ctx.save();
    // Center point of output canvas
    ctx.translate(outputWidth / 2, outputHeight / 2);
    ctx.rotate((rotation * Math.PI) / 180);

    // Apply pan & zoom
    const drawX = pan.x * scaleFactor;
    const drawY = pan.y * scaleFactor;
    const drawWidth = img.naturalWidth * (cropWidth / img.naturalWidth) * zoom * scaleFactor;
    const drawHeight = img.naturalHeight * (cropWidth / img.naturalWidth) * zoom * scaleFactor;

    ctx.drawImage(img, drawX - drawWidth / 2, drawY - drawHeight / 2, drawWidth, drawHeight);
    ctx.restore();

    const dataUrl = canvas.toDataURL("image/png", 0.95);
    onCropComplete(dataUrl);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-xl bg-[#11141b] border border-white/10 text-white p-6 shadow-2xl rounded-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg font-bold text-white">
            <Crop className="h-5 w-5 text-emerald-400" />
            <span>{title}</span>
          </DialogTitle>
          <DialogDescription className="text-xs text-zinc-400">
            Drag to pan, use slider or mouse wheel to zoom, choose aspect ratio, then click Apply.
          </DialogDescription>
        </DialogHeader>

        {/* CROP WORKSPACE AREA */}
        <div
          ref={containerRef}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onWheel={handleWheel}
          className="relative w-full h-80 bg-zinc-950/80 rounded-xl overflow-hidden cursor-grab active:cursor-grabbing flex items-center justify-center select-none border border-white/10 shadow-inner"
        >
          {/* Background image preview */}
          {imageSrc && (
            <img
              ref={imageRef}
              src={imageSrc}
              alt="Crop target"
              onLoad={() => setImageLoaded(true)}
              draggable={false}
              className="max-w-none transition-transform pointer-events-none"
              style={{
                transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom}) rotate(${rotation}deg)`,
                maxHeight: "240px",
                objectFit: "contain",
              }}
            />
          )}

          {/* Semi-transparent crop target frame / overlay */}
          <div
            className="absolute border-2 border-emerald-400/90 rounded-lg pointer-events-none shadow-[0_0_0_9999px_rgba(0,0,0,0.65)] flex items-center justify-center"
            style={{
              width: aspect ? (aspect >= 1 ? "240px" : `${240 * aspect}px`) : "240px",
              height: aspect ? (aspect >= 1 ? `${240 / aspect}px` : "240px") : "200px",
            }}
          >
            {/* Grid crosshairs */}
            <div className="w-full h-full grid grid-cols-3 grid-rows-3 opacity-30 pointer-events-none">
              <div className="border-r border-b border-white" />
              <div className="border-r border-b border-white" />
              <div className="border-b border-white" />
              <div className="border-r border-b border-white" />
              <div className="border-r border-b border-white" />
              <div className="border-b border-white" />
              <div className="border-r border-white" />
              <div className="border-r border-white" />
              <div />
            </div>
          </div>
        </div>

        {/* CONTROLS BAR */}
        <div className="space-y-4 pt-2">
          {/* Aspect Ratio Presets */}
          <div className="flex items-center justify-between gap-2 flex-wrap text-xs">
            <span className="text-zinc-400 font-medium">Aspect Ratio:</span>
            <div className="flex items-center gap-1.5">
              <Button
                type="button"
                size="sm"
                variant={aspect === 0.78 ? "default" : "outline"}
                className={`h-7 px-2.5 text-xs ${aspect === 0.78 ? "bg-emerald-500 hover:bg-emerald-600 text-black font-bold" : "border-white/10 text-zinc-300"}`}
                onClick={() => setAspect(0.78)}
              >
                Portrait (Resume)
              </Button>
              <Button
                type="button"
                size="sm"
                variant={aspect === 1 ? "default" : "outline"}
                className={`h-7 px-2.5 text-xs ${aspect === 1 ? "bg-emerald-500 hover:bg-emerald-600 text-black font-bold" : "border-white/10 text-zinc-300"}`}
                onClick={() => setAspect(1)}
              >
                Square (1:1)
              </Button>
              <Button
                type="button"
                size="sm"
                variant={aspect === 1.6 ? "default" : "outline"}
                className={`h-7 px-2.5 text-xs ${aspect === 1.6 ? "bg-emerald-500 hover:bg-emerald-600 text-black font-bold" : "border-white/10 text-zinc-300"}`}
                onClick={() => setAspect(1.6)}
              >
                Landscape / Logo
              </Button>
              <Button
                type="button"
                size="sm"
                variant={aspect === null ? "default" : "outline"}
                className={`h-7 px-2.5 text-xs ${aspect === null ? "bg-emerald-500 hover:bg-emerald-600 text-black font-bold" : "border-white/10 text-zinc-300"}`}
                onClick={() => setAspect(null)}
              >
                Free
              </Button>
            </div>
          </div>

          {/* Zoom Slider */}
          <div className="flex items-center gap-3">
            <ZoomOut className="h-4 w-4 text-zinc-400 shrink-0" />
            <Slider
              value={[zoom]}
              min={0.5}
              max={3.5}
              step={0.05}
              onValueChange={([v]) => setZoom(v)}
              className="flex-1"
            />
            <ZoomIn className="h-4 w-4 text-zinc-400 shrink-0" />
            <span className="text-xs font-mono text-emerald-400 w-12 text-right">
              {Math.round(zoom * 100)}%
            </span>
          </div>

          {/* Quick Action Tools */}
          <div className="flex items-center justify-between pt-1">
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-8 border-white/10 text-zinc-300 hover:text-white gap-1.5 text-xs"
                onClick={() => setRotation((prev) => (prev + 90) % 360)}
              >
                <RotateCw className="h-3.5 w-3.5 text-emerald-400" />
                <span>Rotate 90°</span>
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-8 text-zinc-400 hover:text-white gap-1.5 text-xs"
                onClick={() => {
                  setZoom(1);
                  setRotation(0);
                  setPan({ x: 0, y: 0 });
                }}
              >
                <RefreshCw className="h-3.5 w-3.5" />
                <span>Reset Frame</span>
              </Button>
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2 pt-2 border-t border-white/10 mt-2">
          <Button
            type="button"
            variant="ghost"
            onClick={onClose}
            className="text-zinc-400 hover:text-white"
          >
            <X className="h-4 w-4 mr-1.5" />
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleApplyCrop}
            className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold gap-1.5 shadow-lg shadow-emerald-500/20"
          >
            <Check className="h-4 w-4" />
            Apply & Save Crop
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
