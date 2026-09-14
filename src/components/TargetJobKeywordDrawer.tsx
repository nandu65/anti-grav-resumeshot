import React, { useState, useMemo } from "react";
import { CheckCircle2, AlertCircle, Plus, Target, Zap, FileText } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ResumeData } from "@/lib/resumeTemplates";

export interface TargetJobKeywordDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  resumeData: ResumeData;
  targetJd?: string;
  onTargetJdChange?: (jd: string) => void;
  onInjectKeyword: (keyword: string) => void;
}

const COMMON_TECH_KEYWORDS = [
  "React", "TypeScript", "JavaScript", "Next.js", "Node.js", "Python", "Java", "Go", "Golang",
  "AWS", "Azure", "GCP", "Docker", "Kubernetes", "GraphQL", "REST APIs", "Microservices",
  "PostgreSQL", "MongoDB", "Redis", "Kafka", "CI/CD", "Git", "System Design", "Agile", "Scrum",
  "Unit Testing", "Jest", "Tailwind CSS", "Redux", "SQL", "p99 Latency", "A/B Testing", "GTM Strategy",
  "Data Pipelines", "PyTorch", "TensorFlow", "Distributed Systems", "Security", "OAuth", "Terraform"
];

export function TargetJobKeywordDrawer({
  open,
  onOpenChange,
  resumeData,
  targetJd = "",
  onTargetJdChange,
  onInjectKeyword,
}: TargetJobKeywordDrawerProps) {
  const [localJd, setLocalJd] = useState("");
  const jobDescription = onTargetJdChange ? targetJd : localJd;
  const setJobDescription = (val: string) => {
    if (onTargetJdChange) {
      onTargetJdChange(val);
    } else {
      setLocalJd(val);
    }
  };

  // Aggregate all text from the current resume
  const resumeFullText = useMemo(() => {
    const skillItems = (resumeData.skills || []).flatMap((s) => [s.category, ...(s.items || [])]);
    const expItems = (resumeData.experience || []).flatMap((e) => [e.role, e.company, e.location, ...(e.bullets || [])]);
    const projItems = (resumeData.projects || []).flatMap((p) => [p.name, p.tech, ...(p.bullets || [])]);
    const leadItems = (resumeData.leadership || []).flatMap((l) => [l.role, l.organization, ...(l.bullets || [])]);
    const eduItems = (resumeData.education || []).flatMap((ed) => [ed.school, ed.degree, ed.details]);

    const parts: string[] = [
      resumeData.name,
      resumeData.summary,
      ...skillItems,
      ...expItems,
      ...projItems,
      ...leadItems,
      ...eduItems,
      ...(resumeData.certifications || []),
    ];
    return parts.filter(Boolean).join(" ").toLowerCase();
  }, [resumeData]);

  // Extract keywords from the job description
  const { matchedKeywords, missingKeywords, score } = useMemo(() => {
    if (!jobDescription.trim()) {
      return { matchedKeywords: [], missingKeywords: [], score: 0 };
    }

    const jdText = jobDescription.toLowerCase();
    const foundInJd = COMMON_TECH_KEYWORDS.filter((kw) => jdText.includes(kw.toLowerCase()));

    const uniqueKeywords = Array.from(new Set([...foundInJd]));

    const matched: string[] = [];
    const missing: string[] = [];

    for (const kw of uniqueKeywords) {
      if (resumeFullText.includes(kw.toLowerCase())) {
        matched.push(kw);
      } else {
        missing.push(kw);
      }
    }

    const matchRate = uniqueKeywords.length > 0 ? Math.round((matched.length / uniqueKeywords.length) * 100) : 0;

    return { matchedKeywords: matched, missingKeywords: missing, score: matchRate };
  }, [jobDescription, resumeFullText]);

  const handleInsertKeyword = (kw: string) => {
    onInjectKeyword(kw);
  };

  const handleAutoInjectAll = () => {
    if (missingKeywords.length === 0) return;
    missingKeywords.forEach((kw) => onInjectKeyword(kw));
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-lg bg-[#0e1118] border-l border-white/[0.12] text-zinc-100 p-0 flex flex-col justify-between">
        <SheetHeader className="p-6 pb-4 border-b border-white/[0.08]">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-emerald-400">
            <Target className="h-4 w-4" /> Live ATS Keyword Radar
          </div>
          <SheetTitle className="text-lg font-bold text-white">
            Target Job Description Ingestion
          </SheetTitle>
          <p className="text-xs text-zinc-400">
            Paste the job description you're applying for. We'll cross-reference your resume in real time.
          </p>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
          {/* Textarea for Job Description */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-zinc-300 flex items-center justify-between">
              <span>Paste Target Job Description</span>
              {jobDescription.length > 0 && (
                <button
                  type="button"
                  onClick={() => setJobDescription("")}
                  className="text-[10px] text-zinc-500 hover:text-white cursor-pointer"
                >
                  Clear
                </button>
              )}
            </label>
            <Textarea
              value={jobDescription}
              onChange={(e) => setJobDescription(e.target.value)}
              placeholder="Paste job requirements, responsibilities, or skills list here..."
              rows={5}
              className="bg-[#141722] border-white/[0.1] text-xs text-zinc-200 placeholder:text-zinc-500 rounded-xl focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 resize-none"
            />
          </div>

          {jobDescription.trim().length > 0 ? (
            <div className="space-y-5">
              {/* Score Card */}
              <div className="p-4 rounded-2xl bg-[#161a25] border border-white/[0.08] flex items-center justify-between">
                <div>
                  <div className="text-[11px] font-bold uppercase tracking-wider text-zinc-400">
                    ATS Keyword Match Rate
                  </div>
                  <div className="text-2xl font-black text-white font-mono mt-0.5">
                    {score}%
                  </div>
                  <div className="text-[10px] text-zinc-400 mt-1">
                    {matchedKeywords.length} matched / {missingKeywords.length} missing
                  </div>
                </div>

                {missingKeywords.length > 0 && (
                  <Button
                    size="sm"
                    onClick={handleAutoInjectAll}
                    className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs rounded-xl shadow-md cursor-pointer"
                  >
                    <Zap className="h-3.5 w-3.5 mr-1" /> Inject All ({missingKeywords.length})
                  </Button>
                )}
              </div>

              {/* Missing Keywords List */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-red-400 flex items-center gap-1.5">
                    <AlertCircle className="h-3.5 w-3.5" /> Missing Keywords ({missingKeywords.length})
                  </span>
                  <span className="text-[10px] text-zinc-500">Click (+) to add to skills</span>
                </div>

                {missingKeywords.length > 0 ? (
                  <div className="flex flex-wrap gap-1.5">
                    {missingKeywords.map((kw) => (
                      <button
                        key={kw}
                        type="button"
                        onClick={() => handleInsertKeyword(kw)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-300 border border-red-500/25 text-xs font-mono transition-all group cursor-pointer"
                        title="Add to skills"
                      >
                        <span>{kw}</span>
                        <Plus className="h-3 w-3 group-hover:scale-125 transition-transform" />
                      </button>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-zinc-500 italic">No missing critical keywords detected!</p>
                )}
              </div>

              {/* Matched Keywords List */}
              <div className="space-y-2">
                <div className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                  <CheckCircle2 className="h-3.5 w-3.5" /> Matched Keywords ({matchedKeywords.length})
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {matchedKeywords.map((kw) => (
                    <span
                      key={kw}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-300 border border-emerald-500/25 text-xs font-mono"
                    >
                      <CheckCircle2 className="h-3 w-3 text-emerald-400" />
                      {kw}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="p-8 text-center rounded-2xl border border-dashed border-white/[0.1] bg-[#12151e]">
              <FileText className="h-8 w-8 text-zinc-500 mx-auto mb-2" />
              <p className="text-xs font-semibold text-zinc-300">Paste any job description above</p>
              <p className="text-[11px] text-zinc-500 mt-1">
                We'll extract requirements and highlight gaps in real time.
              </p>
            </div>
          )}
        </div>

        <div className="p-4 px-6 border-t border-white/[0.08] bg-[#0b0e14] flex items-center justify-between">
          <span className="text-[11px] text-zinc-400">
            Real-time scanner updates as you edit the resume.
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onOpenChange(false)}
            className="border-white/[0.1] bg-[#161922] text-zinc-300 cursor-pointer"
          >
            Done
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
