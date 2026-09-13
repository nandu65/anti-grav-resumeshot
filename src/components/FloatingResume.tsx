import { useState, useRef, MouseEvent } from "react";
import { Sparkles, CheckCircle2, FileText, ArrowRight, ShieldCheck, Zap } from "lucide-react";

/**
 * Pro Interactive 3D Hero Resume Showcase
 * Dual-sided (Live Resume Preview & ATS Score Dashboard) with cursor tilt physics and interactive toggle
 */
export const FloatingResume = () => {
  const [isFlipped, setIsFlipped] = useState(false);
  const [rotate, setRotate] = useState({ x: 0, y: 0 });
  const cardRef = useRef<HTMLDivElement>(null);

  const handleMouseMove = (e: MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    // Gentle tilt
    const rotateX = ((y - centerY) / centerY) * -8;
    const rotateY = ((x - centerX) / centerX) * 8;
    setRotate({ x: rotateX, y: rotateY });
  };

  const handleMouseLeave = () => {
    setRotate({ x: 0, y: 0 });
  };

  return (
    <div className="relative w-full max-w-[480px] mx-auto flex flex-col items-center select-none" style={{ perspective: "1200px" }}>
      {/* Ambient background glow */}
      <div className="absolute -inset-4 bg-gradient-to-tr from-emerald-500/20 via-teal-500/10 to-transparent rounded-3xl blur-2xl pointer-events-none" />

      {/* Floating dynamic tags around the card */}
      <div className="hidden sm:flex absolute -top-4 -left-6 z-20 items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#11141b]/95 border border-emerald-500/30 text-emerald-400 text-xs font-semibold shadow-lg shadow-black/50 animate-bounce" style={{ animationDuration: "3s" }}>
        <Sparkles className="h-3.5 w-3.5" />
        <span>ATS Score: 96 / 100</span>
      </div>

      <div className="hidden sm:flex absolute -bottom-3 -right-4 z-20 items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#11141b]/95 border border-white/[0.08] text-zinc-200 text-xs font-semibold shadow-lg shadow-black/50">
        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
        <span>100% Recruiter Approved</span>
      </div>

      {/* Interactive Card Stage */}
      <div
        ref={cardRef}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        onClick={() => setIsFlipped(!isFlipped)}
        className="relative w-full aspect-[4/5] max-h-[520px] rounded-2xl cursor-pointer transition-transform duration-200 ease-out"
        style={{
          transformStyle: "preserve-3d",
          transform: `rotateX(${rotate.x}deg) rotateY(${rotate.y + (isFlipped ? 180 : 0)}deg)`,
          transition: isFlipped ? "transform 0.7s cubic-bezier(0.4, 0, 0.2, 1)" : "transform 0.2s ease-out",
        }}
      >
        {/* ============ FRONT: TAILORED RESUME PREVIEW ============ */}
        <div
          className="absolute inset-0 rounded-2xl bg-[#11141b]/95 border border-white/[0.12] shadow-2xl p-5 flex flex-col justify-between overflow-hidden backdrop-blur-xl"
          style={{
            backfaceVisibility: "hidden",
            transform: "rotateY(0deg)",
          }}
        >
          {/* Subtle paper background glow */}
          <div className="absolute top-0 right-0 w-48 h-48 bg-emerald-500/5 rounded-full blur-2xl pointer-events-none" />

          {/* Top Header */}
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center text-slate-950 font-bold text-sm shadow-md shadow-emerald-500/20">
                  AS
                </div>
                <div>
                  <h4 className="font-bold text-sm text-zinc-100 leading-tight">Arjun Sharma</h4>
                  <p className="text-[11px] text-zinc-400">Senior Product Designer · Bangalore</p>
                </div>
              </div>
              <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[10px] font-bold">
                <Zap className="h-3 w-3" />
                <span>AI TAILORED</span>
              </div>
            </div>

            {/* Experience Section */}
            <div className="mt-4 space-y-3">
              <div>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="font-bold text-zinc-200">Lead Product Designer • Razorpay</span>
                  <span className="text-[10px] text-zinc-400 font-mono">2022 — Present</span>
                </div>
                <div className="space-y-1.5 text-[11px] text-zinc-300 leading-relaxed">
                  <div className="flex items-start gap-1.5">
                    <span className="text-emerald-400 font-bold">•</span>
                    <span>Spearheaded checkout flow redesign, increasing transaction completion by <strong className="text-emerald-400">28.4%</strong>.</span>
                  </div>
                  <div className="flex items-start gap-1.5">
                    <span className="text-emerald-400 font-bold">•</span>
                    <span>Standardized design system across 14 cross-functional squad repositories.</span>
                  </div>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="font-bold text-zinc-200">Product Designer • Swiggy</span>
                  <span className="text-[10px] text-zinc-400 font-mono">2019 — 2022</span>
                </div>
                <div className="space-y-1.5 text-[11px] text-zinc-300 leading-relaxed">
                  <div className="flex items-start gap-1.5">
                    <span className="text-emerald-400 font-bold">•</span>
                    <span>Architected Instamart live search UI, lowering cart abandonment rate by <strong className="text-emerald-400">19%</strong>.</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Matched Keywords */}
            <div className="mt-4 pt-3 border-t border-white/[0.08]">
              <div className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 mb-2">
                ATS Matched Keywords (14/14)
              </div>
              <div className="flex flex-wrap gap-1.5">
                {["Design Systems", "Figma", "User Testing", "Conversion Rate", "A/B Testing", "TypeScript"].map((k) => (
                  <span key={k} className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 font-mono">
                    ✓ {k}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Footer Action Strip */}
          <div className="pt-3 border-t border-white/[0.08] flex items-center justify-between text-xs text-zinc-400">
            <span className="flex items-center gap-1 text-[11px] text-zinc-400">
              <FileText className="h-3.5 w-3.5 text-emerald-400" /> Click to view ATS Score Report
            </span>
            <span className="text-emerald-400 font-semibold text-[11px] flex items-center gap-1 group">
              Flip Card <ArrowRight className="h-3 w-3" />
            </span>
          </div>

          {/* Glowing laser scan beam */}
          <div
            className="absolute left-0 right-0 top-0 h-[2px] pointer-events-none"
            style={{
              background: "linear-gradient(90deg, transparent, #10b981, transparent)",
              boxShadow: "0 0 15px #10b981",
              animation: "laserScan 3.5s ease-in-out infinite",
            }}
          />
        </div>

        {/* ============ BACK: ATS SCORE DASHBOARD ============ */}
        <div
          className="absolute inset-0 rounded-2xl bg-[#11141b]/95 border border-emerald-500/30 shadow-2xl p-5 flex flex-col justify-between overflow-hidden backdrop-blur-xl"
          style={{
            backfaceVisibility: "hidden",
            transform: "rotateY(180deg)",
          }}
        >
          {/* Top Title */}
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-emerald-400" />
                <span className="font-bold text-sm text-zinc-100">ATS Match Analysis</span>
              </div>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-bold uppercase">
                Ready to Apply
              </span>
            </div>

            {/* Score Ring Section */}
            <div className="flex items-center gap-4 my-4 p-3 rounded-xl bg-[#161922] border border-white/[0.06]">
              <div className="relative h-18 w-18 shrink-0">
                <svg viewBox="0 0 100 100" className="h-18 w-18 -rotate-90">
                  <circle cx="50" cy="50" r="42" fill="none" stroke="#27272a" strokeWidth="8" />
                  <circle
                    cx="50"
                    cy="50"
                    r="42"
                    fill="none"
                    stroke="#10b981"
                    strokeWidth="8"
                    strokeLinecap="round"
                    strokeDasharray={`${0.96 * 2 * Math.PI * 42} ${2 * Math.PI * 42}`}
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-xl font-extrabold text-white">96</span>
                  <span className="text-[8px] text-zinc-400 font-mono -mt-1">/ 100</span>
                </div>
              </div>
              <div>
                <h5 className="font-bold text-sm text-emerald-400">Top 1% Resume Score</h5>
                <p className="text-[11px] text-zinc-400 mt-0.5 leading-snug">
                  Matches 100% of required technical competencies for Senior Product Designer.
                </p>
              </div>
            </div>

            {/* Metrics Breakdown */}
            <div className="space-y-2.5">
              {[
                { label: "Keyword Alignment", pct: 98, color: "bg-emerald-400" },
                { label: "Impact & Quantifiable Metrics", pct: 94, color: "bg-emerald-400" },
                { label: "ATS Parser Layout Integrity", pct: 100, color: "bg-teal-400" },
                { label: "6-Second Recruiter Readability", pct: 92, color: "bg-emerald-400" },
              ].map((m) => (
                <div key={m.label} className="space-y-1">
                  <div className="flex justify-between text-[11px]">
                    <span className="text-zinc-300 font-medium">{m.label}</span>
                    <span className="text-zinc-100 font-bold font-mono">{m.pct}%</span>
                  </div>
                  <div className="h-1.5 w-full rounded-full bg-zinc-800 overflow-hidden">
                    <div className={`h-full rounded-full ${m.color}`} style={{ width: `${m.pct}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Back Footer */}
          <div className="pt-3 border-t border-white/[0.08] flex items-center justify-between text-xs text-zinc-400">
            <span className="text-[11px] text-zinc-400">Click anywhere to flip back</span>
            <span className="text-emerald-400 font-semibold text-[11px] flex items-center gap-1">
              View Resume <ArrowRight className="h-3 w-3" />
            </span>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes laserScan {
          0% {
            top: 0%;
            opacity: 0.2;
          }
          50% {
            top: 96%;
            opacity: 1;
          }
          100% {
            top: 0%;
            opacity: 0.2;
          }
        }
      `}</style>
    </div>
  );
};
