import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { ArrowRight, Sparkles, FileText, Target, Zap, CheckCircle2, BarChart3, ShieldCheck, Mail, Layers, GitCompare, Gauge, SlidersHorizontal, Download, Building2, GraduationCap, Star, Quote, Lock, RefreshCw, Clock, Users, TrendingUp, ShieldOff, KeyRound, Trash2, Wand2, Trophy, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Navbar } from "@/components/Navbar";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { ExitIntentPopup } from "@/components/ExitIntentPopup";
import { AnimatedCounter } from "@/components/AnimatedCounter";
import { FloatingResume } from "@/components/FloatingResume";
import { SkillConstellation } from "@/components/SkillConstellation";
import { ResumeRollingMarquee } from "@/components/ResumeRollingMarquee";
import { InteractiveTailorDemo } from "@/components/InteractiveTailorDemo";
import { SpotlightCard } from "@/components/SpotlightCard";
import { TryNow } from "@/components/TryNow";
import { OnboardingTour, shouldAutoStartTour } from "@/components/OnboardingTour";

const Index = () => {
  const [tourOpen, setTourOpen] = useState(false);
  useEffect(() => {
    const start = () => setTourOpen(true);
    window.addEventListener("tour:start", start);
    // Auto-start once for new users, after layout settles
    if (shouldAutoStartTour()) {
      const t = setTimeout(() => setTourOpen(true), 900);
      return () => { clearTimeout(t); window.removeEventListener("tour:start", start); };
    }
    return () => window.removeEventListener("tour:start", start);
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#090b0e] text-zinc-800 dark:text-zinc-100 selection:bg-emerald-500/30 selection:text-emerald-700 dark:selection:text-emerald-200 transition-colors duration-300">
      <Navbar />
      <OnboardingTour open={tourOpen} onClose={() => setTourOpen(false)} />

      {/* ================================================================
          HERO SECTION: Split Layout with Ambient Celestial Constellation
          ================================================================ */}
      <section data-tour="hero" className="relative overflow-hidden pt-12 pb-20 md:pt-16 md:pb-28">
        {/* Background Mesh and Constellation Galaxy */}
        <div className="absolute inset-0 bg-radial-gradient from-emerald-100/40 dark:from-emerald-950/20 via-slate-50/90 dark:via-[#090b0e]/90 to-slate-50 dark:to-[#090b0e] pointer-events-none" />
        <SkillConstellation />

        {/* Ambient Top Glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[350px] bg-emerald-500/10 rounded-full blur-[120px] pointer-events-none" />

        <div className="container relative z-10 mx-auto px-4 sm:px-6">
          <div className="grid lg:grid-cols-12 gap-10 lg:gap-12 items-center">
            
            {/* Left Column: Hero Value Proposition */}
            <div className="lg:col-span-7 flex flex-col items-start text-left">
              {/* Badge */}
              <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-4 py-1.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400 mb-6 backdrop-blur-md animate-fade-in shadow-sm">
                <Sparkles className="h-3.5 w-3.5 animate-pulse" />
                <span>AI-Powered ATS Resume Optimization & Builder</span>
              </div>

              {/* Main Headline */}
              <h1 className="font-display text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight text-balance leading-[1.12] text-zinc-950 dark:text-white">
                Land more interviews with a{" "}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 via-teal-500 to-emerald-400 dark:from-emerald-400 dark:via-teal-300 dark:to-emerald-200">
                  resume that fits.
                </span>
              </h1>

              {/* Description */}
              <p className="mt-5 text-base sm:text-lg text-zinc-600 dark:text-zinc-400 max-w-xl leading-relaxed">
                Paste any job description and we'll tailor your resume to beat ATS parsers, highlight critical keywords, and impress recruiters — in under 30 seconds.
              </p>

              {/* Social proof counter */}
              <div className="mt-6 flex flex-wrap items-center gap-3">
                <div className="inline-flex items-center gap-2 rounded-full border border-zinc-200/80 dark:border-white/[0.08] bg-white/90 dark:bg-[#11141b]/90 px-3.5 py-1.5 text-xs font-semibold text-zinc-700 dark:text-zinc-300 shadow-sm">
                  <TrendingUp className="h-4 w-4 text-emerald-500 dark:text-emerald-400" />
                  <AnimatedCounter to={12400} suffix="+" /> <span className="text-zinc-500 dark:text-zinc-400 font-normal">resumes tailored</span>
                </div>
                <div className="inline-flex items-center gap-1.5 rounded-full border border-zinc-200/80 dark:border-white/[0.08] bg-white/90 dark:bg-[#11141b]/90 px-3.5 py-1.5 text-xs font-semibold text-zinc-700 dark:text-zinc-300 shadow-sm">
                  <span className="flex text-amber-500">★★★★★</span>
                  <span className="text-zinc-500 dark:text-zinc-400 font-normal">4.9 / 5 Rating</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="mt-8 flex flex-wrap items-center gap-3.5 w-full sm:w-auto">
                <Button asChild size="lg" className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-bold shadow-lg shadow-emerald-500/25 h-12 px-7 text-base rounded-xl cursor-pointer">
                  <Link to="/auth">
                    Tailor My Resume <ArrowRight className="ml-1.5 h-4 w-4" />
                  </Link>
                </Button>
                <Button asChild size="lg" variant="outline" className="h-12 px-7 text-base rounded-xl border-zinc-300 dark:border-white/[0.12] bg-white dark:bg-[#11141b] text-zinc-800 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-[#161922] hover:text-zinc-950 dark:hover:text-white cursor-pointer shadow-sm">
                  <Link to="/tools/resume-builder">
                    Build New Resume
                  </Link>
                </Button>
              </div>

              {/* Trust Badges */}
              <div className="mt-8 pt-6 border-t border-zinc-200/80 dark:border-white/[0.06] flex flex-wrap items-center gap-4 text-xs text-zinc-500 dark:text-zinc-400">
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4 text-emerald-500 dark:text-emerald-400" /> No credit card required
                </span>
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4 text-emerald-500 dark:text-emerald-400" /> 1 Free optimization
                </span>
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4 text-emerald-500 dark:text-emerald-400" /> 100% ATS-tested format
                </span>
              </div>
            </div>

            {/* Right Column: Interactive 3D Showcase Card */}
            <div className="lg:col-span-5 relative w-full flex justify-center mt-6 lg:mt-0">
              <FloatingResume />
            </div>

          </div>
        </div>
      </section>

      {/* ================================================================
          INFINITE ROLLING RESUME MARQUEE RIBBON
          ================================================================ */}
      <ResumeRollingMarquee />

      {/* ================================================================
          INTERACTIVE AI TAILOR SIMULATOR & ATS LIVE ENGINE
          ================================================================ */}
      <InteractiveTailorDemo />

      {/* ================================================================
          ATS SCORE + AI RESUME BUILDER — SIDE BY SIDE PLAYGROUND
          ================================================================ */}
      <section className="relative overflow-hidden border-b border-zinc-200/80 dark:border-white/[0.08] bg-slate-100/60 dark:bg-[#0c0e14] py-16 sm:py-20 transition-colors duration-300">
        {/* Ambient glow effects */}
        <div className="absolute top-1/4 -left-20 w-80 h-80 bg-emerald-500/10 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute bottom-1/4 -right-20 w-80 h-80 bg-teal-500/10 rounded-full blur-[120px] pointer-events-none" />

        <div className="container mx-auto px-4 sm:px-6 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8 items-stretch">
            
            {/* Left Card: ATS Score (Try before signup) */}
            <div data-tour="try-now" className="min-w-0 bg-white dark:bg-[#11141b] rounded-2xl border border-zinc-200/90 dark:border-white/[0.1] p-6 sm:p-8 shadow-xl flex flex-col justify-between hover:border-emerald-500/30 transition-all duration-300">
              <TryNow />
            </div>

            {/* Right Card: AI Resume Builder Showcase */}
            <div data-tour="resume-builder" className="min-w-0 rounded-2xl border border-zinc-200/90 dark:border-white/[0.1] bg-white dark:bg-[#11141b] p-6 sm:p-8 shadow-xl flex flex-col justify-between hover:border-emerald-500/30 transition-all duration-300">
              <div>
                {/* Header Badge */}
                <div className="flex items-center justify-between gap-2 mb-5">
                  <div className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.18em] text-emerald-600 dark:text-emerald-400">
                    <Sparkles className="h-3.5 w-3.5" /> <span>AI Resume Builder</span>
                  </div>
                  <span className="inline-flex items-center gap-1 text-[11px] font-medium text-zinc-500 dark:text-zinc-400 bg-zinc-100 dark:bg-white/[0.05] border border-zinc-200 dark:border-white/[0.08] px-2.5 py-1 rounded-full">
                    <Clock className="h-3 w-3 text-emerald-500" /> ~3 Mins
                  </span>
                </div>

                <h2 className="font-display text-2xl sm:text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-white leading-tight">
                  Build a recruiter-ready resume in <span className="text-emerald-600 dark:text-emerald-400">3 minutes</span>
                </h2>
                <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
                  No existing resume? Pick an ATS-approved template and let AI generate metric-driven, impactful bullet points for you.
                </p>

                {/* Interactive Mini Resume Showcase Preview */}
                <div className="mt-5 rounded-xl border border-zinc-200/90 dark:border-white/[0.08] bg-slate-50 dark:bg-[#161922] p-4 sm:p-5 shadow-inner">
                  {/* Candidate Header preview */}
                  <div className="flex items-center justify-between pb-3 border-b border-zinc-200 dark:border-white/[0.08]">
                    <div>
                      <div className="font-bold text-xs sm:text-sm text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5">
                        Sarah Jenkins <span className="text-[11px] text-zinc-400 font-normal">· Lead Engineer</span>
                      </div>
                      <div className="text-[10px] text-zinc-500 dark:text-zinc-400 font-mono">Stanford Template · ATS Optimized</div>
                    </div>
                    <div className="inline-flex items-center gap-1 text-[10px] sm:text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-2 py-0.5 rounded-full">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-ping" /> ATS Pass: 98%
                    </div>
                  </div>

                  {/* AI Bullet Rewrite Before/After */}
                  <div className="mt-3 space-y-2">
                    <div className="rounded-lg bg-white dark:bg-[#10131a] border border-zinc-200/80 dark:border-white/[0.06] p-2.5">
                      <div className="flex items-center justify-between text-[10px] font-semibold text-zinc-400 dark:text-zinc-500 mb-1">
                        <span>BEFORE (RAW DRAFT)</span>
                        <span className="text-rose-500 dark:text-rose-400">Generic</span>
                      </div>
                      <p className="text-[11px] text-zinc-500 dark:text-zinc-400 line-through">
                        "Wrote React code and fixed bugs in the backend SQL database."
                      </p>
                    </div>

                    <div className="rounded-lg bg-emerald-500/[0.07] border border-emerald-500/30 p-2.5">
                      <div className="flex items-center justify-between text-[10px] font-bold text-emerald-600 dark:text-emerald-400 mb-1">
                        <span className="flex items-center gap-1"><Wand2 className="h-3 w-3" /> AI OPTIMIZED (METRIC-DRIVEN)</span>
                        <span className="bg-emerald-500/20 px-1.5 py-0.2 rounded text-[9px]">+42% Match</span>
                      </div>
                      <p className="text-[11px] font-medium text-zinc-800 dark:text-zinc-200">
                        "Architected <span className="text-emerald-600 dark:text-emerald-400 font-bold">14+ React micro-frontends</span> and indexed PostgreSQL queries, reducing latency by <span className="text-emerald-600 dark:text-emerald-400 font-bold">42%</span> for 1M+ active users."
                      </p>
                    </div>
                  </div>

                  {/* Template Format Chips */}
                  <div className="mt-3 pt-2.5 border-t border-zinc-200 dark:border-white/[0.06] flex items-center justify-between gap-2">
                    <span className="text-[10px] text-zinc-500 dark:text-zinc-400 font-medium">Layout Styles:</span>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-[9px] bg-white dark:bg-white/[0.08] text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-white/[0.1] px-2 py-0.5 rounded font-medium">✨ Modern Tech</span>
                      <span className="text-[9px] bg-white dark:bg-white/[0.08] text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-white/[0.1] px-2 py-0.5 rounded font-medium">🏛️ Classic Harvard</span>
                      <span className="text-[9px] bg-white dark:bg-white/[0.08] text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-white/[0.1] px-2 py-0.5 rounded font-medium">⚡ Minimal Compact</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Footer */}
              <div className="mt-6 pt-5 border-t border-zinc-200/80 dark:border-white/[0.06] flex flex-col sm:flex-row items-center justify-between gap-3">
                <Button asChild size="lg" className="w-full sm:w-auto bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-bold h-11 px-7 text-sm rounded-xl cursor-pointer shadow-md transition-all hover:shadow-[0_0_20px_rgba(16,185,129,0.35)]">
                  <Link to="/tools/resume-builder">
                    Launch Resume Builder <ArrowRight className="ml-1.5 h-4 w-4" />
                  </Link>
                </Button>
                <div className="flex flex-wrap items-center gap-x-3 text-xs text-zinc-500 dark:text-zinc-400">
                  <span className="inline-flex items-center gap-1"><CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" /> ATS-Tested</span>
                  <span className="inline-flex items-center gap-1"><CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" /> 1-Click PDF</span>
                  <span className="inline-flex items-center gap-1"><CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" /> AI Suggestions</span>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ================================================================
          CORE FEATURES GRID WITH SPOTLIGHT PHYSICS
          ================================================================ */}
      <section className="container mx-auto px-4 sm:px-6 py-20 sm:py-24">
        <div className="text-center max-w-2xl mx-auto mb-14 sm:mb-16">
          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3.5 py-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400 mb-3">
            <Target className="h-3.5 w-3.5" /> Built for Modern ATS Systems
          </div>
          <h2 className="font-display text-3xl sm:text-4xl font-bold tracking-tight text-zinc-900 dark:text-white">
            Everything you need to get hired
          </h2>
          <p className="mt-3 text-sm sm:text-base text-zinc-600 dark:text-zinc-400">
            A comprehensive intelligence toolkit to optimize every line of your resume for target roles.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5 sm:gap-6">
          {[
            { icon: Target, title: "ATS Match Score", desc: "Get an instant 0–100 score showing exactly how well your resume matches the job description." },
            { icon: Zap, title: "AI-Rewritten Bullets", desc: "Action-driven, quantifiable achievement lines that mirror the terminology recruiters search for." },
            { icon: BarChart3, title: "Missing Keyword Radar", desc: "Detect missing industry skills, tools, and certifications and incorporate them seamlessly." },
            { icon: FileText, title: "Tailored Summary", desc: "Generate a captivating 3-4 sentence executive summary targeted for the exact opportunity." },
            { icon: ShieldCheck, title: "Pixel-Perfect PDF Export", desc: "Export clean, standard single-column PDF templates tested against Workday, Greenhouse & Lever." },
            { icon: Sparkles, title: "Cross-Industry Adaptation", desc: "From software engineering and data to product, marketing, and operations." },
          ].map(({ icon: Icon, title, desc }) => (
            <SpotlightCard
              key={title}
              className="group p-6 sm:p-7 shadow-md hover:-translate-y-1 transition-all duration-300"
            >
              <div className="h-11 w-11 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 flex items-center justify-center mb-5 group-hover:bg-emerald-500 group-hover:text-slate-950 transition-colors">
                <Icon className="h-5 w-5" />
              </div>
              <h3 className="font-semibold text-lg text-zinc-900 dark:text-white">{title}</h3>
              <p className="mt-2 text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">{desc}</p>
            </SpotlightCard>
          ))}
        </div>
      </section>

      {/* ================================================================
          COMPANY LOGOS / OUTCOMES STRIP
          ================================================================ */}
      <section className="relative border-y border-zinc-200/80 dark:border-white/[0.08] bg-slate-100/60 dark:bg-[#0c0e14] py-16 overflow-hidden transition-colors duration-300">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="flex flex-col items-center text-center mb-10">
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-emerald-600 dark:text-emerald-400">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 dark:bg-emerald-400 animate-pulse" />
              Proven Career Outcomes
            </div>
            <h3 className="mt-3 font-display text-2xl sm:text-3xl font-bold tracking-tight text-zinc-900 dark:text-white">
              Tailored resumes that open doors at top teams
            </h3>
            <p className="mt-2 text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 max-w-md">
              From fast-growing scaleups to high-growth unicorns, our candidates get noticed.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4 max-w-5xl mx-auto">
            {[
              { name: "Razorpay", domain: "razorpay.com", accent: "#3B82F6" },
              { name: "Swiggy",   domain: "swiggy.com",   accent: "#FC8019" },
              { name: "Flipkart", domain: "flipkart.com", accent: "#2874F0" },
              { name: "Zomato",   domain: "zomato.com",   accent: "#E23744" },
              { name: "CRED",     domain: "cred.club",    accent: "#10B981" },
            ].map((c) => (
              <div
                key={c.name}
                className="flex h-20 items-center justify-center rounded-2xl border border-zinc-200/80 dark:border-white/[0.08] bg-white dark:bg-[#11141b] hover:border-emerald-500/40 transition-all duration-300 hover:-translate-y-0.5 shadow-sm"
              >
                <span
                  className="font-display font-bold text-lg tracking-tight select-none"
                  style={{ color: c.accent }}
                >
                  {c.name}
                </span>
              </div>
            ))}
          </div>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs text-zinc-500 dark:text-zinc-400">
            <span className="inline-flex items-center gap-1.5"><span className="h-1.5 w-1.5 rounded-full bg-emerald-500 dark:bg-emerald-400" /> 12,400+ interview calls</span>
            <span className="inline-flex items-center gap-1.5"><span className="h-1.5 w-1.5 rounded-full bg-emerald-500 dark:bg-emerald-400" /> 3,800+ offers landed</span>
            <span className="inline-flex items-center gap-1.5"><span className="h-1.5 w-1.5 rounded-full bg-emerald-500 dark:bg-emerald-400" /> 92% ATS pass-rate</span>
          </div>
        </div>
      </section>

      {/* ================================================================
          TESTIMONIALS SECTION
          ================================================================ */}
      <section className="container mx-auto px-4 sm:px-6 py-20 sm:py-24">
        <div className="text-center max-w-2xl mx-auto mb-14">
          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3.5 py-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400 mb-3">
            <Star className="h-3.5 w-3.5 fill-current" /> Verified User Stories
          </div>
          <h2 className="font-display text-3xl sm:text-4xl font-bold tracking-tight text-zinc-900 dark:text-white">
            From "No Responses" to Multiple Offers
          </h2>
          <p className="mt-3 text-sm text-zinc-600 dark:text-zinc-400">
            Real outcomes from candidates who tailored their resumes with ResumeShot AI.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5 sm:gap-6">
          {[
            { name: "Mounika Reddy", role: "Cloud SDE @ Microsoft", quote: "My ATS score jumped from 44 to 98. The keyword injection and quantifiable bullets made all the difference in getting shortlisted!", initials: "MR" },
            { name: "Harsha Naidu", role: "AI & SDE-2 @ Razorpay", quote: "Tailored my resume for top fintech engineering roles. ATS match went from 48 to 97 and landed 3 direct recruiter callbacks within 48 hours!", initials: "HN" },
            { name: "Sai", role: "Lead Platform Engineer @ Swiggy", quote: "The missing keyword intelligence surfaced critical gaps in my resume. Got shortlisted for high-growth tech roles in under a week!", initials: "S" },
          ].map((t) => (
            <SpotlightCard
              key={t.name}
              className="p-6 sm:p-7 shadow-md flex flex-col justify-between"
            >
              <div>
                <Quote className="h-6 w-6 text-emerald-500/40 dark:text-emerald-400/40 mb-3" />
                <div className="flex gap-0.5 mb-3">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                  ))}
                </div>
                <p className="text-sm text-zinc-700 dark:text-zinc-300 leading-relaxed">"{t.quote}"</p>
              </div>

              <div className="mt-6 flex items-center gap-3 pt-4 border-t border-zinc-200/80 dark:border-white/[0.06]">
                <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-emerald-400 to-teal-500 text-slate-950 font-bold text-xs flex items-center justify-center shadow-md">
                  {t.initials}
                </div>
                <div>
                  <div className="font-semibold text-sm text-zinc-900 dark:text-white">{t.name}</div>
                  <div className="text-xs text-zinc-500 dark:text-zinc-400">{t.role}</div>
                </div>
              </div>
            </SpotlightCard>
          ))}
        </div>
      </section>

      {/* ================================================================
          PRO TOOLKIT SHOWCASE
          ================================================================ */}
      <section className="bg-slate-100/60 dark:bg-[#0c0e14] border-y border-zinc-200/80 dark:border-white/[0.08] py-20 sm:py-24 transition-colors duration-300">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3.5 py-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400 mb-3">
              <Sparkles className="h-3.5 w-3.5" /> All-in-One Platform
            </div>
            <h2 className="font-display text-3xl sm:text-4xl font-bold tracking-tight text-zinc-900 dark:text-white">
              A Complete Job-Search Toolkit
            </h2>
            <p className="mt-3 text-sm text-zinc-600 dark:text-zinc-400">
              Powerful tools designed to elevate your job applications from end to end.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
            {[
              { icon: Wand2, title: "AI Resume Builder", desc: "Build a structured, ATS-compliant resume with AI bullet points in minutes.", tag: "Builder", to: "/tools/resume-builder" },
              { icon: Mail, title: "Cover Letter Generator", desc: "Generate a custom, compelling cover letter matching your resume and JD.", tag: "AI", to: "/tools/cover-letter" },
              { icon: GitCompare, title: "Before / After Diff", desc: "Visualize word-level optimizations and keyword additions clearly.", tag: "Visual", to: "/tools/diff" },
              { icon: Gauge, title: "Keyword Density Meter", desc: "Ensure your resume satisfies ATS search algorithms without keyword stuffing.", tag: "ATS", to: "/tools/keyword-density" },
              { icon: Building2, title: "Company Research Brief", desc: "Instant AI summary of the company culture and interview focus areas.", tag: "Research", to: "/tools/company-brief" },
              { icon: GraduationCap, title: "Skill Gap Analysis", desc: "Pinpoint missing technical credentials and actionable steps to bridge them.", tag: "Growth", to: "/tools/skill-gap" },
              { icon: Trophy, title: "ATS Multi-Compare", desc: "Score and compare multiple resume variations against one job description.", tag: "Compare", to: "/tools/ats-compare" },
              { icon: Eye, title: "6-Second Recruiter View", desc: "Simulate what a human recruiter reads in their initial 6-second scan.", tag: "Recruiter", to: "/tools/recruiter-view" },
            ].map(({ icon: Icon, title, desc, tag, to }) => (
              <Link
                to={to}
                key={title}
                className="group relative rounded-2xl border border-zinc-200/80 dark:border-white/[0.08] bg-white dark:bg-[#11141b] hover:bg-slate-50 dark:hover:bg-[#161922] p-5 shadow-sm hover:border-emerald-500/40 hover:-translate-y-0.5 transition-all duration-300 block"
              >
                <div className="absolute top-4 right-4 text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 rounded-full px-2 py-0.5">
                  {tag}
                </div>
                <div className="h-10 w-10 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 flex items-center justify-center mb-4 group-hover:bg-emerald-500 group-hover:text-slate-950 transition-colors">
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="font-semibold text-sm text-zinc-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-300 transition-colors">{title}</h3>
                <p className="mt-1.5 text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">{desc}</p>
                <div className="mt-3 text-xs font-semibold text-emerald-600 dark:text-emerald-400 opacity-0 group-hover:opacity-100 transition-opacity">
                  Open tool →
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ================================================================
          PRICING SECTION
          ================================================================ */}
      <section data-tour="pricing" className="container mx-auto px-4 sm:px-6 py-20 sm:py-24">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <h2 className="font-display text-3xl sm:text-4xl font-bold tracking-tight text-zinc-900 dark:text-white">Simple, Fair Pricing</h2>
          <p className="mt-3 text-sm text-zinc-600 dark:text-zinc-400">Start free. Upgrade only when you want unlimited tailoring power.</p>
        </div>

        <div className="grid md:grid-cols-2 gap-6 max-w-3xl mx-auto">
          {/* Free Tier */}
          <div className="rounded-2xl border border-zinc-200/80 dark:border-white/[0.08] bg-white dark:bg-[#11141b] p-7 shadow-md dark:shadow-lg flex flex-col justify-between">
            <div>
              <div className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">Free Tier</div>
              <div className="mt-2 font-display text-4xl font-bold text-zinc-900 dark:text-white">₹0</div>
              <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">Get started in seconds with zero commitment.</p>
              <ul className="mt-6 space-y-3 text-xs text-zinc-600 dark:text-zinc-300">
                <li className="flex gap-2"><CheckCircle2 className="h-4 w-4 text-emerald-500 dark:text-emerald-400 mt-0.5 shrink-0" /> 1 Free resume optimization</li>
                <li className="flex gap-2"><CheckCircle2 className="h-4 w-4 text-emerald-500 dark:text-emerald-400 mt-0.5 shrink-0" /> Complete ATS match score & gap report</li>
                <li className="flex gap-2"><CheckCircle2 className="h-4 w-4 text-emerald-500 dark:text-emerald-400 mt-0.5 shrink-0" /> Clean ATS-compliant PDF export</li>
              </ul>
            </div>
            <Button asChild variant="outline" className="w-full mt-8 border-zinc-300 dark:border-white/[0.12] bg-zinc-50 dark:bg-[#161922] text-zinc-800 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-[#1f2430] hover:text-zinc-950 dark:hover:text-white shadow-sm">
              <Link to="/auth">Start Free</Link>
            </Button>
          </div>

          {/* Pro Tier */}
          <div className="relative rounded-2xl border-2 border-emerald-500/40 bg-white dark:bg-[#11141b] p-7 shadow-xl dark:shadow-2xl shadow-emerald-500/10 flex flex-col justify-between">
            <div className="absolute -top-3 right-6 rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 text-xs font-bold px-3 py-1 shadow-md">
              MOST POPULAR
            </div>
            <div>
              <div className="text-xs font-semibold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">Pro Unlimited</div>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="font-display text-4xl font-bold text-zinc-900 dark:text-white">₹99</span>
                <span className="text-sm text-zinc-400 line-through">₹999</span>
                <span className="text-xs text-zinc-500 dark:text-zinc-400">/ month</span>
              </div>
              <p className="mt-1 text-xs text-zinc-600 dark:text-zinc-400">One interview callback pays for this <strong className="text-zinc-900 dark:text-white">1000x over</strong>.</p>
              <ul className="mt-6 space-y-3 text-xs text-zinc-600 dark:text-zinc-300">
                <li className="flex gap-2"><CheckCircle2 className="h-4 w-4 text-emerald-500 dark:text-emerald-400 mt-0.5 shrink-0" /> Unlimited AI optimizations & rewrites</li>
                <li className="flex gap-2"><CheckCircle2 className="h-4 w-4 text-emerald-500 dark:text-emerald-400 mt-0.5 shrink-0" /> Cover letter generator & Diff viewer</li>
                <li className="flex gap-2"><CheckCircle2 className="h-4 w-4 text-emerald-500 dark:text-emerald-400 mt-0.5 shrink-0" /> Unlimited resume versions & history</li>
                <li className="flex gap-2"><CheckCircle2 className="h-4 w-4 text-emerald-500 dark:text-emerald-400 mt-0.5 shrink-0" /> Priority AI processing speed</li>
              </ul>
            </div>
            <Button asChild className="w-full mt-8 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-bold shadow-md shadow-emerald-500/20">
              <Link to="/pricing">Unlock Pro for ₹99</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* ================================================================
          FAQ SECTION
          ================================================================ */}
      <section className="container mx-auto px-4 sm:px-6 py-20">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <h2 className="font-display text-3xl font-bold tracking-tight text-zinc-900 dark:text-white">Frequently Asked Questions</h2>
          <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">Everything you need to know about pricing, privacy, and how it works.</p>
        </div>
        <div className="max-w-3xl mx-auto rounded-2xl border border-zinc-200/80 dark:border-white/[0.08] bg-white dark:bg-[#11141b] p-3 sm:p-6 shadow-md dark:shadow-xl">
          <Accordion type="single" collapsible className="w-full">
            {[
              { q: "How does the free plan work?", a: "Sign up and you get 1 free resume optimization — no credit card required. You'll see your full ATS score, keyword gaps, and a tailored rewrite." },
              { q: "Can I cancel my subscription anytime?", a: "Yes — 100%. Go to Pricing → Manage subscription → Cancel. You keep access till the end of your billing cycle. No cancellation fees." },
              { q: "Is my resume data safe? Do you train AI on it?", a: "Your resume is encrypted in transit (TLS 1.3) and at rest (AES-256). We never sell your data, never share it with third parties, and never train AI models on it." },
              { q: "Will my resume pass modern ATS scanners?", a: "Yes. We test against parsers used by Workday, Greenhouse, Lever, and Taleo. Our PDF exports use selectable text and clean single-column hierarchy." },
            ].map((f, i) => (
              <AccordionItem key={i} value={`item-${i}`} className="border-zinc-200/80 dark:border-white/[0.08]">
                <AccordionTrigger className="text-left font-semibold text-sm text-zinc-800 dark:text-zinc-200 hover:text-emerald-600 dark:hover:text-emerald-400 px-3">{f.q}</AccordionTrigger>
                <AccordionContent className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed px-3">{f.a}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>

      {/* ================================================================
          FINAL CALL TO ACTION
          ================================================================ */}
      <section className="container mx-auto px-4 sm:px-6 pb-24">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-emerald-600 to-teal-600 p-10 md:p-14 text-center shadow-2xl shadow-emerald-500/20">
          <div className="relative z-10">
            <h2 className="font-display text-3xl md:text-5xl font-extrabold text-slate-950 tracking-tight">
              Your next interview is one tailor away.
            </h2>
            <p className="mt-4 text-slate-900 font-medium max-w-xl mx-auto text-base">
              Join 12,000+ job seekers who stopped sending generic resumes to every opening.
            </p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              <Button asChild size="lg" className="h-12 px-7 text-base font-bold bg-slate-950 hover:bg-slate-900 text-white shadow-xl rounded-xl cursor-pointer">
                <Link to="/auth">Start Free — 1 Scan on Us <ArrowRight className="ml-1.5 h-4 w-4" /></Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="h-12 px-7 text-base font-semibold bg-white/20 hover:bg-white/30 text-slate-950 border-slate-950/20 rounded-xl cursor-pointer">
                <Link to="/pricing">View Pricing</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-zinc-200/80 dark:border-white/[0.08] bg-white dark:bg-[#090b0e] py-10 text-xs text-zinc-500 transition-colors duration-300">
        <div className="container mx-auto px-4 sm:px-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <div>© {new Date().getFullYear()} ResumeShot AI. Built to help you get hired.</div>
          <nav className="flex flex-wrap gap-x-5 gap-y-2">
            <Link to="/pricing" className="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors">Pricing</Link>
            <Link to="/terms-of-service" className="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors">Terms of Service</Link>
            <Link to="/privacy-policy" className="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors">Privacy Policy</Link>
            <Link to="/refund-policy" className="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors">Refund Policy</Link>
            <a href="mailto:support.resumeshot@gmail.com" className="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors">Support</a>
          </nav>
        </div>
      </footer>

      <ExitIntentPopup />
    </div>
  );
};

export default Index;
