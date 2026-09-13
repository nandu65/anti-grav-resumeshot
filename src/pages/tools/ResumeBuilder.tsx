import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Loader2, Sparkles, Plus, Minus, Copy, Paintbrush, Trash2, Download, FileText, Wand2, FileEdit, Upload, FilePlus2, MousePointer2, ArrowDown, Link2, Wand, CheckCircle2, ArrowLeft, Type, TypeIcon, SpellCheck, Undo2, Redo2, Settings2, Palette, ChevronRight, Share2, Printer, Eye, Target, Bold, Italic, List, ListOrdered, Link as LinkIcon, Underline, Cloud, CloudOff, Award, GripVertical } from "lucide-react";
import { useUndoRedo } from "@/hooks/useUndoRedo";
import { applyFormatToSelection, copyFormatFromSelection, pasteFormatToSelection, describeFormat, TextFormat } from "@/lib/richFormat";
import { History } from "lucide-react";


import { SectionStyleControls, SectionStyles } from "@/components/SectionStyleControls";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import { DragDropContext, Droppable, Draggable } from "react-beautiful-dnd";


import { extractTextFromFile } from "@/lib/extractText";
import { parseResumeTextLocally, separateExperienceAndLeadership } from "@/lib/resumeParser";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Navbar } from "@/components/Navbar";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { Link, useNavigate } from "react-router-dom";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import {
  TEMPLATES, TemplateId, ResumeData, ResumePreview, TemplateMiniPreview, SAMPLE_RESUME_DATA,
  downloadResumePdfFromData, downloadResumeDocxFromData, buildResumeDataVerbatim,
  normalizeResumeSkills, getNormalizedSectionOrder, isGenericSkillCategory,
  A4_WIDTH_PX, A4_HEIGHT_PX,
} from "@/lib/resumeTemplates";
import { BuilderIntroLoader } from "@/components/BuilderIntroLoader";
import { TemplatePreferencesWizard, DEFAULT_PREFS, ResumePrefs } from "@/components/TemplatePreferencesWizard";
import { PreferenceFilterBar, scoreTemplate } from "@/components/PreferenceFilterBar";
import { ResumeDesignFormattingPanel } from "@/components/ResumeDesignFormattingPanel";
import { RESUME_FONTS } from "@/lib/fonts";

const EMPTY_RESUME: ResumeData = SAMPLE_RESUME_DATA;

export default function ResumeBuilder() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const requireAuth = (intent: string) => {
    toast.info(`Sign in to ${intent}`);
    navigate("/auth", { state: { from: "/tools/resume-builder" } });
  };

  const [resumeData, setResumeData] = useState<ResumeData>(() => {
    try {
      const saved = localStorage.getItem("rs-current-resume");
      const data = saved ? JSON.parse(saved) : EMPTY_RESUME;
      return normalizeResumeSkills(data);
    } catch {
      return normalizeResumeSkills(EMPTY_RESUME);
    }
  });
  const [targetJd, setTargetJd] = useState("");
  const [template, setTemplate] = useState<TemplateId>(() => {
    try {
      const saved = localStorage.getItem("rs-current-template");
      return (saved as TemplateId) || "modern";
    } catch {
      return "modern";
    }
  });
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<"ai" | "verbatim">("ai");
  const [starter, setStarter] = useState<"choose" | "scratch" | "uploaded" | "wizard">(() => {
    const saved = localStorage.getItem("rs-builder-starter");
    return (saved as any) || "choose";
  });
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const [showEditHint, setShowEditHint] = useState(false);
  const [showIntro, setShowIntro] = useState(() => !localStorage.getItem("rs-intro-seen"));
  const [prefs, setPrefs] = useState<ResumePrefs>(DEFAULT_PREFS);
  const [spellCheckEnabled, setSpellCheckEnabled] = useState(true);
  const restoring = useRef(false);
  const [copiedFormat, setCopiedFormat] = useState<TextFormat | null>(null);
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const saveTimerRef = useRef<NodeJS.Timeout | null>(null);
  const [showVersionDialog, setShowVersionDialog] = useState(false);
  const [versionName, setVersionName] = useState("");
  const [versions, setVersions] = useState<any[]>([]);
  const [loadingVersions, setLoadingVersions] = useState(false);
  const [dragActiveStarter, setDragActiveStarter] = useState(false);
  const [dragActiveWorkspace, setDragActiveWorkspace] = useState(false);
  const [templateFilter, setTemplateFilter] = useState<string>("all");
  const [previewTemplateId, setPreviewTemplateId] = useState<TemplateId | null>(null);
  const [useSampleDataInModal, setUseSampleDataInModal] = useState(false);
  const dragCounterStarter = useRef(0);
  const dragCounterWorkspace = useRef(0);

  // Canonical A4 preview zoom & viewport scale
  const [zoomMode, setZoomMode] = useState<"fit" | "custom">("fit");
  const [customZoom, setCustomZoom] = useState<number>(100);
  const previewContainerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState<number>(600);
  const [sheetHeight, setSheetHeight] = useState<number>(A4_HEIGHT_PX);
  const sheetWrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = previewContainerRef.current;
    if (!el) return;
    const updateSize = () => {
      if (el.clientWidth > 0) setContainerWidth(el.clientWidth);
    };
    updateSize();
    const ro = new ResizeObserver(() => updateSize());
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    const el = sheetWrapRef.current;
    if (!el) return;
    const updateHeight = () => {
      const sh = el.scrollHeight || el.offsetHeight || A4_HEIGHT_PX;
      setSheetHeight(sh);
    };
    updateHeight();
    const ro = new ResizeObserver(() => updateHeight());
    ro.observe(el);
    if (el.firstElementChild) ro.observe(el.firstElementChild);
    return () => ro.disconnect();
  }, [template, resumeData]);

  const fitScale = useMemo(() => {
    const available = Math.max(200, containerWidth - 32);
    return Math.min(1.2, Math.max(0.35, available / A4_WIDTH_PX));
  }, [containerWidth]);

  const effectiveScale = zoomMode === "fit" ? fitScale : customZoom / 100;

  const handleStarterDragEnter = (e: React.DragEvent) => {
    if (e.dataTransfer && Array.from(e.dataTransfer.types).includes("Files")) {
      e.preventDefault();
      e.stopPropagation();
      dragCounterStarter.current += 1;
      setDragActiveStarter(true);
    }
  };

  const handleStarterDragOver = (e: React.DragEvent) => {
    if (e.dataTransfer && Array.from(e.dataTransfer.types).includes("Files")) {
      e.preventDefault();
      e.stopPropagation();
      setDragActiveStarter(true);
    }
  };

  const handleStarterDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounterStarter.current -= 1;
    if (dragCounterStarter.current <= 0) {
      dragCounterStarter.current = 0;
      setDragActiveStarter(false);
    }
  };

  const handleStarterDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounterStarter.current = 0;
    setDragActiveStarter(false);
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      const file = files[0];
      const ext = file.name.toLowerCase().slice(file.name.lastIndexOf("."));
      if (![".pdf", ".docx", ".txt"].includes(ext)) {
        toast.error("Please drop a valid resume file (.pdf, .docx, or .txt)");
        return;
      }
      onUpload(file);
    }
  };

  const handleWorkspaceDragEnter = (e: React.DragEvent) => {
    if (e.dataTransfer && Array.from(e.dataTransfer.types).includes("Files")) {
      e.preventDefault();
      e.stopPropagation();
      dragCounterWorkspace.current += 1;
      setDragActiveWorkspace(true);
    }
  };

  const handleWorkspaceDragOver = (e: React.DragEvent) => {
    if (e.dataTransfer && Array.from(e.dataTransfer.types).includes("Files")) {
      e.preventDefault();
      e.stopPropagation();
      setDragActiveWorkspace(true);
    }
  };

  const handleWorkspaceDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounterWorkspace.current -= 1;
    if (dragCounterWorkspace.current <= 0) {
      dragCounterWorkspace.current = 0;
      setDragActiveWorkspace(false);
    }
  };

  const handleWorkspaceDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounterWorkspace.current = 0;
    setDragActiveWorkspace(false);
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      const file = files[0];
      const ext = file.name.toLowerCase().slice(file.name.lastIndexOf("."));
      if (![".pdf", ".docx", ".txt"].includes(ext)) {
        toast.error("Please drop a valid resume file (.pdf, .docx, or .txt)");
        return;
      }
      onUpload(file);
    }
  };

  const handleFormat = (command: string, value?: string) => {
    applyFormatToSelection(command, value);
  };

  const handleCopyFormat = () => {
    const fmt = copyFormatFromSelection();
    if (!fmt) return toast.error("Select some formatted text first");
    setCopiedFormat(fmt);
    toast.success(`Format copied — ${describeFormat(fmt)}`);
  };

  const handlePasteFormat = () => {
    if (!copiedFormat) return;
    pasteFormatToSelection(copiedFormat);
    toast.success("Format applied");
  };

  const onDragEnd = (result: any) => {
    if (!result.destination) return;
    const { source, destination } = result;

    // 1. Reordering resume sections
    if (
      result.type === "section" ||
      source.droppableId === "section-order-list" ||
      source.droppableId.endsWith("-content")
    ) {
      const sections = getNormalizedSectionOrder(resumeData.settings?.sectionOrder, resumeData);
      const items = Array.from(sections);
      const [reorderedItem] = items.splice(source.index, 1);
      items.splice(destination.index, 0, reorderedItem);

      setResumeData(prev => ({
        ...prev,
        settings: {
          ...prev.settings,
          sectionOrder: items,
        },
      }));
      return;
    }

    // 2. Reordering work experience entries
    if (source.droppableId === "experience-list") {
      const items = Array.from(resumeData.experience);
      const [reorderedItem] = items.splice(source.index, 1);
      items.splice(destination.index, 0, reorderedItem);
      setResumeData(prev => ({ ...prev, experience: items }));
      return;
    }

    // 3. Reordering leadership experience entries
    if (source.droppableId === "leadership-list") {
      const items = Array.from(resumeData.leadership || []);
      const [reorderedItem] = items.splice(source.index, 1);
      items.splice(destination.index, 0, reorderedItem);
      setResumeData(prev => ({ ...prev, leadership: items }));
      return;
    }

    // 4. Reordering education entries
    if (source.droppableId === "education-list") {
      const items = Array.from(resumeData.education);
      const [reorderedItem] = items.splice(source.index, 1);
      items.splice(destination.index, 0, reorderedItem);
      setResumeData(prev => ({ ...prev, education: items }));
      return;
    }

    // 5. Reordering project entries
    if (source.droppableId === "projects-list") {
      const items = Array.from(resumeData.projects);
      const [reorderedItem] = items.splice(source.index, 1);
      items.splice(destination.index, 0, reorderedItem);
      setResumeData(prev => ({ ...prev, projects: items }));
      return;
    }
  };



  // Persistence & Autosave
  useEffect(() => {
    if (restoring.current) return;
    if (starter !== "choose" && starter !== "wizard") {
      localStorage.setItem("rs-builder-starter", starter);
      localStorage.setItem("rs-current-resume", JSON.stringify(resumeData));
      localStorage.setItem("rs-current-template", template);
      localStorage.setItem("rs-last-edited", new Date().toISOString());
    }

    // Debounced Cloud Sync
    if (!user || starter === "choose" || starter === "wizard") return;

    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    
    setSaveStatus("saving");
    saveTimerRef.current = setTimeout(async () => {
      try {
        const { error } = await supabase
          .from("resume_drafts")
          .upsert({
            user_id: user.id,
            resume_data: resumeData as any,
            template_id: template,
            updated_at: new Date().toISOString()
          }, { onConflict: 'user_id' });

        if (error) throw error;
        setSaveStatus("saved");
        setTimeout(() => setSaveStatus("idle"), 3000);
      } catch (e) {
        console.error("Autosave failed:", e);
        setSaveStatus("error");
      }
    }, 2000);

    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    };
  }, [starter, resumeData, template, user]);

  // Initial Load & Cloud Sync
  useEffect(() => {
    if (!user) return;

    const syncCloudDraft = async () => {
      try {
        const { data, error } = await supabase
          .from("resume_drafts")
          .select("*")
          .single();

        if (error && error.code !== 'PGRST116') throw error; // PGRST116 is not found

        if (data) {
          const localLastEdited = localStorage.getItem("rs-last-edited");
          const cloudLastEdited = data.updated_at;

          // If cloud is newer OR no local data, use cloud
          if (!localLastEdited || new Date(cloudLastEdited) > new Date(localLastEdited)) {
            restoring.current = true;
            setResumeData(data.resume_data as unknown as ResumeData);
            setTemplate(data.template_id as TemplateId);
            setStarter("uploaded"); // Assuming if there's a draft, they've started
            setTimeout(() => { restoring.current = false; }, 0);
            toast.success("Draft loaded from cloud");
          } else {

            // Local is newer, trigger a sync to cloud immediately
            setSaveStatus("saving");
            await supabase.from("resume_drafts").upsert({
              user_id: user.id,
              resume_data: resumeData as any,
              template_id: template,
              updated_at: new Date().toISOString()
            });
            setSaveStatus("saved");
          }
        }
      } catch (e) {
        console.error("Draft sync failed:", e);
      }
    };

    syncCloudDraft();
  }, [user?.id]);



  const fontFamilies = RESUME_FONTS;

  const onUpload = async (file: File) => {
    setUploading(true);
    try {
      const text = await extractTextFromFile(file);
      if (!text.trim()) throw new Error("Could not read text from this file. Please ensure it is a valid PDF, DOCX, or TXT document.");
      
      let p: any = null;
      if (user) {
        try {
          const { data, error } = await supabase.functions.invoke("parse-resume", { body: { text } });
          if (!error && (data as any)?.parsed && Object.keys((data as any).parsed).length > 0) {
            p = (data as any).parsed;
          }
        } catch (err) {
          console.warn("AI parse call failed, using intelligent local parser:", err);
        }
      }
      
      // If AI parse did not return data or user is not logged in, use our local parser
      if (!p || Object.keys(p).length === 0) {
        p = parseResumeTextLocally(text);
      }
      
      const parsedLinks: { label: string; url: string }[] = [];
      if (p.linkedin) parsedLinks.push({ label: "LinkedIn", url: p.linkedin });
      if (p.github) parsedLinks.push({ label: "GitHub", url: p.github });
      if (p.portfolio) parsedLinks.push({ label: "Portfolio", url: p.portfolio });
      if (Array.isArray(p.links)) p.links.forEach((l: any) => l?.url && parsedLinks.push({ label: l.label || "Link", url: l.url }));

      const rawExp = (p.experience || []).map((e: any) => ({
        company: e.company || "", role: e.role || "", location: e.location || "",
        start: e.start || "", end: e.end || "", bullets: Array.isArray(e.bullets) ? e.bullets : (e.bullets ? [e.bullets] : []),
      }));
      const rawLead = (p.leadership || []).map((l: any) => ({
        organization: l.organization || "", role: l.role || "", location: l.location || "",
        start: l.start || "", end: l.end || "", bullets: Array.isArray(l.bullets) ? l.bullets : (l.bullets ? [l.bullets] : []),
      }));

      const { experience, leadership } = separateExperienceAndLeadership(rawExp, rawLead);

      const newResume: ResumeData = {
        ...EMPTY_RESUME,
        name: p.name || "",
        title: p.title || "",
        email: p.email || "",
        phone: p.phone || "",
        location: p.location || "",
        links: parsedLinks.length ? parsedLinks : [{ label: "LinkedIn", url: "" }],
        summary: p.summary || "",
        experience,
        leadership,
        education: (p.education || []).map((e: any) => ({
          school: e.school || "", degree: e.degree || "", location: e.location || "",
          start: e.start || "", end: e.end || "", details: e.details || "",
        })),
        projects: (p.projects || []).map((x: any) => ({
          name: x.name || "", tech: x.tech || "", bullets: Array.isArray(x.bullets) ? x.bullets : (x.bullets ? [x.bullets] : []),
        })),
        skills: (p.skills || []).map((s: any) => {
          if (typeof s === "string") return { category: "Skills", items: [s] };
          return { category: s.category || "Skills", items: Array.isArray(s.items) ? s.items : (s.items ? [s.items] : []) };
        }),
        certifications: Array.isArray(p.certifications) ? p.certifications : (p.certifications ? [p.certifications] : []),
      };


      setResumeData(normalizeResumeSkills({
        ...newResume,
        _isPolished: false
      }));
      setStarter("uploaded");
      toast.success("Resume imported successfully! Review the fields below and polish with AI.");
    } catch (e) {
      console.error("Resume import error:", e);
      toast.error(e instanceof Error ? e.message : "Failed to import resume");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  /* ---- Undo / Redo over the whole editing state ---- */
  const snapshot = useMemo(() => ({
    resumeData, template, targetJd
  }), [resumeData, template, targetJd]);

  const applySnapshot = useCallback((s: typeof snapshot) => {
    restoring.current = true;
    setResumeData(s.resumeData);
    setTemplate(s.template);
    setTargetJd(s.targetJd);
    setTimeout(() => { restoring.current = false; }, 0);
  }, []);

  const describeChange = useCallback((prev: typeof snapshot, next: typeof snapshot) => {
    if (prev.template !== next.template) return `Template → ${next.template}`;
    const po = JSON.stringify(prev.resumeData?.settings?.sectionOrder);
    const no = JSON.stringify(next.resumeData?.settings?.sectionOrder);
    if (po !== no) return "Section moved";
    if (JSON.stringify(prev.resumeData?.settings?.sections) !== JSON.stringify(next.resumeData?.settings?.sections)) return "Formatting changed";
    if (JSON.stringify(prev.resumeData?.skills) !== JSON.stringify(next.resumeData?.skills)) return "Skills edited";
    if (JSON.stringify(prev.resumeData?.experience) !== JSON.stringify(next.resumeData?.experience)) return "Experience edited";
    if (JSON.stringify(prev.resumeData?.leadership) !== JSON.stringify(next.resumeData?.leadership)) return "Leadership edited";
    if (JSON.stringify(prev.resumeData?.education) !== JSON.stringify(next.resumeData?.education)) return "Education edited";
    if (JSON.stringify(prev.resumeData?.projects) !== JSON.stringify(next.resumeData?.projects)) return "Projects edited";
    if (prev.resumeData?.summary !== next.resumeData?.summary) return "Summary edited";
    if (prev.targetJd !== next.targetJd) return "Job description updated";
    return "Content edited";
  }, []);

  const { undo, redo, canUndo, canRedo, history } = useUndoRedo(snapshot, applySnapshot, { delay: 450, describe: describeChange });

  const addExp = () => setResumeData(prev => ({
    ...prev,
    experience: [...prev.experience, { company: "", role: "", location: "", start: "", end: "", bullets: [] }]
  }));
  const addLeadership = () => setResumeData(prev => ({
    ...prev,
    leadership: [...(prev.leadership || []), { role: "", organization: "", location: "", start: "", end: "", bullets: [] }]
  }));
  const addEdu = () => setResumeData(prev => ({
    ...prev,
    education: [...prev.education, { school: "", degree: "", location: "", start: "", end: "", details: "" }]
  }));
  const addProj = () => setResumeData(prev => ({
    ...prev,
    projects: [...prev.projects, { name: "", tech: "", bullets: [] }]
  }));

  const generate = async () => {
    if (!resumeData.name.trim()) return toast.error("Add your name at minimum");
    if (mode === "verbatim") {
      setShowEditHint(true);
      return;
    }
    if (!user) return requireAuth("use AI polish");
    setLoading(true);
    try {
      const profile = {
        ...resumeData,
        links: resumeData.links.filter(l => l.url.trim()).map(l => ({ label: l.label.trim() || "Link", url: l.url.trim() })),
      };
      const { data, error } = await supabase.functions.invoke("generate-resume", { body: { profile, targetJd } });
      if (error || (data as any)?.error) {
        toast.error((data as any)?.error || error?.message || "Failed");
        return;
      }
      const generated = (data as any).resume;
      setResumeData(normalizeResumeSkills({
        ...resumeData,
        ...generated,
        leadership: (generated.leadership && generated.leadership.length > 0) ? generated.leadership : (resumeData.leadership || []),
        _isPolished: true,
        settings: resumeData.settings // Preserve user settings
      }));
      setShowEditHint(true);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const downloadPdf = async () => {
    const toastId = toast.loading("Preparing PDF...");
    try {
      await new Promise(r => setTimeout(r, 100));
      await downloadResumePdfFromData(resumeData, template);
      toast.success("PDF downloaded successfully!", { id: toastId });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to generate PDF", { id: toastId });
    }
  };
  
  const downloadDocx = async () => {
    const toastId = toast.loading("Generating Word document...");
    try {
      await downloadResumeDocxFromData(resumeData, template);
      toast.success("Word document downloaded!", { id: toastId });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to generate Word document", { id: toastId });
    }
  };


  const loadVersions = useCallback(async () => {
    if (!user) return;
    setLoadingVersions(true);
    try {
      const { data, error } = await supabase
        .from("resume_versions")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      setVersions(data || []);
    } catch (e) {
      console.error("Failed to load versions:", e);
    } finally {
      setLoadingVersions(false);
    }
  }, [user]);

  const saveVersion = async () => {
    if (!user) return requireAuth("save a version");
    if (!versionName.trim()) return toast.error("Enter a name for this version");
    
    try {
      const { error } = await supabase.from("resume_versions").insert({
        user_id: user.id,
        name: versionName.trim(),
        resume_data: resumeData as any,
        template_id: template
      });

      if (error) throw error;
      toast.success("Version saved");
      setVersionName("");
      setShowVersionDialog(false);
      loadVersions();
    } catch (e) {
      toast.error("Failed to save version");
      console.error(e);
    }
  };

  const restoreVersion = (v: any) => {
    setResumeData(v.resume_data);
    setTemplate(v.template_id as TemplateId);
    toast.success(`Restored to: ${v.name}`);
  };

  useEffect(() => {
    if (user) loadVersions();
  }, [user, loadVersions]);



  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <div className="min-h-screen bg-background">
      {showIntro && <BuilderIntroLoader onDone={() => { setShowIntro(false); localStorage.setItem("rs-intro-seen", "true"); }} />}
      <TemplatePreferencesWizard
        open={starter === "wizard"}
        onOpenChange={(v) => {
          if (!v) setStarter("choose");
        }}
        initial={prefs}
        onDone={(p) => {
          setPrefs(p); setStarter("scratch");
          const ranked = [...TEMPLATES].sort((a, b) => scoreTemplate(b.id, p) - scoreTemplate(a.id, p));
          if (ranked[0]) setTemplate(ranked[0].id);
        }}
      />
      <Navbar />
      <input ref={fileRef} type="file" accept=".pdf,.docx,.txt" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) onUpload(f); }} />

      {starter === "choose" ? (
        <div 
          className="container py-10 max-w-7xl relative"
          onDragEnter={handleStarterDragEnter}
          onDragOver={handleStarterDragOver}
          onDragLeave={handleStarterDragLeave}
          onDrop={handleStarterDrop}
        >
          <div className="flex items-center gap-3 mb-8">
            <div className="h-12 w-12 rounded-xl bg-gradient-primary text-primary-foreground flex items-center justify-center shadow-glow">
              <Wand2 className="h-6 w-6" />
            </div>
            <div>
              <h1 className="font-display text-3xl font-bold tracking-tight">AI Resume Builder</h1>
              <p className="text-muted-foreground text-sm mt-1">Fill in your info — AI writes polished bullets and formats it into a template.</p>
            </div>
          </div>

          <div className={`mb-6 rounded-2xl border-2 transition-all duration-300 p-6 shadow-card animate-in fade-in slide-in-from-bottom-4 duration-500 ${
            dragActiveStarter 
              ? "border-primary bg-primary/5 shadow-glow ring-4 ring-primary/20 scale-[1.01]" 
              : "border-border bg-gradient-card"
          }`}>
            <div className="text-center mb-8">
              <h2 className="font-display text-2xl font-bold">
                {dragActiveStarter ? "✨ Drop your resume file here!" : "How would you like to start?"}
              </h2>
              <p className="text-muted-foreground mt-2 max-w-lg mx-auto">
                {dragActiveStarter 
                  ? "Release your file to immediately extract and parse your resume with AI." 
                  : "Choose to build a fresh resume from scratch or import your existing one."}
              </p>
            </div>
            <div className="grid sm:grid-cols-2 gap-6 max-w-3xl mx-auto">
              <button 
                type="button" 
                onClick={() => setStarter("wizard")} 
                className="group relative text-left rounded-2xl border-2 border-border bg-background p-6 transition-all duration-300 hover:border-primary/60 hover:-translate-y-1 hover:shadow-glow"
              >
                <div className="h-12 w-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-4 transition-transform group-hover:scale-110 group-hover:bg-primary group-hover:text-primary-foreground">
                  <FilePlus2 className="h-6 w-6" />
                </div>
                <h3 className="font-display text-lg font-bold">Build from scratch</h3>
                <p className="text-sm text-muted-foreground mt-2 text-pretty">Step-by-step guidance for a perfect professional resume.</p>
              </button>

              <div 
                role="button"
                tabIndex={0}
                onClick={() => fileRef.current?.click()} 
                onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); fileRef.current?.click(); } }}
                className={`group relative text-left rounded-2xl border-2 p-6 transition-all duration-300 cursor-pointer ${
                  dragActiveStarter 
                    ? "border-primary bg-primary/15 shadow-glow ring-2 ring-primary scale-[1.03]" 
                    : "border-border bg-background hover:border-primary/60 hover:-translate-y-1 hover:shadow-glow"
                }`}
              >
                <div className={`h-12 w-12 rounded-xl flex items-center justify-center mb-4 transition-transform ${
                  dragActiveStarter 
                    ? "bg-primary text-primary-foreground scale-110 animate-bounce" 
                    : "bg-primary/10 text-primary group-hover:scale-110 group-hover:bg-primary group-hover:text-primary-foreground"
                }`}>
                  <Upload className="h-6 w-6" />
                </div>
                <h3 className="font-display text-lg font-bold">
                  {dragActiveStarter ? "Drop resume file here" : "Upload my resume"}
                </h3>
                <p className="text-sm text-muted-foreground mt-2">
                  {dragActiveStarter 
                    ? "PDF, DOCX, or TXT — will auto-populate all fields." 
                    : "Import your existing PDF/DOCX or drag & drop anywhere."}
                </p>
              </div>
            </div>
            {uploading && (
              <div className="mt-8 flex flex-col items-center justify-center animate-in fade-in zoom-in-95 duration-300">
                <div className="relative">
                  <div className="h-16 w-16 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
                  <Sparkles className="absolute inset-0 m-auto h-6 w-6 text-primary animate-pulse" />
                </div>
                <p className="mt-4 text-sm font-medium text-primary">Analyzing your resume...</p>
                <p className="text-xs text-muted-foreground mt-1 italic">Extracting details with AI magic</p>
              </div>
            )}
            {!uploading && (
              <div className="mt-8 text-center text-xs text-muted-foreground/60">
                Secure SSL encryption • Privacy protected • AI powered
              </div>
            )}
          </div>

          {/* TEMPLATE SHOWCASE WITH LIVE SAMPLE PREVIEW */}
          <div className="mt-12 space-y-6 animate-in fade-in slide-in-from-bottom-6 duration-700">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-primary" />
                  <h2 className="font-display text-2xl font-bold tracking-tight">Explore {TEMPLATES.length} Professional Templates</h2>
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  Preview any template with live sample data or pick one to start tailoring immediately.
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-1.5 bg-muted/60 p-1.5 rounded-xl border border-border">
                {[
                  { id: "all", label: `All (${TEMPLATES.length})` },
                  { id: "popular", label: "Most Popular" },
                  { id: "ats", label: "ATS Friendly" },
                  { id: "executive", label: "Executive" },
                  { id: "modern", label: "Modern" },
                  { id: "creative", label: "Creative" },
                  { id: "academic", label: "Academic" },
                ].map(cat => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setTemplateFilter(cat.id)}
                    className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                      templateFilter === cat.id
                        ? "bg-primary text-primary-foreground shadow-sm"
                        : "text-muted-foreground hover:text-foreground hover:bg-background/80"
                    }`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
              {TEMPLATES.filter(t => templateFilter === "all" || t.category === templateFilter || (templateFilter === "popular" && t.tag?.includes("Popular")) || (templateFilter === "ats" && t.tag?.includes("ATS"))).map(t => {
                const isSelected = template === t.id;
                return (
                  <div
                    key={t.id}
                    className={`group relative rounded-2xl border-2 transition-all duration-300 overflow-hidden flex flex-col bg-card hover:shadow-glow hover:-translate-y-1 ${
                      isSelected ? "border-primary shadow-glow ring-2 ring-primary/30" : "border-border hover:border-primary/50"
                    }`}
                  >
                    <div className="aspect-[1/1.38] w-full bg-slate-100 relative overflow-hidden flex items-start justify-center p-1.5">
                      <TemplateMiniPreview template={t.id} scale={0.19} className="pointer-events-none" />
                      
                      {t.tag && (
                        <div className="absolute top-2 left-2 z-10 px-2 py-0.5 rounded-full bg-slate-900/90 text-primary-foreground text-[9px] font-bold tracking-wider uppercase shadow-md border border-white/10">
                          {t.tag}
                        </div>
                      )}

                      {/* Hover action overlay */}
                      <div className="absolute inset-0 bg-slate-950/70 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center p-3 gap-2 z-20 backdrop-blur-[2px]">
                        <Button
                          size="sm"
                          variant="secondary"
                          className="w-full h-8 text-xs font-semibold gap-1.5 shadow"
                          onClick={() => {
                            setPreviewTemplateId(t.id);
                            setUseSampleDataInModal(true);
                          }}
                        >
                          <Eye className="h-3.5 w-3.5" /> Quick Preview
                        </Button>
                        <Button
                          size="sm"
                          className="w-full h-8 text-xs font-bold gap-1.5 bg-primary text-primary-foreground shadow-glow"
                          onClick={() => {
                            setTemplate(t.id);
                            setStarter("scratch");
                          }}
                        >
                          <Sparkles className="h-3.5 w-3.5" /> Use Template
                        </Button>
                      </div>
                    </div>

                    <div className="p-3 bg-card border-t border-border flex flex-col justify-between flex-1">
                      <div>
                        <div className="flex items-center justify-between gap-1">
                          <h4 className="font-display text-xs font-bold truncate text-foreground group-hover:text-primary transition-colors">
                            {t.name}
                          </h4>
                          {isSelected && <CheckCircle2 className="h-3.5 w-3.5 text-primary shrink-0" />}
                        </div>
                        <p className="text-[10px] text-muted-foreground mt-0.5 line-clamp-2 leading-tight">
                          {t.desc}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      ) : (
        <div 
          className="relative h-[calc(100vh-4.25rem)] overflow-hidden"
          onDragEnter={handleWorkspaceDragEnter}
          onDragOver={handleWorkspaceDragOver}
          onDragLeave={handleWorkspaceDragLeave}
          onDrop={handleWorkspaceDrop}
        >
          {dragActiveWorkspace && (
            <div 
              className="absolute inset-0 z-50 bg-background/85 backdrop-blur-md flex flex-col items-center justify-center p-6 animate-in fade-in zoom-in-95 duration-150 border-4 border-dashed border-primary"
            >
              <div className="max-w-md w-full bg-card rounded-3xl p-8 text-center shadow-2xl border border-primary/30 animate-pulse">
                <div className="h-16 w-16 mx-auto rounded-2xl bg-primary/10 text-primary flex items-center justify-center mb-4">
                  <Upload className="h-8 w-8 animate-bounce" />
                </div>
                <h3 className="text-xl font-bold font-display text-foreground mb-2">Drop resume file to import</h3>
                <p className="text-xs text-muted-foreground">PDF, DOCX, or TXT — AI will extract and populate your resume details automatically.</p>
              </div>
            </div>
          )}
        <div className="w-full px-3 sm:px-6 lg:px-8 py-3 max-w-[1750px] mx-auto h-full flex flex-col overflow-hidden">
          <div className="shrink-0 bg-background/95 backdrop-blur-md border rounded-2xl p-3 mb-3 shadow-sm flex items-center justify-between gap-4 ring-1 ring-border z-20">
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon" onClick={() => setStarter("choose")} className="text-muted-foreground"><ArrowLeft className="h-5 w-5" /></Button>
              <div className="hidden sm:block">
                <h2 className="text-sm font-bold leading-none">ResumeShot AI</h2>
                <p className="text-[10px] text-muted-foreground">Editor</p>
              </div>
              <Separator orientation="vertical" className="h-6 mx-2 hidden sm:block" />

                <div className="flex items-center gap-1">
                  <Button variant="outline" size="icon" onClick={undo} disabled={!canUndo} className="h-8 w-8" title="Undo (Ctrl+Z)"><Undo2 className="h-4 w-4" /></Button>
                  <Button variant="outline" size="icon" onClick={redo} disabled={!canRedo} className="h-8 w-8" title="Redo (Ctrl+Shift+Z)"><Redo2 className="h-4 w-4" /></Button>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" size="icon" className="h-8 w-8" title="Edit history"><History className="h-4 w-4" /></Button>
                    </PopoverTrigger>
                    <PopoverContent align="start" className="w-64 p-0">
                      <div className="px-3 py-2 border-b text-xs font-bold">Recent edits</div>
                      <div className="max-h-64 overflow-y-auto">
                        {history.length === 0 ? (
                          <p className="px-3 py-4 text-xs text-muted-foreground">No edits yet — changes you make will be listed here.</p>
                        ) : history.map((h, i) => (
                          <div key={`${h.at}-${i}`} className="px-3 py-2 text-xs flex items-center justify-between gap-2 border-b last:border-0">
                            <span className="truncate">{h.label}</span>
                            <span className="text-[10px] text-muted-foreground shrink-0">{new Date(h.at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
                          </div>
                        ))}
                      </div>
                      <div className="flex gap-2 p-2 border-t">
                        <Button variant="outline" size="sm" className="flex-1 h-7 text-xs" onClick={undo} disabled={!canUndo}>Undo</Button>
                        <Button variant="outline" size="sm" className="flex-1 h-7 text-xs" onClick={redo} disabled={!canRedo}>Redo</Button>
                      </div>
                    </PopoverContent>
                  </Popover>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" size="icon" className="h-8 w-8" title="Resume versions"><FileText className="h-4 w-4" /></Button>
                    </PopoverTrigger>
                    <PopoverContent align="start" className="w-80 p-0">
                      <div className="px-3 py-2 border-b text-xs font-bold flex items-center justify-between">
                        <span>Resume Versions</span>
                        <Button variant="ghost" size="sm" className="h-7 px-2 text-[10px] gap-1" onClick={() => setShowVersionDialog(true)}>
                          <Plus className="h-3 w-3" /> Save Current
                        </Button>
                      </div>
                      <div className="max-h-80 overflow-y-auto">
                        {loadingVersions ? (
                          <div className="p-8 flex justify-center"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
                        ) : versions.length === 0 ? (
                          <p className="px-3 py-6 text-xs text-muted-foreground text-center italic">No named versions saved yet.</p>
                        ) : versions.map((v) => (
                          <div key={v.id} className="px-3 py-3 text-xs flex items-center justify-between border-b last:border-0 hover:bg-muted/30 transition-colors group">
                            <div className="flex-1 min-w-0 pr-2">
                              <div className="font-bold truncate text-foreground">{v.name}</div>
                              <div className="text-[10px] text-muted-foreground mt-0.5">
                                {new Date(v.created_at).toLocaleDateString()} {new Date(v.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </div>
                            </div>
                            <Button variant="outline" size="sm" className="h-7 text-[10px] opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => restoreVersion(v)}>Restore</Button>
                          </div>
                        ))}
                      </div>
                    </PopoverContent>
                  </Popover>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {user && (
                  <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-muted/50 text-[10px] font-bold border border-border/50 text-muted-foreground mr-2">
                    {saveStatus === "saving" ? (
                      <Cloud className="h-3 w-3 animate-pulse text-primary" />
                    ) : saveStatus === "error" ? (
                      <CloudOff className="h-3 w-3 text-destructive" />
                    ) : (
                      <CheckCircle2 className="h-3 w-3 text-green-500" />
                    )}
                    <span className="hidden sm:inline">
                      {saveStatus === "saving" ? "Saving..." : saveStatus === "error" ? "Offline" : "Synced"}
                    </span>
                  </div>
                )}

                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => fileRef.current?.click()} 
                  className="h-9 rounded-full gap-2 border-primary/20 hover:bg-primary/5"
                  title="Import or drag a resume file (PDF, DOCX, TXT)"
                >
                  <Upload className="h-4 w-4 text-primary" />
                  <span className="hidden sm:inline">Import</span>
                </Button>

                <Sheet>
                  <SheetTrigger asChild>
                    <Button variant="outline" size="sm" className="h-9 rounded-full gap-2 border-primary/20 hover:bg-primary/5">
                      <Palette className="h-4 w-4 text-primary" />
                      <span className="hidden sm:inline">Design & Layout</span>
                    </Button>
                  </SheetTrigger>
                  <SheetContent side="right" className="w-[400px] sm:w-[540px]">
                    <SheetHeader><SheetTitle>Design & Layout</SheetTitle></SheetHeader>
                    <div className="py-6 space-y-8 overflow-y-auto max-h-[calc(100vh-100px)] px-1">
                      <div>
                        <div className="flex items-center justify-between mb-3">
                          <Label className="text-base font-bold">Templates</Label>
                          <span className="text-xs text-primary font-semibold">{TEMPLATES.length} Styles</span>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          {TEMPLATES.map(t => (
                            <button 
                              key={t.id} 
                              type="button"
                              onClick={() => {
                                setTemplate(t.id);
                              }} 
                              className={`group relative rounded-xl border-2 transition-all overflow-hidden flex flex-col text-left ${template === t.id ? "border-primary shadow-glow bg-primary/5 ring-1 ring-primary" : "border-border hover:border-primary/40 bg-card hover:bg-accent/40"}`}
                            >
                              <div className="aspect-[1/1.35] w-full bg-slate-100 relative overflow-hidden flex items-start justify-center p-1 border-b">
                                <TemplateMiniPreview template={t.id} data={resumeData} scale={0.17} className="pointer-events-none" />
                                {t.tag && (
                                  <div className="absolute top-1.5 left-1.5 z-10 px-1.5 py-0.5 rounded bg-slate-900/90 text-primary-foreground text-[8px] font-bold tracking-wider uppercase border border-white/10">
                                    {t.tag}
                                  </div>
                                )}
                                {template === t.id && (
                                  <div className="absolute top-1.5 right-1.5 z-20 bg-primary text-primary-foreground rounded-full p-0.5 shadow-md">
                                    <CheckCircle2 className="h-3.5 w-3.5" />
                                  </div>
                                )}
                              </div>
                              <div className="p-2.5 bg-background">
                                <span className="text-[11px] font-bold block truncate group-hover:text-primary transition-colors">{t.name}</span>
                                <span className="text-[9px] text-muted-foreground leading-tight mt-0.5 line-clamp-1">{t.desc}</span>
                              </div>
                            </button>
                          ))}
                        </div>
                      </div>
                      <Separator />
                      <PreferenceFilterBar prefs={prefs} onChange={setPrefs} onOpenWizard={() => setStarter("wizard")} />
                      <Separator />
                      <div className="space-y-4">
                        <Label className="text-base font-bold block">Global Typography</Label>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label className="text-xs">Font Family</Label>
                            <select className="w-full bg-background border border-border rounded-lg px-2 py-2 text-sm outline-none" value={resumeData.settings?.fontFamily} onChange={e => setResumeData(prev => ({ ...prev, settings: { ...prev.settings, fontFamily: e.target.value } }))}>
                              {fontFamilies.map(f => <option key={f.value} value={f.value}>{f.label}</option>)}
                            </select>
                          </div>
                          <div className="space-y-2">
                            <Label className="text-xs">Base Size ({resumeData.settings?.fontSize}px)</Label>
                            <div className="flex items-center gap-1 bg-muted/50 rounded-lg p-1">
                              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setResumeData(prev => ({ ...prev, settings: { ...prev.settings, fontSize: Math.max(8, (prev.settings?.fontSize || 11) - 1) } }))}>-</Button>
                              <span className="flex-1 text-center font-bold">{resumeData.settings?.fontSize}</span>
                              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setResumeData(prev => ({ ...prev, settings: { ...prev.settings, fontSize: Math.min(16, (prev.settings?.fontSize || 11) + 1) } }))}>+</Button>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center justify-between p-3 bg-muted/30 rounded-xl border">
                           <div className="flex items-center gap-2">
                              <SpellCheck className={`h-4 w-4 ${spellCheckEnabled ? 'text-primary' : 'text-muted-foreground'}`} />
                              <Label className="text-sm">Spell Check</Label>
                           </div>
                           <input type="checkbox" checked={spellCheckEnabled} onChange={e => setSpellCheckEnabled(e.target.checked)} className="h-4 w-4 accent-primary" />
                        </div>
                      </div>
                      <Separator />
                      <SectionStyleControls value={resumeData.settings?.sections || {}} onChange={sections => setResumeData(prev => ({ ...prev, settings: { ...prev.settings, sections } }))} baseSize={resumeData.settings?.fontSize || 11} />
                    </div>
                  </SheetContent>
                </Sheet>
                
                <Popover>
                  <PopoverTrigger asChild>
                    <Button className="h-9 rounded-full bg-gradient-primary shadow-glow gap-2">
                      <Download className="h-4 w-4" />
                      <span className="hidden sm:inline">Export</span>
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-48 p-2" align="end">
                    <Button variant="ghost" className="w-full justify-start gap-2" onClick={downloadPdf} disabled={!resumeData || !resumeData.name}><FileText className="h-4 w-4" /> PDF Document</Button>
                    <Button variant="ghost" className="w-full justify-start gap-2" onClick={downloadDocx} disabled={!resumeData || !resumeData.name}><FileEdit className="h-4 w-4" /> Word (DOCX)</Button>
                  </PopoverContent>
                </Popover>

                <div className="lg:hidden">
                    <Sheet>
                        <SheetTrigger asChild>
                            <Button variant="outline" size="icon" className="h-9 w-9 rounded-full"><Eye className="h-4 w-4" /></Button>
                        </SheetTrigger>
                        <SheetContent side="bottom" className="h-[90vh] p-0">
                            <div className="p-4 border-b flex items-center justify-between">
                                <h3 className="font-bold">Preview</h3>
                                <Button variant="ghost" size="sm" onClick={() => window.print()}><Printer className="h-4 w-4" /></Button>
                            </div>
                            <ScrollArea className="h-full p-6">
                                {resumeData ? (
                                    <ResumePreview template={template} data={resumeData} onChange={setResumeData} />
                                ) : (
                                    <div className="text-center py-20 text-muted-foreground italic">Preview pending...</div>
                                )}
                            </ScrollArea>
                        </SheetContent>
                    </Sheet>
                </div>
              </div>
            </div>

            <div className="flex-1 min-h-0 grid lg:grid-cols-[0.82fr_1.38fr] xl:grid-cols-[0.85fr_1.45fr] gap-5 overflow-hidden">
              {/* LEFT COLUMN: FORM EDITOR */}
              <div className="h-full overflow-y-auto overflow-x-hidden pr-3 custom-scrollbar space-y-6 min-h-0">
                {/* NAVIGATION */}
                <nav className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide sticky top-0 z-20 bg-background/95 backdrop-blur-md py-2 px-1 -mx-1 border-b">
                  {[
                    { id: "basics", label: "Basics", icon: CheckCircle2 },
                    { id: "summary", label: "Summary", icon: Sparkles },
                    { id: "experience", label: "Experience", icon: FileText },
                    { id: "leadership", label: "Leadership", icon: Award },
                    { id: "education", label: "Education", icon: ArrowDown },
                    { id: "skills", label: "Skills", icon: Wand },
                    { id: "projects", label: "Projects", icon: Link2 },
                    { id: "certs", label: "Certs", icon: CheckCircle2 },
                  ].map((s) => (
                    <button 
                      key={s.id} 
                      onClick={() => {
                        const el = document.getElementById(`section-${s.id}`);
                        if (el) {
                          el.scrollIntoView({ behavior: "smooth", block: "start" });
                        }
                      }}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-muted/50 border border-transparent rounded-xl text-[11px] font-bold hover:bg-primary hover:text-primary-foreground hover:border-primary/20 transition-all shrink-0 shadow-sm"
                    >
                      <s.icon className="h-3 w-3" />
                      {s.label}
                    </button>
                  ))}
                </nav>



                {/* BASICS */}
                <div id="section-basics" className="bg-card border-2 border-border rounded-2xl p-6 shadow-card transition-all hover:border-primary/20">
                  <div className="flex items-center gap-2 mb-6 border-b pb-4">
                    <CheckCircle2 className="h-5 w-5 text-primary" />
                    <h3 className="font-display text-lg font-bold">1. Personal Information</h3>
                  </div>
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <Label className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground ml-1">Full Name</Label>
                      <Input value={resumeData.name} onChange={e => setResumeData({ ...resumeData, name: e.target.value })} placeholder="John Doe" className="rounded-xl border-border/60" name="resume-name" />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground ml-1">Job Title</Label>
                      <Input value={resumeData.title} onChange={e => setResumeData({ ...resumeData, title: e.target.value })} placeholder="Software Engineer" className="rounded-xl border-border/60" name="resume-title" />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground ml-1">Email</Label>
                      <Input value={resumeData.email} onChange={e => setResumeData({ ...resumeData, email: e.target.value })} placeholder="john@example.com" className="rounded-xl border-border/60" name="resume-email" />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground ml-1">Phone</Label>
                      <Input value={resumeData.phone} onChange={e => setResumeData({ ...resumeData, phone: e.target.value })} placeholder="+1 (555) 000-0000" className="rounded-xl border-border/60" name="resume-phone" />
                    </div>
                  </div>
                </div>

                {/* SUMMARY */}
                <div id="section-summary" className="bg-card border-2 border-border rounded-2xl p-6 shadow-card transition-all hover:border-primary/20">
                   <div className="flex items-center justify-between mb-6 border-b pb-4">
                     <div className="flex items-center gap-1.5 flex-1 min-w-0 mr-2">
                        <Sparkles className="h-5 w-5 text-primary shrink-0" />
                        <span className="font-display text-sm font-bold text-muted-foreground shrink-0">2.</span>
                        <Input
                          value={resumeData.settings?.customSectionTitles?.summary ?? "Professional Summary"}
                          onChange={e => {
                            const val = e.target.value;
                            setResumeData(prev => ({
                              ...prev,
                              settings: {
                                ...prev.settings,
                                customSectionTitles: {
                                  ...(prev.settings?.customSectionTitles || {}),
                                  summary: val,
                                }
                              }
                            }));
                          }}
                          className="h-8 font-display text-base font-bold bg-transparent border-transparent hover:border-border/60 focus:border-primary focus:bg-background px-1.5 max-w-[240px] rounded-lg transition-colors"
                          title="Click to rename section heading"
                        />
                     </div>
                     <div className="flex gap-2 shrink-0">
                        <Popover>
                            <PopoverTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full hover:bg-primary/5 text-primary" title="Typography">
                                <Settings2 className="h-4 w-4" />
                            </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-80" align="end">
                                <SectionStyleControls value={resumeData.settings?.sections || {}} onChange={sections => setResumeData(prev => ({ ...prev, settings: { ...prev.settings, sections } }))} baseSize={resumeData.settings?.fontSize || 11} sectionKey="summary" hideHeader />
                            </PopoverContent>
                        </Popover>
                        <Button variant="outline" size="sm" className="h-8 rounded-full text-[10px] font-bold gap-1 border-primary/20 hover:bg-primary/5 text-primary">
                            <Wand2 className="h-3 w-3" />
                            AI POLISH
                        </Button>
                     </div>
                   </div>
                   <Textarea 
                     value={resumeData.summary} 
                     onChange={e => setResumeData({ ...resumeData, summary: e.target.value })} 
                     placeholder="A brief overview of your professional background..." 
                     className="min-h-[120px] rounded-xl border-border/60 resize-none" 
                     spellCheck={spellCheckEnabled} 
                     name="resume-summary"
                   />
                </div>

                {/* EXPERIENCE */}
                <div id="section-experience" className="bg-card border-2 border-border rounded-2xl p-6 shadow-card transition-all hover:border-primary/20">
                  <div className="flex items-center justify-between mb-6 border-b pb-4">
                     <div className="flex items-center gap-1.5 flex-1 min-w-0 mr-2">
                        <FileText className="h-5 w-5 text-primary shrink-0" />
                        <span className="font-display text-sm font-bold text-muted-foreground shrink-0">3.</span>
                        <Input
                          value={resumeData.settings?.customSectionTitles?.experience ?? "Work Experience"}
                          onChange={e => {
                            const val = e.target.value;
                            setResumeData(prev => ({
                              ...prev,
                              settings: {
                                ...prev.settings,
                                customSectionTitles: {
                                  ...(prev.settings?.customSectionTitles || {}),
                                  experience: val,
                                }
                              }
                            }));
                          }}
                          className="h-8 font-display text-base font-bold bg-transparent border-transparent hover:border-border/60 focus:border-primary focus:bg-background px-1.5 max-w-[240px] rounded-lg transition-colors"
                          title="Click to rename section heading"
                        />
                     </div>
                     <div className="flex gap-2 shrink-0">
                        <Popover>
                            <PopoverTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full hover:bg-primary/5 text-primary" title="Typography">
                                <Settings2 className="h-4 w-4" />
                            </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-80" align="end">
                                <SectionStyleControls value={resumeData.settings?.sections || {}} onChange={sections => setResumeData(prev => ({ ...prev, settings: { ...prev.settings, sections } }))} baseSize={resumeData.settings?.fontSize || 11} sectionKey="experience" hideHeader />
                            </PopoverContent>
                        </Popover>
                        <Button variant="outline" size="sm" onClick={addExp} className="h-8 rounded-full gap-1 border-primary/20 hover:bg-primary/5 text-primary">
                            <Plus className="h-3 w-3" />
                            <span className="text-[10px] font-bold">ADD ROLE</span>
                        </Button>
                     </div>
                   </div>
                                 <Droppable droppableId="experience-list">
                     {(provided) => (
                       <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-4">
                         {resumeData.experience.map((exp, i) => (
                           <Draggable key={`exp-${i}`} draggableId={`exp-${i}`} index={i}>
                             {(prov, snap) => (
                               <div
                                 ref={prov.innerRef}
                                 {...prov.draggableProps}
                                 className={`group p-5 rounded-2xl border bg-muted/20 relative transition-all ${
                                   snap.isDragging ? "shadow-2xl ring-2 ring-primary bg-background z-50 scale-[1.02]" : ""
                                 }`}
                               >
                                 <div className="flex items-center justify-between mb-3 border-b border-border/50 pb-2">
                                   <div
                                     {...prov.dragHandleProps}
                                     className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground cursor-grab active:cursor-grabbing text-xs font-semibold"
                                     title="Drag to reorder role"
                                   >
                                     <GripVertical className="h-4 w-4" />
                                     <span>Role #{i + 1}</span>
                                   </div>
                                   <Button 
                                     variant="ghost" 
                                     size="icon" 
                                     className="h-7 w-7 rounded-full text-destructive hover:bg-destructive/10" 
                                     onClick={() => setResumeData(prev => ({ ...prev, experience: prev.experience.filter((_, j) => i !== j) }))}
                                   >
                                     <Trash2 className="h-3.5 w-3.5" />
                                   </Button>
                                 </div>
                                 <div className="grid sm:grid-cols-2 gap-4 mb-4">
                                   <div className="space-y-1">
                                     <Label className="text-[9px] uppercase font-bold text-muted-foreground ml-1">Company</Label>
                                     <Input value={exp.company} onChange={e => { const n = [...resumeData.experience]; n[i].company = e.target.value; setResumeData({ ...resumeData, experience: n }); }} placeholder="Company" className="h-9 rounded-lg border-border/60 bg-background" />
                                   </div>
                                   <div className="space-y-1">
                                     <Label className="text-[9px] uppercase font-bold text-muted-foreground ml-1">Role</Label>
                                     <Input value={exp.role} onChange={e => { const n = [...resumeData.experience]; n[i].role = e.target.value; setResumeData({ ...resumeData, experience: n }); }} placeholder="Role" className="h-9 rounded-lg border-border/60 bg-background" />
                                   </div>
                                 </div>
                                 <div className="grid sm:grid-cols-3 gap-4 mb-4">
                                   <div className="space-y-1">
                                     <Label className="text-[9px] uppercase font-bold text-muted-foreground ml-1">Location</Label>
                                     <Input value={exp.location} onChange={e => { const n = [...resumeData.experience]; n[i].location = e.target.value; setResumeData({ ...resumeData, experience: n }); }} placeholder="Remote / City" className="h-9 rounded-lg border-border/60 bg-background" />
                                   </div>
                                   <div className="space-y-1">
                                     <Label className="text-[9px] uppercase font-bold text-muted-foreground ml-1">Start Date</Label>
                                     <Input value={exp.start} onChange={e => { const n = [...resumeData.experience]; n[i].start = e.target.value; setResumeData({ ...resumeData, experience: n }); }} placeholder="Jan 2022" className="h-9 rounded-lg border-border/60 bg-background" />
                                   </div>
                                   <div className="space-y-1">
                                     <Label className="text-[9px] uppercase font-bold text-muted-foreground ml-1">End Date</Label>
                                     <Input value={exp.end} onChange={e => { const n = [...resumeData.experience]; n[i].end = e.target.value; setResumeData({ ...resumeData, experience: n }); }} placeholder="Present" className="h-9 rounded-lg border-border/60 bg-background" />
                                   </div>
                                 </div>
                                 <div className="relative space-y-1">
                                   <Label className="text-[9px] uppercase font-bold text-muted-foreground ml-1">Description</Label>
                                   <Textarea 
                                     value={exp.bullets.join('\n')} 
                                     onChange={e => { const n = [...resumeData.experience]; n[i].bullets = e.target.value.split('\n'); setResumeData({ ...resumeData, experience: n }); }} 
                                     placeholder="Bullet points describing your achievements..." 
                                     className="min-h-[100px] rounded-lg border-border/60 bg-background resize-none pb-10" 
                                     spellCheck={spellCheckEnabled} 
                                   />
                                   <div className="absolute bottom-2 right-2 flex gap-1">
                                     <Button variant="ghost" size="sm" className="h-7 text-[9px] font-bold text-primary hover:bg-primary/10">
                                       <Sparkles className="h-3 w-3 mr-1" />
                                       IMPROVE
                                     </Button>
                                   </div>
                                 </div>
                               </div>
                             )}
                           </Draggable>
                         ))}
                         {provided.placeholder}
                         {resumeData.experience.length === 0 && (
                           <div className="text-center py-10 border-2 border-dashed rounded-2xl text-muted-foreground italic">No experience added.</div>
                         )}
                       </div>
                     )}
                   </Droppable>
                 </div>

                {/* LEADERSHIP EXPERIENCE */}
                <div id="section-leadership" className="bg-card border-2 border-border rounded-2xl p-6 shadow-card transition-all hover:border-primary/20">
                   <div className="flex items-center justify-between mb-6 border-b pb-4">
                     <div className="flex items-center gap-1.5 flex-1 min-w-0 mr-2">
                        <Award className="h-5 w-5 text-primary shrink-0" />
                        <span className="font-display text-sm font-bold text-muted-foreground shrink-0">4.</span>
                        <Input
                          value={resumeData.settings?.customSectionTitles?.leadership ?? "Leadership Experience"}
                          onChange={e => {
                            const val = e.target.value;
                            setResumeData(prev => ({
                              ...prev,
                              settings: {
                                ...prev.settings,
                                customSectionTitles: {
                                  ...(prev.settings?.customSectionTitles || {}),
                                  leadership: val,
                                }
                              }
                            }));
                          }}
                          className="h-8 font-display text-base font-bold bg-transparent border-transparent hover:border-border/60 focus:border-primary focus:bg-background px-1.5 max-w-[260px] rounded-lg transition-colors"
                          title="Click to rename section heading"
                        />
                     </div>
                     <div className="flex gap-2 shrink-0">
                        <Popover>
                            <PopoverTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full hover:bg-primary/5 text-primary" title="Typography">
                                <Settings2 className="h-4 w-4" />
                            </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-80" align="end">
                                <SectionStyleControls value={resumeData.settings?.sections || {}} onChange={sections => setResumeData(prev => ({ ...prev, settings: { ...prev.settings, sections } }))} baseSize={resumeData.settings?.fontSize || 11} sectionKey="leadership" hideHeader />
                            </PopoverContent>
                        </Popover>
                        <Button variant="outline" size="sm" onClick={addLeadership} className="h-8 rounded-full gap-1 border-primary/20 hover:bg-primary/5 text-primary">
                            <Plus className="h-3 w-3" />
                            <span className="text-[10px] font-bold">ADD ROLE</span>
                        </Button>
                     </div>
                   </div>
                   <Droppable droppableId="leadership-list">
                     {(provided) => (
                       <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-4">
                         {(resumeData.leadership || []).map((lead, i) => (
                           <Draggable key={`lead-${i}`} draggableId={`lead-${i}`} index={i}>
                             {(prov, snap) => (
                               <div
                                 ref={prov.innerRef}
                                 {...prov.draggableProps}
                                 className={`group p-5 rounded-2xl border bg-muted/20 relative transition-all ${
                                   snap.isDragging ? "shadow-2xl ring-2 ring-primary bg-background z-50 scale-[1.02]" : ""
                                 }`}
                               >
                                 <div className="flex items-center justify-between mb-3 border-b border-border/50 pb-2">
                                   <div
                                     {...prov.dragHandleProps}
                                     className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground cursor-grab active:cursor-grabbing text-xs font-semibold"
                                     title="Drag to reorder leadership role"
                                   >
                                     <GripVertical className="h-4 w-4" />
                                     <span>Leadership Role #{i + 1}</span>
                                   </div>
                                   <Button variant="ghost" size="icon" className="h-7 w-7 rounded-full text-destructive hover:bg-destructive/10" onClick={() => setResumeData(prev => ({ ...prev, leadership: (prev.leadership || []).filter((_, j) => i !== j) }))}>
                                     <Trash2 className="h-3.5 w-3.5" />
                                   </Button>
                                 </div>
                                 <div className="grid sm:grid-cols-2 gap-4 mb-4">
                                   <div className="space-y-1">
                                     <Label className="text-[9px] uppercase font-bold text-muted-foreground ml-1">Organization</Label>
                                     <Input value={lead.organization} onChange={e => { const n = [...(resumeData.leadership || [])]; n[i].organization = e.target.value; setResumeData({ ...resumeData, leadership: n }); }} placeholder="Organization" className="h-9 rounded-lg border-border/60 bg-background" />
                                   </div>
                                   <div className="space-y-1">
                                     <Label className="text-[9px] uppercase font-bold text-muted-foreground ml-1">Role</Label>
                                     <Input value={lead.role} onChange={e => { const n = [...(resumeData.leadership || [])]; n[i].role = e.target.value; setResumeData({ ...resumeData, leadership: n }); }} placeholder="Role" className="h-9 rounded-lg border-border/60 bg-background" />
                                   </div>
                                 </div>
                                 <div className="relative space-y-1">
                                     <Label className="text-[9px] uppercase font-bold text-muted-foreground ml-1">Description</Label>
                                     <Textarea value={(lead.bullets || []).join('\n')} onChange={e => { const n = [...(resumeData.leadership || [])]; n[i].bullets = e.target.value.split('\n'); setResumeData({ ...resumeData, leadership: n }); }} placeholder="Bullet points..." className="min-h-[100px] rounded-lg border-border/60 bg-background resize-none" spellCheck={spellCheckEnabled} />
                                 </div>
                               </div>
                             )}
                           </Draggable>
                         ))}
                         {provided.placeholder}
                         {(!resumeData.leadership || resumeData.leadership.length === 0) && (
                           <div className="text-center py-10 border-2 border-dashed rounded-2xl text-muted-foreground italic">No leadership added.</div>
                         )}
                       </div>
                     )}
                   </Droppable>
                </div>

                {/* EDUCATION */}
                <div id="section-education" className="bg-card border-2 border-border rounded-2xl p-6 shadow-card transition-all hover:border-primary/20">
                  <div className="flex items-center justify-between mb-6 border-b pb-4">
                     <div className="flex items-center gap-1.5 flex-1 min-w-0 mr-2">
                        <ArrowDown className="h-5 w-5 text-primary shrink-0" />
                        <span className="font-display text-sm font-bold text-muted-foreground shrink-0">5.</span>
                        <Input
                          value={resumeData.settings?.customSectionTitles?.education ?? "Education"}
                          onChange={e => {
                            const val = e.target.value;
                            setResumeData(prev => ({
                              ...prev,
                              settings: {
                                ...prev.settings,
                                customSectionTitles: {
                                  ...(prev.settings?.customSectionTitles || {}),
                                  education: val,
                                }
                              }
                            }));
                          }}
                          className="h-8 font-display text-base font-bold bg-transparent border-transparent hover:border-border/60 focus:border-primary focus:bg-background px-1.5 max-w-[240px] rounded-lg transition-colors"
                          title="Click to rename section heading"
                        />
                     </div>
                     <div className="flex gap-2 shrink-0">
                         <Popover>
                             <PopoverTrigger asChild>
                             <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full hover:bg-primary/5 text-primary" title="Typography">
                                 <Settings2 className="h-4 w-4" />
                             </Button>
                             </PopoverTrigger>
                             <PopoverContent className="w-80" align="end">
                                 <SectionStyleControls value={resumeData.settings?.sections || {}} onChange={sections => setResumeData(prev => ({ ...prev, settings: { ...prev.settings, sections } }))} baseSize={resumeData.settings?.fontSize || 11} sectionKey="education" hideHeader />
                             </PopoverContent>
                         </Popover>
                         <Button variant="outline" size="sm" onClick={addEdu} className="h-8 rounded-full gap-1 border-primary/20 hover:bg-primary/5 text-primary">
                             <Plus className="h-3 w-3" />
                             <span className="text-[10px] font-bold">ADD SCHOOL</span>
                         </Button>
                      </div>
                    </div>
                    <Droppable droppableId="education-list">
                       {(provided) => (
                         <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-4">
                           {resumeData.education.map((edu, i) => (
                             <Draggable key={`edu-${i}`} draggableId={`edu-${i}`} index={i}>
                               {(prov, snap) => (
                                 <div
                                   ref={prov.innerRef}
                                   {...prov.draggableProps}
                                   className={`group p-5 rounded-2xl border bg-muted/20 relative transition-all ${
                                     snap.isDragging ? "shadow-2xl ring-2 ring-primary bg-background z-50 scale-[1.02]" : ""
                                   }`}
                                 >
                                   <div className="flex items-center justify-between mb-3 border-b border-border/50 pb-2">
                                     <div
                                       {...prov.dragHandleProps}
                                       className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground cursor-grab active:cursor-grabbing text-xs font-semibold"
                                       title="Drag to reorder school"
                                     >
                                       <GripVertical className="h-4 w-4" />
                                       <span>Education #{i + 1}</span>
                                     </div>
                                     <Button variant="ghost" size="icon" className="h-7 w-7 rounded-full text-destructive hover:bg-destructive/10" onClick={() => setResumeData(prev => ({ ...prev, education: prev.education.filter((_, j) => i !== j) }))}>
                                       <Trash2 className="h-3.5 w-3.5" />
                                     </Button>
                                   </div>
                                   <div className="grid sm:grid-cols-2 gap-4 mb-4">
                                     <div className="space-y-1">
                                       <Label className="text-[9px] uppercase font-bold text-muted-foreground ml-1">School</Label>
                                       <Input value={edu.school} onChange={e => { const n = [...resumeData.education]; n[i].school = e.target.value; setResumeData({ ...resumeData, education: n }); }} placeholder="University Name" className="h-9 rounded-lg border-border/60 bg-background" />
                                     </div>
                                     <div className="space-y-1">
                                       <Label className="text-[9px] uppercase font-bold text-muted-foreground ml-1">Degree</Label>
                                       <Input value={edu.degree} onChange={e => { const n = [...resumeData.education]; n[i].degree = e.target.value; setResumeData({ ...resumeData, education: n }); }} placeholder="B.S. in Computer Science" className="h-9 rounded-lg border-border/60 bg-background" />
                                     </div>
                                   </div>
                                   <div className="grid sm:grid-cols-3 gap-4 mb-4">
                                     <div className="space-y-1">
                                       <Label className="text-[9px] uppercase font-bold text-muted-foreground ml-1">Location</Label>
                                       <Input value={edu.location} onChange={e => { const n = [...resumeData.education]; n[i].location = e.target.value; setResumeData({ ...resumeData, education: n }); }} placeholder="City, State" className="h-9 rounded-lg border-border/60 bg-background" />
                                     </div>
                                     <div className="space-y-1">
                                       <Label className="text-[9px] uppercase font-bold text-muted-foreground ml-1">Start Date</Label>
                                       <Input value={edu.start} onChange={e => { const n = [...resumeData.education]; n[i].start = e.target.value; setResumeData({ ...resumeData, education: n }); }} placeholder="2018" className="h-9 rounded-lg border-border/60 bg-background" />
                                     </div>
                                     <div className="space-y-1">
                                       <Label className="text-[9px] uppercase font-bold text-muted-foreground ml-1">End Date</Label>
                                       <Input value={edu.end} onChange={e => { const n = [...resumeData.education]; n[i].end = e.target.value; setResumeData({ ...resumeData, education: n }); }} placeholder="2022" className="h-9 rounded-lg border-border/60 bg-background" />
                                     </div>
                                   </div>
                                   <div className="space-y-1">
                                       <Label className="text-[9px] uppercase font-bold text-muted-foreground ml-1">Details / Honors</Label>
                                       <Input value={edu.details} onChange={e => { const n = [...resumeData.education]; n[i].details = e.target.value; setResumeData({ ...resumeData, education: n }); }} placeholder="GPA: 3.9, Dean's List..." className="h-9 rounded-lg border-border/60 bg-background" />
                                   </div>
                                 </div>
                               )}
                             </Draggable>
                           ))}
                           {provided.placeholder}
                           {resumeData.education.length === 0 && (
                             <div className="text-center py-10 border-2 border-dashed rounded-2xl text-muted-foreground italic">No education added.</div>
                           )}
                         </div>
                       )}
                     </Droppable>
                </div>

                {/* PROJECTS */}
                <div id="section-projects" className="bg-card border-2 border-border rounded-2xl p-6 shadow-card transition-all hover:border-primary/20">
                  <div className="flex items-center justify-between mb-6 border-b pb-4">
                     <div className="flex items-center gap-1.5 flex-1 min-w-0 mr-2">
                        <Link2 className="h-5 w-5 text-primary shrink-0" />
                        <span className="font-display text-sm font-bold text-muted-foreground shrink-0">6.</span>
                        <Input
                          value={resumeData.settings?.customSectionTitles?.projects ?? "Projects"}
                          onChange={e => {
                            const val = e.target.value;
                            setResumeData(prev => ({
                              ...prev,
                              settings: {
                                ...prev.settings,
                                customSectionTitles: {
                                  ...(prev.settings?.customSectionTitles || {}),
                                  projects: val,
                                }
                              }
                            }));
                          }}
                          className="h-8 font-display text-base font-bold bg-transparent border-transparent hover:border-border/60 focus:border-primary focus:bg-background px-1.5 max-w-[240px] rounded-lg transition-colors"
                          title="Click to rename section heading"
                        />
                     </div>
                     <div className="flex gap-2 shrink-0">
                        <Popover>
                            <PopoverTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full hover:bg-primary/5 text-primary" title="Typography">
                                <Settings2 className="h-4 w-4" />
                            </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-80" align="end">
                                <SectionStyleControls value={resumeData.settings?.sections || {}} onChange={sections => setResumeData(prev => ({ ...prev, settings: { ...prev.settings, sections } }))} baseSize={resumeData.settings?.fontSize || 11} sectionKey="projects" hideHeader />
                            </PopoverContent>
                        </Popover>
                        <Button variant="outline" size="sm" onClick={addProj} className="h-8 rounded-full gap-1 border-primary/20 hover:bg-primary/5 text-primary">
                            <Plus className="h-3 w-3" />
                            <span className="text-[10px] font-bold">ADD PROJECT</span>
                        </Button>
                     </div>
                   </div>
                    <Droppable droppableId="projects-list">
                      {(provided) => (
                        <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-4">
                          {resumeData.projects.map((proj, i) => (
                            <Draggable key={`proj-${i}`} draggableId={`proj-${i}`} index={i}>
                              {(prov, snap) => (
                                <div
                                  ref={prov.innerRef}
                                  {...prov.draggableProps}
                                  className={`group p-5 rounded-2xl border bg-muted/20 relative transition-all ${
                                    snap.isDragging ? "shadow-2xl ring-2 ring-primary bg-background z-50 scale-[1.02]" : ""
                                  }`}
                                >
                                  <div className="flex items-center justify-between mb-3 border-b border-border/50 pb-2">
                                    <div
                                      {...prov.dragHandleProps}
                                      className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground cursor-grab active:cursor-grabbing text-xs font-semibold"
                                      title="Drag to reorder project"
                                    >
                                      <GripVertical className="h-4 w-4" />
                                      <span>Project #{i + 1}</span>
                                    </div>
                                    <Button variant="ghost" size="icon" className="h-7 w-7 rounded-full text-destructive hover:bg-destructive/10" onClick={() => setResumeData(prev => ({ ...prev, projects: prev.projects.filter((_, j) => i !== j) }))}>
                                      <Trash2 className="h-3.5 w-3.5" />
                                    </Button>
                                  </div>
                                  <div className="grid sm:grid-cols-2 gap-4 mb-4">
                                    <div className="space-y-1">
                                      <Label className="text-[9px] uppercase font-bold text-muted-foreground ml-1">Project Name</Label>
                                      <Input value={proj.name} onChange={e => { const n = [...resumeData.projects]; n[i].name = e.target.value; setResumeData({ ...resumeData, projects: n }); }} placeholder="Project Alpha" className="h-9 rounded-lg border-border/60 bg-background" />
                                    </div>
                                    <div className="space-y-1">
                                      <Label className="text-[9px] uppercase font-bold text-muted-foreground ml-1">Technologies</Label>
                                      <Input value={proj.tech} onChange={e => { const n = [...resumeData.projects]; n[i].tech = e.target.value; setResumeData({ ...resumeData, projects: n }); }} placeholder="React, Node.js, AWS" className="h-9 rounded-lg border-border/60 bg-background" />
                                    </div>
                                  </div>
                                  <div className="space-y-1">
                                      <Label className="text-[9px] uppercase font-bold text-muted-foreground ml-1">Project Description</Label>
                                      <Textarea value={proj.bullets.join('\n')} onChange={e => { const n = [...resumeData.projects]; n[i].bullets = e.target.value.split('\n'); setResumeData({ ...resumeData, projects: n }); }} placeholder="Describe the impact and technical challenges..." className="min-h-[80px] rounded-lg border-border/60 bg-background resize-none" />
                                  </div>
                                </div>
                              )}
                            </Draggable>
                          ))}
                          {provided.placeholder}
                          {resumeData.projects.length === 0 && (
                            <div className="text-center py-10 border-2 border-dashed rounded-2xl text-muted-foreground italic">No projects added.</div>
                          )}
                        </div>
                      )}
                    </Droppable>
                </div>

                {/* SKILLS & GENERATE */}
                <div id="section-skills" className="bg-card border-2 border-border rounded-2xl p-6 shadow-card transition-all hover:border-primary/20">
                  <div className="flex items-center justify-between mb-6 border-b pb-4">
                     <div className="flex items-center gap-1.5 flex-1 min-w-0 mr-2">
                        <Wand className="h-5 w-5 text-primary shrink-0" />
                        <span className="font-display text-sm font-bold text-muted-foreground shrink-0">7.</span>
                        <Input
                          value={resumeData.settings?.customSectionTitles?.skills ?? "Skills & Optimization"}
                          onChange={e => {
                            const val = e.target.value;
                            setResumeData(prev => ({
                              ...prev,
                              settings: {
                                ...prev.settings,
                                customSectionTitles: {
                                  ...(prev.settings?.customSectionTitles || {}),
                                  skills: val,
                                }
                              }
                            }));
                          }}
                          className="h-8 font-display text-base font-bold bg-transparent border-transparent hover:border-border/60 focus:border-primary focus:bg-background px-1.5 max-w-[240px] rounded-lg transition-colors"
                          title="Click to rename section heading"
                        />
                     </div>
                     <div className="flex gap-2 shrink-0">
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full hover:bg-primary/5 text-primary" title="Typography">
                                    <Settings2 className="h-4 w-4" />
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-80" align="end">
                                <SectionStyleControls value={resumeData.settings?.sections || {}} onChange={sections => setResumeData(prev => ({ ...prev, settings: { ...prev.settings, sections } }))} baseSize={resumeData.settings?.fontSize || 11} sectionKey="skills" hideHeader />
                            </PopoverContent>
                        </Popover>
                        <Button variant="outline" size="sm" className="h-8 rounded-full text-[10px] font-bold gap-1 border-primary/20 hover:bg-primary/5 text-primary">
                            <Sparkles className="h-3 w-3" />
                            ATS OPTIMIZE
                        </Button>
                     </div>
                   </div>
                   <div className="space-y-6">

                      <div className="space-y-2">
                        <Label className="text-xs font-bold text-muted-foreground ml-1">Skills (One category per line, e.g., Languages: Java, Python)</Label>
                        <Textarea 
                          value={resumeData.skills.map(s => isGenericSkillCategory(s.category) ? s.items.join(', ') : `${s.category}: ${s.items.join(', ')}`).join('\n')} 
                          onChange={e => {
                            const lines = e.target.value.split('\n').filter(Boolean);
                            const newSkills = lines.map(line => {
                                const parts = line.split(':');
                                if (parts.length > 1 && parts[0].trim() && !parts[0].includes(',')) {
                                    return { category: parts[0].trim(), items: parts.slice(1).join(':').split(',').map(i => i.trim()).filter(Boolean) };
                                }
                                return { category: "Skills", items: line.split(',').map(i => i.trim()).filter(Boolean) };
                            });
                            setResumeData({ ...resumeData, skills: newSkills });
                          }} 
                          placeholder="Languages: TypeScript, JavaScript&#10;Frameworks: React, Node.js" 
                          className="min-h-[120px] rounded-xl border-border/60" 
                        />
                        <p className="text-[10px] text-muted-foreground ml-1">Tip: Use "Category: skill1, skill2" for grouping.</p>
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-1.5">
                              <Input
                                value={resumeData.settings?.customSectionTitles?.certifications ?? "Certifications"}
                                onChange={e => {
                                  const val = e.target.value;
                                  setResumeData(prev => ({
                                    ...prev,
                                    settings: {
                                      ...prev.settings,
                                      customSectionTitles: {
                                        ...(prev.settings?.customSectionTitles || {}),
                                        certifications: val,
                                      }
                                    }
                                  }));
                                }}
                                className="h-7 text-xs font-bold text-muted-foreground bg-transparent border-transparent hover:border-border/60 focus:border-primary focus:bg-background px-1.5 max-w-[200px] rounded transition-colors"
                                title="Click to rename certifications heading"
                              />
                            </div>
                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button variant="ghost" size="icon" className="h-6 w-6 rounded-full" title="Typography">
                                        <Settings2 className="h-3 w-3" />
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-80" align="end">
                                    <SectionStyleControls value={resumeData.settings?.sections || {}} onChange={sections => setResumeData(prev => ({ ...prev, settings: { ...prev.settings, sections } }))} baseSize={resumeData.settings?.fontSize || 11} sectionKey="certifications" hideHeader />
                                </PopoverContent>
                            </Popover>
                        </div>
                        <Textarea 
                          value={resumeData.certifications.join('\n')} 
                          onChange={e => setResumeData({ ...resumeData, certifications: e.target.value.split('\n').filter(Boolean) })} 
                          placeholder="AWS Certified Developer, PMP..." 
                          className="min-h-[60px] rounded-xl border-border/60" 
                        />
                      </div>
                      
                      <Separator />


                      
                      <div className="p-6 rounded-2xl bg-primary/[0.03] border border-primary/10 space-y-6 relative overflow-hidden group/ai">
                        <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none group-hover/ai:opacity-20 transition-opacity">
                          <Sparkles className="h-20 w-20 text-primary" />
                        </div>
                        
                        <div className="space-y-2 relative">
                          <div className="flex items-center gap-2">
                            <Sparkles className="h-5 w-5 text-primary" />
                            <h3 className="font-display font-bold text-primary tracking-tight">✨ AI RESUME POLISH</h3>
                          </div>
                          <p className="text-xs text-muted-foreground ml-7">
                            "Let AI transform your resume into stronger, job-ready content."
                          </p>
                        </div>

                        <div className="space-y-3 relative">
                          <div className="flex items-center gap-2">
                            <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center"><Target className="h-3 w-3 text-primary" /></div>
                            <Label className="font-bold text-sm">Target Job Description</Label>
                          </div>
                          <Textarea 
                            value={targetJd} 
                            onChange={e => setTargetJd(e.target.value)} 
                            placeholder="Paste the job description you're applying for to optimize your resume bullets and skills..." 
                            className="min-h-[120px] bg-background rounded-xl border-primary/10 focus:border-primary/30 text-sm leading-relaxed" 
                          />
                        </div>

                        <div className="bg-background/50 rounded-xl p-4 border border-primary/5 space-y-3">
                          <div className="flex items-center gap-2 text-primary">
                            <Sparkles className="h-3.5 w-3.5" />
                            <span className="text-[11px] font-bold uppercase tracking-wider">✨ AI will:</span>
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2">
                            {[
                              "Rewrite weak bullet points",
                              "Use stronger action verbs",
                              "Improve professional wording",
                              "Highlight measurable achievements",
                              "Match relevant keywords from the job description",
                              "Improve the professional summary",
                              "Optimize content for ATS"
                            ].map((text, idx) => (
                              <div key={idx} className="flex items-start gap-2 group/item">
                                <CheckCircle2 className="h-3.5 w-3.5 text-primary/60 mt-0.5 shrink-0 group-hover/item:text-primary transition-colors" />
                                <span className="text-[11px] text-muted-foreground leading-snug">✓ {text}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                        
                        <div className="space-y-4">
                          <Button 
                            onClick={generate} 
                            disabled={loading} 
                            className="w-full h-14 text-lg font-bold bg-gradient-primary shadow-glow rounded-2xl group overflow-hidden relative"
                          >
                            {loading ? (
                              <div className="flex items-center gap-3 animate-in fade-in slide-in-from-bottom-2">
                                <div className="relative">
                                  <Loader2 className="h-5 w-5 animate-spin" />
                                  <Sparkles className="absolute -top-1 -right-1 h-2 w-2 text-primary-foreground animate-pulse" />
                                </div>
                                <span className="text-base">✨ AI is polishing your resume...</span>
                              </div>
                            ) : (
                              <div className="flex items-center gap-2 transition-transform group-hover:scale-[1.02]">
                                <Sparkles className="h-5 w-5 transition-transform group-hover:rotate-12" />
                                <span>✨ Generate Polished Resume with AI</span>
                              </div>
                            )}
                          </Button>

                          {loading && (
                            <div className="space-y-2 animate-in fade-in slide-in-from-top-2 duration-500">
                              {[
                                "Analyzing your experience",
                                "Improving your wording",
                                "Matching relevant keywords",
                                "Optimizing for ATS"
                              ].map((text, idx) => (
                                <div 
                                  key={idx} 
                                  className="flex items-center gap-2 text-[10px] text-primary/80"
                                  style={{ animationDelay: `${idx * 150}ms` }}
                                >
                                  <div className="h-1 w-1 rounded-full bg-primary animate-pulse" />
                                  <span>{text}</span>
                                </div>
                              ))}
                            </div>
                          )}

                           {resumeData && resumeData.name && !loading && resumeData._isPolished && (
                              <div className="flex items-start gap-3 p-3 bg-primary/5 rounded-xl border border-primary/10 animate-in zoom-in-95">
                                <CheckCircle2 className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                                <div>
                                  <p className="text-xs font-bold text-primary">✓ Resume polished successfully</p>
                                  <p className="text-[10px] text-muted-foreground mt-0.5">"Your content has been improved for clarity, impact, and ATS relevance."</p>
                                </div>
                              </div>
                            )}
                         </div>
                              </div>
                        </div>
                     </div>
                  </div>
                {/* RIGHT COLUMN: INDEPENDENT PREVIEW PANE */}
                <div className="hidden lg:flex flex-col h-full overflow-hidden bg-muted/15 rounded-3xl border border-border/70 shadow-card min-h-0">

                  {/* Rich Text Toolbar */}
                  <div className="shrink-0 flex items-center gap-1 p-2 bg-background/80 backdrop-blur-sm border-b">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="h-8 w-8 p-0" 
                      onClick={() => handleFormat('bold')}
                      title="Bold"
                    >
                      <Bold className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="h-8 w-8 p-0" 
                      onClick={() => handleFormat('italic')}
                      title="Italic"
                    >
                      <Italic className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="h-8 w-8 p-0" 
                      onClick={() => handleFormat('underline')}
                      title="Underline"
                    >
                      <Underline className="h-4 w-4" />
                    </Button>
                    <Separator orientation="vertical" className="h-4 mx-1" />
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="h-8 w-8 p-0" 
                      onClick={() => handleFormat('insertUnorderedList')}
                      title="Bullet List"
                    >
                      <List className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="h-8 w-8 p-0" 
                      onClick={() => handleFormat('insertOrderedList')}
                      title="Numbered List"
                    >
                      <ListOrdered className="h-4 w-4" />
                    </Button>
                    <Separator orientation="vertical" className="h-4 mx-1" />
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="h-8 w-8 p-0" 
                      onClick={() => {
                        const url = prompt("Enter the URL");
                        if (url) handleFormat('createLink', url);
                      }}
                      title="Insert Link"
                    >
                      <LinkIcon className="h-4 w-4" />
                    </Button>
                    <Separator orientation="vertical" className="h-4 mx-1" />
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="h-8 w-8 p-0" 
                      onClick={() => handleFormat('fontSize', 'decrease')}
                      title="Decrease Font Size"
                    >
                      <Minus className="h-4 w-4" />
                    </Button>
                    <div className="flex items-center px-0.5">
                      <Type className="h-3 w-3 text-muted-foreground" />
                    </div>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="h-8 w-8 p-0" 
                      onClick={() => handleFormat('fontSize', 'increase')}
                      title="Increase Font Size"
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                    <Separator orientation="vertical" className="h-4 mx-1" />
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="h-8 w-8 p-0" 
                      onClick={handleCopyFormat}
                      title="Copy Formatting"
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className={`h-8 w-8 p-0 ${copiedFormat ? 'text-primary' : 'text-muted-foreground'}`}
                      disabled={!copiedFormat}
                      onClick={handlePasteFormat}
                      title={copiedFormat ? `Paste Formatting (${describeFormat(copiedFormat)})` : "Copy a format first"}
                    >
                      <Paintbrush className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="h-8 w-8 p-0" 
                      onClick={() => handleFormat('removeFormat')}
                      title="Clear Formatting"
                    >
                      <Type className="h-4 w-4" />
                    </Button>

                    {/* A4 Canonical Zoom Controls */}
                    <div className="flex items-center gap-1 ml-auto pl-2 border-l border-border/50">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 w-7 p-0"
                        onClick={() => {
                          setZoomMode("custom");
                          setCustomZoom((prev) => Math.max(30, Math.round((zoomMode === "fit" ? effectiveScale * 100 : prev) - 10)));
                        }}
                        title="Zoom Out"
                      >
                        <Minus className="h-3 w-3" />
                      </Button>
                      <button
                        type="button"
                        onClick={() => setZoomMode(zoomMode === "fit" ? "custom" : "fit")}
                        className="px-1.5 py-0.5 text-[10.5px] font-mono font-medium rounded hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
                        title="Click to toggle Fit / Custom Zoom"
                      >
                        {zoomMode === "fit" ? `Fit (${Math.round(effectiveScale * 100)}%)` : `${Math.round(customZoom)}%`}
                      </button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 w-7 p-0"
                        onClick={() => {
                          setZoomMode("custom");
                          setCustomZoom((prev) => Math.min(150, Math.round((zoomMode === "fit" ? effectiveScale * 100 : prev) + 10)));
                        }}
                        title="Zoom In"
                      >
                        <Plus className="h-3 w-3" />
                      </Button>
                      <Button
                        variant={zoomMode === "fit" ? "secondary" : "ghost"}
                        size="sm"
                        className="h-6 px-1.5 text-[9.5px] font-bold"
                        onClick={() => setZoomMode("fit")}
                        title="Auto-fit to available window width"
                      >
                        Fit
                      </Button>
                      <Button
                        variant={zoomMode === "custom" && customZoom === 100 ? "secondary" : "ghost"}
                        size="sm"
                        className="h-6 px-1.5 text-[9.5px] font-bold"
                        onClick={() => {
                          setZoomMode("custom");
                          setCustomZoom(100);
                        }}
                        title="100% Actual A4 Scale"
                      >
                        100%
                      </Button>
                    </div>
                  </div>

                  {/* Independent Scrollable Preview Area with Formatting Sidebar docked on the left of resume */}
                  <div className="flex-1 overflow-hidden flex min-h-0 p-3 sm:p-4 gap-4 bg-muted/10">
                    {/* LEFT OF RESUME: DESIGN & FORMATTING PANEL */}
                    <div className="shrink-0 h-full overflow-y-auto custom-scrollbar">
                      <ResumeDesignFormattingPanel
                        settings={resumeData?.settings || {}}
                        onChangeSettings={(newSettings) => setResumeData(prev => ({ ...prev, settings: newSettings }))}
                        template={template}
                        onChangeTemplate={setTemplate}
                      />
                    </div>

                    {/* RESUME A4 SHEET PREVIEW VIEWPORT (Strict A4 single source of truth with non-clipping center layout) */}
                    <div
                      ref={previewContainerRef}
                      className="flex-1 overflow-y-auto overflow-x-auto p-4 custom-scrollbar min-h-0 bg-muted/20"
                    >
                      {resumeData ? (
                        <div className="min-w-full w-fit flex flex-col items-center justify-start pb-12">
                          <div
                            className="relative shrink-0 transition-all duration-150"
                            style={{
                              width: `${Math.round(A4_WIDTH_PX * effectiveScale)}px`,
                              height: `${Math.round(sheetHeight * effectiveScale)}px`,
                            }}
                          >
                            <div
                              ref={sheetWrapRef}
                              className="resume-export-target bg-white shadow-2xl transition-transform duration-150"
                              style={{
                                width: `${A4_WIDTH_PX}px`,
                                minWidth: `${A4_WIDTH_PX}px`,
                                maxWidth: `${A4_WIDTH_PX}px`,
                                minHeight: `${A4_HEIGHT_PX}px`,
                                transform: `scale(${effectiveScale})`,
                                transformOrigin: "top left",
                              }}
                            >
                              <ResumePreview template={template} data={resumeData} onChange={setResumeData} />
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="h-full flex flex-col items-center justify-center text-muted-foreground p-12 text-center">
                          <div className="h-20 w-20 rounded-3xl bg-muted/30 flex items-center justify-center mb-6"><Eye className="h-10 w-10 opacity-20" /></div>
                          <h4 className="font-bold text-foreground mb-2">Live Preview</h4>
                          <p className="text-xs max-w-[200px]">Fill in your details and click Generate to see your polished resume here.</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
        </div>
          )}



      <Dialog open={showEditHint} onOpenChange={setShowEditHint}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Your resume is ready!</DialogTitle><DialogDescription>Click any text in the preview to edit.</DialogDescription></DialogHeader>
          <DialogFooter><Button onClick={() => setShowEditHint(false)}>Got it</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showVersionDialog} onOpenChange={setShowVersionDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Save Resume Version</DialogTitle>
            <DialogDescription>Give this snapshot a name to easily roll back later.</DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Label htmlFor="version-name" className="text-xs mb-1.5 block">Version Name</Label>
            <Input 
              id="version-name" 
              placeholder="e.g., Before AI Polish, Post-Project Update" 
              value={versionName} 
              onChange={e => setVersionName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && saveVersion()}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowVersionDialog(false)}>Cancel</Button>
            <Button onClick={saveVersion} disabled={!versionName.trim()}>Save Version</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* FULL SAMPLE RESUME PREVIEW MODAL */}
      <Dialog open={!!previewTemplateId} onOpenChange={(open) => !open && setPreviewTemplateId(null)}>
        <DialogContent className="max-w-4xl max-h-[92vh] flex flex-col p-0 overflow-hidden bg-background border-border text-foreground">
          <DialogHeader className="p-4 border-b flex flex-row items-center justify-between shrink-0">
            <div>
              <DialogTitle className="text-base font-bold flex items-center gap-2">
                {TEMPLATES.find(t => t.id === previewTemplateId)?.name}
                {TEMPLATES.find(t => t.id === previewTemplateId)?.tag && (
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary/15 text-primary border border-primary/30 font-semibold">
                    {TEMPLATES.find(t => t.id === previewTemplateId)?.tag}
                  </span>
                )}
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                {TEMPLATES.find(t => t.id === previewTemplateId)?.desc}
              </DialogDescription>
            </div>
            <div className="flex items-center gap-2 pr-6">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setUseSampleDataInModal(!useSampleDataInModal)}
                className="h-8 text-xs font-semibold"
              >
                {useSampleDataInModal ? "View With My Details" : "View With Sample Details"}
              </Button>
              <Button
                size="sm"
                onClick={() => {
                  if (previewTemplateId) {
                    setTemplate(previewTemplateId);
                    setStarter("scratch");
                    setPreviewTemplateId(null);
                  }
                }}
                className="h-8 text-xs bg-primary text-primary-foreground font-bold shadow-glow"
              >
                <Sparkles className="h-3.5 w-3.5 mr-1" /> Use This Template
              </Button>
            </div>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto p-6 bg-muted/20 flex justify-center custom-scrollbar">
            {previewTemplateId && (
              <div className="w-[794px] shrink-0 shadow-2xl rounded-lg overflow-hidden my-auto bg-white">
                <ResumePreview
                  template={previewTemplateId}
                  data={useSampleDataInModal ? SAMPLE_RESUME_DATA : resumeData}
                />
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
    </DragDropContext>
  );
}
