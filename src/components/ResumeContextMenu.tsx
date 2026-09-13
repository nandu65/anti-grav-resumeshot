import React, { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import {
  Bold, Italic, Underline, Strikethrough,
  ArrowUp, ArrowDown, ArrowLeft, ArrowRight, Copy, Plus, Minus, Trash2,
  RemoveFormatting, Palette, Highlighter,
  AlignLeft, AlignCenter, AlignRight,
  Type, MoveVertical, Paintbrush, X, List, Eye, Move, RotateCcw,
  Undo2, Redo2
} from "lucide-react";

export interface ContextMenuPosition {
  x: number;
  y: number;
  targetElement?: HTMLElement | null;
  targetLineIndex?: number;
  targetEntryType?: string;
  targetEntryIndex?: number;
  selectedText?: string;
  savedRange?: Range | null;
}

interface ResumeContextMenuProps {
  position: ContextMenuPosition | null;
  onClose: () => void;
  onMoveLineUp?: (lineIndex?: number) => void;
  onMoveLineDown?: (lineIndex?: number) => void;
  onDuplicateLine?: (lineIndex?: number) => void;
  onAddLineBelow?: (lineIndex?: number) => void;
  onDeleteLine?: (lineIndex?: number) => void;
  onFormatText?: (command: string, value?: string) => void;
  onCopyFormat?: () => void;
  onPasteFormat?: () => void;
  copiedFormatLabel?: string | null;
  onUndo?: () => void;
  onRedo?: () => void;
  canUndo?: boolean;
  canRedo?: boolean;
}

const PRESET_COLORS = [
  { label: "Default", color: "#111827" },
  { label: "Slate", color: "#475569" },
  { label: "Emerald", color: "#059669" },
  { label: "Teal", color: "#0d9488" },
  { label: "Indigo", color: "#4f46e5" },
  { label: "Blue", color: "#2563eb" },
  { label: "Burgundy", color: "#991b1b" },
  { label: "Amber", color: "#d97706" },
];

const PRESET_HIGHLIGHTS = [
  { label: "None", color: "transparent" },
  { label: "Yellow", color: "#fef08a" },
  { label: "Green", color: "#bbf7d0" },
  { label: "Cyan", color: "#bae6fd" },
  { label: "Purple", color: "#e9d5ff" },
  { label: "Pink", color: "#fbcfe8" },
];

export function ResumeContextMenu({
  position,
  onClose,
  onMoveLineUp,
  onMoveLineDown,
  onDuplicateLine,
  onAddLineBelow,
  onDeleteLine,
  onFormatText,
  onCopyFormat,
  onPasteFormat,
  copiedFormatLabel,
  onUndo,
  onRedo,
  canUndo,
  canRedo,
}: ResumeContextMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [showHighlightPicker, setShowHighlightPicker] = useState(false);
  const [showOpacityPicker, setShowOpacityPicker] = useState(false);
  const [coords, setCoords] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const savedRangeRef = useRef<Range | null>(null);

  // Capture selection range on open and calculate intelligent, unobtrusive position
  useEffect(() => {
    if (!position) return;
    if (position.savedRange) {
      savedRangeRef.current = position.savedRange;
    } else {
      const sel = window.getSelection();
      if (sel && sel.rangeCount > 0) {
        savedRangeRef.current = sel.getRangeAt(0).cloneRange();
      }
    }

    let targetRect: { left: number; right: number; top: number; bottom: number; width: number; height: number } | null = null;
    if (savedRangeRef.current) {
      const r = savedRangeRef.current.getBoundingClientRect();
      if (r.width > 0 || r.height > 0) {
        targetRect = r;
      }
    }
    if (!targetRect && position.targetElement) {
      targetRect = position.targetElement.getBoundingClientRect();
    }
    if (!targetRect) {
      targetRect = {
        left: position.x,
        right: position.x,
        top: position.y,
        bottom: position.y,
        width: 0,
        height: 0,
      };
    }

    const menuEl = menuRef.current;
    const menuWidth = menuEl?.offsetWidth || 340;
    const menuHeight = Math.min(menuEl?.scrollHeight || 420, window.innerHeight - 32);

    const viewportW = window.innerWidth;
    const viewportH = window.innerHeight;

    const roomAbove = targetRect.top - 16;
    const roomBelow = viewportH - targetRect.bottom - 16;

    let posX = targetRect.left + (targetRect.width / 2) - (menuWidth / 2);
    let posY = targetRect.bottom + 10;

    // Prioritize not obscuring the selected line
    if (roomAbove >= menuHeight + 10) {
      // Comfortably fits above selected text
      posY = targetRect.top - menuHeight - 10;
    } else if (roomBelow >= menuHeight + 10) {
      // Comfortably fits below selected text
      posY = targetRect.bottom + 10;
    } else {
      // Screen is tight vertically, try horizontal offset first to leave text visible
      const canFitRight = targetRect.right + 16 + menuWidth <= viewportW - 16;
      const canFitLeft = targetRect.left - 16 - menuWidth >= 16;

      if (canFitRight) {
        posX = targetRect.right + 16;
        posY = Math.max(16, Math.min(viewportH - menuHeight - 16, targetRect.top - 20));
      } else if (canFitLeft) {
        posX = targetRect.left - menuWidth - 16;
        posY = Math.max(16, Math.min(viewportH - menuHeight - 16, targetRect.top - 20));
      } else {
        // Fallback: pick the side with more room and clamp
        if (roomBelow >= roomAbove) {
          posY = targetRect.bottom + 8;
        } else {
          posY = Math.max(16, targetRect.top - menuHeight - 8);
        }
      }
    }

    // Strict clamping within viewport boundaries
    posX = Math.max(16, Math.min(viewportW - menuWidth - 16, posX));
    posY = Math.max(16, Math.min(viewportH - menuHeight - 16, posY));

    setCoords({ x: Math.round(posX), y: Math.round(posY) });
  }, [position, showColorPicker, showHighlightPicker, showOpacityPicker]);

  // Click outside or Escape to close
  useEffect(() => {
    if (!position) return;

    const handlePointerDown = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [position, onClose]);

  if (!position) return null;
  if (typeof document === "undefined") return null;

  const restoreSelection = () => {
    const sel = window.getSelection();
    if (sel && savedRangeRef.current) {
      try {
        sel.removeAllRanges();
        sel.addRange(savedRangeRef.current);
      } catch (_) {}
    }
    const targetEditable = position.targetElement?.closest('[contenteditable="true"]') as HTMLElement | null;
    if (targetEditable && document.activeElement !== targetEditable) {
      try {
        targetEditable.focus({ preventScroll: true });
      } catch (_) {}
    }
  };

  const applyCommand = (command: string, value: string = "") => {
    restoreSelection();
    try {
      if (onFormatText) {
        onFormatText(command, value);
      } else {
        if (command === "hiliteColor") {
          if (!document.execCommand("hiliteColor", false, value)) {
            document.execCommand("backColor", false, value);
          }
        } else {
          document.execCommand(command, false, value);
        }
        const targetEditable = position.targetElement?.closest('[contenteditable="true"]') as HTMLElement | null;
        if (targetEditable) {
          targetEditable.dispatchEvent(new Event("input", { bubbles: true }));
          targetEditable.dispatchEvent(new FocusEvent("blur", { bubbles: true }));
        }
      }
    } catch (err) {
      console.warn("Formatting command failed:", err);
    }
  };

  const transformCase = (type: "upper" | "lower" | "title") => {
    restoreSelection();
    const sel = window.getSelection();
    const selectedText = sel?.toString() || position.selectedText || "";
    if (!selectedText) return;

    let transformed = selectedText;
    if (type === "upper") {
      transformed = selectedText.toUpperCase();
    } else if (type === "lower") {
      transformed = selectedText.toLowerCase();
    } else if (type === "title") {
      transformed = selectedText.replace(/\b\w+/g, w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase());
    }

    try {
      const success = document.execCommand("insertText", false, transformed);
      if (!success && savedRangeRef.current) {
        savedRangeRef.current.deleteContents();
        const textNode = document.createTextNode(transformed);
        savedRangeRef.current.insertNode(textNode);
      }
      const targetEditable = position.targetElement?.closest('[contenteditable="true"]') as HTMLElement | null;
      if (targetEditable) {
        targetEditable.dispatchEvent(new Event("input", { bubbles: true }));
        targetEditable.dispatchEvent(new FocusEvent("blur", { bubbles: true }));
      }
    } catch (err) {
      console.warn("Case transform failed:", err);
    }
    onClose();
  };

  const insertBulletPoint = () => {
    restoreSelection();
    const sel = window.getSelection();
    if (!sel) return;

    if (!sel.isCollapsed && sel.toString()) {
      const text = sel.toString();
      const lines = text.split("\n");
      const bulleted = lines.map(line => (line.trim().startsWith("•") ? line : `• ${line}`)).join("\n");
      try {
        const success = document.execCommand("insertText", false, bulleted);
        if (!success && savedRangeRef.current) {
          savedRangeRef.current.deleteContents();
          savedRangeRef.current.insertNode(document.createTextNode(bulleted));
        }
      } catch (_) {}
    } else {
      try {
        document.execCommand("insertText", false, "• ");
      } catch (_) {}
    }

    const targetEditable = position.targetElement?.closest('[contenteditable="true"]') as HTMLElement | null;
    if (targetEditable) {
      targetEditable.dispatchEvent(new Event("input", { bubbles: true }));
      targetEditable.dispatchEvent(new FocusEvent("blur", { bubbles: true }));
    }
    onClose();
  };

  const applyOpacity = (val: number) => {
    restoreSelection();
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0) return;

    try {
      const range = sel.getRangeAt(0);
      const selectedContent = range.extractContents();
      const span = document.createElement("span");
      span.style.opacity = `${val}`;
      span.style.display = "inline";
      span.appendChild(selectedContent);
      range.insertNode(span);

      const targetEditable = position.targetElement?.closest('[contenteditable="true"]') as HTMLElement | null;
      if (targetEditable) {
        targetEditable.dispatchEvent(new Event("input", { bubbles: true }));
        targetEditable.dispatchEvent(new FocusEvent("blur", { bubbles: true }));
      }
    } catch (e) {
      console.warn("Apply opacity failed:", e);
    }
    setShowOpacityPicker(false);
  };

  const nudge = (dir: "left" | "right" | "up" | "down" | "reset") => {
    restoreSelection();
    const sel = window.getSelection();
    const targetNode = position.targetElement || (sel && sel.anchorNode?.nodeType === Node.ELEMENT_NODE ? sel.anchorNode as HTMLElement : sel?.anchorNode?.parentElement);
    if (!targetNode) return;

    const targetEditable = (targetNode.closest('[contenteditable="true"]') as HTMLElement) || (targetNode.querySelector('[contenteditable="true"]') as HTMLElement) || targetNode;
    if (!targetEditable) return;

    const STEP_X = 6;
    const STEP_Y = 2;

    const getPx = (val: string) => {
      if (!val) return 0;
      const num = parseFloat(val);
      return isNaN(num) ? 0 : num;
    };

    // 1. If text is selected within the editable element:
    if (sel && !sel.isCollapsed && sel.rangeCount > 0 && targetEditable.contains(sel.anchorNode)) {
      const range = sel.getRangeAt(0);
      const parentSpan = (range.commonAncestorContainer.nodeType === Node.ELEMENT_NODE 
        ? range.commonAncestorContainer as HTMLElement 
        : range.commonAncestorContainer.parentElement)?.closest('span[data-nudge="true"]') as HTMLElement | null;

      if (parentSpan && targetEditable.contains(parentSpan)) {
        if (dir === "reset") {
          parentSpan.style.marginLeft = "0px";
          parentSpan.style.marginTop = "0px";
        } else {
          const curX = getPx(parentSpan.style.marginLeft);
          const curY = getPx(parentSpan.style.marginTop);
          const nextX = dir === "left" ? curX - STEP_X : dir === "right" ? curX + STEP_X : curX;
          const nextY = dir === "up" ? curY - STEP_Y : dir === "down" ? curY + STEP_Y : curY;
          parentSpan.style.marginLeft = `${nextX}px`;
          parentSpan.style.marginTop = `${nextY}px`;
        }
      } else {
        const selectedContent = range.extractContents();
        const span = document.createElement("span");
        span.setAttribute("data-nudge", "true");
        span.style.display = "inline-block";
        const deltaX = dir === "left" ? -STEP_X : dir === "right" ? STEP_X : 0;
        const deltaY = dir === "up" ? -STEP_Y : dir === "down" ? STEP_Y : 0;
        span.style.marginLeft = `${deltaX}px`;
        span.style.marginTop = `${deltaY}px`;
        span.appendChild(selectedContent);
        range.insertNode(span);
      }
    } else {
      // 2. Entire content of the editable element or existing nudged child
      let existingSpan = targetEditable.querySelector(':scope > span[data-nudge="true"]') as HTMLElement | null;
      if (!existingSpan && targetEditable.children.length === 1 && targetEditable.firstElementChild?.tagName === "SPAN") {
        existingSpan = targetEditable.firstElementChild as HTMLElement;
      }

      if (existingSpan) {
        if (dir === "reset") {
          existingSpan.style.marginLeft = "0px";
          existingSpan.style.marginTop = "0px";
        } else {
          const curX = getPx(existingSpan.style.marginLeft);
          const curY = getPx(existingSpan.style.marginTop);
          const nextX = dir === "left" ? curX - STEP_X : dir === "right" ? curX + STEP_X : curX;
          const nextY = dir === "up" ? curY - STEP_Y : dir === "down" ? curY + STEP_Y : curY;
          existingSpan.style.display = "inline-block";
          existingSpan.style.marginLeft = `${nextX}px`;
          existingSpan.style.marginTop = `${nextY}px`;
          existingSpan.setAttribute("data-nudge", "true");
        }
      } else {
        if (dir !== "reset") {
          const deltaX = dir === "left" ? -STEP_X : dir === "right" ? STEP_X : 0;
          const deltaY = dir === "up" ? -STEP_Y : dir === "down" ? STEP_Y : 0;
          const span = document.createElement("span");
          span.setAttribute("data-nudge", "true");
          span.style.display = "inline-block";
          span.style.marginLeft = `${deltaX}px`;
          span.style.marginTop = `${deltaY}px`;
          while (targetEditable.firstChild) {
            span.appendChild(targetEditable.firstChild);
          }
          targetEditable.appendChild(span);
        }
      }
    }

    if (targetEditable) {
      targetEditable.dispatchEvent(new Event("input", { bubbles: true }));
      targetEditable.dispatchEvent(new FocusEvent("blur", { bubbles: true }));
    }
  };

  const hasLineActions = Boolean(
    onMoveLineUp || onMoveLineDown || onDuplicateLine || onAddLineBelow || onDeleteLine
  );

  return createPortal(
    <div
      ref={menuRef}
      role="menu"
      aria-label="Unified Resume Context & Formatting Menu"
      style={{
        position: "fixed",
        left: `${coords.x}px`,
        top: `${coords.y}px`,
        zIndex: 99999,
        maxHeight: "calc(100vh - 28px)",
      }}
      className="w-[340px] max-w-[calc(100vw-28px)] max-h-[calc(100vh-28px)] overflow-y-auto overscroll-contain bg-popover/95 text-popover-foreground backdrop-blur-md border border-border shadow-2xl rounded-2xl p-2.5 font-sans text-xs animate-in fade-in-50 zoom-in-95 duration-100 select-none ring-1 ring-border/50"
      onContextMenu={e => e.preventDefault()}
      onMouseDown={e => {
        // Prevent clicking context menu from de-selecting or blurring editable text
        e.preventDefault();
      }}
    >
      {/* --- Section 1: Quick Formatting Toolbar --- */}
      <div className="flex flex-wrap items-center justify-between gap-1 pb-2 mb-2 border-b border-border/70 px-0.5">
        <div className="flex items-center gap-0.5 bg-muted/40 p-0.5 rounded-lg">
          {onUndo && (
            <button
              type="button"
              onClick={onUndo}
              disabled={canUndo === false}
              title="Undo (Ctrl+Z)"
              className={`w-7 h-7 flex items-center justify-center rounded-md transition-colors ${canUndo === false ? "opacity-40 cursor-not-allowed text-muted-foreground" : "hover:bg-accent text-foreground"}`}
            >
              <Undo2 className="w-3.5 h-3.5" />
            </button>
          )}
          {onRedo && (
            <button
              type="button"
              onClick={onRedo}
              disabled={canRedo === false}
              title="Redo (Ctrl+Y)"
              className={`w-7 h-7 flex items-center justify-center rounded-md transition-colors ${canRedo === false ? "opacity-40 cursor-not-allowed text-muted-foreground" : "hover:bg-accent text-foreground"}`}
            >
              <Redo2 className="w-3.5 h-3.5" />
            </button>
          )}
          <button
            type="button"
            onClick={() => applyCommand("bold")}
            title="Bold (Ctrl+B)"
            className="w-7 h-7 flex items-center justify-center rounded-md hover:bg-accent hover:text-accent-foreground text-foreground transition-colors font-bold"
          >
            <Bold className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => applyCommand("italic")}
            title="Italic (Ctrl+I)"
            className="w-7 h-7 flex items-center justify-center rounded-md hover:bg-accent hover:text-accent-foreground text-foreground transition-colors italic"
          >
            <Italic className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => applyCommand("underline")}
            title="Underline (Ctrl+U)"
            className="w-7 h-7 flex items-center justify-center rounded-md hover:bg-accent hover:text-accent-foreground text-foreground transition-colors underline"
          >
            <Underline className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => applyCommand("strikeThrough")}
            title="Strikethrough"
            className="w-7 h-7 flex items-center justify-center rounded-md hover:bg-accent hover:text-accent-foreground text-foreground transition-colors"
          >
            <Strikethrough className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={insertBulletPoint}
            title="Insert Bullet Point (•) (Alt+B)"
            className="w-7 h-7 flex items-center justify-center rounded-md hover:bg-accent hover:text-accent-foreground text-primary transition-colors font-bold"
          >
            <List className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Font size +/- */}
        <div className="flex items-center gap-0.5 bg-muted/40 p-0.5 rounded-lg">
          <button
            type="button"
            onClick={() => applyCommand("fontSize", "decrease")}
            title="Decrease font size"
            className="w-7 h-7 flex items-center justify-center rounded-md hover:bg-accent hover:text-accent-foreground text-foreground transition-colors"
          >
            <Minus className="w-3.5 h-3.5" />
          </button>
          <Type className="w-3 h-3 text-muted-foreground mx-0.5" />
          <button
            type="button"
            onClick={() => applyCommand("fontSize", "increase")}
            title="Increase font size"
            className="w-7 h-7 flex items-center justify-center rounded-md hover:bg-accent hover:text-accent-foreground text-foreground transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Text color, Highlight & Opacity */}
        <div className="flex items-center gap-0.5 bg-muted/40 p-0.5 rounded-lg">
          <button
            type="button"
            onClick={() => {
              setShowColorPicker(!showColorPicker);
              setShowHighlightPicker(false);
              setShowOpacityPicker(false);
            }}
            title="Text Color"
            className={`w-7 h-7 flex items-center justify-center rounded-md hover:bg-accent transition-colors ${showColorPicker ? "bg-accent text-primary" : "text-foreground"}`}
          >
            <Palette className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => {
              setShowHighlightPicker(!showHighlightPicker);
              setShowColorPicker(false);
              setShowOpacityPicker(false);
            }}
            title="Highlight Color"
            className={`w-7 h-7 flex items-center justify-center rounded-md hover:bg-accent transition-colors ${showHighlightPicker ? "bg-accent text-primary" : "text-foreground"}`}
          >
            <Highlighter className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => {
              setShowOpacityPicker(!showOpacityPicker);
              setShowColorPicker(false);
              setShowHighlightPicker(false);
            }}
            title="Selected Text Opacity"
            className={`w-7 h-7 flex items-center justify-center rounded-md hover:bg-accent transition-colors ${showOpacityPicker ? "bg-accent text-primary" : "text-foreground"}`}
          >
            <Eye className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Format painter & Close */}
        <div className="flex items-center gap-0.5">
          {onCopyFormat && (
            <button
              type="button"
              onClick={onCopyFormat}
              title="Copy text format"
              className="w-7 h-7 flex items-center justify-center rounded-md hover:bg-accent hover:text-accent-foreground text-foreground transition-colors"
            >
              <Copy className="w-3.5 h-3.5" />
            </button>
          )}
          {onPasteFormat && (
            <button
              type="button"
              onClick={onPasteFormat}
              disabled={!copiedFormatLabel}
              title={copiedFormatLabel ? `Paste text format (${copiedFormatLabel})` : "Copy a format first"}
              className={`w-7 h-7 flex items-center justify-center rounded-md hover:bg-accent transition-colors ${copiedFormatLabel ? "text-primary" : "text-muted-foreground/40 cursor-not-allowed"}`}
            >
              <Paintbrush className="w-3.5 h-3.5" />
            </button>
          )}
          <button
            type="button"
            onClick={onClose}
            title="Close"
            className="w-7 h-7 flex items-center justify-center rounded-md hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors ml-0.5"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* --- Palette dropdown (Text Color) --- */}
      {showColorPicker && (
        <div className="p-2 mb-2 bg-muted/60 rounded-xl border border-border/60 animate-in fade-in-50 duration-75">
          <div className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">
            Text Color
          </div>
          <div className="grid grid-cols-4 gap-1.5">
            {PRESET_COLORS.map(c => (
              <button
                key={c.color}
                type="button"
                onClick={() => {
                  applyCommand("foreColor", c.color);
                  setShowColorPicker(false);
                }}
                className="flex items-center gap-1 p-1 rounded-lg hover:bg-background/80 transition-colors text-left"
                title={c.label}
              >
                <span className="w-3 h-3 rounded-full border shadow-xs inline-block shrink-0" style={{ backgroundColor: c.color }} />
                <span className="text-[9px] truncate">{c.label}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* --- Highlight dropdown --- */}
      {showHighlightPicker && (
        <div className="p-2 mb-2 bg-muted/60 rounded-xl border border-border/60 animate-in fade-in-50 duration-75">
          <div className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">
            Highlight Color
          </div>
          <div className="grid grid-cols-3 gap-1.5">
            {PRESET_HIGHLIGHTS.map(c => (
              <button
                key={c.color}
                type="button"
                onClick={() => {
                  applyCommand("hiliteColor", c.color);
                  setShowHighlightPicker(false);
                }}
                className="flex items-center gap-1 p-1 rounded-lg hover:bg-background/80 transition-colors text-left"
                title={c.label}
              >
                <span className="w-3 h-3 rounded border shadow-xs inline-block shrink-0" style={{ backgroundColor: c.color === "transparent" ? "#fff" : c.color }} />
                <span className="text-[9px] truncate">{c.label}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* --- Opacity dropdown --- */}
      {showOpacityPicker && (
        <div className="p-2 mb-2 bg-muted/60 rounded-xl border border-border/60 animate-in fade-in-50 duration-75">
          <div className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 flex items-center justify-between">
            <span>Selected Text Opacity</span>
          </div>
          <div className="grid grid-cols-5 gap-1">
            {[
              { label: "100%", val: 1.0 },
              { label: "85%", val: 0.85 },
              { label: "70%", val: 0.70 },
              { label: "50%", val: 0.50 },
              { label: "30%", val: 0.30 },
            ].map(op => (
              <button
                key={op.label}
                type="button"
                onClick={() => applyOpacity(op.val)}
                className="py-1 px-1.5 rounded-lg bg-background/80 hover:bg-accent text-center font-mono text-[10px] font-semibold transition-colors border shadow-xs"
              >
                {op.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* --- Section 2: Line Movement & Actions --- */}
      {hasLineActions && (
        <div className="py-1 mb-1 border-b border-border/70 space-y-0.5">
          <div className="px-2 py-0.5 text-[9.5px] font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
            <MoveVertical className="w-3 h-3" />
            <span>Line & Position</span>
          </div>
          {onMoveLineUp && (
            <button
              type="button"
              onClick={() => {
                onMoveLineUp(position.targetLineIndex);
                onClose();
              }}
              className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg hover:bg-accent hover:text-accent-foreground text-left transition-colors"
            >
              <span className="flex items-center gap-2">
                <ArrowUp className="w-3.5 h-3.5 text-primary" />
                <span>Move Line Up</span>
              </span>
              <kbd className="text-[9px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded border">Alt+↑</kbd>
            </button>
          )}
          {onMoveLineDown && (
            <button
              type="button"
              onClick={() => {
                onMoveLineDown(position.targetLineIndex);
                onClose();
              }}
              className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg hover:bg-accent hover:text-accent-foreground text-left transition-colors"
            >
              <span className="flex items-center gap-2">
                <ArrowDown className="w-3.5 h-3.5 text-primary" />
                <span>Move Line Down</span>
              </span>
              <kbd className="text-[9px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded border">Alt+↓</kbd>
            </button>
          )}
          {onAddLineBelow && (
            <button
              type="button"
              onClick={() => {
                onAddLineBelow(position.targetLineIndex);
                onClose();
              }}
              className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-accent hover:text-accent-foreground text-left transition-colors"
            >
              <Plus className="w-3.5 h-3.5 text-emerald-600" />
              <span>Insert Line Below</span>
            </button>
          )}
          {onDuplicateLine && (
            <button
              type="button"
              onClick={() => {
                onDuplicateLine(position.targetLineIndex);
                onClose();
              }}
              className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-accent hover:text-accent-foreground text-left transition-colors"
            >
              <Copy className="w-3.5 h-3.5 text-indigo-500" />
              <span>Duplicate Line</span>
            </button>
          )}
          {onDeleteLine && (
            <button
              type="button"
              onClick={() => {
                onDeleteLine(position.targetLineIndex);
                onClose();
              }}
              className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-destructive/10 text-destructive text-left transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Delete Line</span>
            </button>
          )}
        </div>
      )}

      {/* --- Section 3: Text Transformations & Alignment --- */}
      <div className="py-1 space-y-0.5">
        <div className="px-2 py-0.5 text-[9.5px] font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
          <Type className="w-3 h-3" />
          <span>Transform & Align</span>
        </div>
        <div className="grid grid-cols-3 gap-1 px-1 py-1">
          <button
            type="button"
            onClick={() => transformCase("upper")}
            title="UPPERCASE"
            className="px-2 py-1 rounded-lg bg-muted/60 hover:bg-accent text-center text-[10px] font-semibold transition-colors"
          >
            ABC
          </button>
          <button
            type="button"
            onClick={() => transformCase("lower")}
            title="lowercase"
            className="px-2 py-1 rounded-lg bg-muted/60 hover:bg-accent text-center text-[10px] font-semibold transition-colors"
          >
            abc
          </button>
          <button
            type="button"
            onClick={() => transformCase("title")}
            title="Title Case"
            className="px-2 py-1 rounded-lg bg-muted/60 hover:bg-accent text-center text-[10px] font-semibold transition-colors"
          >
            Abc
          </button>
        </div>

        <div className="flex items-center justify-between gap-1 px-1 pt-1">
          <button
            type="button"
            onClick={() => {
              applyCommand("justifyLeft");
              onClose();
            }}
            title="Align Left"
            className="flex-1 p-1.5 rounded-lg hover:bg-accent flex justify-center text-foreground transition-colors"
          >
            <AlignLeft className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => {
              applyCommand("justifyCenter");
              onClose();
            }}
            title="Align Center"
            className="flex-1 p-1.5 rounded-lg hover:bg-accent flex justify-center text-foreground transition-colors"
          >
            <AlignCenter className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => {
              applyCommand("justifyRight");
              onClose();
            }}
            title="Align Right"
            className="flex-1 p-1.5 rounded-lg hover:bg-accent flex justify-center text-foreground transition-colors"
          >
            <AlignRight className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => {
              applyCommand("removeFormat");
              onClose();
            }}
            title="Clear Formatting"
            className="flex-1 p-1.5 rounded-lg hover:bg-accent flex justify-center text-muted-foreground hover:text-foreground transition-colors"
          >
            <RemoveFormatting className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Nudge & Move Position */}
        <div className="pt-1.5 px-1 border-t border-border/50">
          <div className="text-[9.5px] font-semibold text-muted-foreground uppercase tracking-wider mb-1 flex items-center justify-between">
            <span className="flex items-center gap-1">
              <Move className="w-3 h-3" />
              <span>Nudge & Move Position</span>
            </span>
            <button
              type="button"
              onClick={() => nudge("reset")}
              title="Reset Position to Default"
              className="text-[9px] text-muted-foreground hover:text-primary flex items-center gap-0.5 px-1 py-0.5 rounded hover:bg-muted transition-colors"
            >
              <RotateCcw className="w-2.5 h-2.5" />
              <span>Reset</span>
            </button>
          </div>
          <div className="grid grid-cols-4 gap-1">
            <button
              type="button"
              onClick={() => nudge("left")}
              title="Move / Nudge Left (←)"
              className="py-1 px-1 rounded-lg bg-muted/60 hover:bg-accent flex items-center justify-center gap-1 text-[10px] font-medium transition-colors"
            >
              <ArrowLeft className="w-3 h-3 text-primary" />
              <span>Left</span>
            </button>
            <button
              type="button"
              onClick={() => nudge("right")}
              title="Move / Nudge Right (→)"
              className="py-1 px-1 rounded-lg bg-muted/60 hover:bg-accent flex items-center justify-center gap-1 text-[10px] font-medium transition-colors"
            >
              <ArrowRight className="w-3 h-3 text-primary" />
              <span>Right</span>
            </button>
            <button
              type="button"
              onClick={() => nudge("up")}
              title="Nudge Up (↑)"
              className="py-1 px-1 rounded-lg bg-muted/60 hover:bg-accent flex items-center justify-center gap-1 text-[10px] font-medium transition-colors"
            >
              <ArrowUp className="w-3 h-3 text-primary" />
              <span>Up</span>
            </button>
            <button
              type="button"
              onClick={() => nudge("down")}
              title="Nudge Down (↓)"
              className="py-1 px-1 rounded-lg bg-muted/60 hover:bg-accent flex items-center justify-center gap-1 text-[10px] font-medium transition-colors"
            >
              <ArrowDown className="w-3 h-3 text-primary" />
              <span>Down</span>
            </button>
          </div>
        </div>

        <div className="px-1 pt-1">
          <button
            type="button"
            onClick={insertBulletPoint}
            title="Insert Bullet Point (•) (Alt+B)"
            className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg bg-muted/40 hover:bg-accent text-left transition-colors text-xs font-medium"
          >
            <span className="flex items-center gap-2">
              <List className="w-3.5 h-3.5 text-primary" />
              <span>Insert Bullet Point (•)</span>
            </span>
            <kbd className="text-[9px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded border">Alt+B</kbd>
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
