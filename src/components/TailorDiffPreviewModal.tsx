import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { DiffView } from "@/components/DiffView";
import {
  Sparkles,
  Check,
  X,
  CheckCheck,
  RotateCcw,
  ShieldCheck,
  Briefcase,
  Users,
  FolderGit2,
  FileText,
  ArrowRight,
} from "lucide-react";

export interface TailorDiffBullet {
  id: string;
  sectionType: "experience" | "leadership" | "projects";
  entryIndex: number;
  bulletIndex: number;
  entryTitle: string;
  original: string;
  improved: string;
  accepted: boolean;
}

export interface SummaryDiff {
  original: string;
  improved: string;
  accepted: boolean;
}

interface TailorDiffPreviewModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  diffItems: TailorDiffBullet[];
  summaryDiff?: SummaryDiff | null;
  onApplyChanges: (
    acceptedDiffs: TailorDiffBullet[],
    appliedSummary: SummaryDiff | null
  ) => void;
}

export function TailorDiffPreviewModal({
  open,
  onOpenChange,
  diffItems: initialDiffs,
  summaryDiff: initialSummary,
  onApplyChanges,
}: TailorDiffPreviewModalProps) {
  const [items, setItems] = useState<TailorDiffBullet[]>(initialDiffs);
  const [summary, setSummary] = useState<SummaryDiff | null>(initialSummary || null);

  // Sync state when props change
  React.useEffect(() => {
    setItems(initialDiffs);
    setSummary(initialSummary || null);
  }, [initialDiffs, initialSummary]);

  const toggleItem = (id: string) => {
    setItems((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, accepted: !item.accepted } : item
      )
    );
  };

  const setAllItems = (accepted: boolean) => {
    setItems((prev) => prev.map((item) => ({ ...item, accepted })));
    if (summary) {
      setSummary({ ...summary, accepted });
    }
  };

  const acceptedCount =
    items.filter((i) => i.accepted).length + (summary?.accepted ? 1 : 0);
  const totalCount = items.length + (summary ? 1 : 0);

  // Group diff items by entryTitle
  const groupedItems = React.useMemo(() => {
    const map = new Map<string, { sectionType: string; items: TailorDiffBullet[] }>();
    items.forEach((item) => {
      const key = `${item.sectionType}:${item.entryTitle}`;
      if (!map.has(key)) {
        map.set(key, { sectionType: item.sectionType, items: [] });
      }
      map.get(key)!.items.push(item);
    });
    return Array.from(map.entries());
  }, [items]);

  const handleApply = () => {
    onApplyChanges(items, summary);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col p-0 bg-[#0d0f14] border border-white/10 text-zinc-100 rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-5 border-b border-white/[0.08] bg-[#11141b]/90 backdrop-blur-md shrink-0">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <DialogTitle className="font-display text-xl font-bold text-white flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-emerald-400" />
                Review AI Polish & Tailoring
              </DialogTitle>
              <DialogDescription className="text-xs text-zinc-400 mt-1">
                Compare side-by-side improvements. Accept polished action verbs or keep your original text per bullet.
              </DialogDescription>
            </div>
            <div className="flex items-center gap-2 self-start sm:self-auto">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <ShieldCheck className="h-3.5 w-3.5" />
                Titles & Dates Protected
              </span>
            </div>
          </div>

          {/* Quick Actions Bar */}
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-white/[0.06]">
            <div className="text-xs text-zinc-300 font-medium">
              <span className="text-emerald-400 font-bold">{acceptedCount}</span> of {totalCount} improvements selected
            </div>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setAllItems(true)}
                className="h-7 text-xs border-white/10 bg-white/5 hover:bg-emerald-500/20 hover:text-emerald-300 text-zinc-300 cursor-pointer"
              >
                <CheckCheck className="h-3.5 w-3.5 mr-1 text-emerald-400" /> Accept All
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setAllItems(false)}
                className="h-7 text-xs border-white/10 bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-zinc-200 cursor-pointer"
              >
                <RotateCcw className="h-3.5 w-3.5 mr-1" /> Keep All Original
              </Button>
            </div>
          </div>
        </div>

        {/* Scrollable Comparison Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-6 custom-scrollbar bg-[#090b0e]">
          {/* Summary Diff if available */}
          {summary && (
            <div className="rounded-xl border border-white/[0.08] bg-[#11141b] overflow-hidden">
              <div className="px-4 py-2.5 bg-white/[0.03] border-b border-white/[0.06] flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-bold text-zinc-200">
                  <FileText className="h-4 w-4 text-emerald-400" />
                  <span>Professional Summary</span>
                </div>
                <Button
                  type="button"
                  size="sm"
                  variant={summary.accepted ? "default" : "outline"}
                  onClick={() => setSummary({ ...summary, accepted: !summary.accepted })}
                  className={`h-7 px-2.5 text-xs font-semibold rounded-lg cursor-pointer ${
                    summary.accepted
                      ? "bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold"
                      : "border-white/10 text-zinc-400 hover:text-white hover:bg-white/5"
                  }`}
                >
                  {summary.accepted ? (
                    <>
                      <Check className="h-3 w-3 mr-1" /> Accepted
                    </>
                  ) : (
                    <>
                      <X className="h-3 w-3 mr-1" /> Original Kept
                    </>
                  )}
                </Button>
              </div>

              <div className="p-4 grid sm:grid-cols-2 gap-3">
                <div className="p-3 rounded-lg bg-black/40 border border-white/5 space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">
                    Original Summary
                  </span>
                  <p className="text-xs text-zinc-400 leading-relaxed">
                    {summary.original || "(Empty)"}
                  </p>
                </div>
                <div
                  className={`p-3 rounded-lg border transition-all space-y-1 ${
                    summary.accepted
                      ? "bg-emerald-500/[0.08] border-emerald-500/30 text-zinc-100"
                      : "bg-black/20 border-white/5 text-zinc-400 opacity-60"
                  }`}
                >
                  <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400">
                    ✨ Tailored Summary
                  </span>
                  <div className="text-xs leading-relaxed">
                    <DiffView original={summary.original} improved={summary.improved} />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Grouped Experience / Leadership / Project Bullets */}
          {groupedItems.map(([groupKey, group]) => {
            const sectionIcon =
              group.sectionType === "experience" ? (
                <Briefcase className="h-4 w-4 text-emerald-400" />
              ) : group.sectionType === "leadership" ? (
                <Users className="h-4 w-4 text-teal-400" />
              ) : (
                <FolderGit2 className="h-4 w-4 text-cyan-400" />
              );

            const displayTitle = groupKey.split(":")[1] || groupKey;

            return (
              <div
                key={groupKey}
                className="rounded-xl border border-white/[0.08] bg-[#11141b] overflow-hidden shadow-sm"
              >
                {/* Group Title Bar */}
                <div className="px-4 py-2.5 bg-white/[0.03] border-b border-white/[0.06] flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs font-bold text-zinc-200">
                    {sectionIcon}
                    <span className="truncate">{displayTitle}</span>
                  </div>
                  <span className="text-[10.5px] text-zinc-400 font-mono">
                    {group.items.filter((i) => i.accepted).length} of {group.items.length} accepted
                  </span>
                </div>

                {/* Bullets List */}
                <div className="divide-y divide-white/[0.04]">
                  {group.items.map((item, idx) => (
                    <div
                      key={item.id}
                      className={`p-4 transition-colors ${
                        item.accepted ? "bg-emerald-500/[0.02]" : "bg-transparent opacity-80"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-3 mb-2.5">
                        <span className="text-[11px] font-mono text-zinc-400">
                          Bullet #{idx + 1}
                        </span>
                        <Button
                          type="button"
                          size="sm"
                          variant={item.accepted ? "default" : "outline"}
                          onClick={() => toggleItem(item.id)}
                          className={`h-7 px-3 text-xs font-semibold rounded-lg cursor-pointer transition-all ${
                            item.accepted
                              ? "bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold shadow-xs shadow-emerald-500/20"
                              : "border-white/10 text-zinc-400 hover:text-white hover:bg-white/5"
                          }`}
                        >
                          {item.accepted ? (
                            <>
                              <Check className="h-3 w-3 mr-1" /> Accepted
                            </>
                          ) : (
                            <>
                              <X className="h-3 w-3 mr-1" /> Keep Original
                            </>
                          )}
                        </Button>
                      </div>

                      <div className="grid sm:grid-cols-2 gap-3">
                        {/* Original */}
                        <div className="p-3 rounded-lg bg-black/40 border border-white/5 space-y-1">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 block">
                            Original Text
                          </span>
                          <p className="text-xs text-zinc-400 leading-relaxed">
                            {item.original || "(Empty)"}
                          </p>
                        </div>

                        {/* AI Improved */}
                        <div
                          className={`p-3 rounded-lg border transition-all space-y-1 ${
                            item.accepted
                              ? "bg-emerald-500/[0.08] border-emerald-500/30 text-zinc-100"
                              : "bg-black/20 border-white/5 text-zinc-400"
                          }`}
                        >
                          <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 block">
                            ✨ AI Enhanced (Impact & Action Verbs)
                          </span>
                          <div className="text-xs leading-relaxed">
                            <DiffView original={item.original} improved={item.improved} />
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}

          {items.length === 0 && !summary && (
            <div className="text-center py-12 text-zinc-400 text-sm">
              No bullet differences detected. Your resume content was already well-aligned!
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-white/[0.08] bg-[#11141b]/95 backdrop-blur-md flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          <p className="text-xs text-zinc-400">
            Clicking <strong className="text-zinc-200">Apply Changes</strong> will update accepted bullets on your live canvas.
          </p>
          <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => onOpenChange(false)}
              className="text-zinc-400 hover:text-white"
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleApply}
              className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-bold px-5 h-9 rounded-xl shadow-lg shadow-emerald-500/20 cursor-pointer"
            >
              Apply Accepted Changes ({acceptedCount}) <ArrowRight className="h-4 w-4 ml-1.5" />
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

