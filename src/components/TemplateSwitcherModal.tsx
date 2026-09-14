import React, { useState } from "react";
import { Check, Sparkles, X, LayoutTemplate, ShieldCheck, Star } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { TemplateMiniPreview, TEMPLATES, TemplateId } from "@/components/ResumeDesignFormattingPanel";

interface TemplateSwitcherModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentTemplate: TemplateId;
  onSelectTemplate: (id: TemplateId) => void;
}

export function TemplateSwitcherModal({
  open,
  onOpenChange,
  currentTemplate,
  onSelectTemplate,
}: TemplateSwitcherModalProps) {
  const [selected, setSelected] = useState<TemplateId>(currentTemplate);
  const [filter, setFilter] = useState<"all" | "ats" | "modern" | "executive">("all");

  const handleApply = () => {
    onSelectTemplate(selected);
    onOpenChange(false);
  };

  const filteredTemplates = TEMPLATES.filter((t) => {
    if (filter === "ats") return t.tag?.toLowerCase().includes("ats") || t.tag?.toLowerCase().includes("clean");
    if (filter === "modern") return t.tag?.toLowerCase().includes("modern") || t.tag?.toLowerCase().includes("tech");
    if (filter === "executive") return t.tag?.toLowerCase().includes("exec") || t.tag?.toLowerCase().includes("classic");
    return true;
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl p-0 gap-0 overflow-hidden bg-[#0e1118] border border-white/[0.12] text-zinc-100 rounded-3xl shadow-2xl">
        <DialogHeader className="p-6 pb-4 border-b border-white/[0.08] flex flex-row items-center justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-400 mb-1.5">
              <Sparkles className="h-3.5 w-3.5" /> 1-Click Instant Template Switcher
            </div>
            <DialogTitle className="text-xl font-bold text-white">
              Choose an ATS-Tested Template
            </DialogTitle>
          </div>
          <div className="flex items-center gap-1.5 bg-[#161922] p-1 rounded-xl border border-white/[0.06]">
            {(["all", "ats", "modern", "executive"] as const).map((f) => (
              <button
                key={f}
                type="button"
                onClick={() => setFilter(f)}
                className={`px-3 py-1 text-xs font-bold rounded-lg transition-all capitalize ${
                  filter === f
                    ? "bg-emerald-500 text-slate-950 shadow-sm"
                    : "text-zinc-400 hover:text-white"
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        </DialogHeader>

        {/* Templates Grid */}
        <div className="p-6 max-h-[60vh] overflow-y-auto grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 custom-scrollbar">
          {filteredTemplates.map((t) => {
            const isSelected = selected === t.id;
            return (
              <div
                key={t.id}
                onClick={() => setSelected(t.id)}
                className={`group relative flex flex-col rounded-2xl border text-left transition-all duration-300 cursor-pointer overflow-hidden p-2.5 ${
                  isSelected
                    ? "bg-[#181d28] border-emerald-400 shadow-xl ring-2 ring-emerald-400/50 scale-[1.02]"
                    : "bg-[#12151e] border-white/[0.08] hover:border-white/30 hover:bg-[#161a25]"
                }`}
              >
                <div className="aspect-[1/1.3] w-full bg-white rounded-xl relative overflow-hidden flex items-start justify-center p-1 border border-zinc-200 shadow-inner">
                  <TemplateMiniPreview template={t.id} scale={0.22} className="pointer-events-none" />
                  {t.tag && (
                    <div className="absolute top-2 left-2 z-10 px-2 py-0.5 rounded-md bg-slate-950/90 text-emerald-400 text-[9px] font-bold tracking-wider uppercase border border-white/10 shadow-sm">
                      {t.tag}
                    </div>
                  )}
                  {isSelected && (
                    <div className="absolute top-2 right-2 z-10 bg-emerald-500 text-slate-950 rounded-full p-1 shadow-md">
                      <Check className="h-3.5 w-3.5 stroke-[3]" />
                    </div>
                  )}
                </div>

                <div className="mt-3">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-bold text-white group-hover:text-emerald-300 transition-colors">
                      {t.name}
                    </p>
                    {t.isATS && (
                      <span className="text-[9px] font-mono text-emerald-400 flex items-center gap-0.5">
                        <ShieldCheck className="h-2.5 w-2.5" /> 100% ATS
                      </span>
                    )}
                  </div>
                  <p className="text-[10px] text-zinc-400 line-clamp-1 mt-0.5">{t.desc}</p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="p-4 px-6 border-t border-white/[0.08] bg-[#0b0e14] flex items-center justify-between">
          <div className="text-xs text-zinc-400 flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-emerald-400" />
            Switching preserves all your typed data, sections, and custom bullet points.
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onOpenChange(false)}
              className="border-white/[0.1] bg-[#161922] text-zinc-300 hover:text-white"
            >
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handleApply}
              className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-bold shadow-md shadow-emerald-500/20"
            >
              Apply Template
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
