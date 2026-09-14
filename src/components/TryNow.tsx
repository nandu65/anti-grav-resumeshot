import { useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Upload, FileText, Sparkles, Loader2, Lock, ArrowRight, CheckCircle2, RefreshCw, Zap, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { toast } from "sonner";
import { extractTextFromFile } from "@/lib/extractText";
import { validateResumeFile } from "@/lib/fileValidation";
import { AnalyzeProgress } from "@/components/AnalyzeProgress";
import { supabase } from "@/integrations/supabase/client";

type Result = {
  score: number;
  matched_keywords: string[];
  missing_keywords: string[];
  improvements: string[];
};

const SAMPLE_JD = `Senior Full Stack Engineer (React, TypeScript, Node.js)
Responsibilities:
- Build and maintain scalable web applications using React, TypeScript, and Node.js
- Architect robust RESTful microservices, PostgreSQL databases, and Redis caching layers
- Deploy and monitor cloud infrastructure on AWS using Docker and CI/CD pipelines
- Optimize web app performance, core web vitals, and backend query latencies
- Collaborate closely with product managers and designers to deliver high-impact features`;

const SAMPLE_RESUME_TEXT = `Alex Morgan
alex.morgan@example.com | (555) 234-5678 | San Francisco, CA | linkedin.com/in/alexmorgan

SUMMARY
Senior Full Stack Engineer with 5+ years of experience engineering high-throughput web applications with React, TypeScript, Node.js, and AWS. Proven track record leading microservice architectures and reducing latency by 45%.

TECHNICAL SKILLS
- Frontend: React, Next.js, TypeScript, Tailwind CSS, Redux, Webpack
- Backend: Node.js, Express, PostgreSQL, Redis, REST APIs, GraphQL
- Cloud & DevOps: AWS (S3, ECS, Lambda), Docker, GitHub Actions, CI/CD

PROFESSIONAL EXPERIENCE
Senior Full Stack Engineer | CloudTech Labs | 2022 - Present
- Architected and launched 12+ cloud microservices using Node.js and TypeScript on AWS, handling 2M+ daily requests.
- Engineered high-performance React dashboards, reducing initial page load times by 42%.
- Optimized complex PostgreSQL queries and implemented Redis caching, lowering average API response times from 350ms to 60ms.
- Mentored 5 junior engineers and established automated testing pipelines with Jest, increasing test coverage to 88%.

Software Engineer | DevMatrix Solutions | 2019 - 2022
- Developed user-facing features for enterprise SaaS clients using React, TypeScript, and Node.js.
- Integrated third-party payment gateways and webhook processing services with 99.98% reliability.`;

export function TryNow() {
  const [jd, setJd] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [resumeText, setResumeText] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<Result | null>(null);
  const [open, setOpen] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [isSample, setIsSample] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (f: File) => {
    const v = validateResumeFile(f);
    if (v.ok === false) {
      toast.error(v.error);
      if (inputRef.current) inputRef.current.value = "";
      return;
    }
    setFile(f);
    setIsSample(false);
    setResumeText("");
    try {
      const text = await extractTextFromFile(f);
      if (!text || text.length < 30) {
        toast.error("We couldn't read enough text from that file. Try another PDF, DOCX, or TXT.");
        setFile(null);
        return;
      }
      setResumeText(text);
      toast.success("Resume loaded successfully!");
    } catch (e: any) {
      toast.error(e?.message || "Failed to read file");
      setFile(null);
    } finally {
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  const loadSampleData = () => {
    setJd(SAMPLE_JD);
    setResumeText(SAMPLE_RESUME_TEXT);
    const mockFile = new File([SAMPLE_RESUME_TEXT], "Alex_Morgan_Resume_Sample.pdf", { type: "application/pdf" });
    setFile(mockFile);
    setIsSample(true);
    toast.success("Sample SWE resume & Job Description loaded! Click 'Get ATS Score'.");
  };

  const clearData = () => {
    setJd("");
    setFile(null);
    setResumeText("");
    setIsSample(false);
    if (inputRef.current) inputRef.current.value = "";
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const f = e.dataTransfer.files?.[0];
    if (f) handleFile(f);
  };

  const analyze = async () => {
    if (!jd.trim() || jd.trim().length < 40) {
      toast.error("Paste a job description (at least 40 characters) or click 'Try with Sample'.");
      return;
    }
    if (!resumeText) {
      toast.error("Upload your resume or click 'Try with Sample'.");
      return;
    }
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("ats-score", {
        body: { resume: resumeText, jobDescription: jd },
      });
      if (error) throw error;
      setResult(data as Result);
      setOpen(true);
    } catch (e: any) {
      toast.error(e?.message || "Analysis failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full flex flex-col justify-between h-full">
      <div>
        {/* Header with Sample quick-filler */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 mb-5">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.18em] text-emerald-600 dark:text-emerald-400">
              <Sparkles className="h-3.5 w-3.5" /> AI Analysis Ready
            </span>
            <span className="text-[11px] text-zinc-500 dark:text-zinc-400 font-medium">· 100% Free Preview</span>
          </div>

          <button
            type="button"
            onClick={isSample ? clearData : loadSampleData}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/25 px-2.5 py-1 rounded-lg transition-all self-start sm:self-auto cursor-pointer"
          >
            {isSample ? (
              <>
                <RefreshCw className="h-3 w-3" /> Clear Sample
              </>
            ) : (
              <>
                <Zap className="h-3 w-3 text-amber-500 animate-pulse" /> Try with Sample Data
              </>
            )}
          </button>
        </div>

        <h2 className="font-display text-2xl sm:text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-white leading-tight">
          Instant ATS score in <span className="text-emerald-600 dark:text-emerald-400">30 seconds</span>
        </h2>
        <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
          See how well your resume matches any job description before submitting. Uncover keyword gaps and formatting scores.
        </p>

        {/* Inputs Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6">
          {/* Job Description */}
          <div className="flex flex-col">
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold flex items-center gap-1.5 text-zinc-800 dark:text-zinc-200">
                <FileText className="h-3.5 w-3.5 text-emerald-500" /> Target Job Description
              </label>
              <span className="text-[10px] text-zinc-400 font-mono">{jd.length} chars</span>
            </div>
            <Textarea
              value={jd}
              onChange={(e) => {
                setJd(e.target.value);
                if (isSample) setIsSample(false);
              }}
              placeholder="Paste the target job description here (responsibilities, required skills, tools)..."
              className="min-h-[140px] sm:min-h-[170px] text-xs leading-relaxed resize-none rounded-xl border border-zinc-200 dark:border-white/[0.1] bg-slate-50/70 dark:bg-[#161922] focus-visible:ring-emerald-500 focus-visible:border-emerald-500 transition-colors"
            />
          </div>

          {/* Resume Upload Dropzone */}
          <div className="flex flex-col">
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold flex items-center gap-1.5 text-zinc-800 dark:text-zinc-200">
                <Upload className="h-3.5 w-3.5 text-emerald-500" /> Upload Your Resume
              </label>
              {file && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setFile(null);
                    setResumeText("");
                    setIsSample(false);
                  }}
                  className="text-[10px] text-red-500 hover:text-red-400 underline cursor-pointer"
                >
                  Remove
                </button>
              )}
            </div>

            <div
              onDragOver={(e) => {
                e.preventDefault();
                setDragOver(true);
              }}
              onDragLeave={() => setDragOver(false)}
              onDrop={onDrop}
              onClick={() => inputRef.current?.click()}
              className={`min-h-[140px] sm:min-h-[170px] rounded-xl border-2 border-dashed flex flex-col items-center justify-center text-center p-4 cursor-pointer transition-all ${
                dragOver
                  ? "border-emerald-500 bg-emerald-500/10 shadow-[0_0_20px_rgba(16,185,129,0.2)]"
                  : file
                  ? "border-emerald-500/40 bg-emerald-500/5 hover:border-emerald-500/60"
                  : "border-zinc-300 dark:border-white/[0.12] bg-slate-50/70 dark:bg-[#161922] hover:border-emerald-500/60 hover:bg-emerald-500/[0.03]"
              }`}
            >
              <input
                ref={inputRef}
                type="file"
                accept=".pdf,.docx,.txt"
                hidden
                onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
              />
              {file ? (
                <div className="flex flex-col items-center gap-1.5 px-2">
                  <div className="h-10 w-10 rounded-full bg-emerald-500/20 text-emerald-500 flex items-center justify-center">
                    <CheckCircle2 className="h-5 w-5" />
                  </div>
                  <div className="font-semibold text-xs text-zinc-900 dark:text-zinc-100 max-w-[200px] truncate">
                    {file.name}
                  </div>
                  <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">
                    {isSample ? "✨ Sample data ready" : "Ready to scan · Click to change"}
                  </span>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-1.5">
                  <div className="h-10 w-10 rounded-full bg-zinc-200/60 dark:bg-white/[0.06] text-zinc-500 dark:text-zinc-400 flex items-center justify-center mb-1 group-hover:scale-105 transition-transform">
                    <Upload className="h-5 w-5 text-emerald-500" />
                  </div>
                  <div className="font-semibold text-xs text-zinc-800 dark:text-zinc-200">
                    Drop resume or click to browse
                  </div>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="text-[10px] bg-zinc-200/70 dark:bg-white/[0.08] text-zinc-600 dark:text-zinc-400 px-1.5 py-0.5 rounded font-mono">PDF</span>
                    <span className="text-[10px] bg-zinc-200/70 dark:bg-white/[0.08] text-zinc-600 dark:text-zinc-400 px-1.5 py-0.5 rounded font-mono">DOCX</span>
                    <span className="text-[10px] bg-zinc-200/70 dark:bg-white/[0.08] text-zinc-600 dark:text-zinc-400 px-1.5 py-0.5 rounded font-mono">TXT</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Action Footer */}
      <div className="mt-6 pt-5 border-t border-zinc-200/80 dark:border-white/[0.06] flex flex-col sm:flex-row items-center justify-between gap-3">
        <Button
          size="lg"
          onClick={analyze}
          disabled={loading}
          className="w-full sm:w-auto bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-bold h-11 px-7 text-sm rounded-xl cursor-pointer shadow-md transition-all hover:shadow-[0_0_20px_rgba(16,185,129,0.35)]"
        >
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Analyzing Match...
            </>
          ) : (
            <>
              Get ATS Score <ArrowRight className="ml-1.5 h-4 w-4" />
            </>
          )}
        </Button>

        <div className="flex items-center gap-1.5 text-xs text-zinc-500 dark:text-zinc-400">
          <ShieldCheck className="h-4 w-4 text-emerald-500" />
          <span>No sign-up required · Privacy protected</span>
        </div>
      </div>

      {/* Preview modal */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg border border-zinc-200 dark:border-white/[0.1] bg-white dark:bg-[#11141b] text-zinc-900 dark:text-white">
          <DialogHeader>
            <DialogTitle className="font-display text-2xl font-bold flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-emerald-500" /> Instant ATS Match Score
            </DialogTitle>
            <DialogDescription className="text-zinc-600 dark:text-zinc-400">
              Here is how your resume measures up against the target job requirements.
            </DialogDescription>
          </DialogHeader>

          {result && (
            <div className="space-y-5 mt-2">
              {/* Score card */}
              <div className="rounded-2xl bg-gradient-to-br from-emerald-500/20 via-teal-500/10 to-emerald-950/40 border border-emerald-500/30 p-6 text-center shadow-[0_0_30px_rgba(16,185,129,0.15)]">
                <div className="text-xs uppercase tracking-widest text-emerald-600 dark:text-emerald-400 font-bold">
                  Overall ATS Match
                </div>
                <div className="font-display text-6xl font-extrabold mt-1 text-zinc-900 dark:text-white tracking-tight">
                  {result.score}<span className="text-2xl text-zinc-500 dark:text-zinc-400 font-normal">/100</span>
                </div>
                <div className="text-sm mt-2 font-medium text-zinc-700 dark:text-zinc-300">
                  {result.score >= 80
                    ? "🎉 Outstanding match! High chance of passing recruiter screen."
                    : result.score >= 60
                    ? "⚠️ Moderate match. Some critical keywords need integration."
                    : "❌ Low ATS match. High risk of automated rejection."}
                </div>
              </div>

              {/* Keyword insights */}
              <div>
                <div className="text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-2">
                  Top Missing ATS Keywords
                </div>
                <div className="flex flex-wrap gap-2">
                  {result.missing_keywords && result.missing_keywords.length > 0 ? (
                    result.missing_keywords.slice(0, 3).map((k) => (
                      <span
                        key={k}
                        className="text-xs font-semibold bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20 rounded-lg px-3 py-1"
                      >
                        - {k}
                      </span>
                    ))
                  ) : (
                    <span className="text-xs text-emerald-600 dark:text-emerald-400">No major missing keywords found!</span>
                  )}
                  {result.missing_keywords && result.missing_keywords.length > 3 && (
                    <span className="text-xs font-medium bg-zinc-100 dark:bg-white/[0.05] text-zinc-400 border border-zinc-200 dark:border-white/[0.08] rounded-lg px-3 py-1 flex items-center gap-1.5 blur-[1.5px] select-none">
                      <Lock className="h-3 w-3" /> +{result.missing_keywords.length - 3} more locked
                    </span>
                  )}
                </div>
              </div>

              {/* Conversion Callout */}
              <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-4 text-center">
                <div className="font-display font-bold text-base text-zinc-900 dark:text-white">
                  Unlock Full Report & 1-Click AI Tailoring
                </div>
                <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-1 leading-relaxed">
                  Get full missing keyword list, line-by-line bullet rewrites, tailored cover letter, and instant PDF download.
                </p>
                <Button
                  asChild
                  size="lg"
                  className="mt-3.5 w-full bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-bold rounded-xl shadow-md cursor-pointer"
                >
                  <Link to="/auth">
                    Create Free Account & Fix Resume <ArrowRight className="ml-1.5 h-4 w-4" />
                  </Link>
                </Button>
                <div className="mt-2 text-[11px] text-zinc-500 dark:text-zinc-400">
                  ⚡ Free forever plan available · No credit card required
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <AnalyzeProgress open={loading} title="Analyzing your resume against target JD" />
    </div>
  );
}
