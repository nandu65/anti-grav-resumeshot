import React, { useState } from "react";
import { Palette, Type, Check, RotateCcw, LayoutList, GripVertical, ArrowUp, ArrowDown } from "lucide-react";
import { Droppable, Draggable } from "react-beautiful-dnd";
import { ResumeSettings, TemplateId, TEMPLATES, getNormalizedSectionOrder } from "@/lib/resumeTemplates";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

interface ResumeDesignFormattingPanelProps {
  settings: ResumeSettings;
  onChangeSettings: (settings: ResumeSettings) => void;
  template: TemplateId;
  onChangeTemplate: (template: TemplateId) => void;
  className?: string;
}

import { RESUME_FONTS } from "@/lib/fonts";

const SECTION_LABELS: Record<string, string> = {
  summary: "Summary",
  experience: "Work Experience",
  leadership: "Leadership",
  education: "Education",
  projects: "Projects",
  skills: "Skills",
  certifications: "Certifications",
};

export function ResumeDesignFormattingPanel({
  settings,
  onChangeSettings,
  template,
  onChangeTemplate,
  className = "",
}: ResumeDesignFormattingPanelProps) {
  const [activeTab, setActiveTab] = useState<"formatting" | "sections" | "design">("formatting");

  const updateSetting = <K extends keyof ResumeSettings>(key: K, value: ResumeSettings[K]) => {
    onChangeSettings({
      ...settings,
      [key]: value,
    });
  };

  const sectionOrder = getNormalizedSectionOrder(settings.sectionOrder);

  const moveSection = (index: number, direction: "up" | "down") => {
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= sectionOrder.length) return;
    const newOrder = [...sectionOrder];
    const temp = newOrder[index];
    newOrder[index] = newOrder[targetIndex];
    newOrder[targetIndex] = temp;
    updateSetting("sectionOrder", newOrder);
  };

  const currentFontFamily = settings.fontFamily || "Arial, sans-serif";
  const currentFontSize = settings.fontSize ?? 10;
  const currentHeadingSize = settings.headingSize ?? 14;
  const currentSectionSpacing = settings.sectionSpacing ?? 16;
  const currentParagraphSpacing = settings.paragraphSpacing ?? 6;
  const currentLineSpacing = settings.lineSpacing ?? 1.35;
  const currentMarginTB = settings.marginTopBottom ?? 32;
  const currentMarginSide = settings.marginSide ?? 32;
  const currentIndent = settings.paragraphIndent ?? 0;

  const handleResetDefaults = () => {
    onChangeSettings({
      ...settings,
      fontFamily: "Arial, sans-serif",
      fontSize: 10,
      headingSize: 14,
      sectionSpacing: 16,
      paragraphSpacing: 6,
      lineSpacing: 1.35,
      marginTopBottom: 32,
      marginSide: 32,
      paragraphIndent: 0,
    });
  };

  return (
    <aside
      aria-label="Resume Design & Formatting"
      className={`w-full lg:w-72 shrink-0 bg-[#28334f] text-white rounded-2xl shadow-xl p-4 flex flex-col gap-4 border border-white/10 select-none custom-scrollbar overflow-y-auto max-h-[calc(100vh-140px)] ${className}`}
    >
      {/* Top Tabs */}
      <div className="flex bg-[#1c243c] p-1 rounded-xl gap-1">
        <button
          type="button"
          onClick={() => setActiveTab("formatting")}
          className={`flex-1 flex items-center justify-center gap-1 py-1.5 px-2 text-[11px] font-bold rounded-lg transition-all ${
            activeTab === "formatting"
              ? "bg-[#fceed6] text-neutral-900 shadow-sm"
              : "text-white/80 hover:text-white"
          }`}
        >
          <Type className="h-3 w-3" />
          Format
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("sections")}
          className={`flex-1 flex items-center justify-center gap-1 py-1.5 px-2 text-[11px] font-bold rounded-lg transition-all ${
            activeTab === "sections"
              ? "bg-[#fceed6] text-neutral-900 shadow-sm"
              : "text-white/80 hover:text-white"
          }`}
        >
          <LayoutList className="h-3 w-3" />
          Sections
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("design")}
          className={`flex-1 flex items-center justify-center gap-1 py-1.5 px-2 text-[11px] font-bold rounded-lg transition-all ${
            activeTab === "design"
              ? "bg-[#fceed6] text-neutral-900 shadow-sm"
              : "text-white/80 hover:text-white"
          }`}
        >
          <Palette className="h-3 w-3" />
          Themes
        </button>
      </div>

      {activeTab === "formatting" && (
        <div className="space-y-4">
          {/* FONT FORMATTING */}
          <div className="space-y-3">
            <h4 className="font-bold text-sm text-white tracking-tight">Font Formatting</h4>

            {/* Font Style */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-white/90">Font Style</Label>
              <div className="relative">
                <select
                  value={currentFontFamily}
                  onChange={(e) => updateSetting("fontFamily", e.target.value)}
                  className="w-full h-9 px-3 bg-[#1c243c] border border-white/20 rounded-xl text-xs font-medium text-white appearance-none cursor-pointer focus:outline-none focus:ring-1 focus:ring-emerald-400"
                >
                  {RESUME_FONTS.map((f) => (
                    <option key={f.value} value={f.value} style={{ fontFamily: f.value }} className="bg-[#1c243c] text-white py-1">
                      {f.label}
                    </option>
                  ))}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2.5 text-white/60">
                  <svg className="h-4 w-4 fill-current" viewBox="0 0 20 20">
                    <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Font Size */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center text-xs">
                <span className="font-semibold text-white/90">Font Size</span>
                <span className="font-mono text-white/80 text-[11px]">{currentFontSize} pt</span>
              </div>
              <input
                type="range"
                min={8}
                max={16}
                step={1}
                value={currentFontSize}
                onChange={(e) => updateSetting("fontSize", Number(e.target.value))}
                className="w-full h-1.5 bg-white/20 rounded-lg appearance-none cursor-pointer accent-[#86efac]"
              />
            </div>

            {/* Heading Size */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center text-xs">
                <span className="font-semibold text-white/90">Heading Size</span>
                <span className="font-mono text-white/80 text-[11px]">{currentHeadingSize} pt</span>
              </div>
              <input
                type="range"
                min={11}
                max={24}
                step={1}
                value={currentHeadingSize}
                onChange={(e) => updateSetting("headingSize", Number(e.target.value))}
                className="w-full h-1.5 bg-white/20 rounded-lg appearance-none cursor-pointer accent-[#86efac]"
              />
            </div>
          </div>

          {/* Dotted separator */}
          <div className="border-t border-dashed border-white/25 my-3" />

          {/* DOCUMENT FORMATTING */}
          <div className="space-y-3.5">
            <h4 className="font-bold text-sm text-white tracking-tight">Document Formatting</h4>

            {/* Section Spacing */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center text-xs">
                <span className="font-semibold text-white/90">Section Spacing</span>
                <span className="font-mono text-white/80 text-[11px]">{currentSectionSpacing} px</span>
              </div>
              <input
                type="range"
                min={4}
                max={36}
                step={1}
                value={currentSectionSpacing}
                onChange={(e) => updateSetting("sectionSpacing", Number(e.target.value))}
                className="w-full h-1.5 bg-white/20 rounded-lg appearance-none cursor-pointer accent-[#86efac]"
              />
            </div>

            {/* Paragraph Spacing */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center text-xs">
                <span className="font-semibold text-white/90">Paragraph Spacing</span>
                <span className="font-mono text-white/80 text-[11px]">{currentParagraphSpacing} px</span>
              </div>
              <input
                type="range"
                min={0}
                max={20}
                step={1}
                value={currentParagraphSpacing}
                onChange={(e) => updateSetting("paragraphSpacing", Number(e.target.value))}
                className="w-full h-1.5 bg-white/20 rounded-lg appearance-none cursor-pointer accent-[#86efac]"
              />
            </div>

            {/* Line Spacing */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center text-xs">
                <span className="font-semibold text-white/90">Line Spacing</span>
                <span className="font-mono text-white/80 text-[11px]">{Number(currentLineSpacing).toFixed(2)}</span>
              </div>
              <input
                type="range"
                min={1.0}
                max={2.2}
                step={0.05}
                value={currentLineSpacing}
                onChange={(e) => updateSetting("lineSpacing", Number(e.target.value))}
                className="w-full h-1.5 bg-white/20 rounded-lg appearance-none cursor-pointer accent-[#86efac]"
              />
            </div>

            {/* Top & Bottom Margin */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center text-xs">
                <span className="font-semibold text-white/90">Top & Bottom Margin</span>
                <span className="font-mono text-white/80 text-[11px]">{currentMarginTB} px</span>
              </div>
              <input
                type="range"
                min={8}
                max={64}
                step={2}
                value={currentMarginTB}
                onChange={(e) => updateSetting("marginTopBottom", Number(e.target.value))}
                className="w-full h-1.5 bg-white/20 rounded-lg appearance-none cursor-pointer accent-[#86efac]"
              />
            </div>

            {/* Side Margins */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center text-xs">
                <span className="font-semibold text-white/90">Side Margins</span>
                <span className="font-mono text-white/80 text-[11px]">{currentMarginSide} px</span>
              </div>
              <input
                type="range"
                min={8}
                max={64}
                step={2}
                value={currentMarginSide}
                onChange={(e) => updateSetting("marginSide", Number(e.target.value))}
                className="w-full h-1.5 bg-white/20 rounded-lg appearance-none cursor-pointer accent-[#86efac]"
              />
            </div>

            {/* Paragraph Indent */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center text-xs">
                <span className="font-semibold text-white/90">Paragraph Indent</span>
                <span className="font-mono text-white/80 text-[11px]">{currentIndent} px</span>
              </div>
              <input
                type="range"
                min={0}
                max={32}
                step={2}
                value={currentIndent}
                onChange={(e) => updateSetting("paragraphIndent", Number(e.target.value))}
                className="w-full h-1.5 bg-white/20 rounded-lg appearance-none cursor-pointer accent-[#86efac]"
              />
            </div>
          </div>

          <div className="pt-2 border-t border-white/10">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleResetDefaults}
              className="w-full text-xs text-white/70 hover:text-white hover:bg-white/10 gap-1.5 h-8"
            >
              <RotateCcw className="h-3 w-3" />
              Reset to Defaults
            </Button>
          </div>
        </div>
      )}

      {/* SECTIONS TAB: DRAG & DROP REORDER */}
      {activeTab === "sections" && (
        <div className="space-y-3">
          <div>
            <h4 className="font-bold text-sm text-white tracking-tight">Section Order</h4>
            <p className="text-[11px] text-white/60 mt-0.5">
              Drag to reorder sections or use arrows. Changes sync live with the preview.
            </p>
          </div>

          <Droppable droppableId="section-order-list">
            {(provided) => (
              <div
                {...provided.droppableProps}
                ref={provided.innerRef}
                className="space-y-1.5 max-h-[460px] overflow-y-auto pr-1 custom-scrollbar"
              >
                {sectionOrder.map((sec, idx) => (
                  <Draggable key={sec} draggableId={sec} index={idx}>
                    {(prov, snap) => (
                      <div
                        ref={prov.innerRef}
                        {...prov.draggableProps}
                        className={`flex items-center justify-between p-2 rounded-xl border transition-all ${
                          snap.isDragging
                            ? "bg-[#1c243c] border-emerald-400 text-white shadow-2xl scale-[1.03] z-50 ring-2 ring-emerald-400"
                            : "bg-[#1c243c]/70 border-white/10 text-white/90 hover:bg-[#1c243c]"
                        }`}
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <div
                            {...prov.dragHandleProps}
                            className="text-white/40 hover:text-white cursor-grab active:cursor-grabbing p-0.5"
                            title="Drag to reorder"
                          >
                            <GripVertical className="h-4 w-4" />
                          </div>
                          <span className="text-xs font-semibold truncate">
                            {SECTION_LABELS[sec] || sec.toUpperCase()}
                          </span>
                        </div>

                        <div className="flex items-center gap-0.5">
                          <button
                            type="button"
                            disabled={idx === 0}
                            onClick={() => moveSection(idx, "up")}
                            className="p-1 rounded hover:bg-white/10 text-white/60 hover:text-white disabled:opacity-20 disabled:hover:bg-transparent"
                            title="Move Up"
                          >
                            <ArrowUp className="h-3 w-3" />
                          </button>
                          <button
                            type="button"
                            disabled={idx === sectionOrder.length - 1}
                            onClick={() => moveSection(idx, "down")}
                            className="p-1 rounded hover:bg-white/10 text-white/60 hover:text-white disabled:opacity-20 disabled:hover:bg-transparent"
                            title="Move Down"
                          >
                            <ArrowDown className="h-3 w-3" />
                          </button>
                        </div>
                      </div>
                    )}
                  </Draggable>
                ))}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        </div>
      )}

      {/* DESIGN TAB: TEMPLATES */}
      {activeTab === "design" && (
        <div className="space-y-3">
          <h4 className="font-bold text-sm text-white tracking-tight">Resume Template</h4>
          <div className="grid grid-cols-1 gap-2 max-h-[480px] overflow-y-auto pr-1 custom-scrollbar">
            {TEMPLATES.map((t) => {
              const active = template === t.id;
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => onChangeTemplate(t.id)}
                  className={`flex items-center justify-between p-2.5 rounded-xl border text-left transition-all ${
                    active
                      ? "bg-[#1c243c] border-emerald-400 text-white shadow-md ring-1 ring-emerald-400"
                      : "bg-[#1c243c]/60 border-white/10 text-white/80 hover:bg-[#1c243c] hover:text-white"
                  }`}
                >
                  <div className="min-w-0 pr-2">
                    <p className="text-xs font-bold truncate">{t.name}</p>
                    <p className="text-[10px] text-white/60 line-clamp-1">{t.desc}</p>
                  </div>
                  {active && <Check className="h-4 w-4 text-emerald-400 shrink-0" />}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </aside>
  );
}

