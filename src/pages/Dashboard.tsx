import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Upload, FileText, Loader2, Sparkles, History, Building2, AlertTriangle, X, Link2, Download, RefreshCw, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Navbar } from "@/components/Navbar";
import { AnnouncementBanner } from "@/components/AnnouncementBanner";
import { CustomOffers } from "@/components/CustomOffers";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { extractTextFromFile } from "@/lib/extractText";
import { validateResumeFile } from "@/lib/fileValidation";
import { AnalyzeProgress } from "@/components/AnalyzeProgress";
import { toast } from "sonner";

type RewriteLevel = "light" | "balanced" | "aggressive";

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const fileRef = useRef<HTMLInputElement>(null);
  const [resumeText, setResumeText] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const [filename, setFilename] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [rewriteLevel, setRewriteLevel] = useState<RewriteLevel>("balanced");
  const [extracting, setExtracting] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [profile, setProfile] = useState<{
    plan: string;
    optimizations_used: number;
    scans_used_month: number;
    subscription_status: string;
    current_period_end: string | null;
    payment_failed: boolean;
    pending_plan: string | null;
  } | null>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [cancelling, setCancelling] = useState(false);
  const [jdUrl, setJdUrl] = useState("");
  const [importingUrl, setImportingUrl] = useState(false);
  const [lastError, setLastError] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [fileError, setFileError] = useState<string | null>(null);
  const [appStats, setAppStats] = useState<{ total: number; interviews: number; offers: number; recent: any[] } | null>(null);

  // Persist inputs so a failed request / reload never forces the user to re-upload.
  useEffect(() => {
    try {
      const raw = localStorage.getItem("dashboard:draft");
      if (!raw) return;
      const d = JSON.parse(raw);
      if (d.resumeText) setResumeText(d.resumeText);
      if (d.jobDescription) setJobDescription(d.jobDescription);
      if (d.filename) setFilename(d.filename);
      if (d.title) setTitle(d.title);
      if (d.rewriteLevel) setRewriteLevel(d.rewriteLevel);
    } catch { /* ignore */ }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem("dashboard:draft", JSON.stringify({ resumeText, jobDescription, filename, title, rewriteLevel }));
    } catch { /* ignore */ }
  }, [resumeText, jobDescription, filename, title, rewriteLevel]);

  const handleImportUrl = async () => {
    const url = jdUrl.trim();
    if (!url) return toast.error("Paste a job posting URL");
    if (!/^https?:\/\//i.test(url)) return toast.error("URL must start with http:// or https://");
    setImportingUrl(true);
    try {
      const { data, error } = await supabase.functions.invoke("jd-from-url", { body: { url } });
      if (error || (data as any)?.error) {
        toast.error((data as any)?.error || (error as any)?.message || "Could not fetch URL");
        return;
      }
      const d = data as { jobDescription: string; title?: string | null; company?: string | null };
      setJobDescription(d.jobDescription);
      if (d.title && !title) setTitle([d.company, d.title].filter(Boolean).join(" – "));
      toast.success("Job description imported");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Import failed");
    } finally {
      setImportingUrl(false);
    }
  };

  const loadProfile = () => {
    if (!user) return;
    supabase
      .from("profiles")
      .select("plan, optimizations_used, scans_used_month, subscription_status, current_period_end, payment_failed, pending_plan")
      .eq("user_id", user.id)
      .maybeSingle()
      .then(({ data }) => setProfile(data as any));
  };

  const loadHistory = () => {
    if (!user) return;
    supabase.from("optimizations").select("id, ats_score, created_at, title, company, role").eq("user_id", user.id).order("created_at", { ascending: false }).limit(9)
      .then(({ data }) => setHistory(data ?? []));
  };

  const loadAppStats = async () => {
    if (!user) return;
    const { data } = await supabase.from("job_applications")
      .select("id, company_name, job_title, status, application_date, created_at")
      .eq("user_id", user.id).order("created_at", { ascending: false });
    const rows = (data ?? []) as any[];
    const has = (s: string) => rows.filter(r => r.status === s).length;
    setAppStats({
      total: rows.length,
      interviews: has("interview") + has("offer"),
      offers: has("offer"),
      recent: rows.slice(0, 3),
    });
  };

  useEffect(() => {
    if (!user) return;
    loadProfile();
    loadHistory();
    loadAppStats();
  }, [user]);

  const handleCancel = async () => {
    if (!confirm("Cancel your subscription? You'll keep paid access until the end of the current billing cycle, then drop to Free.")) return;
    setCancelling(true);
    try {
      const { data, error } = await supabase.functions.invoke("razorpay-cancel-subscription");
      if (error || (data as any)?.error) {
        toast.error((error as any)?.message || (data as any)?.error || "Could not cancel");
        return;
      }
      toast.success("Subscription cancelled. Access continues until the cycle ends.");
      loadProfile();
    } finally {
      setCancelling(false);
    }
  };

  const handleFile = async (file: File) => {
    setFileError(null);
    const v = validateResumeFile(file);
    if (v.ok === false) {
      setFileError(v.error);
      toast.error(v.error);
      if (fileRef.current) fileRef.current.value = "";
      return;
    }
    setExtracting(true);
    try {
      const text = await extractTextFromFile(file);
      if (!text || text.trim().length < 30) {
        toast.error("We couldn't read enough text from that file. Try a different PDF/DOCX or paste the text below.");
        return;
      }
      setResumeText(text);
      setFilename(file.name);
      toast.success(`Loaded ${file.name}`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to read file");
    } finally {
      setExtracting(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const handleAnalyze = async () => {
    if (!resumeText.trim()) return toast.error("Add your resume first");
    if (!jobDescription.trim()) return toast.error("Paste the job description");

    setLastError(null);
    setAnalyzing(true);
    try {
      const { data, error } = await supabase.functions.invoke("analyze-resume", {
        body: { resume: resumeText, jobDescription, rewriteLevel, title: title.trim() || undefined },
      });
      if (error) {
        const msg = (error as any).context?.error || error.message || "Analysis failed";
        setLastError(msg);
        toast.error(msg);
        return;
      }
      if (data?.error) { setLastError(data.error); toast.error(data.error); return; }
      toast.success("Resume tailored!");
      try { localStorage.removeItem("dashboard:draft"); } catch { /* ignore */ }
      navigate(`/results/${data.optimization.id}`);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Something went wrong";
      setLastError(msg);
      toast.error(msg);
    } finally {
      setAnalyzing(false);
    }
  };

  const plan = profile?.plan ?? "free";
  const limit = plan === "pro" ? 50 : plan === "basic" ? 10 : 1;
  const used = profile?.scans_used_month ?? 0;
  const left = Math.max(0, limit - used);
  const isPaid = plan === "basic" || plan === "pro";

  const levels: { value: RewriteLevel; label: string; desc: string }[] = [
    { value: "light", label: "Light polish", desc: "Minimal edits, keep voice" },
    { value: "balanced", label: "Balanced", desc: "Strong rewrite + keywords" },
    { value: "aggressive", label: "Aggressive", desc: "Max rewrite for ATS" },
  ];

  return (
    <div className="min-h-screen bg-[#090b0e] text-zinc-100 selection:bg-emerald-500/30 selection:text-emerald-200">
      <Navbar />
      <div className="container py-10 max-w-6xl">
        <div className="mb-4"><AnnouncementBanner /></div>
        <CustomOffers onPaid={loadProfile} />
        {profile?.payment_failed && (
          <div className="mb-6 rounded-xl border border-destructive/40 bg-destructive/10 p-4 flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
            <div className="flex-1 text-sm">
              <div className="font-semibold text-destructive">Payment failed — please update your payment method</div>
              <div className="text-zinc-400 mt-1">
                Your latest autopay charge didn't go through. Update your card/UPI from the{" "}
                <Link to="/pricing" className="underline text-emerald-400">Pricing page</Link> or email{" "}
                <a className="underline text-emerald-400" href="mailto:support.resumeshot@gmail.com">support.resumeshot@gmail.com</a>{" "}
                if you need help.
              </div>
            </div>
          </div>
        )}

        {profile?.pending_plan && profile.pending_plan !== plan && (
          <div className="mb-6 rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-4 text-sm">
            You'll keep <span className="capitalize font-semibold text-emerald-400">{plan}</span> access until{" "}
            <span className="font-semibold">{profile.current_period_end ? new Date(profile.current_period_end).toLocaleDateString() : "the end of this cycle"}</span>.{" "}
            <span className="capitalize font-semibold text-emerald-400">{profile.pending_plan}</span> plan starts from next billing cycle.
          </div>
        )}

        <div className="flex items-end justify-between flex-wrap gap-4 mb-8">
          <div>
            <h1 className="font-display text-3xl md:text-4xl font-extrabold tracking-tight text-white">Tailor your resume</h1>
            <p className="text-zinc-400 mt-1 text-sm">Upload your resume and paste a job description to get a tailored ATS-optimized version.</p>
            <Link to="/notifications" className="text-xs text-emerald-400 underline mt-1 inline-block">View your notifications & messages</Link>
          </div>
          <div className="rounded-xl border border-white/[0.08] bg-[#11141b] px-4 py-3 text-sm shadow-xl min-w-[240px]">
            <div className="text-xs text-zinc-400 uppercase font-semibold tracking-wider">Plan · <span className="text-emerald-400">{plan}</span></div>
            <div className="font-display font-bold text-white mt-0.5">{used}/{limit} scans used</div>
            {left <= 2 && left > 0 && isPaid && (
              <div className="text-xs text-amber-600 dark:text-amber-400 mt-0.5">Only {left} scan{left === 1 ? "" : "s"} left this month</div>
            )}
            {left === 0 && plan === "free" && (
              <div className="text-xs text-amber-600 dark:text-amber-400 mt-0.5">
                You've used your free scan.{" "}
                <Link to="/pricing" className="underline text-primary">Upgrade for ₹49/month</Link>
              </div>
            )}
            {isPaid && profile?.subscription_status !== "cancelled" && (
              <div className="mt-2">
                <Button onClick={handleCancel} variant="outline" size="sm" disabled={cancelling} className="h-7 text-xs">
                  {cancelling ? <Loader2 className="h-3 w-3 mr-1 animate-spin" /> : <X className="h-3 w-3 mr-1" />}
                  Cancel subscription
                </Button>
              </div>
            )}
            {profile?.subscription_status === "cancelled" && profile?.current_period_end && (
              <div className="text-xs text-muted-foreground mt-1">
                Your subscription will end on {new Date(profile.current_period_end).toLocaleDateString()}
              </div>
            )}
          </div>
        </div>

        {/* Applications widget */}
        <div className="mb-6 rounded-2xl border border-white/[0.08] bg-[#11141b] p-5 shadow-xl">
          <div className="flex items-center justify-between gap-3 mb-3 flex-wrap">
            <div>
              <h2 className="font-display font-semibold text-lg text-white">Your Job Search</h2>
              <p className="text-xs text-zinc-400">Track every application, interview, and offer in one place.</p>
            </div>
            <div className="flex gap-2">
              <Button asChild variant="outline" size="sm" className="border-white/10 bg-[#161922] text-zinc-200 hover:text-white"><Link to="/applications">View all</Link></Button>
              <Button asChild size="sm" className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-bold shadow-md"><Link to="/applications?new=1"><Sparkles className="h-3.5 w-3.5 mr-1" /> Add Application</Link></Button>
            </div>
          </div>
          {appStats && appStats.total > 0 ? (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-3">
                <div className="rounded-xl border border-white/[0.06] bg-[#161922] p-3"><div className="text-[11px] uppercase tracking-wider font-semibold text-zinc-400">Total</div><div className="font-display text-xl font-bold text-white">{appStats.total}</div></div>
                <div className="rounded-xl border border-white/[0.06] bg-[#161922] p-3"><div className="text-[11px] uppercase tracking-wider font-semibold text-zinc-400">Interviews</div><div className="font-display text-xl font-bold text-emerald-400">{appStats.interviews}</div></div>
                <div className="rounded-xl border border-white/[0.06] bg-[#161922] p-3"><div className="text-[11px] uppercase tracking-wider font-semibold text-zinc-400">Offers</div><div className="font-display text-xl font-bold text-emerald-400">{appStats.offers}</div></div>
                <div className="rounded-xl border border-white/[0.06] bg-[#161922] p-3"><div className="text-[11px] uppercase tracking-wider font-semibold text-zinc-400">Active</div><div className="font-display text-xl font-bold text-white">{appStats.total - appStats.recent.filter((r: any) => r.status === "rejected" || r.status === "withdrawn").length}</div></div>
              </div>
              <div className="grid gap-2">
                {appStats.recent.map((r: any) => {
                  if (!r) return null;
                  return (
                    <Link key={r.id} to="/applications" className="flex items-center justify-between rounded-xl border border-white/[0.06] bg-[#161922] px-3.5 py-2.5 text-sm hover:border-emerald-500/30 transition-all">
                      <div className="min-w-0"><div className="font-medium text-zinc-100 truncate">{r.company_name}</div><div className="text-xs text-zinc-400 truncate">{r.job_title}</div></div>
                      <span className="text-xs capitalize text-emerald-400 font-semibold shrink-0 ml-3">{r.status}</span>
                    </Link>
                  );
                })}
              </div>
            </>
          ) : (
            <div className="text-sm text-zinc-400 py-2">No applications yet — <Link to="/applications?new=1" className="text-emerald-400 underline">add your first</Link>.</div>
          )}
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Resume card */}
          <div className="rounded-2xl border border-white/[0.08] bg-[#11141b] p-6 shadow-xl">
            <div className="flex items-center gap-2 mb-4">
              <div className="h-9 w-9 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center"><FileText className="h-4 w-4" /></div>
              <div>
                <h2 className="font-display font-semibold text-white">Your Resume</h2>
                <p className="text-xs text-zinc-400">Upload PDF / DOCX / TXT or paste text</p>
              </div>
            </div>

            <input ref={fileRef} type="file" accept=".pdf,.docx,.txt" className="hidden"
              onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])} />

            <div
              role="button"
              tabIndex={0}
              aria-label="Upload resume file. Drag and drop or click to browse."
              onClick={() => fileRef.current?.click()}
              onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); fileRef.current?.click(); } }}
              onDragEnter={(e) => { e.preventDefault(); setDragActive(true); }}
              onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
              onDragLeave={(e) => { e.preventDefault(); setDragActive(false); }}
              onDrop={(e) => {
                e.preventDefault();
                setDragActive(false);
                const f = e.dataTransfer.files?.[0];
                if (f) handleFile(f);
              }}
              className={`w-full rounded-xl border-2 border-dashed p-8 text-center group cursor-pointer transition-colors ${
                dragActive ? "border-emerald-400 bg-emerald-500/10" : fileError ? "border-destructive/50 bg-destructive/5" : "border-white/10 hover:border-emerald-500/50 hover:bg-[#161922]"
              } ${extracting ? "opacity-70 pointer-events-none" : ""}`}
            >
              {extracting ? (
                <Loader2 className="h-6 w-6 mx-auto animate-spin text-emerald-400" />
              ) : (
                <>
                  <Upload className={`h-6 w-6 mx-auto transition-colors ${dragActive ? "text-emerald-400" : "text-zinc-400 group-hover:text-emerald-400"}`} />
                  <div className="mt-2 text-sm font-medium text-zinc-200">{filename ?? (dragActive ? "Drop your resume here" : "Drag & drop, or click to upload")}</div>
                  <div className="text-xs text-zinc-500">PDF, DOCX, or TXT · max 5 MB</div>
                </>
              )}
            </div>
            {fileError && (
              <div role="alert" className="mt-2 flex items-start gap-2 rounded-lg border border-destructive/40 bg-destructive/10 p-2.5 text-xs text-destructive">
                <AlertTriangle className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                <span>{fileError}</span>
              </div>
            )}

            <div className="mt-4">
              <Label htmlFor="resume" className="text-xs text-zinc-300">Or paste resume text</Label>
              <Textarea id="resume" value={resumeText} onChange={(e) => setResumeText(e.target.value)}
                placeholder="Paste your resume contents here..." className="mt-1.5 min-h-[200px] font-mono text-xs bg-[#161922] border-white/10 text-zinc-100 placeholder:text-zinc-500" />
            </div>
          </div>

          {/* JD card */}
          <div className="rounded-2xl border border-white/[0.08] bg-[#11141b] p-6 shadow-xl">
            <div className="flex items-center gap-2 mb-4">
              <div className="h-9 w-9 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center"><Sparkles className="h-4 w-4" /></div>
              <div>
                <h2 className="font-display font-semibold text-white">Job Description</h2>
                <p className="text-xs text-zinc-400">Paste text or import from a URL</p>
              </div>
            </div>

            <div className="mb-3 flex gap-2">
              <div className="relative flex-1">
                <Link2 className="h-3.5 w-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
                <Input
                  value={jdUrl}
                  onChange={(e) => setJdUrl(e.target.value)}
                  placeholder="Paste job URL (LinkedIn, company site…)"
                  className="pl-8 h-9 text-sm bg-[#161922] border-white/10 text-zinc-100 placeholder:text-zinc-500"
                  onKeyDown={(e) => e.key === "Enter" && handleImportUrl()}
                />
              </div>
              <Button onClick={handleImportUrl} disabled={importingUrl} size="sm" variant="outline" className="h-9 border-white/10 bg-[#161922] text-zinc-200 hover:text-white">
                {importingUrl ? <Loader2 className="h-3.5 w-3.5 animate-spin text-emerald-400" /> : <><Download className="h-3.5 w-3.5 mr-1 text-emerald-400" /> Import</>}
              </Button>
            </div>
            <Textarea value={jobDescription} onChange={(e) => setJobDescription(e.target.value)}
              placeholder="Paste the full job description here — the more detail, the better the tailoring..."
              className="min-h-[240px] bg-[#161922] border-white/10 text-zinc-100 placeholder:text-zinc-500" />

            <div className="mt-4">
              <Label htmlFor="title" className="text-xs text-zinc-300">Version name (optional)</Label>
              <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Acme – Senior Engineer" className="mt-1.5 bg-[#161922] border-white/10 text-zinc-100 placeholder:text-zinc-500" />
            </div>
          </div>
        </div>

        {/* Rewrite level selector */}
        <div className="mt-6 rounded-2xl border border-white/[0.08] bg-[#11141b] p-6 shadow-xl">
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="h-4 w-4 text-emerald-400" />
            <h3 className="font-display font-semibold text-white">Rewrite intensity</h3>
          </div>
          <div className="grid sm:grid-cols-3 gap-3">
            {levels.map(l => (
              <button key={l.value}
                onClick={() => setRewriteLevel(l.value)}
                type="button"
                className={`text-left rounded-xl border-2 p-4 transition-all ${rewriteLevel === l.value ? "border-emerald-500 bg-emerald-500/10 shadow-lg shadow-emerald-500/10" : "border-white/10 bg-[#161922] hover:border-emerald-500/40 text-zinc-300"}`}>
                <div className="font-display font-semibold text-sm text-white">{l.label}</div>
                <div className="text-xs text-zinc-400 mt-0.5">{l.desc}</div>
              </button>
            ))}
          </div>
        </div>

        {lastError && !analyzing && (
          <div className="mt-6 rounded-xl border border-destructive/40 bg-destructive/10 p-4 flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
            <div className="flex-1 text-sm min-w-0">
              <div className="font-semibold text-destructive">Analysis failed</div>
              <div className="text-zinc-400 mt-0.5 break-words">{lastError}</div>
              <div className="text-xs text-zinc-500 mt-1">Your resume and job description are still loaded — no need to re-upload.</div>
            </div>
            <Button onClick={handleAnalyze} size="sm" variant="outline" className="shrink-0 border-white/10 bg-[#161922] text-zinc-200">
              <RefreshCw className="h-3.5 w-3.5 mr-1.5" /> Retry
            </Button>
          </div>
        )}

        <div className="mt-6 flex justify-end">
          <Button onClick={handleAnalyze} disabled={analyzing} size="lg"
            className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-bold shadow-lg shadow-emerald-500/20 h-12 px-8 text-base rounded-xl cursor-pointer">
            {analyzing ? <><Loader2 className="h-4 w-4 mr-2 animate-spin text-slate-950" /> Tailoring...</> : <><Sparkles className="h-4 w-4 mr-2" /> Analyze & Tailor</>}
          </Button>
        </div>

        <AnalyzeProgress open={analyzing} />

        {history.length > 0 && (
          <div className="mt-12">
            <div className="flex items-center justify-between gap-2 mb-4 flex-wrap">
              <div className="flex items-center gap-2">
                <History className="h-4 w-4 text-emerald-400" />
                <h3 className="font-display font-semibold text-white">Your tailored versions</h3>
              </div>
              <Button asChild variant="ghost" size="sm" className="text-zinc-400 hover:text-white">
                <Link to="/history">View all history <ArrowRight className="h-3.5 w-3.5 ml-1" /></Link>
              </Button>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {history.map((h) => {
                if (!h) return null;
                return (
                <button key={h.id} onClick={() => navigate(`/results/${h.id}`)}
                  className="text-left rounded-xl border border-white/[0.08] bg-[#11141b] hover:bg-[#161922] p-4 shadow-lg hover:border-emerald-500/40 hover:-translate-y-0.5 transition-all">
                  <div className="font-display font-semibold truncate text-white">{h.title || "Untitled"}</div>
                  {(h.company || h.role) && (
                    <div className="text-xs text-zinc-400 mt-1 flex items-center gap-1 truncate">
                      <Building2 className="h-3 w-3 shrink-0 text-emerald-400" />
                      {[h.company, h.role].filter(Boolean).join(" · ")}
                    </div>
                  )}
                  <div className="flex items-center justify-between mt-3">
                    <div className="text-xs text-zinc-500 font-mono">{new Date(h.created_at).toLocaleDateString()}</div>
                    <div className="text-sm font-display font-semibold text-zinc-200">Score <span className="text-emerald-400 font-bold">{h.ats_score ?? "—"}</span></div>
                  </div>
                </button>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
