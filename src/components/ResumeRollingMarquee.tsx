import { memo } from "react";
import { Sparkles, CheckCircle2, TrendingUp, Star, Award, Building2, Flame } from "lucide-react";

interface ResumeTickerItem {
  id: string;
  name: string;
  role: string;
  company: string;
  companyColor: string;
  score: number;
  highlight: string;
  keywords: string[];
  hike?: string;
  time: string;
}

const TRACK_1: ResumeTickerItem[] = [
  {
    id: "mounika-reddy",
    name: "Mounika Reddy",
    role: "Full Stack SDE & Cloud Engineer",
    company: "Microsoft",
    companyColor: "#00A4EF",
    score: 98,
    highlight: "ATS Score: 44 → 98 (Top 1%)",
    keywords: ["React.js", "Azure", "Microservices", "System Design"],
    hike: "Offered ₹42 LPA",
    time: "Just now",
  },
  {
    id: "harsha-naidu",
    name: "Harsha Naidu",
    role: "Senior AI & Full Stack SDE",
    company: "Razorpay",
    companyColor: "#3B82F6",
    score: 99,
    highlight: "3 Callbacks in 24 Hours",
    keywords: ["Next.js", "AI Pipelines", "System Design", "TypeScript"],
    hike: "Offered ₹45 LPA",
    time: "2m ago",
  },
  {
    id: "sai",
    name: "Sai",
    role: "Lead Platform Engineer",
    company: "Swiggy",
    companyColor: "#FC8019",
    score: 97,
    highlight: "ATS Score: 42 → 97",
    keywords: ["Distributed Systems", "Kafka", "Microservices", "Go"],
    hike: "Offered ₹40 LPA",
    time: "4m ago",
  },
  {
    id: "3",
    name: "Dev N.",
    role: "Staff Backend Architect",
    company: "Flipkart",
    companyColor: "#2874F0",
    score: 98,
    highlight: "Passed 6 ATS Screeners",
    keywords: ["Distributed Systems", "Kafka", "Golang"],
    hike: "Offered ₹48 LPA",
    time: "6m ago",
  },
  {
    id: "4",
    name: "Sneha R.",
    role: "Product & UI/UX Designer",
    company: "Zomato",
    companyColor: "#E23744",
    score: 96,
    highlight: "6s Recruiter Pass: 100%",
    keywords: ["Design Systems", "Figma", "User Research"],
    hike: "+38% Hike",
    time: "8m ago",
  },
];

const TRACK_2: ResumeTickerItem[] = [
  {
    id: "5",
    name: "Vikram M.",
    role: "Growth Marketing Lead",
    company: "CRED",
    companyColor: "#10B981",
    score: 94,
    highlight: "Shortlisted for Final Round",
    keywords: ["CAC Optimization", "Retention", "Mixpanel"],
    hike: "Offered ₹28 LPA",
    time: "10m ago",
  },
  {
    id: "6",
    name: "Ananya S.",
    role: "Data Scientist / AI Engineer",
    company: "Google",
    companyColor: "#4285F4",
    score: 99,
    highlight: "+14 Critical Skills Added",
    keywords: ["LLMs", "RAG Pipeline", "PyTorch"],
    hike: "Offered ₹54 LPA",
    time: "12m ago",
  },
  {
    id: "7",
    name: "Karan D.",
    role: "DevOps & Cloud Architect",
    company: "Amazon AWS",
    companyColor: "#FF9900",
    score: 96,
    highlight: "Immediate Interview Invite",
    keywords: ["Terraform", "Kubernetes", "CI/CD"],
    hike: "+50% Hike",
    time: "15m ago",
  },
  {
    id: "8",
    name: "Meera P.",
    role: "Engineering Manager",
    company: "Microsoft",
    companyColor: "#00A4EF",
    score: 97,
    highlight: "1-Page Executive Format",
    keywords: ["Team Scaling", "System Design", "Budgeting"],
    hike: "Offered ₹62 LPA",
    time: "18m ago",
  },
];

export const ResumeRollingMarquee = memo(function ResumeRollingMarquee() {
  // Duplicated arrays for seamless continuous looping
  const duplicatedTrack1 = [...TRACK_1, ...TRACK_1, ...TRACK_1, ...TRACK_1];
  const duplicatedTrack2 = [...TRACK_2, ...TRACK_2, ...TRACK_2, ...TRACK_2];

  return (
    <div className="relative w-full overflow-hidden py-10 border-y border-white/[0.08] bg-[#090b0e] select-none">
      {/* Background ambient beam */}
      <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/[0.02] via-emerald-500/[0.07] to-emerald-500/[0.02] pointer-events-none" />

      {/* Header bar */}
      <div className="container mx-auto px-4 mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <span className="flex h-2.5 w-2.5 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
          </span>
          <span className="text-xs font-bold uppercase tracking-[0.2em] text-zinc-300 flex items-center gap-2">
            Live Tailored Outcomes
            <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px]">
              REAL-TIME
            </span>
          </span>
        </div>
        <div className="flex items-center gap-4 text-xs text-zinc-400">
          <span className="flex items-center gap-1.5"><Sparkles className="h-3.5 w-3.5 text-emerald-400" /> Avg ATS Score: <strong className="text-emerald-400">96.4%</strong></span>
          <span className="hidden md:inline-flex items-center gap-1.5"><Award className="h-3.5 w-3.5 text-amber-400" /> 12,400+ Resumes Processed</span>
        </div>
      </div>

      {/* Fade masks on left & right */}
      <div className="pointer-events-none absolute inset-y-0 left-0 w-28 sm:w-48 bg-gradient-to-r from-[#090b0e] via-[#090b0e]/90 to-transparent z-20" />
      <div className="pointer-events-none absolute inset-y-0 right-0 w-28 sm:w-48 bg-gradient-to-l from-[#090b0e] via-[#090b0e]/90 to-transparent z-20" />

      {/* TRACK 1 (Moves Left) */}
      <div className="marquee-row flex gap-4 w-max hover:[animation-play-state:paused] mb-4">
        {duplicatedTrack1.map((item, idx) => (
          <div
            key={`t1-${item.id}-${idx}`}
            className="group relative flex flex-col justify-between w-[300px] sm:w-[340px] rounded-2xl bg-[#11141b]/95 border border-white/[0.08] hover:border-emerald-500/40 p-4 transition-all duration-300 hover:shadow-xl hover:shadow-emerald-500/10 hover:-translate-y-1"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-sm text-zinc-100 truncate">{item.name}</span>
                  <span className="text-[10px] text-zinc-500 font-mono">{item.time}</span>
                </div>
                <div className="text-xs text-zinc-400 truncate mt-0.5">{item.role}</div>
                <div className="inline-flex items-center gap-1.5 mt-1.5 text-xs font-semibold text-zinc-300">
                  <span className="h-2 w-2 rounded-full inline-block" style={{ backgroundColor: item.companyColor }} />
                  <span>Target: <strong className="text-white">{item.company}</strong></span>
                </div>
              </div>

              {/* ATS Match Score Chip */}
              <div className="shrink-0 flex flex-col items-end">
                <div className="flex items-center gap-1 bg-emerald-500/15 border border-emerald-500/30 px-2.5 py-1 rounded-full text-emerald-400 font-extrabold text-xs shadow-sm">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                  <span>{item.score}%</span>
                </div>
                {item.hike && (
                  <span className="text-[10px] text-amber-300 font-bold mt-1 bg-amber-400/10 px-1.5 py-0.5 rounded border border-amber-400/20">
                    {item.hike}
                  </span>
                )}
              </div>
            </div>

            <div className="mt-3 py-1.5 px-2.5 rounded-xl bg-[#161922] border border-white/[0.04] flex items-center justify-between text-xs">
              <span className="text-emerald-400 font-medium flex items-center gap-1 text-[11px]">
                <TrendingUp className="h-3 w-3" /> {item.highlight}
              </span>
              <span className="text-[10px] text-zinc-500 font-mono">100% ATS Safe</span>
            </div>

            <div className="mt-2.5 pt-2 border-t border-white/[0.06] flex flex-wrap gap-1">
              {item.keywords.map((kw, kIdx) => (
                <span key={kIdx} className="text-[10px] px-2 py-0.5 rounded-md bg-white/[0.04] text-zinc-300 border border-white/[0.06] font-mono">
                  ✓ {kw}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* TRACK 2 (Moves Right) */}
      <div className="marquee-row-reverse flex gap-4 w-max hover:[animation-play-state:paused]">
        {duplicatedTrack2.map((item, idx) => (
          <div
            key={`t2-${item.id}-${idx}`}
            className="group relative flex flex-col justify-between w-[300px] sm:w-[340px] rounded-2xl bg-[#11141b]/95 border border-white/[0.08] hover:border-emerald-500/40 p-4 transition-all duration-300 hover:shadow-xl hover:shadow-emerald-500/10 hover:-translate-y-1"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-sm text-zinc-100 truncate">{item.name}</span>
                  <span className="text-[10px] text-zinc-500 font-mono">{item.time}</span>
                </div>
                <div className="text-xs text-zinc-400 truncate mt-0.5">{item.role}</div>
                <div className="inline-flex items-center gap-1.5 mt-1.5 text-xs font-semibold text-zinc-300">
                  <span className="h-2 w-2 rounded-full inline-block" style={{ backgroundColor: item.companyColor }} />
                  <span>Target: <strong className="text-white">{item.company}</strong></span>
                </div>
              </div>

              <div className="shrink-0 flex flex-col items-end">
                <div className="flex items-center gap-1 bg-emerald-500/15 border border-emerald-500/30 px-2.5 py-1 rounded-full text-emerald-400 font-extrabold text-xs shadow-sm">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                  <span>{item.score}%</span>
                </div>
                {item.hike && (
                  <span className="text-[10px] text-amber-300 font-bold mt-1 bg-amber-400/10 px-1.5 py-0.5 rounded border border-amber-400/20">
                    {item.hike}
                  </span>
                )}
              </div>
            </div>

            <div className="mt-3 py-1.5 px-2.5 rounded-xl bg-[#161922] border border-white/[0.04] flex items-center justify-between text-xs">
              <span className="text-emerald-400 font-medium flex items-center gap-1 text-[11px]">
                <TrendingUp className="h-3 w-3" /> {item.highlight}
              </span>
              <span className="text-[10px] text-zinc-500 font-mono">100% ATS Safe</span>
            </div>

            <div className="mt-2.5 pt-2 border-t border-white/[0.06] flex flex-wrap gap-1">
              {item.keywords.map((kw, kIdx) => (
                <span key={kIdx} className="text-[10px] px-2 py-0.5 rounded-md bg-white/[0.04] text-zinc-300 border border-white/[0.06] font-mono">
                  ✓ {kw}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>

      <style>{`
        @keyframes scrollLeft {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        @keyframes scrollRight {
          0% { transform: translateX(-50%); }
          100% { transform: translateX(0); }
        }
        .marquee-row {
          animation: scrollLeft 38s linear infinite;
        }
        .marquee-row-reverse {
          animation: scrollRight 38s linear infinite;
        }
      `}</style>
    </div>
  );
});
