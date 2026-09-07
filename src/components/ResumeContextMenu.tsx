import React, { useState, useEffect, useRef } from "react";
import {
  Bold, Italic, Underline, Strikethrough,
  ArrowUp, ArrowDown, Copy, Plus, Trash2,
  RemoveFormatting, Palette, Highlighter,
  AlignLeft, AlignCenter, AlignRight,
  Type, MoveVertical
} from "lucide-react";

export interface ContextMenuPosition {
  x: number;
  y: number;
  targetElement?: HTMLElement | null;
  targetLineIndex?: number;
  targetEntryType?: string;
  targetEntryIndex?: number;
  selectedText?: string;
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
}: ResumeContextMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [showHighlightPicker, setShowHighlightPicker] = useState(false);
  const [coords, setCoords] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  // Compute position keeping menu within viewport
  useEffect(() => {
    if (!position) return;
    const menuWidth = 260;
    const menuHeight = 360;

    let x = position.x;
    let y = position.y;

    if (x + menuWidth > window.innerWidth - 10) {
      x = window.innerWidth - menuWidth - 10;
    }
    if (y + menuHeight > window.innerHeight - 10) {
      y = window.innerHeight - menuHeight - 10;
    }

    setCoords({ x: Math.max(10, x), y: Math.max(10, y) });
  }, [position]);

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

  const applyCommand = (command: string, value: string = "") => {
    try {
      if (onFormatText) {
        onFormatText(command, value);
      } else {
        document.execCommand(command, false, value);
      }
    } catch (err) {
      console.warn("Formatting command failed:", err);
    }
  };

  const transformCase = (type: "upper" | "lower" | "title") => {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return;
    const selectedText = selection.toString();
    if (!selectedText) return;

    let transformed = selectedText;
    if (type === "upper") {
      transformed = selectedText.toUpperCase();
    } else if (type === "lower") {
      transformed = selectedText.toLowerCase();
    } else if (type === "title") {
      transformed = selectedText.replace(/\b\w+/g, w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase());
    }

    document.execCommand("insertText", false, transformed);
    onClose();
  };

  const hasLineActions = Boolean(
    onMoveLineUp || onMoveLineDown || onDuplicateLine || onAddLineBelow || onDeleteLine
  );

  return (
    <div
      ref={menuRef}
      role="menu"
      aria-label="Resume Formatting Context Menu"
      style={{
        position: "fixed",
        left: `${coords.x}px`,
        top: `${coords.y}px`,
        zIndex: 99999,
      }}
      className="w-64 bg-popover/95 text-popover-foreground backdrop-blur-md border border-border shadow-2xl rounded-xl p-2 font-sans text-xs animate-in fade-in-50 zoom-in-95 duration-100 select-none"
      onContextMenu={e => e.preventDefault()}
    >
      {/* --- Section 1: Quick Formatting Toolbar --- */}
      <div className="flex items-center justify-between gap-1 pb-2 mb-2 border-b border-border/70 px-1">
        <button
          type="button"
          onClick={() => applyCommand("bold")}
          title="Bold (Ctrl+B)"
          className="p-1.5 rounded-lg hover:bg-accent hover:text-accent-foreground text-foreground transition-colors font-bold"
        >
          <Bold className="w-3.5 h-3.5" />
        </button>
        <button
          type="button"
          onClick={() => applyCommand("italic")}
          title="Italic (Ctrl+I)"
          className="p-1.5 rounded-lg hover:bg-accent hover:text-accent-foreground text-foreground transition-colors italic"
        >
          <Italic className="w-3.5 h-3.5" />
        </button>
        <button
          type="button"
          onClick={() => applyCommand("underline")}
          title="Underline (Ctrl+U)"
          className="p-1.5 rounded-lg hover:bg-accent hover:text-accent-foreground text-foreground transition-colors underline"
        >
          <Underline className="w-3.5 h-3.5" />
        </button>
        <button
          type="button"
          onClick={() => applyCommand("strikeThrough")}
          title="Strikethrough"
          className="p-1.5 rounded-lg hover:bg-accent hover:text-accent-foreground text-foreground transition-colors"
        >
          <Strikethrough className="w-3.5 h-3.5" />
        </button>
        <button
          type="button"
          onClick={() => {
            setShowColorPicker(!showColorPicker);
            setShowHighlightPicker(false);
          }}
          title="Text Color"
          className={`p-1.5 rounded-lg hover:bg-accent transition-colors ${showColorPicker ? "bg-accent text-primary" : "text-foreground"}`}
        >
          <Palette className="w-3.5 h-3.5" />
        </button>
        <button
          type="button"
          onClick={() => {
            setShowHighlightPicker(!showHighlightPicker);
            setShowColorPicker(false);
          }}
          title="Highlight Color"
          className={`p-1.5 rounded-lg hover:bg-accent transition-colors ${showHighlightPicker ? "bg-accent text-primary" : "text-foreground"}`}
        >
          <Highlighter className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* --- Palette dropdown (Text Color) --- */}
      {showColorPicker && (
        <div className="p-2 mb-2 bg-muted/60 rounded-lg border border-border/60 animate-in fade-in-50 duration-75">
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
                className="flex items-center gap-1 p-1 rounded hover:bg-background/80 transition-colors text-left"
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
        <div className="p-2 mb-2 bg-muted/60 rounded-lg border border-border/60 animate-in fade-in-50 duration-75">
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
                className="flex items-center gap-1 p-1 rounded hover:bg-background/80 transition-colors text-left"
                title={c.label}
              >
                <span className="w-3 h-3 rounded border shadow-xs inline-block shrink-0" style={{ backgroundColor: c.color === "transparent" ? "#fff" : c.color }} />
                <span className="text-[9px] truncate">{c.label}</span>
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
            className="px-2 py-1 rounded bg-muted/60 hover:bg-accent text-center text-[10px] font-semibold transition-colors"
          >
            ABC
          </button>
          <button
            type="button"
            onClick={() => transformCase("lower")}
            title="lowercase"
            className="px-2 py-1 rounded bg-muted/60 hover:bg-accent text-center text-[10px] font-semibold transition-colors"
          >
            abc
          </button>
          <button
            type="button"
            onClick={() => transformCase("title")}
            title="Title Case"
            className="px-2 py-1 rounded bg-muted/60 hover:bg-accent text-center text-[10px] font-semibold transition-colors"
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
            className="flex-1 p-1.5 rounded hover:bg-accent flex justify-center text-foreground transition-colors"
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
            className="flex-1 p-1.5 rounded hover:bg-accent flex justify-center text-foreground transition-colors"
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
            className="flex-1 p-1.5 rounded hover:bg-accent flex justify-center text-foreground transition-colors"
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
            className="flex-1 p-1.5 rounded hover:bg-accent flex justify-center text-muted-foreground hover:text-foreground transition-colors"
          >
            <RemoveFormatting className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
