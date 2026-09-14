import { useEffect, useState } from "react";
import { Sparkles, CheckCircle2, ShieldCheck, Target, Zap, Cpu, Loader2 } from "lucide-react";

interface Step {
  id: number;
  label: string;
  detail: string;
  badge: string;
}

const SCAN_STEPS: Step[] = [
  {
    id: 1,
    label: "Deconstructing Document Hierarchy",
    detail: "Analyzing single-column structure, font legibility & section headers for ATS parsers.",
    badge: "Structure Verified",
  },
  {
    id: 2,
    label: "Cross-Referencing Job Description",
    detail: "Extracting core competencies, hard frameworks, soft skills & domain terminologies.",
    badge: "24 Keywords Found",
  },
  {
    id: 3,
    label: "Detecting Missing Keyword Gaps",
    detail: "Isolating high-weighting recruiter terms absent from your existing resume.",
    badge: "12 Gaps Identified",
  },
  {
    id: 4,
    label: "Synthesizing Metric-Driven Bullets",
    detail: "Injecting quantifiable impact metrics, active power verbs & XYZ formula phrasing.",
    badge: "98% Match Target",
  },
];

interface LiveDiagnosticScannerProps {
  onComplete?: () => void;
  targetRole?: string;
  targetCompany?: string;
}

export function LiveDiagnosticScanner({
  onComplete,
  targetRole = "Target Role",
  targetCompany = "Target Company",
}: LiveDiagnosticScannerProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [progress, setProgress] = useState(15);

  useEffect(() => {
    const timer1 = setTimeout(() => { setCurrentStep(2); setProgress(42); }, 1200);
    const timer2 = setTimeout(() => { setCurrentStep(3); setProgress(72); }, 2600);
    const timer3 = setTimeout(() => { setCurrentStep(4); setProgress(94); }, 4000);
    const timer4 = setTimeout(() => {
      setProgress(100);
      if (onComplete) onComplete();
    }, 5400);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
      clearTimeout(timer4);
    };
  }, [onComplete]);

  return (
    <div className="relative w-full max-w-2xl mx-auto rounded-3xl border border-zinc-200/80 dark:border-white/[0.12] bg-white/95 dark:bg-[#0c0e14]/95 p-6 sm:p-8 shadow-2xl backdrop-blur-2xl overflow-hidden transition-colors duration-300">
      {/* Background Radar Scanner Waves */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full bg-emerald-500/5 blur-[80px] pointer-events-none" />

      {/* Header Banner */}
      <div className="flex items-center justify-between pb-5 border-b border-zinc-200/80 dark:border-white/[0.08]">
        <div className="flex items-center gap-3">
          <div className="relative flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
            <Cpu className="h-5 w-5 animate-pulse" />
            <span className="absolute -top-1 -right-1 flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
            </span>
          </div>
          <div>
            <h3 className="font-display font-extrabold text-base sm:text-lg text-zinc-900 dark:text-white flex items-center gap-2">
              Deep ATS Intelligence Scan
            </h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Optimizing for <strong className="text-emerald-600 dark:text-emerald-400">{targetRole}</strong> at <strong className="text-zinc-900 dark:text-white">{targetCompany}</strong>
            </p>
          </div>
        </div>

        <div className="flex flex-col items-end">
          <span className="font-mono text-xs font-bold text-emerald-600 dark:text-emerald-400">
            {progress}%
          </span>
          <span className="text-[10px] text-zinc-400 font-mono">Neural Engine v3.2</span>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-zinc-100 dark:bg-white/[0.06] h-1.5 rounded-full my-6 overflow-hidden">
        <div
          className="bg-gradient-to-r from-emerald-500 to-teal-400 h-full rounded-full transition-all duration-500 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Diagnostic Steps */}
      <div className="space-y-3.5">
        {SCAN_STEPS.map((step) => {
          const isDone = currentStep > step.id || progress === 100;
          const isCurrent = currentStep === step.id && progress < 100;

          return (
            <div
              key={step.id}
              className={`flex items-start justify-between gap-3 p-3.5 rounded-2xl border transition-all duration-300 ${
                isCurrent
                  ? "border-emerald-500/50 bg-emerald-500/5 shadow-md shadow-emerald-500/5"
                  : isDone
                  ? "border-zinc-200/60 dark:border-white/[0.06] bg-slate-50/70 dark:bg-[#11141b]/70 opacity-90"
                  : "border-transparent bg-transparent opacity-40"
              }`}
            >
              <div className="flex items-start gap-3">
                <div className="mt-0.5 shrink-0">
                  {isDone ? (
                    <CheckCircle2 className="h-5 w-5 text-emerald-500 dark:text-emerald-400 animate-in zoom-in-75 duration-300" />
                  ) : isCurrent ? (
                    <Loader2 className="h-5 w-5 text-emerald-500 animate-spin" />
                  ) : (
                    <div className="h-5 w-5 rounded-full border border-zinc-300 dark:border-zinc-700 flex items-center justify-center text-[10px] font-mono text-zinc-400">
                      {step.id}
                    </div>
                  )}
                </div>
                <div>
                  <h4 className="font-semibold text-xs sm:text-sm text-zinc-900 dark:text-zinc-100">
                    {step.label}
                  </h4>
                  <p className="text-[11px] sm:text-xs text-zinc-500 dark:text-zinc-400 mt-0.5 leading-relaxed">
                    {step.detail}
                  </p>
                </div>
              </div>

              {isDone && (
                <span className="shrink-0 text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 animate-fade-in">
                  ✓ {step.badge}
                </span>
              )}
            </div>
          );
        })}
      </div>

      {/* Footer Security Badges */}
      <div className="mt-6 pt-4 border-t border-zinc-200/80 dark:border-white/[0.06] flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-400">
        <span className="inline-flex items-center gap-1.5">
          <ShieldCheck className="h-3.5 w-3.5 text-emerald-500 dark:text-emerald-400" /> AES-256 Encrypted & Private
        </span>
        <span className="inline-flex items-center gap-1.5">
          <Zap className="h-3.5 w-3.5 text-amber-500" /> 100% ATS Compliant Format
        </span>
      </div>
    </div>
  );
}
