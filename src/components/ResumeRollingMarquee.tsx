import { memo } from "react";
import { Sparkles, CheckCircle2, TrendingUp, Building2, Star } from "lucide-react";

interface ResumeTickerItem {
  id: string;
  name: string;
  role: string;
  company: string;
  companyColor: string;
  score: number;
  highlight: string;
  keywords: string[];
  time: string;
}

const TICKER_ITEMS: ResumeTickerItem[] = [
  {
    id: "1",
    name: "Arjun S.",
    role: "Senior Frontend Engineer",
    company: "Razorpay",
    companyColor: "#0C2451",
    score: 96,
    highlight: "3 Interview Calls in 48h",
    keywords: ["React", "TypeScript", "Micro-frontends", "Next.js"],
    time: "2m ago",
  },
  {
    id: "2",
    name: "Priya K.",
    role: "Lead Product Manager",
    company: "Swiggy",
    companyColor: "#FC8019",
    score: 94,
    highlight: "ATS Score: 41 → 94",
    keywords: ["Roadmapping", "A/B Testing", "GTM Strategy", "SQL"],
    time: "4m ago",
  },
  {
    id: "3",
    name: "Dev N.",
    role: "Staff Backend Architect",
    company: "Flipkart",
    companyColor: "#2874F0",
    score: 98,
    highlight: "Offer Received: ₹36 LPA",
    keywords: ["Distributed Systems", "Kafka", "Golang", "Kubernetes"],
    time: "6m ago",
  },
  {
    id: "4",
    name: "Sneha R.",
    role: "Product & UI/UX Designer",
    company: "Zomato",
    companyColor: "#E23744",
    score: 95,
    highlight: "6s Recruiter Pass Rate: 100%",
    keywords: ["Design Systems", "Figma", "User Research", "Prototyping"],
    time: "9m ago",
  },
  {
    id: "5",
    name: "Vikram M.",
    role: "Growth Marketing Lead",
    company: "CRED",
    companyColor: "#10b981",
    score: 93,
    highlight: "Shortlisted for Round 2",
    keywords: ["CAC Optimization", "Performance Ads", "Retention", "Mixpanel"],
    time: "11m ago",
  },
  {
    id: "6",
    name: "Ananya S.",
    role: "Data Scientist / AI Engineer",
    company: "Google",
    companyColor: "#4285F4",
    score: 97,
    highlight: "+12 Critical Keywords Match",
    keywords: ["LLMs", "PyTorch", "RAG Pipeline", "FastAPI"],
    time: "14m ago",
  },
];

export const ResumeRollingMarquee = memo(function ResumeRollingMarquee() {
  // Duplicate array for seamless infinite marquee loop
  const duplicatedItems = [...TICKER_ITEMS, ...TICKER_ITEMS, ...TICKER_ITEMS];

  return (
    <div className="relative w-full overflow-hidden py-8 border-y border-white/[0.08] bg-[#090b0e]/95 backdrop-blur-md">
      {/* Background ambient glow line */}
      <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/[0.03] via-emerald-500/[0.08] to-emerald-500/[0.03] pointer-events-none" />

      {/* Header bar / Title micro-label */}
      <div className="container mx-auto px-4 mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="flex h-2 w-2 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <span className="text-[11px] font-bold uppercase tracking-[0.18em] text-zinc-400">
            Live Tailored Resumes • Real-time ATS Matches
          </span>
        </div>
        <div className="hidden sm:flex items-center gap-2 text-xs text-zinc-400">
          <Sparkles className="h-3.5 w-3.5 text-emerald-400" />
          <span>Average Score Improvement: <strong className="text-emerald-400 font-semibold">+47 pts</strong></span>
        </div>
      </div>

      {/* Fade masks on both ends for smooth visual blending */}
      <div className="pointer-events-none absolute inset-y-0 left-0 w-24 sm:w-40 bg-gradient-to-r from-[#090b0e] via-[#090b0e]/80 to-transparent z-20" />
      <div className="pointer-events-none absolute inset-y-0 right-0 w-24 sm:w-40 bg-gradient-to-l from-[#090b0e] via-[#090b0e]/80 to-transparent z-20" />

      {/* Marquee Track container */}
      <div className="marquee-track flex gap-4 w-max hover:[animation-play-state:paused] cursor-pointer">
        {duplicatedItems.map((item, idx) => (
          <div
            key={`${item.id}-${idx}`}
            className="group relative flex flex-col justify-between w-[290px] sm:w-[330px] rounded-2xl bg-[#11141b]/90 border border-white/[0.08] hover:border-emerald-500/40 p-4 transition-all duration-300 hover:shadow-xl hover:shadow-emerald-500/10 hover:-translate-y-1"
          >
            {/* Top row: Candidate + Target Company & Score */}
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-sm text-zinc-100 truncate">{item.name}</span>
                  <span className="text-[10px] text-zinc-400 font-mono">{item.time}</span>
                </div>
                <div className="text-xs text-zinc-400 truncate mt-0.5">{item.role}</div>
                <div className="inline-flex items-center gap-1.5 mt-1.5 text-[11px] font-semibold text-zinc-300">
                  <span
                    className="h-2 w-2 rounded-full inline-block"
                    style={{ backgroundColor: item.companyColor }}
                  />
                  <span>Target: <strong className="text-white">{item.company}</strong></span>
                </div>
              </div>

              {/* ATS Match Score Chip */}
              <div className="shrink-0 flex flex-col items-end">
                <div className="flex items-center gap-1 bg-emerald-500/10 border border-emerald-500/30 px-2.5 py-1 rounded-full text-emerald-400 font-bold text-xs shadow-sm">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                  <span>{item.score}%</span>
                </div>
                <span className="text-[9px] text-zinc-400 uppercase tracking-wider font-semibold mt-1">ATS Match</span>
              </div>
            </div>

            {/* Middle: Highlight banner */}
            <div className="mt-3 py-1.5 px-2.5 rounded-lg bg-[#161922] border border-white/[0.04] flex items-center justify-between text-xs">
              <span className="text-emerald-400 font-medium flex items-center gap-1 text-[11px]">
                <TrendingUp className="h-3 w-3" />
                {item.highlight}
              </span>
              <span className="text-[10px] text-zinc-400 flex items-center gap-0.5">
                <Star className="h-2.5 w-2.5 fill-amber-400 text-amber-400" /> 100% ATS Safe
              </span>
            </div>

            {/* Bottom row: Matched keywords tags */}
            <div className="mt-3 pt-2.5 border-t border-white/[0.06] flex flex-wrap gap-1">
              {item.keywords.slice(0, 3).map((kw, kIdx) => (
                <span
                  key={kIdx}
                  className="text-[10px] px-2 py-0.5 rounded-md bg-white/[0.04] text-zinc-300 border border-white/[0.06] font-mono"
                >
                  +{kw}
                </span>
              ))}
              {item.keywords.length > 3 && (
                <span className="text-[10px] px-1.5 py-0.5 rounded-md text-zinc-400 font-mono">
                  +{item.keywords.length - 3} more
                </span>
              )}
            </div>
          </div>
        ))}
      </div>

      <style>{`
        @keyframes marqueeScroll {
          0% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(-33.333333%);
          }
        }
        .marquee-track {
          animation: marqueeScroll 42s linear infinite;
        }
        @media (max-width: 640px) {
          .marquee-track {
            animation-duration: 30s;
          }
        }
      `}</style>
    </div>
  );
});
