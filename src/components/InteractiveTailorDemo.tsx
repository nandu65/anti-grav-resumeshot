import { useState, useEffect } from "react";
import { Sparkles, CheckCircle2, ArrowRight, Zap, Target, TrendingUp, ShieldCheck, Flame } from "lucide-react";
import { Button } from "@/components/ui/button";

interface DemoRole {
  id: string;
  role: string;
  company: string;
  salary: string;
  color: string;
  initialScore: number;
  tailoredScore: number;
  beforeBullet: string;
  afterBullet: string;
  addedKeywords: string[];
  metrics: string;
}

const DEMO_ROLES: DemoRole[] = [
  {
    id: "sde",
    role: "Senior Frontend Engineer",
    company: "Razorpay",
    salary: "₹32 — 40 LPA",
    color: "#3B82F6",
    initialScore: 48,
    tailoredScore: 97,
    beforeBullet: "Worked on website frontend using React and fixed some performance bugs on checkout pages.",
    afterBullet: "Architected modern micro-frontend checkout workflow in Next.js & TypeScript, cutting p99 load latency by 42% and increasing transaction completion by +28.4%.",
    addedKeywords: ["Next.js", "Micro-frontends", "p99 Latency", "TypeScript", "State Management"],
    metrics: "+49 pts ATS Match",
  },
  {
    id: "pm",
    role: "Lead Product Manager",
    company: "Swiggy",
    salary: "₹35 — 45 LPA",
    color: "#FC8019",
    initialScore: 41,
    tailoredScore: 95,
    beforeBullet: "Managed product roadmap for food delivery app and coordinated with engineering teams for sprints.",
    afterBullet: "Spearheaded Instamart 10-minute delivery routing revamp; drove A/B experimentation across 4.2M MAUs, expanding cart conversion by +19.2% and retention by +14%.",
    addedKeywords: ["GTM Strategy", "A/B Testing", "Cohort Retention", "SQL", "Unit Economics"],
    metrics: "+54 pts ATS Match",
  },
  {
    id: "data",
    role: "Staff AI & Data Architect",
    company: "Flipkart",
    salary: "₹45 — 60 LPA",
    color: "#10B981",
    initialScore: 52,
    tailoredScore: 98,
    beforeBullet: "Built machine learning models for customer recommendations and ran python scripts.",
    afterBullet: "Engineered distributed vector search & LLM RAG recommendation pipeline in PyTorch & Kafka, serving 120k QPS and driving ₹18 Cr incremental annualized GMV.",
    addedKeywords: ["RAG Pipeline", "Vector DB", "Distributed Systems", "Kafka", "PyTorch"],
    metrics: "+46 pts ATS Match",
  },
];

export function InteractiveTailorDemo() {
  const [selectedRole, setSelectedRole] = useState<DemoRole>(DEMO_ROLES[0]);
  const [isTailoring, setIsTailoring] = useState(false);
  const [displayScore, setDisplayScore] = useState(DEMO_ROLES[0].tailoredScore);
  const [activeTab, setActiveTab] = useState<"after" | "diff" | "before">("after");

  const handleRoleSelect = (role: DemoRole) => {
    if (role.id === selectedRole.id) return;
    setIsTailoring(true);
    setSelectedRole(role);
    setDisplayScore(role.initialScore);

    // Animate score roll
    const start = role.initialScore;
    const end = role.tailoredScore;
    const duration = 650;
    const startTime = performance.now();

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const ease = 1 - Math.pow(1 - progress, 3);
      const current = Math.round(start + (end - start) * ease);
      setDisplayScore(current);

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        setIsTailoring(false);
      }
    };
    requestAnimationFrame(animate);
  };

  return (
    <div className="relative w-full rounded-3xl border border-zinc-200/80 dark:border-white/[0.12] bg-white/95 dark:bg-[#0d1017]/95 p-6 sm:p-8 shadow-xl dark:shadow-2xl backdrop-blur-2xl overflow-hidden transition-colors duration-300">
      {/* Background aurora ambient lights */}
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-emerald-500/10 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-0 left-1/4 w-80 h-80 bg-teal-500/10 rounded-full blur-[90px] pointer-events-none" />

      {/* Top Header & Role Selector */}
      <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 pb-6 border-b border-zinc-200/80 dark:border-white/[0.08]">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400 mb-2">
            <Flame className="h-3.5 w-3.5" /> Interactive AI Simulator
          </div>
          <h3 className="font-display text-xl sm:text-2xl font-extrabold text-zinc-900 dark:text-white">
            See Real-Time Resume Morphing in Action
          </h3>
          <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 mt-1">
            Select a target company to watch passive lines transform into high-impact ATS bullet points.
          </p>
        </div>

        {/* Target Role Pills */}
        <div className="flex flex-wrap items-center gap-2 p-1.5 rounded-2xl bg-zinc-100 dark:bg-[#161922] border border-zinc-200/80 dark:border-white/[0.06]">
          {DEMO_ROLES.map((r) => {
            const isSelected = r.id === selectedRole.id;
            return (
              <button
                key={r.id}
                type="button"
                onClick={() => handleRoleSelect(r)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  isSelected
                    ? "bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 shadow-md shadow-emerald-500/20 scale-[1.02]"
                    : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-200/60 dark:hover:bg-white/5"
                }`}
              >
                <span
                  className="h-2 w-2 rounded-full shrink-0"
                  style={{ backgroundColor: isSelected ? "#022c22" : r.color }}
                />
                <span>{r.company}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Interactive Stage Grid */}
      <div className="relative z-10 grid lg:grid-cols-12 gap-6 mt-6 items-stretch">
        {/* Left Column: Live ATS Match Gauge & Keywords (4 cols) */}
        <div className="lg:col-span-4 rounded-2xl border border-zinc-200/80 dark:border-white/[0.08] bg-slate-50/80 dark:bg-[#11141b] p-5 flex flex-col justify-between shadow-md dark:shadow-lg">
          <div>
            <div className="flex items-center justify-between text-xs text-zinc-600 dark:text-zinc-400 mb-4">
              <span className="font-semibold uppercase tracking-wider text-[11px]">ATS Match Gauge</span>
              <span className="text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1 font-mono">
                <Zap className="h-3 w-3" /> {selectedRole.metrics}
              </span>
            </div>

            {/* Circular Gauge */}
            <div className="flex items-center gap-4 p-4 rounded-xl bg-white dark:bg-[#161922] border border-zinc-200/80 dark:border-white/[0.06] mb-5 shadow-sm">
              <div className="relative h-20 w-20 shrink-0">
                <svg viewBox="0 0 100 100" className="h-20 w-20 -rotate-90">
                  <circle cx="50" cy="50" r="42" fill="none" stroke="currentColor" className="text-zinc-200 dark:text-zinc-800" strokeWidth="8" />
                  <circle
                    cx="50"
                    cy="50"
                    r="42"
                    fill="none"
                    stroke="#10b981"
                    strokeWidth="8"
                    strokeLinecap="round"
                    strokeDasharray={`${(displayScore / 100) * 2 * Math.PI * 42} ${2 * Math.PI * 42}`}
                    className="transition-all duration-300"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-2xl font-black text-zinc-900 dark:text-white font-mono">{displayScore}</span>
                  <span className="text-[9px] text-zinc-500 dark:text-zinc-400 font-mono -mt-1">/ 100</span>
                </div>
              </div>

              <div>
                <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 block">
                  {displayScore >= 90 ? "🔥 Top 1% Tier" : "Moderate Match"}
                </span>
                <span className="text-[11px] text-zinc-600 dark:text-zinc-400 block mt-0.5">Target: {selectedRole.role}</span>
                <span className="text-[10px] text-zinc-500 block mt-1 font-mono">{selectedRole.salary}</span>
              </div>
            </div>

            {/* Matched Keywords Radar */}
            <div>
              <div className="text-[11px] font-bold uppercase tracking-wider text-zinc-600 dark:text-zinc-400 mb-2 flex items-center justify-between">
                <span>AI Injected Keywords</span>
                <span className="text-emerald-600 dark:text-emerald-400 font-mono text-[10px]">+{selectedRole.addedKeywords.length} Detected</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {selectedRole.addedKeywords.map((kw, i) => (
                  <span
                    key={kw}
                    className="inline-flex items-center gap-1 text-[11px] px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/25 font-mono animate-in fade-in zoom-in-95 duration-300"
                    style={{ animationDelay: `${i * 100}ms` }}
                  >
                    <CheckCircle2 className="h-3 w-3 text-emerald-500 dark:text-emerald-400" />
                    {kw}
                  </span>
                ))}
              </div>
            </div>
          </div>

          <div className="pt-4 mt-4 border-t border-zinc-200/80 dark:border-white/[0.06] flex items-center gap-2 text-xs text-zinc-600 dark:text-zinc-400">
            <ShieldCheck className="h-4 w-4 text-emerald-500 dark:text-emerald-400 shrink-0" />
            <span>Passes Taleo, Greenhouse & Workday parser standards</span>
          </div>
        </div>

        {/* Right Column: Bullet Point Transformation & Interactive Diff View (8 cols) */}
        <div className="lg:col-span-8 rounded-2xl border border-zinc-200/80 dark:border-white/[0.08] bg-slate-50/80 dark:bg-[#11141b] p-5 sm:p-6 flex flex-col justify-between shadow-md dark:shadow-lg">
          <div>
            {/* View Switcher Tabs */}
            <div className="flex items-center justify-between pb-4 border-b border-zinc-200/80 dark:border-white/[0.06] mb-4">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-emerald-500 dark:text-emerald-400" />
                <span className="font-bold text-sm text-zinc-900 dark:text-zinc-100">Experience Bullet Transformation</span>
              </div>
              <div className="flex items-center gap-1 bg-zinc-200/70 dark:bg-[#161922] p-1 rounded-xl border border-zinc-200/80 dark:border-white/[0.06]">
                <button
                  type="button"
                  onClick={() => setActiveTab("after")}
                  className={`px-3 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                    activeTab === "after" ? "bg-emerald-500 text-slate-950 shadow-sm" : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white"
                  }`}
                >
                  Tailored (AI)
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("diff")}
                  className={`px-3 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                    activeTab === "diff" ? "bg-emerald-500 text-slate-950 shadow-sm" : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white"
                  }`}
                >
                  Before vs After
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("before")}
                  className={`px-3 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                    activeTab === "before" ? "bg-emerald-500 text-slate-950 shadow-sm" : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white"
                  }`}
                >
                  Original
                </button>
              </div>
            </div>

            {/* Bullet Display Box */}
            <div className="min-h-[160px] flex flex-col justify-center">
              {activeTab === "after" && (
                <div className="p-4 rounded-xl bg-white dark:bg-[#161922] border border-emerald-500/30 text-zinc-900 dark:text-zinc-100 text-sm sm:text-base leading-relaxed animate-in fade-in duration-300 shadow-sm">
                  <div className="flex items-start gap-2.5">
                    <span className="h-5 w-5 rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 mt-0.5 font-bold text-xs">
                      ✓
                    </span>
                    <div>
                      <p className="font-medium text-zinc-900 dark:text-zinc-100">{selectedRole.afterBullet}</p>
                      <div className="mt-3 flex flex-wrap items-center gap-2 text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold">
                        <span className="px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20">Metric-Driven</span>
                        <span className="px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20">Action Verbs Polished</span>
                        <span className="px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20">XYZ Resume Formula</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === "before" && (
                <div className="p-4 rounded-xl bg-white dark:bg-[#161922] border border-red-500/20 text-zinc-500 dark:text-zinc-400 text-sm sm:text-base leading-relaxed animate-in fade-in duration-300 shadow-sm">
                  <div className="flex items-start gap-2.5">
                    <span className="h-5 w-5 rounded-full bg-red-500/20 text-red-500 dark:text-red-400 flex items-center justify-center shrink-0 mt-0.5 font-bold text-xs">
                      ✕
                    </span>
                    <div>
                      <p className="line-through opacity-75">{selectedRole.beforeBullet}</p>
                      <div className="mt-3 text-[11px] text-red-500 dark:text-red-400 font-semibold">
                        Weak phrasing • Zero quantifiable metrics • Fails keyword filters
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === "diff" && (
                <div className="space-y-3 animate-in fade-in duration-300">
                  <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/20 border border-red-500/20 text-xs text-red-700 dark:text-red-300 flex items-start gap-2">
                    <span className="font-bold shrink-0 text-red-500 dark:text-red-400">- BEFORE:</span>
                    <span className="line-through">{selectedRole.beforeBullet}</span>
                  </div>
                  <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-500/30 text-xs text-emerald-800 dark:text-emerald-200 flex items-start gap-2">
                    <span className="font-bold shrink-0 text-emerald-600 dark:text-emerald-400">+ AFTER:</span>
                    <span>{selectedRole.afterBullet}</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Bottom Callout & Quick Launch */}
          <div className="pt-4 mt-4 border-t border-zinc-200/80 dark:border-white/[0.06] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="text-xs text-zinc-600 dark:text-zinc-400">
              Transform your own resume bullets in <strong className="text-zinc-900 dark:text-white">under 30 seconds</strong>.
            </div>
            <Button asChild size="sm" className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-bold rounded-xl h-9 px-5 cursor-pointer">
              <a href="/tools/resume-builder">
                Try AI Tailor on My Resume <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
              </a>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
