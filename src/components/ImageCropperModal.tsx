import React, { useState, useRef, useEffect, useCallback } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Crop, ZoomIn, ZoomOut, RotateCw, Check, X, RefreshCw, Maximize2, Square, RectangleHorizontal, RectangleVertical } from "lucide-react";

export interface ImageCropperModalProps {
  isOpen: boolean;
  onClose: () => void;
  imageSrc: string;
  title?: string;
  aspectRatio?: number; // width / height, e.g. 0.78, 1, 1.6, or undefined for Free
  onCropComplete: (croppedDataUrl: string) => void;
}

type DragMode =
  | "move"
  | "nw"
  | "ne"
  | "sw"
  | "se"
  | "n"
  | "s"
  | "w"
  | "e"
  | null;

interface CropRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export function ImageCropperModal({
  isOpen,
  onClose,
  imageSrc,
  title = "Crop & Adjust Image",
  aspectRatio: initialAspect,
  onCropComplete,
}: ImageCropperModalProps) {
  const [aspect, setAspect] = useState<number | null>(initialAspect !== undefined ? initialAspect : 0.78);
  const [rotation, setRotation] = useState<number>(0);
  const [zoom, setZoom] = useState<number>(1);

  // Stage & Image measurement state
  const stageRef = useRef<HTMLDivElement | null>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);
  const [imgNaturalSize, setImgNaturalSize] = useState<{ width: number; height: number }>({ width: 0, height: 0 });
  const [displayedImgRect, setDisplayedImgRect] = useState<{ x: number; y: number; width: number; height: number }>({ x: 0, y: 0, width: 0, height: 0 });

  // Crop Box state in Stage pixel coordinates
  const [cropBox, setCropBox] = useState<CropRect>({ x: 0, y: 0, width: 100, height: 100 });

  // Dragging state
  const [dragMode, setDragMode] = useState<DragMode>(null);
  const dragStartRef = useRef<{ clientX: number; clientY: number; box: CropRect }>({
    clientX: 0,
    clientY: 0,
    box: { x: 0, y: 0, width: 100, height: 100 },
  });

  // Calculate displayed image rect when image loads or stage resizes or rotation changes
  const updateLayout = useCallback(() => {
    if (!stageRef.current || !imgNaturalSize.width || !imgNaturalSize.height) return;

    const stageWidth = stageRef.current.clientWidth;
    const stageHeight = stageRef.current.clientHeight;
    if (!stageWidth || !stageHeight) return;

    const isRotated90or270 = rotation === 90 || rotation === 270;
    const srcW = isRotated90or270 ? imgNaturalSize.height : imgNaturalSize.width;
    const srcH = isRotated90or270 ? imgNaturalSize.width : imgNaturalSize.height;

    const padding = 20;
    const availW = Math.max(50, stageWidth - padding * 2);
    const availH = Math.max(50, stageHeight - padding * 2);

    const scale = Math.min(availW / srcW, availH / srcH) * zoom;
    const dispW = srcW * scale;
    const dispH = srcH * scale;
    const dispX = (stageWidth - dispW) / 2;
    const dispY = (stageHeight - dispH) / 2;

    const newDispRect = { x: dispX, y: dispY, width: dispW, height: dispH };
    setDisplayedImgRect(newDispRect);

    // Initialize crop box to fit within displayed image
    setCropBox((prev) => {
      // If already initialized inside image, constrain it
      let w = prev.width;
      let h = prev.height;

      if (w <= 10 || h <= 10) {
        // Initial setup
        if (aspect) {
          if (dispW / dispH > aspect) {
            h = dispH * 0.85;
            w = h * aspect;
          } else {
            w = dispW * 0.85;
            h = w / aspect;
          }
        } else {
          w = dispW * 0.85;
          h = dispH * 0.85;
        }
      } else if (aspect) {
        // Maintain aspect ratio
        h = w / aspect;
        if (h > dispH) {
          h = dispH;
          w = h * aspect;
        }
      }

      w = Math.min(w, dispW);
      h = Math.min(h, dispH);
      const x = dispX + (dispW - w) / 2;
      const y = dispY + (dispH - h) / 2;

      return { x, y, width: w, height: h };
    });
  }, [imgNaturalSize, rotation, zoom, aspect]);

  // Handle Image Load
  const handleImageLoaded = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const img = e.currentTarget;
    setImgNaturalSize({ width: img.naturalWidth, height: img.naturalHeight });
  };

  // Reset all state on modal open
  useEffect(() => {
    if (isOpen) {
      setRotation(0);
      setZoom(1);
      setAspect(initialAspect !== undefined ? initialAspect : 0.78);
      setCropBox({ x: 0, y: 0, width: 0, height: 0 });
    }
  }, [isOpen, imageSrc, initialAspect]);

  // Re-layout whenever image size or rotation or zoom changes
  useEffect(() => {
    updateLayout();
  }, [updateLayout]);

  // Adjust crop box when aspect ratio button is clicked
  const handleSetAspect = (newAspect: number | null) => {
    setAspect(newAspect);
    if (!newAspect || displayedImgRect.width <= 0) return;

    setCropBox((prev) => {
      let w = prev.width;
      let h = w / newAspect;

      if (h > displayedImgRect.height) {
        h = displayedImgRect.height * 0.9;
        w = h * newAspect;
      }
      if (w > displayedImgRect.width) {
        w = displayedImgRect.width * 0.9;
        h = w / newAspect;
      }

      // Keep centered at current center
      const centerX = prev.x + prev.width / 2;
      const centerY = prev.y + prev.height / 2;

      let x = centerX - w / 2;
      let y = centerY - h / 2;

      // Constrain within displayed image
      x = Math.max(displayedImgRect.x, Math.min(x, displayedImgRect.x + displayedImgRect.width - w));
      y = Math.max(displayedImgRect.y, Math.min(y, displayedImgRect.y + displayedImgRect.height - h));

      return { x, y, width: w, height: h };
    });
  };

  // Mouse handlers for dragging crop box or resize handles
  const handleMouseDown = (e: React.MouseEvent, mode: DragMode) => {
    e.preventDefault();
    e.stopPropagation();
    setDragMode(mode);
    dragStartRef.current = {
      clientX: e.clientX,
      clientY: e.clientY,
      box: { ...cropBox },
    };
  };

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!dragMode) return;

    const dx = e.clientX - dragStartRef.current.clientX;
    const dy = e.clientY - dragStartRef.current.clientY;
    const orig = dragStartRef.current.box;
    const minSize = 25;

    const imgMinX = displayedImgRect.x;
    const imgMinY = displayedImgRect.y;
    const imgMaxX = displayedImgRect.x + displayedImgRect.width;
    const imgMaxY = displayedImgRect.y + displayedImgRect.height;

    setCropBox(() => {
      let { x, y, width, height } = orig;

      if (dragMode === "move") {
        x = Math.max(imgMinX, Math.min(orig.x + dx, imgMaxX - width));
        y = Math.max(imgMinY, Math.min(orig.y + dy, imgMaxY - height));
        return { x, y, width, height };
      }

      // Handle Corner & Middle Resizing
      if (dragMode.includes("e")) {
        width = Math.max(minSize, Math.min(orig.width + dx, imgMaxX - orig.x));
      }
      if (dragMode.includes("s")) {
        height = Math.max(minSize, Math.min(orig.height + dy, imgMaxY - orig.y));
      }
      if (dragMode.includes("w")) {
        const newX = Math.max(imgMinX, Math.min(orig.x + dx, orig.x + orig.width - minSize));
        width = orig.x + orig.width - newX;
        x = newX;
      }
      if (dragMode.includes("n")) {
        const newY = Math.max(imgMinY, Math.min(orig.y + dy, orig.y + orig.height - minSize));
        height = orig.y + orig.height - newY;
        y = newY;
      }

      // If aspect ratio is locked, maintain aspect ratio during resize
      if (aspect) {
        if (dragMode === "e" || dragMode === "w") {
          height = width / aspect;
        } else if (dragMode === "n" || dragMode === "s") {
          width = height * aspect;
        } else if (dragMode === "se" || dragMode === "nw" || dragMode === "ne" || dragMode === "sw") {
          // Corner drag: adjust height to width
          height = width / aspect;
        }

        // Re-constrain bounds
        if (x + width > imgMaxX) {
          width = imgMaxX - x;
          height = width / aspect;
        }
        if (y + height > imgMaxY) {
          height = imgMaxY - y;
          width = height * aspect;
        }
      }

      return { x, y, width, height };
    });
  }, [dragMode, displayedImgRect, aspect]);

  const handleMouseUp = useCallback(() => {
    setDragMode(null);
  }, []);

  useEffect(() => {
    if (dragMode) {
      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);
      return () => {
        window.removeEventListener("mousemove", handleMouseMove);
        window.removeEventListener("mouseup", handleMouseUp);
      };
    }
  }, [dragMode, handleMouseMove, handleMouseUp]);

  // Export & Apply Crop
  const handleApplyCrop = () => {
    if (!imageRef.current || !imgNaturalSize.width || !imgNaturalSize.height) return;

    const img = imageRef.current;
    const isRotated90or270 = rotation === 90 || rotation === 270;
    const orientNaturalW = isRotated90or270 ? imgNaturalSize.height : imgNaturalSize.width;
    const orientNaturalH = isRotated90or270 ? imgNaturalSize.width : imgNaturalSize.height;

    // Calculate crop box relative to displayed image (0..1)
    const relX = Math.max(0, (cropBox.x - displayedImgRect.x) / displayedImgRect.width);
    const relY = Math.max(0, (cropBox.y - displayedImgRect.y) / displayedImgRect.height);
    const relW = Math.min(1 - relX, cropBox.width / displayedImgRect.width);
    const relH = Math.min(1 - relY, cropBox.height / displayedImgRect.height);

    // Source rect on rotated image
    const sourceCropX = relX * orientNaturalW;
    const sourceCropY = relY * orientNaturalH;
    const sourceCropW = relW * orientNaturalW;
    const sourceCropH = relH * orientNaturalH;

    // Create high-res destination canvas
    const canvas = document.createElement("canvas");
    const maxOutDim = 1200;
    let outW = Math.round(sourceCropW);
    let outH = Math.round(sourceCropH);

    if (outW > maxOutDim || outH > maxOutDim) {
      const s = Math.min(maxOutDim / outW, maxOutDim / outH);
      outW = Math.round(outW * s);
      outH = Math.round(outH * s);
    }

    canvas.width = Math.max(1, outW);
    canvas.height = Math.max(1, outH);

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";

    // Intermediate rotated image canvas
    const rotCanvas = document.createElement("canvas");
    rotCanvas.width = orientNaturalW;
    rotCanvas.height = orientNaturalH;
    const rotCtx = rotCanvas.getContext("2d");
    if (!rotCtx) return;

    rotCtx.imageSmoothingEnabled = true;
    rotCtx.imageSmoothingQuality = "high";

    rotCtx.save();
    rotCtx.translate(orientNaturalW / 2, orientNaturalH / 2);
    rotCtx.rotate((rotation * Math.PI) / 180);
    rotCtx.drawImage(
      img,
      -imgNaturalSize.width / 2,
      -imgNaturalSize.height / 2,
      imgNaturalSize.width,
      imgNaturalSize.height
    );
    rotCtx.restore();

    // Now copy the selected sub-rectangle to destination canvas
    ctx.drawImage(
      rotCanvas,
      sourceCropX,
      sourceCropY,
      sourceCropW,
      sourceCropH,
      0,
      0,
      canvas.width,
      canvas.height
    );

    const croppedDataUrl = canvas.toDataURL("image/png", 1.0);
    onCropComplete(croppedDataUrl);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl bg-[#0f1219] border border-white/10 text-white p-6 shadow-2xl rounded-2xl select-none">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg font-bold text-white">
            <Crop className="h-5 w-5 text-emerald-400" />
            <span>{title}</span>
          </DialogTitle>
          <DialogDescription className="text-xs text-zinc-400">
            Drag inside the box to move, or drag any of the 8 corners/edges to adjust the crop area.
          </DialogDescription>
        </DialogHeader>

        {/* CROP WORKSPACE STAGE */}
        <div
          ref={stageRef}
          className="relative w-full h-88 bg-zinc-950 rounded-xl overflow-hidden flex items-center justify-center border border-white/10 shadow-inner"
        >
          {/* Target Image */}
          {imageSrc && (
            <img
              ref={imageRef}
              src={imageSrc}
              alt="Crop target"
              crossOrigin="anonymous"
              onLoad={handleImageLoaded}
              draggable={false}
              className="absolute pointer-events-none select-none"
              style={{
                left: `${displayedImgRect.x}px`,
                top: `${displayedImgRect.y}px`,
                width: `${displayedImgRect.width}px`,
                height: `${displayedImgRect.height}px`,
                transform: `rotate(${rotation}deg)`,
                objectFit: "fill",
              }}
            />
          )}

          {/* Darkened Overlay mask outside Crop Box */}
          <div
            className="absolute pointer-events-none"
            style={{
              left: `${cropBox.x}px`,
              top: `${cropBox.y}px`,
              width: `${cropBox.width}px`,
              height: `${cropBox.height}px`,
              boxShadow: "0 0 0 9999px rgba(0, 0, 0, 0.68)",
            }}
          />

          {/* Interactive Crop Rectangle */}
          {cropBox.width > 0 && cropBox.height > 0 && (
            <div
              className="absolute border-2 border-emerald-400 cursor-move z-20"
              style={{
                left: `${cropBox.x}px`,
                top: `${cropBox.y}px`,
                width: `${cropBox.width}px`,
                height: `${cropBox.height}px`,
              }}
              onMouseDown={(e) => handleMouseDown(e, "move")}
            >
              {/* 3x3 Rule-of-Thirds Grid */}
              <div className="w-full h-full grid grid-cols-3 grid-rows-3 pointer-events-none opacity-40">
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

              {/* 4 Corner Resize Handles */}
              <div
                className="absolute -top-1.5 -left-1.5 w-3.5 h-3.5 bg-white border-2 border-emerald-500 rounded-xs cursor-nwse-resize shadow-md hover:scale-125 transition-transform"
                onMouseDown={(e) => handleMouseDown(e, "nw")}
              />
              <div
                className="absolute -top-1.5 -right-1.5 w-3.5 h-3.5 bg-white border-2 border-emerald-500 rounded-xs cursor-nesw-resize shadow-md hover:scale-125 transition-transform"
                onMouseDown={(e) => handleMouseDown(e, "ne")}
              />
              <div
                className="absolute -bottom-1.5 -left-1.5 w-3.5 h-3.5 bg-white border-2 border-emerald-500 rounded-xs cursor-nesw-resize shadow-md hover:scale-125 transition-transform"
                onMouseDown={(e) => handleMouseDown(e, "sw")}
              />
              <div
                className="absolute -bottom-1.5 -right-1.5 w-3.5 h-3.5 bg-white border-2 border-emerald-500 rounded-xs cursor-nwse-resize shadow-md hover:scale-125 transition-transform"
                onMouseDown={(e) => handleMouseDown(e, "se")}
              />

              {/* 4 Middle / Edge Resize Handles */}
              <div
                className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-3.5 h-3.5 bg-white border-2 border-emerald-500 rounded-xs cursor-ns-resize shadow-md hover:scale-125 transition-transform"
                onMouseDown={(e) => handleMouseDown(e, "n")}
              />
              <div
                className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-3.5 h-3.5 bg-white border-2 border-emerald-500 rounded-xs cursor-ns-resize shadow-md hover:scale-125 transition-transform"
                onMouseDown={(e) => handleMouseDown(e, "s")}
              />
              <div
                className="absolute top-1/2 -left-1.5 -translate-y-1/2 w-3.5 h-3.5 bg-white border-2 border-emerald-500 rounded-xs cursor-ew-resize shadow-md hover:scale-125 transition-transform"
                onMouseDown={(e) => handleMouseDown(e, "w")}
              />
              <div
                className="absolute top-1/2 -right-1.5 -translate-y-1/2 w-3.5 h-3.5 bg-white border-2 border-emerald-500 rounded-xs cursor-ew-resize shadow-md hover:scale-125 transition-transform"
                onMouseDown={(e) => handleMouseDown(e, "e")}
              />
            </div>
          )}
        </div>

        {/* CONTROLS BAR */}
        <div className="space-y-3.5 pt-2">
          {/* Aspect Ratio Options */}
          <div className="flex items-center justify-between gap-2 flex-wrap text-xs">
            <span className="text-zinc-400 font-medium">Aspect Ratio:</span>
            <div className="flex items-center gap-1.5 flex-wrap">
              <Button
                type="button"
                size="sm"
                variant={aspect === null ? "default" : "outline"}
                className={`h-7 px-2.5 text-xs gap-1 ${aspect === null ? "bg-emerald-500 hover:bg-emerald-600 text-black font-bold" : "border-white/10 text-zinc-300"}`}
                onClick={() => handleSetAspect(null)}
              >
                <Maximize2 className="h-3 w-3" />
                Free Crop
              </Button>
              <Button
                type="button"
                size="sm"
                variant={aspect === 0.78 ? "default" : "outline"}
                className={`h-7 px-2.5 text-xs gap-1 ${aspect === 0.78 ? "bg-emerald-500 hover:bg-emerald-600 text-black font-bold" : "border-white/10 text-zinc-300"}`}
                onClick={() => handleSetAspect(0.78)}
              >
                <RectangleVertical className="h-3 w-3" />
                Portrait (Resume)
              </Button>
              <Button
                type="button"
                size="sm"
                variant={aspect === 1 ? "default" : "outline"}
                className={`h-7 px-2.5 text-xs gap-1 ${aspect === 1 ? "bg-emerald-500 hover:bg-emerald-600 text-black font-bold" : "border-white/10 text-zinc-300"}`}
                onClick={() => handleSetAspect(1)}
              >
                <Square className="h-3 w-3" />
                Square (1:1)
              </Button>
              <Button
                type="button"
                size="sm"
                variant={aspect === 1.6 ? "default" : "outline"}
                className={`h-7 px-2.5 text-xs gap-1 ${aspect === 1.6 ? "bg-emerald-500 hover:bg-emerald-600 text-black font-bold" : "border-white/10 text-zinc-300"}`}
                onClick={() => handleSetAspect(1.6)}
              >
                <RectangleHorizontal className="h-3 w-3" />
                Landscape
              </Button>
            </div>
          </div>

          {/* Quick Action Tools & Zoom */}
          <div className="flex items-center justify-between gap-3 pt-1 border-t border-white/10">
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
                  setRotation(0);
                  setZoom(1);
                  setAspect(null);
                  updateLayout();
                }}
              >
                <RefreshCw className="h-3.5 w-3.5" />
                <span>Reset Crop</span>
              </Button>
            </div>

            <div className="flex items-center gap-2 w-48">
              <ZoomOut className="h-3.5 w-3.5 text-zinc-400 shrink-0" />
              <Slider
                value={[zoom]}
                min={0.6}
                max={2.5}
                step={0.05}
                onValueChange={([v]) => setZoom(v)}
                className="flex-1"
              />
              <ZoomIn className="h-3.5 w-3.5 text-zinc-400 shrink-0" />
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2 pt-3 border-t border-white/10 mt-2">
          <Button
            type="button"
            variant="ghost"
            onClick={onClose}
            className="text-zinc-400 hover:text-white text-xs h-9"
          >
            <X className="h-4 w-4 mr-1.5" />
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleApplyCrop}
            className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold gap-1.5 text-xs h-9 shadow-lg shadow-emerald-500/20 px-4"
          >
            <Check className="h-4 w-4" />
            Apply & Save Crop
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
