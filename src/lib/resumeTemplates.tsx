import React, { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import {
  Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType,
  BorderStyle, LevelFormat, PageBreak,
  Table, TableRow, TableCell, WidthType, ShadingType, VerticalAlign,
} from "docx";
import { Droppable, Draggable } from "react-beautiful-dnd";
import { MousePointer2, Palette, Check, X, RotateCcw } from "lucide-react";
import { toast } from "sonner";
import { ResumeContextMenu, ContextMenuPosition } from "../components/ResumeContextMenu";
import {
  applyFormatToSelection,
  copyFormatFromSelection,
  pasteFormatToSelection,
  describeFormat,
  TextFormat,
} from "./richFormat";


export function saveBlob(blob: Blob, filename: string) {
  if (typeof window !== "undefined" && typeof document !== "undefined") {
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  }
}

/** Canonical ISO A4 Portrait Dimensions (Single Source of Truth across Preview & PDF Export) */
export const A4_WIDTH_PX = 794; // 210mm at 96 CSS DPI
export const A4_HEIGHT_PX = 1123; // 297mm at 96 CSS DPI (794 * 297 / 210 = 1122.94 ≈ 1123px)
export const A4_RATIO = 297 / 210; // 1.414285714
export const A4_WIDTH_PT = 595.28; // 210mm at 72 PDF points/in
export const A4_HEIGHT_PT = 841.89; // 297mm at 72 PDF points/in




export interface ResumeSettings {
  fontSize?: number;
  headingSize?: number;
  fontFamily?: string;
  textOpacity?: number;
  primaryColor?: string;
  accentColor?: string;
  headerBg?: string;
  sidebarBg?: string;
  sectionSpacing?: number;
  paragraphSpacing?: number;
  lineSpacing?: number;
  marginTopBottom?: number;
  marginSide?: number;
  paragraphIndent?: number;
  sections?: Partial<Record<ResumeSectionKey, SectionStyle>>;
  sectionOrder?: string[];
  customSectionTitles?: Partial<Record<string, string>>;
}

export interface ResumeData {
  name: string;
  title: string;
  email: string;
  phone: string;
  location: string;
  links: { label: string; url: string }[];
  summary: string;
  experience: { company: string; role: string; location: string; start: string; end: string; bullets: string[] }[];
  leadership?: { role: string; organization: string; location?: string; start?: string; end?: string; bullets: string[] }[];
  education: { school: string; degree: string; location: string; start: string; end: string; details: string }[];
  projects: { name: string; tech: string; bullets: string[] }[];
  skills: { category: string; items: string[] }[];
  certifications: string[];
  settings?: ResumeSettings;

  _isPolished?: boolean;
}

export type ResumeSectionKey =
  | "headings" | "summary" | "experience" | "leadership" | "education" | "skills" | "projects" | "certifications";


export interface SectionStyle {
  fontSize?: number;
  fontFamily?: string;
  bold?: boolean;
  italic?: boolean;
  letterSpacing?: number;
}

export const RESUME_SECTIONS: { key: ResumeSectionKey; label: string }[] = [
  { key: "headings", label: "Section headings" },
  { key: "summary", label: "Summary" },
  { key: "experience", label: "Experience" },
  { key: "leadership", label: "Leadership Experience" },
  { key: "education", label: "Education" },
  { key: "skills", label: "Skills" },
  { key: "projects", label: "Projects" },
  { key: "certifications", label: "Certifications" },
];



export type TemplateId =
  | "modern" | "classic" | "compact" | "executive" | "creative" | "minimal"
  | "timeline" | "elegant" | "sidebar-dark" | "photo-header"
  | "centered-serif" | "banner-photo" | "teal-left" | "photo-grid" | "logo-boxed"
  | "nordic" | "ivy-league" | "tech-dark"
  | "monogram-blue-frame" | "emerald-timeline" | "hexagon-editorial" | "slate-node-timeline"
  | "centered-dual-column" | "teal-duo-banner" | "taupe-header-split" | "amber-ribbon"
  | "slate-frame-sidebar" | "burgundy-boxed-monogram";

export interface TemplateDefinition {
  id: TemplateId;
  name: string;
  desc: string;
  tag?: string;
  category?: "popular" | "modern" | "ats" | "executive" | "creative" | "academic";
  previewUrl?: string;
}

export const SAMPLE_RESUME_DATA: ResumeData = {
  name: "Harsha Naidu",
  title: "Senior Software Engineer",
  email: "harsha.naidu@example.com",
  phone: "+91 98765 43210",
  location: "Bangalore, India",
  links: [
    { label: "LinkedIn", url: "linkedin.com/in/harshanaidu" },
    { label: "GitHub", url: "github.com/harshanaidu" }
  ],
  summary: "Results-driven Senior Software Engineer with 6+ years of experience architecting high-scale distributed systems and modern web applications. Proven track record in leading engineering teams, improving frontend latency, and shipping AI-powered platforms.",
  experience: [
    {
      company: "Tech Solutions Inc.",
      role: "Senior Full Stack Developer",
      location: "Bangalore",
      start: "2021",
      end: "Present",
      bullets: [
        "Led the migration of legacy architecture to modern microservices, improving system reliability by 40%.",
        "Mentored a team of 5 junior developers, fostering a culture of clean code and rigorous testing.",
        "Optimized frontend performance, reducing page load times by 50% across the main product suite."
      ]
    },
    {
      company: "Innovate Web Systems",
      role: "Software Developer",
      location: "Chennai",
      start: "2018",
      end: "2021",
      bullets: [
        "Developed and maintained critical customer-facing features using React, TypeScript, and Node.js.",
        "Implemented automated CI/CD pipelines, reducing deployment errors by 30%.",
        "Collaborated with design teams to ensure pixel-perfect implementation of UI/UX requirements."
      ]
    }
  ],
  leadership: [
    {
      role: "President & Lead Organizer",
      organization: "Cloud & Open Source Community",
      location: "Bangalore",
      start: "2019",
      end: "2021",
      bullets: [
        "Organized national annual hackathon with 400+ participants and 20 industry tech speakers.",
        "Conducted 12+ hands-on technical workshops on cloud architectures and DevOps."
      ]
    }
  ],
  education: [
    {
      school: "National Institute of Technology",
      degree: "Bachelor of Technology in Computer Science",
      location: "India",
      start: "2014",
      end: "2018",
      details: "Graduated with Honors. Specialized in Distributed Systems."
    }
  ],
  projects: [
    {
      name: "ResumeShot AI",
      tech: "React, Supabase, Tailwind CSS",
      bullets: [
        "Built a high-performance resume builder with real-time AI optimization and instant formatting.",
        "Integrated multi-format export engine supporting pixel-perfect PDF and DOCX."
      ]
    }
  ],
  skills: [
    { category: "Languages", items: ["TypeScript", "JavaScript", "Python", "SQL", "Go"] },
    { category: "Frameworks & Libraries", items: ["React", "Next.js", "Node.js", "Express", "Tailwind CSS"] },
    { category: "Cloud & Tools", items: ["Docker", "AWS", "Git", "Kubernetes", "PostgreSQL"] }
  ],
  certifications: ["AWS Certified Solutions Architect", "Google Professional Cloud Developer"],
  settings: {
    fontSize: 11,
    headingSize: 14,
    fontFamily: "Arial, sans-serif",
    sectionSpacing: 16,
    paragraphSpacing: 6,
    lineSpacing: 1.35,
    marginTopBottom: 0,
    marginSide: 0,
    paragraphIndent: 0,
    sections: {}
  }
};

export const TEMPLATES: TemplateDefinition[] = [
  { 
    id: "modern", 
    name: "Modern Professional", 
    desc: "Clean sidebar layout with emerald accents, ideal for technology and design roles.",
    tag: "Most Popular",
    category: "popular",
  },
  { 
    id: "classic", 
    name: "Classic ATS-Optimized", 
    desc: "Single-column format designed for maximum compatibility with tracking systems.",
    tag: "ATS Friendly",
    category: "ats",
  },
  { 
    id: "compact", 
    name: "Compact Density", 
    desc: "High-density clean single column, ideal for technical resumes and 1-page limits.",
    tag: "Compact",
    category: "modern",
  },
  { 
    id: "executive", 
    name: "Executive Serif", 
    desc: "Distinguished typography with amber-toned headers for senior leadership positions.",
    tag: "Senior Roles",
    category: "executive",
  },
  { 
    id: "creative", 
    name: "Creative Indigo", 
    desc: "Bold gradient header and two-column structure for marketing and creative professionals.",
    tag: "Creative",
    category: "creative",
  },
  { 
    id: "minimal", 
    name: "Ultra Minimal", 
    desc: "Sophisticated use of whitespace and light weights for a modern, airy aesthetic.",
    tag: "Minimal",
    category: "modern",
  },
  { 
    id: "timeline", 
    name: "Timeline Rail", 
    desc: "Left date rail with teal accents, perfect for showing clear career progression.",
    tag: "Timeline",
    category: "modern",
  },
  { 
    id: "elegant", 
    name: "Warm Editorial", 
    desc: "Centered serif header with warm stone tones and refined editorial typography.",
    tag: "Editorial",
    category: "executive",
  },
  { 
    id: "sidebar-dark", 
    name: "Dark Sidebar Pro", 
    desc: "Deep teal right sidebar with avatar, structured summary, and visual chips.",
    tag: "Sidebar",
    category: "modern",
  },
  { 
    id: "photo-header", 
    name: "Header Slate & Photo", 
    desc: "Slate header banner with avatar circle and balanced 2-column layout.",
    tag: "Photo Ready",
    category: "creative",
  },
  { 
    id: "centered-serif", 
    name: "Centered Classic Serif", 
    desc: "Alexander Taylor style with clean dividing rules and centered classic header.",
    tag: "Traditional",
    category: "ats",
  },
  { 
    id: "banner-photo", 
    name: "Navy Banner Modern", 
    desc: "Navy header banner with profile initials badge and achievement highlights.",
    tag: "Modern",
    category: "modern",
  },
  { 
    id: "teal-left", 
    name: "Teal Split Sidebar", 
    desc: "Solid teal left rail with achievement stars and crisp white main section.",
    tag: "Split View",
    category: "modern",
  },
  { 
    id: "photo-grid", 
    name: "Grid & Highlights", 
    desc: "Centered header with 3-column key achievement boxes and clean timeline.",
    tag: "Visual Grid",
    category: "creative",
  },
  { 
    id: "logo-boxed", 
    name: "Brand Boxed", 
    desc: "Centered header with company initial badges for clear brand recognition.",
    tag: "Branded",
    category: "ats",
  },
  { 
    id: "nordic", 
    name: "Nordic Crisp Minimal", 
    desc: "Clean Scandinavian aesthetic with slate-gray accents, pill tags, and sleek lines.",
    tag: "New",
    category: "modern",
  },
  { 
    id: "ivy-league", 
    name: "Ivy League Academic", 
    desc: "Prestigious academic serif layout with centered header and formal divider rules.",
    tag: "Academic",
    category: "academic",
  },
  { 
    id: "tech-dark", 
    name: "Modern Tech Lead", 
    desc: "Dark charcoal slate header, cyan tech accents, and monospace code-styled skills.",
    tag: "Tech Lead",
    category: "modern",
  },
  {
    id: "monogram-blue-frame",
    name: "Classic Monogram Blue Frame",
    desc: "Centered circular monogram avatar, royal blue border frame, and 2-column experience split.",
    tag: "Framed",
    category: "popular",
  },
  {
    id: "emerald-timeline",
    name: "Emerald Left Timeline",
    desc: "High-converting ResumeNow style with two-tone header, left date timeline, and 2-column skills grid.",
    tag: "ATS Friendly",
    category: "popular",
  },
  {
    id: "hexagon-editorial",
    name: "Hexagon Monogram Editorial",
    desc: "Geometric hexagon initials badge, blue serif headline, and 35/65 split two-column layout.",
    tag: "Editorial",
    category: "executive",
  },
  {
    id: "slate-node-timeline",
    name: "Slate Node Timeline Spine",
    desc: "Dark slate header bar, boxed contact strip, and central dot-spine timeline layout.",
    tag: "Executive",
    category: "executive",
  },
  {
    id: "centered-dual-column",
    name: "Centered Minimalist Dual-Column",
    desc: "Clean centered title, dual-column balanced layout, right-aligned dates, and language meters.",
    tag: "Minimalist",
    category: "modern",
  },
  {
    id: "teal-duo-banner",
    name: "Teal Duo-Tone Executive",
    desc: "Charcoal & teal top banner with left-aligned section labels and right-aligned content.",
    tag: "Executive",
    category: "executive",
  },
  {
    id: "taupe-header-split",
    name: "Warm Taupe Executive Split",
    desc: "Warm sand/taupe header block with clean vertical divider and left section labels.",
    tag: "Editorial",
    category: "executive",
  },
  {
    id: "amber-ribbon",
    name: "Amber Gold Ribbon Classic",
    desc: "Golden amber accent ribbon, two-tone bold name, and deep wine section headers.",
    tag: "Classic",
    category: "ats",
  },
  {
    id: "slate-frame-sidebar",
    name: "Slate Frame Modern Sidebar",
    desc: "Full slate border frame, compact 35% left sidebar for skills & education, and spacious experience column.",
    tag: "Framed",
    category: "modern",
  },
  {
    id: "burgundy-boxed-monogram",
    name: "Burgundy Boxed Monogram",
    desc: "Square monogram box, deep burgundy header banner, contact icon strip, and dual-column structure.",
    tag: "Executive",
    category: "executive",
  },
];


/* ---------- Inline editable primitive ---------- */
export const Editable = React.memo(function Editable({
  value, onChange, className, as = "span", multiline = false, style
}: {
  value: string;
  onChange?: (v: string) => void;
  className?: string;
  as?: any;
  multiline?: boolean;
  style?: React.CSSProperties;
}) {
  const ref = useRef<HTMLElement>(null);
  
  useEffect(() => {
    if (ref.current) {
      const isHtml = value?.includes("<") && value?.includes(">");
      if (isHtml) {
        if (ref.current.innerHTML !== value) ref.current.innerHTML = value;
      } else {
        if (ref.current.innerText !== value) ref.current.innerText = value;
      }
    }
  }, [value]);

  const editable = !!onChange;
  const Tag: any = as;

  return (
    <Tag
      ref={ref}
      contentEditable={editable}
      suppressContentEditableWarning
      className={
        (className || "") +
        (editable
          ? " outline-none focus:bg-primary/5 focus:ring-1 focus:ring-primary/40 rounded px-0.5"
          : "")
      }
      style={{ ...style, cursor: editable ? "text" : "default" }}
      onPointerDown={(e: React.PointerEvent) => {
        if (editable) {
          // Check if we are already focused. If not, don't stop propagation immediately
          // to allow the drag handle to work if they are dragging by the handle.
          // react-beautiful-dnd drag handle has its own listener.
          const isFocused = document.activeElement === ref.current;
          if (isFocused) e.stopPropagation();
        }
      }}
      onBlur={
        editable
          ? (e: any) => {
              const html = e.currentTarget.innerHTML as string;
              const hasMarkup = /<(b|i|u|strong|em|span|font)\b/i.test(html);
              const txt = multiline || hasMarkup
                ? html.replace(/<div>/gi, multiline ? "\n" : " ").replace(/<\/div>/gi, "").replace(/<br\s*[\/]?>/gi, multiline ? "\n" : " ").trim()
                : (e.currentTarget.innerText as string).replace(/\s+/g, " ").trim();
              if (txt !== value) onChange!(txt);
            }
          : undefined
      }
      dangerouslySetInnerHTML={value?.includes("<") ? { __html: value } : undefined}
    >
      {!value?.includes("<") ? (value || (multiline ? "\u00A0" : "")) : null}
    </Tag>

  );
});


/** Bullets editor: one <li> per bullet, editable, splits on Enter via onBlur parse. */
export function BulletsEditor({
  bullets, onChange, className,
}: { bullets: string[]; onChange?: (v: string[]) => void; className?: string }) {
  const editable = !!onChange;
  const ref = useRef<HTMLUListElement>(null);
  const text = bullets.join("\n");
  
  useEffect(() => {
    if (!ref.current) return;
    const current = Array.from(ref.current.querySelectorAll("li"))
      .map((li) => (li.innerHTML || "").trim())
      .join("\n");
    if (current !== text) {
      ref.current.innerHTML = bullets.map((b, i) => `<li data-bullet-line="true" data-bullet-index="${i}">${b}</li>`).join("");
    }
  }, [text, bullets]);

  useEffect(() => {
    const ul = ref.current;
    if (!ul || !onChange) return;
    const handler = (e: CustomEvent<string[]>) => {
      if (e.detail && Array.isArray(e.detail)) {
        onChange(e.detail);
      }
    };
    ul.addEventListener("bullets-update", handler as EventListener);
    return () => ul.removeEventListener("bullets-update", handler as EventListener);
  }, [onChange]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLUListElement>) => {
    if (!editable) return;

    // Alt + ArrowUp to move active bullet line up
    if (e.altKey && e.key === "ArrowUp") {
      e.preventDefault();
      const sel = window.getSelection();
      if (!sel || !ref.current) return;
      const li = sel.anchorNode ? (sel.anchorNode instanceof HTMLElement ? sel.anchorNode.closest("li") : sel.anchorNode.parentElement?.closest("li")) : null;
      if (li && ref.current.contains(li)) {
        const lis = Array.from(ref.current.querySelectorAll("li"));
        const idx = lis.indexOf(li);
        if (idx > 0) {
          const newBullets = [...bullets];
          const temp = newBullets[idx];
          newBullets[idx] = newBullets[idx - 1];
          newBullets[idx - 1] = temp;
          onChange?.(newBullets);
        }
      }
      return;
    }

    // Alt + ArrowDown to move active bullet line down
    if (e.altKey && e.key === "ArrowDown") {
      e.preventDefault();
      const sel = window.getSelection();
      if (!sel || !ref.current) return;
      const li = sel.anchorNode ? (sel.anchorNode instanceof HTMLElement ? sel.anchorNode.closest("li") : sel.anchorNode.parentElement?.closest("li")) : null;
      if (li && ref.current.contains(li)) {
        const lis = Array.from(ref.current.querySelectorAll("li"));
        const idx = lis.indexOf(li);
        if (idx !== -1 && idx < lis.length - 1) {
          const newBullets = [...bullets];
          const temp = newBullets[idx];
          newBullets[idx] = newBullets[idx + 1];
          newBullets[idx + 1] = temp;
          onChange?.(newBullets);
        }
      }
      return;
    }
  };

  return (
    <ul
      ref={ref}
      contentEditable={editable}
      suppressContentEditableWarning
      onKeyDown={handleKeyDown}
      className={
        (className || "") +
        (editable ? " outline-none focus:bg-primary/5 focus:ring-1 focus:ring-primary/40 rounded px-1 min-h-[1em]" : "")
      }
      onBlur={
        editable
          ? (e) => {
              const items = Array.from(e.currentTarget.querySelectorAll("li"))
                .map((li) => (li.innerHTML || "").trim())
                .filter(Boolean);
              onChange!(items);
            }
          : undefined
      }
    />
  );
}


function escapeHtml(s: string) {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]!));
}

export function cloneResumeData(r: ResumeData): ResumeData {
  return JSON.parse(JSON.stringify(r));
}



/* ---------- Update helpers passed down to previews ---------- */
type UpdateFn = ((patch: Partial<ResumeData>) => void) | undefined;

function makeExpUpdater(update: UpdateFn, r: ResumeData, i: number) {
  return (patch: Partial<ResumeData["experience"][number]>) =>
    update?.({ experience: r.experience.map((x, j) => (j === i ? { ...x, ...patch } : x)) });
}
function makeLeadershipUpdater(update: UpdateFn, r: ResumeData, i: number) {
  return (patch: Partial<NonNullable<ResumeData["leadership"]>[number]>) =>
    update?.({ leadership: (r.leadership || []).map((x, j) => (j === i ? { ...x, ...patch } : x)) });
}
function makeEduUpdater(update: UpdateFn, r: ResumeData, i: number) {
  return (patch: Partial<ResumeData["education"][number]>) =>
    update?.({ education: r.education.map((x, j) => (j === i ? { ...x, ...patch } : x)) });
}
function makeProjUpdater(update: UpdateFn, r: ResumeData, i: number) {
  return (patch: Partial<ResumeData["projects"][number]>) =>
    update?.({ projects: r.projects.map((x, j) => (j === i ? { ...x, ...patch } : x)) });
}
function makeSkillUpdater(update: UpdateFn, r: ResumeData, i: number) {
  return (patch: Partial<ResumeData["skills"][number]>) =>
    update?.({ skills: r.skills.map((x, j) => (j === i ? { ...x, ...patch } : x)) });
}


/** A skill group category label. Hidden when the category is generic (e.g. "Skills"),
 *  so the section heading isn't repeated for every single skill row. */
export function isGenericSkillCategory(c?: string) {
  return !c || /^(skills?|general|others?|misc|key skills)$/i.test(c.trim());
}

function SkillCat({ value, onChange, className, as, colon }: {
  value: string;
  onChange?: (v: string) => void;
  className?: string;
  as?: any;
  colon?: boolean;
}) {
  if (isGenericSkillCategory(value)) return null;
  return (
    <span className={className}>
      <Editable as={as} value={value} onChange={onChange} className={as ? className : undefined} />
      {colon ? ":" : null}
    </span>
  );
}

/** Normalize skill groups while preserving user-defined distinct groups and multiline formatting. */
export function normalizeResumeSkills<T extends { skills?: { category: string; items: string[] }[] }>(r: T): T {
  if (!r?.skills?.length) return r;
  const skills = r.skills.map(g => ({
    category: isGenericSkillCategory(g.category) ? "Skills" : g.category,
    items: Array.isArray(g.items) ? g.items : (g.items ? [g.items] : []),
  }));
  return { ...r, skills };
}


export type RichSegment = { text: string; bold: boolean; italic: boolean; underline: boolean; fontSize?: number; fontFamily?: string };

/** Parse inline HTML produced by the editable preview into styled segments used by PDF/DOCX export. */
export function parseRichSegments(html: string): RichSegment[] {
  if (!html) return [{ text: "", bold: false, italic: false, underline: false }];
  if (!/[<&]/.test(html)) {
    return [{ text: html, bold: false, italic: false, underline: false }];
  }

  if (typeof document !== "undefined") {
    const root = document.createElement("div");
    root.innerHTML = html;
    const out: RichSegment[] = [];
    const walk = (node: Node, inherited: Omit<RichSegment, "text">) => {
      node.childNodes.forEach(child => {
        if (child.nodeType === Node.TEXT_NODE) {
          const text = child.textContent || "";
          if (text) out.push({ ...inherited, text });
          return;
        }
        if (child.nodeType !== Node.ELEMENT_NODE) return;
        const el = child as HTMLElement;
        const tag = el.tagName.toLowerCase();
        const style = el.style;
        const next: Omit<RichSegment, "text"> = {
          bold: inherited.bold || tag === "b" || tag === "strong" || parseInt(style.fontWeight || "0", 10) >= 600 || style.fontWeight === "bold",
          italic: inherited.italic || tag === "i" || tag === "em" || style.fontStyle === "italic",
          underline: inherited.underline || tag === "u" || (style.textDecoration || "").includes("underline"),
          fontSize: style.fontSize ? parseFloat(style.fontSize) : inherited.fontSize,
          fontFamily: style.fontFamily || inherited.fontFamily,
        };
        walk(el, next);
        if (tag === "br" || tag === "div" || tag === "p" || tag === "li") out.push({ ...next, text: "\n" });
      });
    };
    walk(root, { bold: false, italic: false, underline: false });
    const merged = out.filter(s => s.text !== "");
    return merged.length ? merged : [{ text: "", bold: false, italic: false, underline: false }];
  }

  // Fast isomorphic fallback when running in server/test environments without DOM
  const out: RichSegment[] = [];
  const tokenRegex = /(<[^>]+>|[^<]+)/g;
  let bold = false;
  let italic = false;
  let underline = false;
  let match: RegExpExecArray | null;

  while ((match = tokenRegex.exec(html)) !== null) {
    const token = match[0];
    if (token.startsWith("<")) {
      const lowerTag = token.toLowerCase();
      const isClosing = lowerTag.startsWith("</");
      const tagName = lowerTag.replace(/[</>]/g, "").trim().split(/\s+/)[0];
      if (tagName === "b" || tagName === "strong") bold = !isClosing;
      else if (tagName === "i" || tagName === "em") italic = !isClosing;
      else if (tagName === "u") underline = !isClosing;
    } else {
      out.push({ text: token, bold, italic, underline });
    }
  }

  return out.length ? out : [{ text: html, bold: false, italic: false, underline: false }];
}

/** Plain text of inline HTML (used where styling can't be represented). */
export function richToPlain(html: string) {
  return parseRichSegments(html).map(s => s.text).join("").replace(/\s+/g, " ").trim();
}

export function getNormalizedSectionOrder(order?: string[], r?: ResumeData): string[] {
  const baseOrder = Array.isArray(order) && order.length > 0 
    ? [...order] 
    : ["summary", "experience", "leadership", "projects", "education", "skills", "certifications"];
  
  if (!baseOrder.includes("leadership")) {
    const expIdx = baseOrder.indexOf("experience");
    if (expIdx !== -1) {
      baseOrder.splice(expIdx + 1, 0, "leadership");
    } else {
      const eduIdx = baseOrder.indexOf("education");
      if (eduIdx !== -1) {
        baseOrder.splice(eduIdx, 0, "leadership");
      } else {
        baseOrder.push("leadership");
      }
    }
  }
  return baseOrder;
}

export function getSectionTitle(r: ResumeData, key: string, fallback: string): string {
  return r.settings?.customSectionTitles?.[key] || fallback;
}

export function updateSectionTitle(
  r: ResumeData,
  on: ((patch: Partial<ResumeData>) => void) | undefined,
  key: string,
  newTitle: string
) {
  if (!on) return;
  on({
    settings: {
      ...r.settings,
      customSectionTitles: {
        ...(r.settings?.customSectionTitles || {}),
        [key]: newTitle,
      },
    },
  });
}

/* ---------- HTML Preview components ---------- */
function ModernPreview({ r, update }: { r: ResumeData; update?: UpdateFn }) {
  const on = (patch: Partial<ResumeData>) => update?.(patch);
  const sectionOrder = getNormalizedSectionOrder(r.settings?.sectionOrder, r);


  const renderSection = (key: string, index: number) => {
    let content = null;
    let title = "";
    
    switch(key) {
      case "summary":
        if (r.summary && r.summary.trim()) {
          title = "Summary";
          content = <Editable as="p" multiline value={r.summary} onChange={update && (v => on({ summary: v }))} className="text-[10px] whitespace-pre-wrap" />;
        }
        break;
      case "experience":
        if (r.experience?.length > 0) {
          title = "Experience";
          content = r.experience.map((e, i) => {
            const upd = makeExpUpdater(update, r, i);
            return (
              <div key={i} className="mb-2">
                <div className="flex justify-between font-semibold text-[11px] gap-2">
                  <span className="flex-1">
                    <Editable value={e.role} onChange={update && (v => upd({ role: v }))} /> · <Editable value={e.company} onChange={update && (v => upd({ company: v }))} />
                  </span>
                  <span className="text-neutral-500 text-[9px] whitespace-nowrap">
                    <Editable value={e.start} onChange={update && (v => upd({ start: v }))} /> – <Editable value={e.end} onChange={update && (v => upd({ end: v }))} />
                  </span>
                </div>
                <BulletsEditor bullets={e.bullets || []} onChange={update && (v => upd({ bullets: v }))} className="list-disc pl-4 mt-0.5 text-[10px] space-y-0.5" />
              </div>
            );
          });
        }
        break;
      case "leadership":
        if (r.leadership && r.leadership.length > 0) {
          title = "Leadership Experience";
          content = r.leadership.map((l, i) => {
            const upd = makeLeadershipUpdater(update, r, i);
            return (
              <div key={i} className="mb-2">
                <div className="flex justify-between font-semibold text-[11px] gap-2">
                  <span className="flex-1">
                    <Editable value={l.role} onChange={update && (v => upd({ role: v }))} /> · <Editable value={l.organization} onChange={update && (v => upd({ organization: v }))} />
                  </span>
                  <span className="text-neutral-500 text-[9px] whitespace-nowrap">
                    <Editable value={l.start || ""} onChange={update && (v => upd({ start: v }))} /> – <Editable value={l.end || ""} onChange={update && (v => upd({ end: v }))} />
                  </span>
                </div>
                {l.location && (
                  <div className="text-[9px] text-neutral-500">
                    <Editable value={l.location} onChange={update && (v => upd({ location: v }))} />
                  </div>
                )}
                <BulletsEditor bullets={l.bullets || []} onChange={update && (v => upd({ bullets: v }))} className="list-disc pl-4 mt-0.5 text-[10px] space-y-0.5" />
              </div>
            );
          });
        }
        break;
      case "projects":
        if (r.projects?.length > 0) {
          title = "Projects";
          content = r.projects.map((p, i) => {
            const upd = makeProjUpdater(update, r, i);
            return (
              <div key={i} className="mb-2">
                <div className="font-semibold text-[11px]">
                  <Editable value={p.name} onChange={update && (v => upd({ name: v }))} />{" "}
                  <span className="text-neutral-500 font-normal text-[9px]">· <Editable value={p.tech} onChange={update && (v => upd({ tech: v }))} /></span>
                </div>
                <BulletsEditor bullets={p.bullets || []} onChange={update && (v => upd({ bullets: v }))} className="list-disc pl-4 mt-0.5 text-[10px] space-y-0.5" />
              </div>
            );
          });
        }
        break;
      case "education":
        if (r.education?.length > 0) {
          title = "Education";
          content = r.education.map((e, i) => {
            const upd = makeEduUpdater(update, r, i);
            return (
              <div key={i} className="mb-1">
                <div className="flex justify-between font-semibold text-[11px] gap-2">
                  <span className="flex-1">
                    <Editable value={e.degree} onChange={update && (v => upd({ degree: v }))} />, <Editable value={e.school} onChange={update && (v => upd({ school: v }))} />
                  </span>
                  <span className="text-neutral-500 text-[9px] whitespace-nowrap">
                    <Editable value={e.start} onChange={update && (v => upd({ start: v }))} /> – <Editable value={e.end} onChange={update && (v => upd({ end: v }))} />
                  </span>
                </div>
                <Editable as="div" value={e.details} onChange={update && (v => upd({ details: v }))} className="text-[10px] text-neutral-600" />
              </div>
            );
          });
        }
        break;
      case "skills":
        return null;
      case "certifications":
        return null;
    }

    if (!content) return null;

    return (
      <Draggable key={key} draggableId={key} index={index}>
        {(provided, snapshot) => (
          <section
            ref={provided.innerRef}
            {...provided.draggableProps}
            className={`mb-4 group relative ${snapshot.isDragging ? "opacity-100 z-50 ring-2 ring-primary ring-offset-4 rounded bg-white shadow-2xl scale-[1.02]" : ""}`}
          >
            <div {...provided.dragHandleProps} className="absolute -left-6 top-0 opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing p-1 bg-white/80 rounded-full shadow-sm">
              <MousePointer2 className="h-3.5 w-3.5 text-primary" />
            </div>
            <h3 className="uppercase tracking-wider text-[10px] font-bold text-emerald-800 border-b-2 border-emerald-800 pb-1 mb-2 group-hover:bg-emerald-50 transition-colors">
              <Editable
                value={getSectionTitle(r, key, title)}
                onChange={update && (v => updateSectionTitle(r, on, key, v))}
              />
            </h3>
            <div className={snapshot.isDragging ? "pointer-events-none" : ""}>
              {content}
            </div>
          </section>
        )}
      </Draggable>
    );
  };

  return (
    <div 
      className="bg-white text-neutral-900 shadow-elegant rounded-none overflow-hidden font-sans text-[11px] leading-snug" 
      style={{ 
        minHeight: "var(--page-h, auto)",
        fontSize: r.settings?.fontSize ? `${r.settings.fontSize}px` : undefined,
        fontFamily: r.settings?.fontFamily || undefined
      }}
    >
      <div className="grid grid-cols-[35%_65%] h-full min-h-[1056px]">
        <div
          className="relative text-white p-5 group/sidebar cursor-pointer transition-colors"
          style={{ backgroundColor: r.settings?.sidebarBg || r.settings?.primaryColor || "#065f46" }}
          data-color-target="sidebar"
          data-color-label="Left Sidebar"
          data-current-color={r.settings?.sidebarBg || r.settings?.primaryColor || "#065f46"}
          title={update ? "Click to change color" : undefined}
        >
          {update && (
            <div className="preview-only-badge absolute top-2 right-2 opacity-0 group-hover/sidebar:opacity-100 transition-opacity bg-black/60 hover:bg-black/80 text-white text-[10px] font-semibold px-2 py-0.5 rounded-full flex items-center gap-1 pointer-events-none shadow backdrop-blur-sm z-10">
              <span>🎨 Color</span>
            </div>
          )}
          <Editable as="div" value={r.name || "Your Name"} onChange={update && (v => on({ name: v }))} className="font-bold text-lg leading-tight" />
          <Editable as="div" value={r.title} onChange={update && (v => on({ title: v }))} className="text-emerald-100 text-[10px] mt-0.5" />
          <div className="mt-4 space-y-1 text-[10px] text-emerald-50 break-words">
            <Editable as="div" value={r.email} onChange={update && (v => on({ email: v }))} />
            <Editable as="div" value={r.phone} onChange={update && (v => on({ phone: v }))} />
            <Editable as="div" value={r.location} onChange={update && (v => on({ location: v }))} />
            {r.links?.map((l, i) => (
              <Editable
                key={i}
                as="div"
                value={`${l.label}: ${l.url}`}
                onChange={update && (v => {
                  const [label, ...rest] = v.split(":");
                  on({ links: r.links.map((x, j) => j === i ? { label: (label || "").trim(), url: rest.join(":").trim() } : x) });
                })}
              />
            ))}
          </div>
          {r.skills?.length > 0 && (
            <div className="mt-5">
              <div className="uppercase tracking-wider text-[9px] font-bold border-b border-emerald-600 pb-1 mb-2">
                <Editable value={getSectionTitle(r, "skills", "Skills")} onChange={update && (v => updateSectionTitle(r, on, "skills", v))} />
              </div>
              <div className="flex flex-wrap gap-1.5">
                {r.skills.flatMap(s => s.items).map((it, k) => (
                  <span key={k} className="text-[9px] px-2 py-0.5 rounded-full bg-emerald-700/50 text-emerald-50 border border-emerald-600/30 whitespace-nowrap">
                    {it}
                  </span>
                ))}
              </div>
            </div>
          )}
          {r.certifications?.length > 0 && (
            <div className="mt-5">
              <div className="uppercase tracking-wider text-[9px] font-bold border-b border-emerald-600 pb-1 mb-2">
                <Editable value={getSectionTitle(r, "certifications", "Certifications")} onChange={update && (v => updateSectionTitle(r, on, "certifications", v))} />
              </div>
              <Editable as="div" multiline value={r.certifications.join("\n")} onChange={update && (v => on({ certifications: v.split("\n").map(x => x.trim()).filter(Boolean) }))} className="text-[10px] whitespace-pre-wrap" />
            </div>
          )}
        </div>
        <div className="p-5">
          <Droppable droppableId="main-content">
            {(provided) => (
              <div {...provided.droppableProps} ref={provided.innerRef}>
                {sectionOrder.map((key, index) => renderSection(key, index))}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        </div>
      </div>
    </div>
  );
}


function ClassicPreview({ r, update }: { r: ResumeData; update?: UpdateFn }) {
  const on = (patch: Partial<ResumeData>) => update?.(patch);
  const sectionOrder = getNormalizedSectionOrder(r.settings?.sectionOrder, r);


  const renderSection = (key: string, index: number) => {
    let content = null;
    let title = "";

    switch(key) {
      case "summary":
        if (r.summary && r.summary.trim()) {
          title = "Summary";
          content = <Editable as="p" multiline value={r.summary} onChange={update && (v => on({ summary: v }))} className="whitespace-pre-wrap" />;
        }
        break;
      case "experience":
        if (r.experience?.length > 0) {
          title = "Experience";
          content = r.experience.map((e, i) => {
            const upd = makeExpUpdater(update, r, i);
            return (
              <div key={i} className="mb-2">
                <div className="flex justify-between gap-2">
                  <span className="font-bold flex-1"><Editable value={e.role} onChange={update && (v => upd({ role: v }))} />, <Editable value={e.company} onChange={update && (v => upd({ company: v }))} /></span>
                  <span className="text-[10px] whitespace-nowrap"><Editable value={e.start} onChange={update && (v => upd({ start: v }))} /> – <Editable value={e.end} onChange={update && (v => upd({ end: v }))} /></span>
                </div>
                <Editable as="div" value={e.location} onChange={update && (v => upd({ location: v }))} className="italic text-[10px]" />
                <BulletsEditor bullets={e.bullets || []} onChange={update && (v => upd({ bullets: v }))} className="list-disc pl-4 mt-0.5" />
              </div>
            );
          });
        }
        break;
      case "leadership":
        if (r.leadership && r.leadership.length > 0) {
          title = "Leadership Experience";
          content = r.leadership.map((l, i) => {
            const upd = makeLeadershipUpdater(update, r, i);
            return (
              <div key={i} className="mb-2">
                <div className="flex justify-between gap-2">
                  <span className="font-bold flex-1"><Editable value={l.role} onChange={update && (v => upd({ role: v }))} />, <Editable value={l.organization} onChange={update && (v => upd({ organization: v }))} /></span>
                  <span className="text-[10px] whitespace-nowrap"><Editable value={l.start || ""} onChange={update && (v => upd({ start: v }))} /> – <Editable value={l.end || ""} onChange={update && (v => upd({ end: v }))} /></span>
                </div>
                {l.location && <Editable as="div" value={l.location} onChange={update && (v => upd({ location: v }))} className="italic text-[10px]" />}
                <BulletsEditor bullets={l.bullets || []} onChange={update && (v => upd({ bullets: v }))} className="list-disc pl-4 mt-0.5" />
              </div>
            );
          });
        }
        break;
      case "education":
        if (r.education?.length > 0) {
          title = "Education";
          content = r.education.map((e, i) => {
            const upd = makeEduUpdater(update, r, i);
            return (
              <div key={i} className="mb-1">
                <div className="flex justify-between gap-2"><span className="font-bold flex-1"><Editable value={e.degree} onChange={update && (v => upd({ degree: v }))} />, <Editable value={e.school} onChange={update && (v => upd({ school: v }))} /></span><span className="text-[10px] whitespace-nowrap"><Editable value={e.start} onChange={update && (v => upd({ start: v }))} /> – <Editable value={e.end} onChange={update && (v => upd({ end: v }))} /></span></div>
                <Editable as="div" value={e.details} onChange={update && (v => upd({ details: v }))} className="text-[10px]" />
              </div>
            );
          });
        }
        break;
      case "projects":
        if (r.projects?.length > 0) {
          title = "Projects";
          content = r.projects.map((p, i) => {
            const upd = makeProjUpdater(update, r, i);
            return (
              <div key={i} className="mb-1">
                <div className="font-bold"><Editable value={p.name} onChange={update && (v => upd({ name: v }))} /> <span className="italic font-normal">— <Editable value={p.tech} onChange={update && (v => upd({ tech: v }))} /></span></div>
                <BulletsEditor bullets={p.bullets || []} onChange={update && (v => upd({ bullets: v }))} className="list-disc pl-4" />
              </div>
            );
          });
        }
        break;
      case "skills":
        if (r.skills?.length > 0) {
          title = "Skills";
          content = (
            <div className="space-y-1">
              {r.skills.map((s, i) => {
                const upd = makeSkillUpdater(update, r, i);
                return (
                  <div key={i} className="text-[10px] leading-relaxed">
                    <SkillCat value={s.category} onChange={update && (v => upd({ category: v }))} className="font-bold" colon />{" "}
                    <Editable as="span" multiline value={s.items.join(", ")} onChange={update && (v => upd({ items: v.split(/[\n,]/).map(x => x.trim()).filter(Boolean) }))} className="whitespace-pre-wrap" />
                  </div>
                );
              })}
            </div>
          );
        }
        break;
      case "certifications":
        if (r.certifications?.length > 0) {
          title = "Certifications";
          content = <Editable value={r.certifications.join(" • ")} onChange={update && (v => on({ certifications: v.split("•").map(x => x.trim()).filter(Boolean) }))} />;
        }
        break;
    }

    if (!content) return null;

    return (
      <Draggable key={key} draggableId={key} index={index}>
        {(provided, snapshot) => (
          <section
            ref={provided.innerRef}
            {...provided.draggableProps}
            className={`mb-3 group relative ${snapshot.isDragging ? "opacity-100 z-50 ring-2 ring-primary ring-offset-4 rounded bg-white shadow-2xl scale-[1.02]" : ""}`}
          >
            <div {...provided.dragHandleProps} className="absolute -left-7 top-0 opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing p-1 bg-white/80 rounded-full shadow-sm">
              <MousePointer2 className="h-3.5 w-3.5 text-primary" />
            </div>
            <h3 className="uppercase text-[11px] font-bold tracking-widest border-b border-neutral-400 pb-1 mb-1.5 group-hover:bg-neutral-50 transition-colors">
              <Editable
                value={getSectionTitle(r, key, title)}
                onChange={update && (v => updateSectionTitle(r, on, key, v))}
              />
            </h3>
            <div className={snapshot.isDragging ? "pointer-events-none" : ""}>
              {content}
            </div>
          </section>
        )}
      </Draggable>
    );
  };

  return (
    <div 
      className="bg-white text-neutral-900 shadow-elegant rounded-lg p-8 font-serif text-[11px] leading-snug" 
      style={{ 
        minHeight: "var(--page-h, auto)",
        fontSize: r.settings?.fontSize ? `${r.settings.fontSize}px` : undefined,
        fontFamily: r.settings?.fontFamily || undefined
      }}
    >
      <div className="text-center border-b-2 border-neutral-900 pb-2 mb-3">
        <Editable as="div" value={r.name || "Your Name"} onChange={update && (v => on({ name: v }))} className="font-bold text-2xl tracking-tight" />
        <Editable as="div" value={r.title} onChange={update && (v => on({ title: v }))} className="text-[11px] mt-0.5" />
        <div className="text-[10px] mt-1 text-neutral-700">
          <Editable value={[r.email, r.phone, r.location, ...(r.links?.map(l => l.url) ?? [])].filter(Boolean).join("  •  ")}
            onChange={update && (v => {
              const parts = v.split("•").map(s => s.trim()).filter(Boolean);
              const [email, phone, location, ...linkUrls] = parts;
              on({
                email: email || "", phone: phone || "", location: location || "",
                links: linkUrls.map((url, i) => ({ label: r.links?.[i]?.label || "Link", url })),
              });
            })} />
        </div>
      </div>
      
      <Droppable droppableId="classic-content">
        {(provided) => (
          <div {...provided.droppableProps} ref={provided.innerRef}>
            {sectionOrder.map((key, index) => renderSection(key, index))}
            {provided.placeholder}
          </div>
        )}
      </Droppable>
    </div>
  );
}

function CompactPreview({ r, update }: { r: ResumeData; update?: UpdateFn }) {
  const on = (patch: Partial<ResumeData>) => update?.(patch);
  const sectionOrder = getNormalizedSectionOrder(r.settings?.sectionOrder, r);


  const renderSection = (key: string, index: number) => {
    let content = null;
    let title = "";

    switch(key) {
      case "summary":
        if (r.summary && r.summary.trim()) {
          title = "Summary";
          content = <Editable as="p" multiline value={r.summary} onChange={update && (v => on({ summary: v }))} className="mb-2 text-[10px] whitespace-pre-wrap" />;
        }
        break;
      case "experience":
        if (r.experience?.length > 0) {
          title = "Experience";
          content = r.experience.map((e, i) => {
            const upd = makeExpUpdater(update, r, i);
            return (
              <div key={i} className="mb-1.5">
                <div className="flex justify-between text-[10px] gap-2">
                  <span className="font-semibold flex-1"><Editable value={e.role} onChange={update && (v => upd({ role: v }))} /> — <Editable value={e.company} onChange={update && (v => upd({ company: v }))} /></span>
                  <span className="text-neutral-500 whitespace-nowrap"><Editable value={e.start} onChange={update && (v => upd({ start: v }))} /> – <Editable value={e.end} onChange={update && (v => upd({ end: v }))} /></span>
                </div>
                <BulletsEditor bullets={e.bullets || []} onChange={update && (v => upd({ bullets: v }))} className="list-disc pl-3.5" />
              </div>
            );
          });
        }
        break;
      case "leadership":
        if (r.leadership && r.leadership.length > 0) {
          title = "Leadership";
          content = r.leadership.map((l, i) => {
            const upd = makeLeadershipUpdater(update, r, i);
            return (
              <div key={i} className="mb-1.5">
                <div className="flex justify-between text-[10px] gap-2">
                  <span className="font-semibold flex-1"><Editable value={l.role} onChange={update && (v => upd({ role: v }))} /> — <Editable value={l.organization} onChange={update && (v => upd({ organization: v }))} /></span>
                  <span className="text-neutral-500 whitespace-nowrap"><Editable value={l.start || ""} onChange={update && (v => upd({ start: v }))} /> – <Editable value={l.end || ""} onChange={update && (v => upd({ end: v }))} /></span>
                </div>
                {l.location && <div className="text-[9px] text-neutral-500"><Editable value={l.location} onChange={update && (v => upd({ location: v }))} /></div>}
                <BulletsEditor bullets={l.bullets || []} onChange={update && (v => upd({ bullets: v }))} className="list-disc pl-3.5" />
              </div>
            );
          });
        }
        break;
      case "education":
        if (r.education?.length > 0) {
          title = "Education";
          content = r.education.map((e, i) => {
            const upd = makeEduUpdater(update, r, i);
            return (
              <div key={i}>
                <Editable as="div" value={e.degree} onChange={update && (v => upd({ degree: v }))} className="font-semibold" />
                <div><Editable value={e.school} onChange={update && (v => upd({ school: v }))} />, <Editable value={e.start} onChange={update && (v => upd({ start: v }))} />–<Editable value={e.end} onChange={update && (v => upd({ end: v }))} /></div>
              </div>
            );
          });
        }
        break;
      case "projects":
        if (r.projects?.length > 0) {
          title = "Projects";
          content = r.projects.map((p, i) => {
            const upd = makeProjUpdater(update, r, i);
            return (
              <div key={i} className="mb-1">
                <Editable as="div" value={p.name} onChange={update && (v => upd({ name: v }))} className="font-semibold" />
                <BulletsEditor bullets={p.bullets || []} onChange={update && (v => upd({ bullets: v }))} className="list-disc pl-3.5" />
              </div>
            );
          });
        }
        break;
      case "skills":
        if (r.skills?.length > 0) {
          title = "Skills";
          content = r.skills.map((s, i) => {
            const upd = makeSkillUpdater(update, r, i);
            return (
              <div key={i} className="mb-1"><SkillCat value={s.category} onChange={update && (v => upd({ category: v }))} className="font-semibold" colon /> <Editable as="span" multiline value={s.items.join(", ")} onChange={update && (v => upd({ items: v.split(/[\n,]/).map(x => x.trim()).filter(Boolean) }))} className="whitespace-pre-wrap" /></div>
            );
          });
        }
        break;
      case "certifications":
        if (r.certifications?.length > 0) {
          title = "Certifications";
          content = <Editable as="div" multiline value={r.certifications.map(c => "• " + c).join("\n")}
            onChange={update && (v => on({ certifications: v.split("\n").map(x => x.replace(/^•\s*/, "").trim()).filter(Boolean) }))}
            className="whitespace-pre-wrap" />;
        }
        break;
    }

    if (!content) return null;

    return (
      <Draggable key={key} draggableId={key} index={index}>
        {(provided, snapshot) => (
          <section
            ref={provided.innerRef}
            {...provided.draggableProps}
            className={`mb-2 group relative ${snapshot.isDragging ? "opacity-100 z-50 ring-1 ring-primary ring-offset-2 rounded bg-white shadow-xl scale-[1.01]" : ""}`}
          >
            <div {...provided.dragHandleProps} className="absolute -left-6 top-0 opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing p-1 bg-white/80 rounded-full shadow-sm">
              <MousePointer2 className="h-3 w-3 text-primary" />
            </div>
            {title && (
              <h3 className="font-bold text-[10px] uppercase tracking-wide text-neutral-700 mb-0.5 group-hover:bg-neutral-50 transition-colors">
                <Editable
                  value={getSectionTitle(r, key, title)}
                  onChange={update && (v => updateSectionTitle(r, on, key, v))}
                />
              </h3>
            )}
            <div className={snapshot.isDragging ? "pointer-events-none" : ""}>
              {content}
            </div>
          </section>
        )}
      </Draggable>
    );
  };

  return (
    <div className="bg-white text-neutral-900 shadow-elegant rounded-lg p-6 font-sans text-[10px] leading-tight" style={{ minHeight: "var(--page-h, auto)", fontSize: r.settings?.fontSize ? `${r.settings.fontSize}px` : undefined, fontFamily: r.settings?.fontFamily || undefined }}>
      <div className="flex justify-between items-end border-b-2 border-neutral-900 pb-1.5 mb-2">
        <div>
          <Editable as="div" value={r.name || "Your Name"} onChange={update && (v => on({ name: v }))} className="font-extrabold text-xl" />
          <Editable as="div" value={r.title} onChange={update && (v => on({ title: v }))} className="text-[10px] text-neutral-600" />
        </div>
        <div className="text-right text-[9px] text-neutral-700">
          <Editable as="div" value={r.email} onChange={update && (v => on({ email: v }))} />
          <Editable as="div" value={r.phone} onChange={update && (v => on({ phone: v }))} />
          <Editable as="div" value={r.location} onChange={update && (v => on({ location: v }))} />
          {r.links?.map((l, i) => (
            <Editable key={i} as="div" value={l.url}
              onChange={update && (v => on({ links: r.links.map((x, j) => j === i ? { ...x, url: v } : x) }))} />
          ))}
        </div>
      </div>
      
      <Droppable droppableId="compact-content">
        {(provided) => (
          <div {...provided.droppableProps} ref={provided.innerRef} className="grid grid-cols-1 gap-1">
            {sectionOrder.map((key, index) => renderSection(key, index))}
            {provided.placeholder}
          </div>
        )}
      </Droppable>
    </div>
  );
}

/* ---------- Executive: elegant serif, right-aligned metadata ---------- */
function ExecutivePreview({ r, update }: { r: ResumeData; update?: UpdateFn }) {
  const on = (patch: Partial<ResumeData>) => update?.(patch);
  const sectionOrder = getNormalizedSectionOrder(r.settings?.sectionOrder, r);


  const renderSection = (key: string, index: number) => {
    let content = null;
    let title = "";

    switch(key) {
      case "summary":
        if (r.summary && r.summary.trim()) {
          title = "Profile";
          content = <Editable as="p" multiline value={r.summary} onChange={update && (v => on({ summary: v }))} className="whitespace-pre-wrap" />;
        }
        break;
      case "experience":
        if (r.experience?.length > 0) {
          title = "Professional Experience";
          content = r.experience.map((e, i) => {
            const upd = makeExpUpdater(update, r, i);
            return (
              <div key={i} className="mb-2">
                <div className="flex justify-between gap-2">
                  <span className="font-bold flex-1"><Editable value={e.role} onChange={update && (v => upd({ role: v }))} /></span>
                  <span className="text-[10px] italic text-neutral-600 whitespace-nowrap"><Editable value={e.start} onChange={update && (v => upd({ start: v }))} /> – <Editable value={e.end} onChange={update && (v => upd({ end: v }))} /></span>
                </div>
                <div className="italic text-[10px] text-neutral-700"><Editable value={e.company} onChange={update && (v => upd({ company: v }))} />{e.location ? ", " : ""}<Editable value={e.location} onChange={update && (v => upd({ location: v }))} /></div>
                <BulletsEditor bullets={e.bullets || []} onChange={update && (v => upd({ bullets: v }))} className="list-disc pl-4 mt-0.5" />
              </div>
            );
          });
        }
        break;
      case "leadership":
        if (r.leadership && r.leadership.length > 0) {
          title = "Leadership & Activities";
          content = r.leadership.map((l, i) => {
            const upd = makeLeadershipUpdater(update, r, i);
            return (
              <div key={i} className="mb-2">
                <div className="flex justify-between gap-2">
                  <span className="font-bold flex-1"><Editable value={l.role} onChange={update && (v => upd({ role: v }))} /></span>
                  <span className="text-[10px] italic text-neutral-600 whitespace-nowrap"><Editable value={l.start || ""} onChange={update && (v => upd({ start: v }))} /> – <Editable value={l.end || ""} onChange={update && (v => upd({ end: v }))} /></span>
                </div>
                <div className="italic text-[10px] text-neutral-700"><Editable value={l.organization} onChange={update && (v => upd({ organization: v }))} />{l.location ? ", " : ""}<Editable value={l.location || ""} onChange={update && (v => upd({ location: v }))} /></div>
                <BulletsEditor bullets={l.bullets || []} onChange={update && (v => upd({ bullets: v }))} className="list-disc pl-4 mt-0.5" />
              </div>
            );
          });
        }
        break;
      case "education":
        if (r.education?.length > 0) {
          title = "Education";
          content = r.education.map((e, i) => {
            const upd = makeEduUpdater(update, r, i);
            return (
              <div key={i} className="mb-1">
                <div className="flex justify-between gap-2">
                  <span className="font-bold flex-1"><Editable value={e.degree} onChange={update && (v => upd({ degree: v }))} />, <Editable value={e.school} onChange={update && (v => upd({ school: v }))} /></span>
                  <span className="text-[10px] italic text-neutral-600 whitespace-nowrap"><Editable value={e.start} onChange={update && (v => upd({ start: v }))} /> – <Editable value={e.end} onChange={update && (v => upd({ end: v }))} /></span>
                </div>
                <Editable as="div" value={e.details} onChange={update && (v => upd({ details: v }))} className="text-[10px]" />
              </div>
            );
          });
        }
        break;
      case "projects":
        if (r.projects?.length > 0) {
          title = "Key Projects";
          content = r.projects.map((p, i) => {
            const upd = makeProjUpdater(update, r, i);
            return (
              <div key={i} className="mb-1">
                <div className="font-bold text-amber-900"><Editable value={p.name} onChange={update && (v => upd({ name: v }))} /></div>
                <BulletsEditor bullets={p.bullets || []} onChange={update && (v => upd({ bullets: v }))} className="list-disc pl-4 mt-0.5" />
              </div>
            );
          });
        }
        break;
      case "skills":
        if (r.skills?.length > 0) {
          title = "Core Competencies";
          content = r.skills.map((s, i) => {
            const upd = makeSkillUpdater(update, r, i);
            return (
              <div key={i}><SkillCat value={s.category} onChange={update && (v => upd({ category: v }))} className="font-bold" colon /> <Editable as="span" multiline value={s.items.join(", ")} onChange={update && (v => upd({ items: v.split(/[\n,]/).map(x => x.trim()).filter(Boolean) }))} className="whitespace-pre-wrap" /></div>
            );
          });
        }
        break;
      case "certifications":
        if (r.certifications?.length > 0) {
          title = "Certifications";
          content = <Editable value={r.certifications.join(" • ")} onChange={update && (v => on({ certifications: v.split("•").map(x => x.trim()).filter(Boolean) }))} />;
        }
        break;
    }

    if (!content) return null;

    return (
      <Draggable key={key} draggableId={key} index={index}>
        {(provided, snapshot) => (
          <section
            ref={provided.innerRef}
            {...provided.draggableProps}
            className={`mb-3 group relative ${snapshot.isDragging ? "opacity-100 z-50 ring-2 ring-amber-800 ring-offset-4 rounded bg-white shadow-2xl scale-[1.02]" : ""}`}
          >
            <div {...provided.dragHandleProps} className="absolute -left-7 top-0 opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing p-1 bg-white/80 rounded-full shadow-sm">
              <MousePointer2 className="h-3.5 w-3.5 text-amber-800" />
            </div>
            <h3 className="text-[11px] font-bold uppercase tracking-[0.2em] text-amber-800 mb-1 group-hover:bg-amber-50/30 transition-colors">
              <Editable
                value={getSectionTitle(r, key, title)}
                onChange={update && (v => updateSectionTitle(r, on, key, v))}
              />
            </h3>
            <div className={snapshot.isDragging ? "pointer-events-none" : ""}>
              {content}
            </div>
          </section>
        )}
      </Draggable>
    );
  };

  return (
    <div className="bg-white text-neutral-900 shadow-elegant rounded-lg p-8 font-serif text-[11px] leading-snug" style={{ minHeight: "var(--page-h, auto)", fontSize: r.settings?.fontSize ? `${r.settings.fontSize}px` : undefined, fontFamily: r.settings?.fontFamily || undefined }}>
      <div className="pb-3 mb-4 border-b-4 border-amber-800">
        <Editable as="div" value={r.name || "Your Name"} onChange={update && (v => on({ name: v }))} className="font-bold text-3xl tracking-tight text-amber-900" />
        <div className="flex justify-between items-end mt-1">
          <Editable as="div" value={r.title} onChange={update && (v => on({ title: v }))} className="italic text-[12px] text-neutral-700" />
          <div className="text-right text-[9px] text-neutral-600">
            <Editable as="div" value={r.email} onChange={update && (v => on({ email: v }))} />
            <Editable as="div" value={r.phone} onChange={update && (v => on({ phone: v }))} />
            <Editable as="div" value={r.location} onChange={update && (v => on({ location: v }))} />
          </div>
        </div>
      </div>
      
      <Droppable droppableId="executive-content">
        {(provided) => (
          <div {...provided.droppableProps} ref={provided.innerRef}>
            {sectionOrder.map((key, index) => renderSection(key, index))}
            {provided.placeholder}
          </div>
        )}
      </Droppable>
    </div>
  );
}

/* ---------- Creative: bold indigo header banner, two-column ---------- */
function CreativePreview({ r, update }: { r: ResumeData; update?: UpdateFn }) {
  const on = (patch: Partial<ResumeData>) => update?.(patch);
  const sectionOrder = getNormalizedSectionOrder(r.settings?.sectionOrder, r);

  const renderSection = (key: string) => {
    switch (key) {
      case "summary":
        if (r.summary && r.summary.trim()) {
          return (
            <section key="summary" className="mb-3">
              <h3 className="text-[10px] font-bold uppercase tracking-widest text-indigo-700 mb-1">
                <Editable value={getSectionTitle(r, "summary", "About")} onChange={update && (v => updateSectionTitle(r, on, "summary", v))} />
              </h3>
              <Editable as="p" multiline value={r.summary} onChange={update && (v => on({ summary: v }))} className="whitespace-pre-wrap text-[10px]" />
            </section>
          );
        }
        return null;
      case "experience":
        if (r.experience?.length > 0) {
          return (
            <section key="experience" className="mb-3">
              <h3 className="text-[10px] font-bold uppercase tracking-widest text-indigo-700 mb-1">
                <Editable value={getSectionTitle(r, "experience", "Experience")} onChange={update && (v => updateSectionTitle(r, on, "experience", v))} />
              </h3>
              {r.experience.map((e, i) => {
                const upd = makeExpUpdater(update, r, i);
                return (
                  <div key={i} className="mb-2 pl-3 border-l-2 border-indigo-200">
                    <div className="font-semibold text-[11px]"><Editable value={e.role} onChange={update && (v => upd({ role: v }))} /> · <span className="text-indigo-700"><Editable value={e.company} onChange={update && (v => upd({ company: v }))} /></span></div>
                    <div className="text-[9px] text-neutral-500"><Editable value={e.start} onChange={update && (v => upd({ start: v }))} /> – <Editable value={e.end} onChange={update && (v => upd({ end: v }))} /></div>
                    <BulletsEditor bullets={e.bullets || []} onChange={update && (v => upd({ bullets: v }))} className="list-disc pl-4 mt-0.5 text-[10px]" />
                  </div>
                );
              })}
            </section>
          );
        }
        return null;
      case "projects":
        if (r.projects?.length > 0) {
          return (
            <section key="projects" className="mb-3">
              <h3 className="text-[10px] font-bold uppercase tracking-widest text-indigo-700 mb-1">
                <Editable value={getSectionTitle(r, "projects", "Projects")} onChange={update && (v => updateSectionTitle(r, on, "projects", v))} />
              </h3>
              {r.projects.map((p, i) => {
                const upd = makeProjUpdater(update, r, i);
                return (
                  <div key={i} className="mb-1.5">
                    <div className="font-semibold text-[11px]"><Editable value={p.name} onChange={update && (v => upd({ name: v }))} /> <span className="text-neutral-500 font-normal text-[9px]">— <Editable value={p.tech} onChange={update && (v => upd({ tech: v }))} /></span></div>
                    <BulletsEditor bullets={p.bullets || []} onChange={update && (v => upd({ bullets: v }))} className="list-disc pl-4 text-[10px]" />
                  </div>
                );
              })}
            </section>
          );
        }
        return null;
      case "leadership":
        if (r.leadership && r.leadership.length > 0) {
          return (
            <section key="leadership" className="mb-3">
              <h3 className="text-[10px] font-bold uppercase tracking-widest text-indigo-700 mb-1">
                <Editable value={getSectionTitle(r, "leadership", "Leadership")} onChange={update && (v => updateSectionTitle(r, on, "leadership", v))} />
              </h3>
              {r.leadership.map((l, i) => {
                const upd = makeLeadershipUpdater(update, r, i);
                return (
                  <div key={i} className="mb-2 pl-3 border-l-2 border-indigo-200">
                    <div className="font-semibold text-[11px]"><Editable value={l.role} onChange={update && (v => upd({ role: v }))} /> · <span className="text-indigo-700"><Editable value={l.organization} onChange={update && (v => upd({ organization: v }))} /></span></div>
                    <div className="text-[9px] text-neutral-500"><Editable value={l.start || ""} onChange={update && (v => upd({ start: v }))} /> – <Editable value={l.end || ""} onChange={update && (v => upd({ end: v }))} /></div>
                    <BulletsEditor bullets={l.bullets || []} onChange={update && (v => upd({ bullets: v }))} className="list-disc pl-4 mt-0.5 text-[10px]" />
                  </div>
                );
              })}
            </section>
          );
        }
        return null;
      case "skills":
        if (r.skills?.length > 0) {
          return (
            <section key="skills" className="mb-3">
              <h3 className="text-[10px] font-bold uppercase tracking-widest text-indigo-700 mb-1">
                <Editable value={getSectionTitle(r, "skills", "Skills")} onChange={update && (v => updateSectionTitle(r, on, "skills", v))} />
              </h3>
              <div className="space-y-1">
                {r.skills.map((s, i) => {
                  const upd = makeSkillUpdater(update, r, i);
                  return (
                    <div key={i} className="mb-1">
                      <SkillCat as="div" value={s.category} onChange={update && (v => upd({ category: v }))} className="font-semibold text-[10px]" />
                      <Editable as="div" multiline value={s.items.join(", ")} onChange={update && (v => upd({ items: v.split(/[\n,]/).map(x => x.trim()).filter(Boolean) }))} className="text-[9.5px] text-neutral-700 mt-0.5 whitespace-pre-wrap leading-relaxed" />
                    </div>
                  );
                })}
              </div>
            </section>
          );
        }
        return null;
      case "education":
        if (r.education?.length > 0) {
          return (
            <section key="education" className="mb-3">
              <h3 className="text-[10px] font-bold uppercase tracking-widest text-indigo-700 mb-1">
                <Editable value={getSectionTitle(r, "education", "Education")} onChange={update && (v => updateSectionTitle(r, on, "education", v))} />
              </h3>
              {r.education.map((e, i) => {
                const upd = makeEduUpdater(update, r, i);
                return (
                  <div key={i} className="mb-1">
                    <Editable as="div" value={e.degree} onChange={update && (v => upd({ degree: v }))} className="font-semibold text-[10px]" />
                    <Editable as="div" value={e.school} onChange={update && (v => upd({ school: v }))} className="text-[10px]" />
                    <div className="text-[9px] text-neutral-500"><Editable value={e.start} onChange={update && (v => upd({ start: v }))} />–<Editable value={e.end} onChange={update && (v => upd({ end: v }))} /></div>
                  </div>
                );
              })}
            </section>
          );
        }
        return null;
      case "certifications":
        if (r.certifications?.length > 0) {
          return (
            <section key="certifications">
              <h3 className="text-[10px] font-bold uppercase tracking-widest text-indigo-700 mb-1">
                <Editable value={getSectionTitle(r, "certifications", "Certifications")} onChange={update && (v => updateSectionTitle(r, on, "certifications", v))} />
              </h3>
              <Editable as="div" multiline value={r.certifications.join("\n")} onChange={update && (v => on({ certifications: v.split("\n").map(x => x.trim()).filter(Boolean) }))} className="text-[10px] whitespace-pre-wrap" />
            </section>
          );
        }
        return null;
      default:
        return null;
    }
  };

  const leftKeys = ["summary", "experience", "leadership", "projects"];
  const rightKeys = ["skills", "education", "certifications"];

  return (
    <div className="bg-white text-neutral-900 shadow-elegant rounded-none overflow-hidden font-sans text-[11px] leading-snug" style={{ minHeight: "var(--page-h, auto)", fontSize: r.settings?.fontSize ? `${r.settings.fontSize}px` : undefined, fontFamily: r.settings?.fontFamily || undefined }}>
      <div
        className="p-5 text-white relative group/header cursor-pointer transition-colors"
        style={{ background: r.settings?.headerBg || r.settings?.primaryColor || "linear-gradient(to right, #4338ca, #4f46e5, #c026d3)" }}
        data-color-target="header"
        data-color-label="Indigo Creative Header"
        data-current-color={r.settings?.headerBg || r.settings?.primaryColor || "#4338ca"}
        title={update ? "Click to change color" : undefined}
      >
        {update && (
          <div className="preview-only-badge absolute top-2 right-2 opacity-0 group-hover/header:opacity-100 transition-opacity bg-black/60 hover:bg-black/80 text-white text-[10px] font-semibold px-2 py-0.5 rounded-full flex items-center gap-1 pointer-events-none shadow backdrop-blur-sm z-10">
            <span>🎨 Color</span>
          </div>
        )}
        <Editable as="div" value={r.name || "Your Name"} onChange={update && (v => on({ name: v }))} className="font-extrabold text-2xl tracking-tight" />
        <Editable as="div" value={r.title} onChange={update && (v => on({ title: v }))} className="text-indigo-100 text-[11px]" />
        <div className="flex flex-wrap gap-x-3 mt-2 text-[10px] text-indigo-50">
          <Editable value={r.email} onChange={update && (v => on({ email: v }))} />
          <Editable value={r.phone} onChange={update && (v => on({ phone: v }))} />
          <Editable value={r.location} onChange={update && (v => on({ location: v }))} />
          {r.links?.filter(l => l && (l.url || l.label)).map((l, i) => (
            <Editable key={i} value={l.url || l.label} onChange={update && (v => on({ links: r.links.map((x, j) => j === i ? { ...x, url: v } : x) }))} />
          ))}
        </div>
      </div>
      <div className="grid grid-cols-[minmax(0,1fr)_230px] gap-4 p-5">
        <div>
          {sectionOrder.filter(k => leftKeys.includes(k)).map(k => renderSection(k))}
        </div>
        <div>
          {sectionOrder.filter(k => rightKeys.includes(k)).map(k => renderSection(k))}
        </div>
      </div>
    </div>
  );
}

/* ---------- Minimal: airy, mono-weight, generous whitespace ---------- */
function MinimalPreview({ r, update }: { r: ResumeData; update?: UpdateFn }) {
  const on = (patch: Partial<ResumeData>) => update?.(patch);
  const sectionOrder = getNormalizedSectionOrder(r.settings?.sectionOrder, r);


  const renderSection = (key: string, index: number) => {
    let content = null;
    let title = "";

    switch(key) {
      case "summary":
        if (r.summary && r.summary.trim()) {
          title = "Summary";
          content = <Editable as="p" multiline value={r.summary} onChange={update && (v => on({ summary: v }))} className="whitespace-pre-wrap text-[11px]" />;
        }
        break;
      case "experience":
        if (r.experience?.length > 0) {
          title = "Experience";
          content = r.experience.map((e, i) => {
            const upd = makeExpUpdater(update, r, i);
            return (
              <div key={i} className="mb-3 grid grid-cols-[80px_1fr] gap-4">
                <div className="text-[9px] text-neutral-400 pt-0.5"><Editable value={e.start} onChange={update && (v => upd({ start: v }))} /><br /><Editable value={e.end} onChange={update && (v => upd({ end: v }))} /></div>
                <div>
                  <div className="font-medium text-[11px]"><Editable value={e.role} onChange={update && (v => upd({ role: v }))} /></div>
                  <div className="text-neutral-500 text-[10px]"><Editable value={e.company} onChange={update && (v => upd({ company: v }))} /></div>
                  <BulletsEditor bullets={e.bullets || []} onChange={update && (v => upd({ bullets: v }))} className="list-disc pl-4 mt-1 text-[10px] space-y-0.5" />
                </div>
              </div>
            );
          });
        }
        break;
      case "leadership":
        if (r.leadership && r.leadership.length > 0) {
          title = "Leadership";
          content = r.leadership.map((l, i) => {
            const upd = makeLeadershipUpdater(update, r, i);
            return (
              <div key={i} className="mb-3 grid grid-cols-[80px_1fr] gap-4">
                <div className="text-[9px] text-neutral-400 pt-0.5"><Editable value={l.start || ""} onChange={update && (v => upd({ start: v }))} /><br /><Editable value={l.end || ""} onChange={update && (v => upd({ end: v }))} /></div>
                <div>
                  <div className="font-medium text-[11px]"><Editable value={l.role} onChange={update && (v => upd({ role: v }))} /></div>
                  <div className="text-neutral-500 text-[10px]"><Editable value={l.organization} onChange={update && (v => upd({ organization: v }))} /></div>
                  <BulletsEditor bullets={l.bullets || []} onChange={update && (v => upd({ bullets: v }))} className="list-disc pl-4 mt-1 text-[10px] space-y-0.5" />
                </div>
              </div>
            );
          });
        }
        break;
      case "education":
        if (r.education?.length > 0) {
          title = "Education";
          content = r.education.map((e, i) => {
            const upd = makeEduUpdater(update, r, i);
            return (
              <div key={i} className="mb-1 grid grid-cols-[80px_1fr] gap-4">
                <div className="text-[9px] text-neutral-400 pt-0.5"><Editable value={e.start} onChange={update && (v => upd({ start: v }))} />–<Editable value={e.end} onChange={update && (v => upd({ end: v }))} /></div>
                <div>
                  <div className="font-medium text-[11px]"><Editable value={e.degree} onChange={update && (v => upd({ degree: v }))} /></div>
                  <div className="text-neutral-500 text-[10px]"><Editable value={e.school} onChange={update && (v => upd({ school: v }))} /></div>
                </div>
              </div>
            );
          });
        }
        break;
      case "projects":
        if (r.projects?.length > 0) {
          title = "Projects";
          content = r.projects.map((p, i) => {
            const upd = makeProjUpdater(update, r, i);
            return (
              <div key={i} className="mb-2 grid grid-cols-[80px_1fr] gap-4">
                <div className="text-[9px] text-neutral-400 pt-0.5"><Editable value={p.tech} onChange={update && (v => upd({ tech: v }))} /></div>
                <div>
                  <div className="font-medium text-[11px]"><Editable value={p.name} onChange={update && (v => upd({ name: v }))} /></div>
                  <BulletsEditor bullets={p.bullets || []} onChange={update && (v => upd({ bullets: v }))} className="list-disc pl-4 mt-1 text-[10px]" />
                </div>
              </div>
            );
          });
        }
        break;
      case "skills":
        if (r.skills?.length > 0) {
          title = "Skills";
          content = r.skills.map((s, i) => {
            const upd = makeSkillUpdater(update, r, i);
            return (
              <div key={i} className={isGenericSkillCategory(s.category) ? "mb-1" : "grid grid-cols-[80px_1fr] gap-4 mb-1"}>
                <div className="text-[10px] text-neutral-500"><SkillCat value={s.category} onChange={update && (v => upd({ category: v }))} /></div>
                <div className="text-[10px]"><Editable as="div" multiline value={s.items.join(", ")} onChange={update && (v => upd({ items: v.split(/[\n,]/).map(x => x.trim()).filter(Boolean) }))} className="whitespace-pre-wrap leading-relaxed" /></div>
              </div>
            );
          });
        }
        break;
      case "certifications":
        if (r.certifications?.length > 0) {
          title = "Certifications";
          content = <Editable value={r.certifications.join(" · ")} onChange={update && (v => on({ certifications: v.split("·").map(x => x.trim()).filter(Boolean) }))} />;
        }
        break;
    }

    if (!content) return null;

    return (
      <Draggable key={key} draggableId={key} index={index}>
        {(provided, snapshot) => (
          <section
            ref={provided.innerRef}
            {...provided.draggableProps}
            className={`mb-5 group relative ${snapshot.isDragging ? "opacity-100 z-50 ring-1 ring-neutral-300 ring-offset-2 rounded bg-white shadow-lg scale-[1.01]" : ""}`}
          >
            <div {...provided.dragHandleProps} className="absolute -left-7 top-0 opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing p-1 bg-white/80 rounded-full shadow-sm">
              <MousePointer2 className="h-3 w-3 text-neutral-400" />
            </div>
            <h3 className="text-[9px] font-semibold uppercase tracking-[0.3em] text-neutral-400 mb-2 group-hover:bg-neutral-50 transition-colors">
              <Editable
                value={getSectionTitle(r, key, title)}
                onChange={update && (v => updateSectionTitle(r, on, key, v))}
              />
            </h3>
            <div className={snapshot.isDragging ? "pointer-events-none" : ""}>
              {content}
            </div>
          </section>
        )}
      </Draggable>
    );
  };

  return (
    <div className="bg-white text-neutral-900 shadow-elegant rounded-lg p-10 font-sans text-[11px] leading-relaxed" style={{ minHeight: "var(--page-h, auto)", fontSize: r.settings?.fontSize ? `${r.settings.fontSize}px` : undefined, fontFamily: r.settings?.fontFamily || undefined }}>
      <div className="mb-6">
        <Editable as="div" value={r.name || "Your Name"} onChange={update && (v => on({ name: v }))} className="font-light text-3xl tracking-tight text-neutral-900" />
        <Editable as="div" value={r.title} onChange={update && (v => on({ title: v }))} className="text-neutral-500 text-[11px] mt-1" />
        <div className="mt-2 text-[10px] text-neutral-500">
          <Editable value={[r.email, r.phone, r.location, ...(r.links?.map(l => l.url) ?? [])].filter(Boolean).join("   ·   ")}
            onChange={update && (v => {
              const parts = v.split("·").map(s => s.trim()).filter(Boolean);
              const [email, phone, location, ...linkUrls] = parts;
              on({ email: email || "", phone: phone || "", location: location || "",
                links: linkUrls.map((url, i) => ({ label: r.links?.[i]?.label || "Link", url })) });
            })} />
        </div>
      </div>
      
      <Droppable droppableId="minimal-content">
        {(provided) => (
          <div {...provided.droppableProps} ref={provided.innerRef}>
            {sectionOrder.map((key, index) => renderSection(key, index))}
            {provided.placeholder}
          </div>
        )}
      </Droppable>
    </div>
  );
}

/**
 * Wraps a template preview and:
 *  - sets --page-h strictly to A4_HEIGHT_PX (1123px) so the sheet always shows a full canonical A4 page
 *  - overlays dashed "Page 2 / 3 / ..." break lines when content overflows one A4 page (1123px)
 *    so users can visually confirm content spilling onto additional pages.
 */
function PagedSheet({ children, isMini, isExport }: { children: React.ReactNode; isMini?: boolean; isExport?: boolean }) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const [totalH, setTotalH] = React.useState(A4_HEIGHT_PX);

  React.useLayoutEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    el.style.setProperty("--page-h", `${A4_HEIGHT_PX}px`);

    if (isMini || isExport) return;

    const measure = () => {
      const sh = el.scrollHeight || el.offsetHeight || A4_HEIGHT_PX;
      setTotalH(sh);
    };

    measure();

    const ro = new ResizeObserver(() => {
      measure();
    });
    ro.observe(el);
    if (el.firstElementChild) ro.observe(el.firstElementChild as Element);
    return () => ro.disconnect();
  }, [isMini, isExport]);

  if (isMini || isExport) {
    return (
      <div
        ref={wrapRef}
        className="relative w-full"
        style={{ minHeight: `${A4_HEIGHT_PX}px`, "--page-h": `${A4_HEIGHT_PX}px` } as React.CSSProperties}
      >
        {children}
      </div>
    );
  }

  // 25px buffer tolerance prevents sub-pixel rounding or margin collapse from prematurely creating a 2nd page
  const pageCount = Math.max(1, Math.ceil((totalH - 25) / A4_HEIGHT_PX));
  const breaks: number[] = [];
  for (let i = 1; i < pageCount; i++) breaks.push(i * A4_HEIGHT_PX);

  return (
    <div
      ref={wrapRef}
      className="relative w-full"
      style={{ minHeight: `${A4_HEIGHT_PX}px`, "--page-h": `${A4_HEIGHT_PX}px` } as React.CSSProperties}
    >
      {children}
      {breaks.map((top, i) => (
        <div
          key={i}
          aria-hidden="true"
          data-page-indicator="true"
          className="preview-only-badge pointer-events-none absolute left-0 right-0 z-10"
          style={{ top: top - 1 }}
        >
          <div className="border-t-2 border-dashed border-primary/50" />
          <div className="absolute -top-2.5 right-2 px-2 py-0.5 rounded-full bg-primary text-primary-foreground text-[9px] font-semibold shadow">
            Page {i + 2}
          </div>
        </div>
      ))}
      {pageCount > 1 && (
        <div
          aria-hidden="true"
          data-page-badge="true"
          className="preview-only-badge pointer-events-none absolute top-2 right-2 z-10 px-2 py-0.5 rounded-full bg-primary/90 text-primary-foreground text-[9px] font-semibold shadow"
        >
          {pageCount} pages
        </div>
      )}
    </div>
  );
}

function initials(name: string) {
  return (name || "You")
    .split(/\s+/).filter(Boolean).slice(0, 2)
    .map(w => w[0]?.toUpperCase() ?? "").join("") || "Y";
}

/* ---------- Timeline: left date rail, teal accents ---------- */
function TimelinePreview({ r, update }: { r: ResumeData; update?: UpdateFn }) {
  const on = (patch: Partial<ResumeData>) => update?.(patch);
  const sectionOrder = getNormalizedSectionOrder(r.settings?.sectionOrder, r);

  const renderSection = (key: string, index: number) => {
    let content = null;
    let defaultTitle = "";
    switch (key) {
      case "summary":
        if (r.summary && r.summary.trim()) {
          defaultTitle = "Summary";
          content = <Editable as="p" multiline value={r.summary} onChange={update && (v => on({ summary: v }))} className="whitespace-pre-wrap text-[11px]" />;
        }
        break;
      case "experience":
        if (r.experience?.length > 0) {
          defaultTitle = "Experience";
          content = (
            <div>
              {r.experience.map((e, i) => {
                const upd = makeExpUpdater(update, r, i);
                return (
                  <div key={i} className="grid grid-cols-[90px_1fr] gap-3 mb-3">
                    <div className="text-[10px] text-teal-700 font-semibold pt-0.5 border-r-2 border-teal-200 pr-2">
                      <div><Editable value={e.start} onChange={update && (v => upd({ start: v }))} /></div>
                      <div className="text-neutral-500 font-normal"><Editable value={e.end} onChange={update && (v => upd({ end: v }))} /></div>
                      <div className="text-neutral-500 font-normal mt-0.5 text-[9px]"><Editable value={e.location} onChange={update && (v => upd({ location: v }))} /></div>
                    </div>
                    <div>
                      <div className="font-semibold text-[11px]"><Editable value={e.role} onChange={update && (v => upd({ role: v }))} /></div>
                      <div className="text-teal-700 text-[10px]"><Editable value={e.company} onChange={update && (v => upd({ company: v }))} /></div>
                      <BulletsEditor bullets={e.bullets || []} onChange={update && (v => upd({ bullets: v }))} className="list-disc pl-4 mt-0.5 text-[10px] space-y-0.5" />
                    </div>
                  </div>
                );
              })}
            </div>
          );
        }
        break;
      case "leadership":
        if (r.leadership && r.leadership.length > 0) {
          defaultTitle = "Leadership";
          content = (
            <div>
              {r.leadership.map((l, i) => {
                const upd = makeLeadershipUpdater(update, r, i);
                return (
                  <div key={i} className="grid grid-cols-[90px_1fr] gap-3 mb-3">
                    <div className="text-[10px] text-teal-700 font-semibold pt-0.5 border-r-2 border-teal-200 pr-2">
                      <div><Editable value={l.start || ""} onChange={update && (v => upd({ start: v }))} /></div>
                      <div className="text-neutral-500 font-normal"><Editable value={l.end || ""} onChange={update && (v => upd({ end: v }))} /></div>
                      {l.location && <div className="text-neutral-500 font-normal mt-0.5 text-[9px]"><Editable value={l.location} onChange={update && (v => upd({ location: v }))} /></div>}
                    </div>
                    <div>
                      <div className="font-semibold text-[11px]"><Editable value={l.role} onChange={update && (v => upd({ role: v }))} /></div>
                      <div className="text-teal-700 text-[10px]"><Editable value={l.organization} onChange={update && (v => upd({ organization: v }))} /></div>
                      <BulletsEditor bullets={l.bullets || []} onChange={update && (v => upd({ bullets: v }))} className="list-disc pl-4 mt-0.5 text-[10px] space-y-0.5" />
                    </div>
                  </div>
                );
              })}
            </div>
          );
        }
        break;
      case "education":
        if (r.education?.length > 0) {
          defaultTitle = "Education";
          content = (
            <div>
              {r.education.map((e, i) => {
                const upd = makeEduUpdater(update, r, i);
                return (
                  <div key={i} className="grid grid-cols-[90px_1fr] gap-3 mb-2">
                    <div className="text-[10px] text-teal-700 font-semibold border-r-2 border-teal-200 pr-2">
                      <Editable value={e.start} onChange={update && (v => upd({ start: v }))} />–<Editable value={e.end} onChange={update && (v => upd({ end: v }))} />
                    </div>
                    <div>
                      <div className="font-semibold text-[11px]"><Editable value={e.degree} onChange={update && (v => upd({ degree: v }))} /></div>
                      <div className="text-neutral-600 text-[10px]"><Editable value={e.school} onChange={update && (v => upd({ school: v }))} /></div>
                    </div>
                  </div>
                );
              })}
            </div>
          );
        }
        break;
      case "skills":
        if (r.skills?.length > 0) {
          defaultTitle = "Skills";
          content = (
            <div className="space-y-1 text-left">
              {r.skills.map((s, i) => {
                const upd = makeSkillUpdater(update, r, i);
                return (
                  <div key={i} className="text-[10px] leading-relaxed">
                    <SkillCat value={s.category} onChange={update && (v => upd({ category: v }))} className="font-semibold text-teal-800" colon />{" "}
                    <Editable as="span" multiline value={s.items.join(", ")} onChange={update && (v => upd({ items: v.split(/[\n,]/).map(x => x.trim()).filter(Boolean) }))} className="whitespace-pre-wrap" />
                  </div>
                );
              })}
            </div>
          );
        }
        break;
      case "certifications":
        if (r.certifications?.length > 0) {
          defaultTitle = "Certifications";
          content = (
            <Editable value={r.certifications.join(" • ")} onChange={update && (v => on({ certifications: v.split("•").map(x => x.trim()).filter(Boolean) }))} className="text-[10px]" />
          );
        }
        break;
    }
    if (!content) return null;

    return (
      <Draggable key={key} draggableId={`timeline-${key}`} index={index} isDragDisabled={!update}>
        {(provided, snapshot) => (
          <section
            ref={provided.innerRef}
            {...provided.draggableProps}
            className={`mb-4 relative group/sec transition-colors rounded ${snapshot.isDragging ? "opacity-75 bg-teal-50/50 shadow-md ring-1 ring-teal-400" : ""}`}
          >
            <h3 className="text-[11px] font-bold tracking-widest uppercase text-teal-700 border-b border-teal-200 pb-0.5 mb-2 flex items-center justify-between">
              <span className="flex items-center gap-1.5 flex-1">
                {update && (
                  <span {...provided.dragHandleProps} className="opacity-0 group-hover/sec:opacity-60 hover:!opacity-100 cursor-grab active:cursor-grabbing text-neutral-400 hover:text-teal-700 select-none p-0.5" title="Drag to reorder section">
                    ⠿
                  </span>
                )}
                <Editable
                  value={getSectionTitle(r, key, defaultTitle)}
                  onChange={update && (v => updateSectionTitle(r, on, key, v))}
                  className="inline-block"
                />
              </span>
            </h3>
            <div className={snapshot.isDragging ? "pointer-events-none" : ""}>
              {content}
            </div>
          </section>
        )}
      </Draggable>
    );
  };

  return (
    <div className="bg-white text-neutral-900 shadow-elegant rounded-lg p-8 font-sans text-[11px] leading-snug" style={{ minHeight: "var(--page-h, auto)", fontSize: r.settings?.fontSize ? `${r.settings.fontSize}px` : undefined, fontFamily: r.settings?.fontFamily || undefined }}>
      <div className="mb-4">
        <Editable as="div" value={r.name || "Your Name"} onChange={update && (v => on({ name: v }))} className="font-bold text-2xl tracking-tight" />
        <Editable as="div" value={r.title} onChange={update && (v => on({ title: v }))} className="text-teal-700 text-[11px] font-medium" />
        <div className="mt-1 text-[10px] text-neutral-600 flex flex-wrap gap-x-3">
          <Editable value={r.email} onChange={update && (v => on({ email: v }))} />
          <Editable value={r.phone} onChange={update && (v => on({ phone: v }))} />
          <Editable value={r.location} onChange={update && (v => on({ location: v }))} />
          {r.links?.map((l, i) => (
            <Editable key={i} value={l.url} onChange={update && (v => on({ links: r.links.map((x, j) => j === i ? { ...x, url: v } : x) }))} />
          ))}
        </div>
      </div>
      
      <Droppable droppableId="timeline-content">
        {(provided) => (
          <div {...provided.droppableProps} ref={provided.innerRef}>
            {sectionOrder.map((key, index) => renderSection(key, index))}
            {provided.placeholder}
          </div>
        )}
      </Droppable>
    </div>
  );
}

/* ---------- Elegant: cream bg, centered serif with italic summary ---------- */
function ElegantPreview({ r, update }: { r: ResumeData; update?: UpdateFn }) {
  const on = (patch: Partial<ResumeData>) => update?.(patch);
  const sectionOrder = getNormalizedSectionOrder(r.settings?.sectionOrder, r);

  const renderSection = (key: string, index: number) => {
    let content = null;
    let defaultTitle = "";
    switch (key) {
      case "summary":
        if (r.summary && r.summary.trim()) {
          defaultTitle = "Summary";
          content = (
            <div className="max-w-[85%] mx-auto text-center">
              <Editable as="p" multiline value={r.summary} onChange={update && (v => on({ summary: v }))} className="italic text-[11px] whitespace-pre-wrap" />
            </div>
          );
        }
        break;
      case "experience":
        if (r.experience?.length > 0) {
          defaultTitle = "Experience";
          content = (
            <div>
              {r.experience.map((e, i) => {
                const upd = makeExpUpdater(update, r, i);
                return (
                  <div key={i} className="mb-3">
                    <div className="flex justify-between gap-2">
                      <span className="font-semibold text-[12px]"><Editable value={e.role} onChange={update && (v => upd({ role: v }))} /> — <span className="italic font-normal"><Editable value={e.company} onChange={update && (v => upd({ company: v }))} /></span></span>
                      <span className="text-[10px] italic text-stone-500 whitespace-nowrap"><Editable value={e.start} onChange={update && (v => upd({ start: v }))} /> – <Editable value={e.end} onChange={update && (v => upd({ end: v }))} /></span>
                    </div>
                    <BulletsEditor bullets={e.bullets || []} onChange={update && (v => upd({ bullets: v }))} className="list-[square] pl-4 mt-1 text-[10.5px] space-y-0.5" />
                  </div>
                );
              })}
            </div>
          );
        }
        break;
      case "leadership":
        if (r.leadership && r.leadership.length > 0) {
          defaultTitle = "Leadership";
          content = (
            <div>
              {r.leadership.map((l, i) => {
                const upd = makeLeadershipUpdater(update, r, i);
                return (
                  <div key={i} className="mb-3">
                    <div className="flex justify-between gap-2">
                      <span className="font-semibold text-[12px]"><Editable value={l.role} onChange={update && (v => upd({ role: v }))} /> — <span className="italic font-normal"><Editable value={l.organization} onChange={update && (v => upd({ organization: v }))} /></span></span>
                      <span className="text-[10px] italic text-stone-500 whitespace-nowrap"><Editable value={l.start || ""} onChange={update && (v => upd({ start: v }))} /> – <Editable value={l.end || ""} onChange={update && (v => upd({ end: v }))} /></span>
                    </div>
                    <BulletsEditor bullets={l.bullets || []} onChange={update && (v => upd({ bullets: v }))} className="list-[square] pl-4 mt-1 text-[10.5px] space-y-0.5" />
                  </div>
                );
              })}
            </div>
          );
        }
        break;
      case "education":
        if (r.education?.length > 0) {
          defaultTitle = "Education";
          content = (
            <div>
              {r.education.map((e, i) => {
                const upd = makeEduUpdater(update, r, i);
                return (
                  <div key={i} className="text-center mb-1">
                    <div className="font-semibold"><Editable value={e.degree} onChange={update && (v => upd({ degree: v }))} /></div>
                    <div className="italic text-[10px] text-stone-600"><Editable value={e.school} onChange={update && (v => upd({ school: v }))} /> · <Editable value={e.start} onChange={update && (v => upd({ start: v }))} />–<Editable value={e.end} onChange={update && (v => upd({ end: v }))} /></div>
                  </div>
                );
              })}
            </div>
          );
        }
        break;
      case "skills":
        if (r.skills?.length > 0) {
          defaultTitle = "Skills";
          content = (
            <div className="space-y-1 text-center max-w-[90%] mx-auto">
              {r.skills.map((s, i) => {
                const upd = makeSkillUpdater(update, r, i);
                return (
                  <div key={i} className="text-[10.5px] leading-relaxed">
                    <SkillCat value={s.category} onChange={update && (v => upd({ category: v }))} className="font-semibold text-stone-700" colon />{" "}
                    <Editable as="span" multiline value={s.items.join(", ")} onChange={update && (v => upd({ items: v.split(/[\n,]/).map(x => x.trim()).filter(Boolean) }))} className="whitespace-pre-wrap" />
                  </div>
                );
              })}
            </div>
          );
        }
        break;
      case "certifications":
        if (r.certifications?.length > 0) {
          defaultTitle = "Certifications";
          content = (
            <div className="text-center"><Editable value={r.certifications.join(" • ")} onChange={update && (v => on({ certifications: v.split("•").map(x => x.trim()).filter(Boolean) }))} /></div>
          );
        }
        break;
    }
    if (!content) return null;

    return (
      <Draggable key={key} draggableId={`elegant-${key}`} index={index} isDragDisabled={!update}>
        {(provided, snapshot) => (
          <section
            ref={provided.innerRef}
            {...provided.draggableProps}
            className={`mb-4 relative group/sec transition-colors rounded ${snapshot.isDragging ? "opacity-75 bg-stone-200/50 shadow-md ring-1 ring-stone-400" : ""}`}
          >
            <h3 className="text-center text-[10px] font-semibold uppercase tracking-[0.35em] text-stone-600 my-3 flex items-center justify-center gap-2">
              {update && (
                <span {...provided.dragHandleProps} className="opacity-0 group-hover/sec:opacity-60 hover:!opacity-100 cursor-grab active:cursor-grabbing text-stone-400 hover:text-stone-800 select-none p-0.5" title="Drag to reorder section">
                  ⠿
                </span>
              )}
              <Editable
                value={getSectionTitle(r, key, defaultTitle)}
                onChange={update && (v => updateSectionTitle(r, on, key, v))}
              />
            </h3>
            <div className={snapshot.isDragging ? "pointer-events-none" : ""}>
              {content}
            </div>
          </section>
        )}
      </Draggable>
    );
  };

  return (
    <div className="bg-stone-50 text-stone-900 shadow-elegant rounded-lg p-10 font-serif text-[11px] leading-relaxed" style={{ minHeight: "var(--page-h, auto)", fontSize: r.settings?.fontSize ? `${r.settings.fontSize}px` : undefined, fontFamily: r.settings?.fontFamily || undefined }}>
      <div className="text-center">
        <Editable as="div" value={r.name || "Your Name"} onChange={update && (v => on({ name: v }))} className="font-normal text-[36px] italic tracking-tight" />
        <div className="mt-1 text-[10px] uppercase tracking-[0.3em] text-stone-600">
          <Editable value={r.title} onChange={update && (v => on({ title: v }))} />
        </div>
        <div className="mt-2 text-[10px] text-stone-600 flex justify-center flex-wrap gap-x-3">
          <Editable value={r.phone} onChange={update && (v => on({ phone: v }))} />
          <Editable value={r.email} onChange={update && (v => on({ email: v }))} />
          <Editable value={r.location} onChange={update && (v => on({ location: v }))} />
        </div>
      </div>
      <div className="my-4 flex justify-center gap-2 text-stone-400">
        <span>•</span><span>•</span><span>•</span>
      </div>

      <Droppable droppableId="elegant-content">
        {(provided) => (
          <div {...provided.droppableProps} ref={provided.innerRef}>
            {sectionOrder.map((key, index) => renderSection(key, index))}
            {provided.placeholder}
          </div>
        )}
      </Droppable>
    </div>
  );
}

/* ---------- Sidebar Dark: main content left, dark teal right rail with avatar ---------- */
function SidebarDarkPreview({ r, update }: { r: ResumeData; update?: UpdateFn }) {
  const on = (patch: Partial<ResumeData>) => update?.(patch);
  const sectionOrder = getNormalizedSectionOrder(r.settings?.sectionOrder, r);
  const leftKeys = ["summary", "experience", "leadership", "education", "projects"];
  const rightKeys = ["skills", "certifications", "languages", "custom"];

  const renderMainSection = (key: string) => {
    switch (key) {
      case "summary":
        if (r.summary && r.summary.trim()) {
          return (
            <section key="summary" className="mt-4">
              <h3 className="uppercase text-[10px] font-bold tracking-widest text-teal-800 mb-1">
                <Editable value={getSectionTitle(r, "summary", "Summary")} onChange={update && (v => updateSectionTitle(r, on, "summary", v))} />
              </h3>
              <Editable as="p" multiline value={r.summary} onChange={update && (v => on({ summary: v }))} className="whitespace-pre-wrap text-[10.5px]" />
            </section>
          );
        }
        return null;
      case "experience":
        if (r.experience?.length > 0) {
          return (
            <section key="experience" className="mt-4">
              <h3 className="uppercase text-[10px] font-bold tracking-widest text-teal-800 mb-1">
                <Editable value={getSectionTitle(r, "experience", "Experience")} onChange={update && (v => updateSectionTitle(r, on, "experience", v))} />
              </h3>
              {r.experience.map((e, i) => {
                const upd = makeExpUpdater(update, r, i);
                return (
                  <div key={i} className="mb-2">
                    <div className="flex justify-between gap-2">
                      <span className="font-semibold text-[11px]"><Editable value={e.role} onChange={update && (v => upd({ role: v }))} /></span>
                      <span className="text-[9px] text-neutral-500 whitespace-nowrap"><Editable value={e.start} onChange={update && (v => upd({ start: v }))} /> – <Editable value={e.end} onChange={update && (v => upd({ end: v }))} /></span>
                    </div>
                    <div className="text-[10px] text-teal-700"><Editable value={e.company} onChange={update && (v => upd({ company: v }))} /></div>
                    <BulletsEditor bullets={e.bullets || []} onChange={update && (v => upd({ bullets: v }))} className="list-disc pl-4 mt-0.5 text-[10px] space-y-0.5" />
                  </div>
                );
              })}
            </section>
          );
        }
        return null;
      case "leadership":
        if (r.leadership && r.leadership.length > 0) {
          return (
            <section key="leadership" className="mt-4">
              <h3 className="uppercase text-[10px] font-bold tracking-widest text-teal-800 mb-1">
                <Editable value={getSectionTitle(r, "leadership", "Leadership")} onChange={update && (v => updateSectionTitle(r, on, "leadership", v))} />
              </h3>
              {r.leadership.map((l, i) => {
                const upd = makeLeadershipUpdater(update, r, i);
                return (
                  <div key={i} className="mb-2">
                    <div className="flex justify-between gap-2">
                      <span className="font-semibold text-[11px]"><Editable value={l.role} onChange={update && (v => upd({ role: v }))} /></span>
                      <span className="text-[9px] text-neutral-500 whitespace-nowrap"><Editable value={l.start || ""} onChange={update && (v => upd({ start: v }))} /> – <Editable value={l.end || ""} onChange={update && (v => upd({ end: v }))} /></span>
                    </div>
                    <div className="text-[10px] text-teal-700"><Editable value={l.organization} onChange={update && (v => upd({ organization: v }))} /></div>
                    <BulletsEditor bullets={l.bullets || []} onChange={update && (v => upd({ bullets: v }))} className="list-disc pl-4 mt-0.5 text-[10px] space-y-0.5" />
                  </div>
                );
              })}
            </section>
          );
        }
        return null;
      case "education":
        if (r.education?.length > 0) {
          return (
            <section key="education" className="mt-3">
              <h3 className="uppercase text-[10px] font-bold tracking-widest text-teal-800 mb-1">
                <Editable value={getSectionTitle(r, "education", "Education")} onChange={update && (v => updateSectionTitle(r, on, "education", v))} />
              </h3>
              {r.education.map((e, i) => {
                const upd = makeEduUpdater(update, r, i);
                return (
                  <div key={i} className="mb-1">
                    <div className="font-semibold text-[10.5px]"><Editable value={e.degree} onChange={update && (v => upd({ degree: v }))} /></div>
                    <div className="text-[10px] text-neutral-600"><Editable value={e.school} onChange={update && (v => upd({ school: v }))} /> · <Editable value={e.start} onChange={update && (v => upd({ start: v }))} />–<Editable value={e.end} onChange={update && (v => upd({ end: v }))} /></div>
                  </div>
                );
              })}
            </section>
          );
        }
        return null;
      case "projects":
        if (r.projects?.length > 0) {
          return (
            <section key="projects" className="mt-3">
              <h3 className="uppercase text-[10px] font-bold tracking-widest text-teal-800 mb-1">
                <Editable value={getSectionTitle(r, "projects", "Projects")} onChange={update && (v => updateSectionTitle(r, on, "projects", v))} />
              </h3>
              {r.projects.map((p, i) => {
                const upd = makeProjUpdater(update, r, i);
                return (
                  <div key={i} className="mb-2">
                    <div className="font-semibold text-[11px]"><Editable value={p.name} onChange={update && (v => upd({ name: v }))} /> <span className="text-[9.5px] text-neutral-500 font-normal">· <Editable value={p.tech} onChange={update && (v => upd({ tech: v }))} /></span></div>
                    <BulletsEditor bullets={p.bullets || []} onChange={update && (v => upd({ bullets: v }))} className="list-disc pl-4 mt-0.5 text-[10px]" />
                  </div>
                );
              })}
            </section>
          );
        }
        return null;
      default:
        return null;
    }
  };

  const renderSideSection = (key: string) => {
    switch (key) {
      case "skills":
        if (r.skills?.length > 0) {
          return (
            <div key="skills" className="mb-4">
              <div className="uppercase tracking-widest text-[9px] font-bold border-b border-teal-500 pb-1 mb-2">
                <Editable value={getSectionTitle(r, "skills", "Skills")} onChange={update && (v => updateSectionTitle(r, on, "skills", v))} />
              </div>
              {r.skills.map((s, i) => {
                const upd = makeSkillUpdater(update, r, i);
                return (
                  <div key={i} className="mb-2">
                    <SkillCat as="div" value={s.category} onChange={update && (v => upd({ category: v }))} className="font-semibold text-[10px]" />
                    <div className="flex flex-wrap gap-1 mt-0.5">
                      {s.items.map((it, k) => (
                        <span key={k} className="text-[9px] px-1.5 py-0.5 rounded-full bg-teal-600 text-teal-50 border border-teal-500/30">{it}</span>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          );
        }
        return null;
      case "certifications":
        if (r.certifications?.length > 0) {
          return (
            <div key="certifications">
              <div className="uppercase tracking-widest text-[9px] font-bold border-b border-teal-500 pb-1 mb-2">
                <Editable value={getSectionTitle(r, "certifications", "Certifications")} onChange={update && (v => updateSectionTitle(r, on, "certifications", v))} />
              </div>
              <Editable as="div" multiline value={r.certifications.join("\n")} onChange={update && (v => on({ certifications: v.split("\n").map(x => x.trim()).filter(Boolean) }))} className="text-[10px] whitespace-pre-wrap" />
            </div>
          );
        }
        return null;
      default:
        return null;
    }
  };

  return (
    <div className="bg-white text-neutral-900 shadow-elegant rounded-none overflow-hidden font-sans text-[11px] leading-snug" style={{ minHeight: "var(--page-h, auto)", fontSize: r.settings?.fontSize ? `${r.settings.fontSize}px` : undefined, fontFamily: r.settings?.fontFamily || undefined }}>
      <div className="grid grid-cols-[minmax(0,1fr)_240px] h-full">
        <div className="p-6">
          <Editable as="div" value={r.name || "Your Name"} onChange={update && (v => on({ name: v }))} className="font-bold text-2xl tracking-tight" />
          <Editable as="div" value={r.title} onChange={update && (v => on({ title: v }))} className="text-teal-700 text-[11px] font-medium mt-0.5" />
          <div className="mt-1 text-[10px] text-neutral-600 flex flex-wrap gap-x-3">
            <Editable value={r.phone} onChange={update && (v => on({ phone: v }))} />
            <Editable value={r.email} onChange={update && (v => on({ email: v }))} />
            <Editable value={r.location} onChange={update && (v => on({ location: v }))} />
          </div>
          {sectionOrder.filter(k => leftKeys.includes(k)).map(k => renderMainSection(k))}
        </div>
        <div
          className="text-teal-50 p-5 relative group/sidebar cursor-pointer transition-colors"
          style={{ backgroundColor: r.settings?.sidebarBg || r.settings?.primaryColor || "#115e59" }}
          data-color-target="sidebar"
          data-color-label="Dark Teal Sidebar"
          data-current-color={r.settings?.sidebarBg || r.settings?.primaryColor || "#115e59"}
          title={update ? "Click to change color" : undefined}
        >
          {update && (
            <div className="preview-only-badge absolute top-2 right-2 opacity-0 group-hover/sidebar:opacity-100 transition-opacity bg-black/60 hover:bg-black/80 text-white text-[10px] font-semibold px-2 py-0.5 rounded-full flex items-center gap-1 pointer-events-none shadow backdrop-blur-sm z-10">
              <span>🎨 Color</span>
            </div>
          )}
          <div className="mx-auto mb-3 h-16 w-16 rounded-full bg-teal-600 flex items-center justify-center text-xl font-bold text-white ring-2 ring-teal-300/40">
            {initials(r.name)}
          </div>
          {r.links?.filter(l => l && (l.url || l.label))?.length > 0 && (
            <div className="text-[10px] space-y-1 break-words mb-4">
              {r.links.filter(l => l && (l.url || l.label)).map((l, i) => (
                <Editable key={i} as="div" value={l.label && l.url ? `${l.label}: ${l.url}` : (l.url || l.label)} onChange={update && (v => {
                  const [label, ...rest] = v.split(":");
                  on({ links: r.links.map((x, j) => j === i ? { label: (label || "").trim(), url: rest.join(":").trim() } : x) });
                })} />
              ))}
            </div>
          )}
          {sectionOrder.filter(k => rightKeys.includes(k)).map(k => renderSideSection(k))}
        </div>
      </div>
    </div>
  );
}

/* ---------- Photo Header: dark banner with avatar circle on the right ---------- */
function PhotoHeaderPreview({ r, update }: { r: ResumeData; update?: UpdateFn }) {
  const on = (patch: Partial<ResumeData>) => update?.(patch);
  const sectionOrder = getNormalizedSectionOrder(r.settings?.sectionOrder, r);
  const leftKeys = ["summary", "experience", "leadership", "education", "projects"];
  const rightKeys = ["skills", "certifications", "languages", "custom"];

  const renderMainSection = (key: string) => {
    switch (key) {
      case "summary":
        if (r.summary && r.summary.trim()) {
          return (
            <section key="summary" className="mb-4">
              <h3 className="text-[10px] font-bold uppercase tracking-widest text-slate-800 border-b border-slate-300 pb-1 mb-2.5">
                <Editable value={getSectionTitle(r, "summary", "Summary")} onChange={update && (v => updateSectionTitle(r, on, "summary", v))} />
              </h3>
              <Editable as="p" multiline value={r.summary} onChange={update && (v => on({ summary: v }))} className="whitespace-pre-wrap text-[10.5px] leading-relaxed" />
            </section>
          );
        }
        return null;
      case "experience":
        if (r.experience?.length > 0) {
          return (
            <section key="experience" className="mb-4">
              <h3 className="text-[10px] font-bold uppercase tracking-widest text-slate-800 border-b border-slate-300 pb-1 mb-2.5">
                <Editable value={getSectionTitle(r, "experience", "Experience")} onChange={update && (v => updateSectionTitle(r, on, "experience", v))} />
              </h3>
              {r.experience.map((e, i) => {
                const upd = makeExpUpdater(update, r, i);
                return (
                  <div key={i} className="mb-2.5 last:mb-0">
                    <div className="font-semibold text-[11px] leading-tight mb-0.5"><Editable value={e.role} onChange={update && (v => upd({ role: v }))} /></div>
                    <div className="flex justify-between items-baseline text-[10px] text-slate-600 gap-2 mb-1">
                      <span className="min-w-0"><Editable value={e.company} onChange={update && (v => upd({ company: v }))} /></span>
                      <span className="shrink-0 text-right whitespace-nowrap"><Editable value={e.start} onChange={update && (v => upd({ start: v }))} /> – <Editable value={e.end} onChange={update && (v => upd({ end: v }))} /></span>
                    </div>
                    <BulletsEditor bullets={e.bullets || []} onChange={update && (v => upd({ bullets: v }))} className="list-disc pl-4 mt-1 text-[10px] space-y-1" />
                  </div>
                );
              })}
            </section>
          );
        }
        return null;
      case "leadership":
        if (r.leadership && r.leadership.length > 0) {
          return (
            <section key="leadership" className="mb-4">
              <h3 className="text-[10px] font-bold uppercase tracking-widest text-slate-800 border-b border-slate-300 pb-1 mb-2.5">
                <Editable value={getSectionTitle(r, "leadership", "Leadership")} onChange={update && (v => updateSectionTitle(r, on, "leadership", v))} />
              </h3>
              {r.leadership.map((l, i) => {
                const upd = makeLeadershipUpdater(update, r, i);
                return (
                  <div key={i} className="mb-2.5 last:mb-0">
                    <div className="font-semibold text-[11px] leading-tight mb-0.5"><Editable value={l.role} onChange={update && (v => upd({ role: v }))} /></div>
                    <div className="flex justify-between items-baseline text-[10px] text-slate-600 gap-2 mb-1">
                      <span className="min-w-0"><Editable value={l.organization} onChange={update && (v => upd({ organization: v }))} /></span>
                      <span className="shrink-0 text-right whitespace-nowrap"><Editable value={l.start || ""} onChange={update && (v => upd({ start: v }))} /> – <Editable value={l.end || ""} onChange={update && (v => upd({ end: v }))} /></span>
                    </div>
                    <BulletsEditor bullets={l.bullets || []} onChange={update && (v => upd({ bullets: v }))} className="list-disc pl-4 mt-1 text-[10px] space-y-1" />
                  </div>
                );
              })}
            </section>
          );
        }
        return null;
      case "education":
        if (r.education?.length > 0) {
          return (
            <section key="education" className="mb-4">
              <h3 className="text-[10px] font-bold uppercase tracking-widest text-slate-800 border-b border-slate-300 pb-1 mb-2.5">
                <Editable value={getSectionTitle(r, "education", "Education")} onChange={update && (v => updateSectionTitle(r, on, "education", v))} />
              </h3>
              {r.education.map((e, i) => {
                const upd = makeEduUpdater(update, r, i);
                return (
                  <div key={i} className="mb-2 last:mb-0">
                    <div className="font-semibold text-[10.5px] leading-tight mb-0.5"><Editable value={e.degree} onChange={update && (v => upd({ degree: v }))} /></div>
                    <div className="text-[10px] text-slate-600 leading-snug"><Editable value={e.school} onChange={update && (v => upd({ school: v }))} /> · <Editable value={e.start} onChange={update && (v => upd({ start: v }))} />–<Editable value={e.end} onChange={update && (v => upd({ end: v }))} /></div>
                  </div>
                );
              })}
            </section>
          );
        }
        return null;
      case "projects":
        if (r.projects?.length > 0) {
          return (
            <section key="projects" className="mb-4">
              <h3 className="text-[10px] font-bold uppercase tracking-widest text-slate-800 border-b border-slate-300 pb-1 mb-2.5">
                <Editable value={getSectionTitle(r, "projects", "Projects")} onChange={update && (v => updateSectionTitle(r, on, "projects", v))} />
              </h3>
              {r.projects.map((p, i) => {
                const upd = makeProjUpdater(update, r, i);
                return (
                  <div key={i} className="mb-2.5 last:mb-0">
                    <div className="font-semibold text-[11px] leading-tight mb-0.5"><Editable value={p.name} onChange={update && (v => upd({ name: v }))} /></div>
                    {p.tech && <div className="text-[10px] text-slate-600 mb-1"><Editable value={p.tech} onChange={update && (v => upd({ tech: v }))} /></div>}
                    <BulletsEditor bullets={p.bullets || []} onChange={update && (v => upd({ bullets: v }))} className="list-disc pl-4 mt-1 text-[10px] space-y-1" />
                  </div>
                );
              })}
            </section>
          );
        }
        return null;
      default:
        return null;
    }
  };

  const renderSideSection = (key: string) => {
    switch (key) {
      case "skills":
        if (r.skills?.length > 0) {
          return (
            <section key="skills" className="mb-4">
              <h3 className="text-[10px] font-bold uppercase tracking-widest text-sky-700 border-b border-sky-200 pb-1 mb-2.5">
                <Editable value={getSectionTitle(r, "skills", "Skills")} onChange={update && (v => updateSectionTitle(r, on, "skills", v))} />
              </h3>
              <div className="space-y-2">
                {r.skills.map((s, i) => {
                  const upd = makeSkillUpdater(update, r, i);
                  return (
                    <div key={i} className="text-[10px]">
                      <SkillCat as="div" value={s.category} onChange={update && (v => upd({ category: v }))} className="font-semibold text-[10px] mb-0.5 text-slate-800" />
                      <Editable as="div" multiline value={s.items.join(", ")} onChange={update && (v => upd({ items: v.split(/[\n,]/).map(x => x.trim()).filter(Boolean) }))} className="text-[9.5px] text-neutral-700 whitespace-pre-wrap leading-relaxed" />
                    </div>
                  );
                })}
              </div>
            </section>
          );
        }
        return null;
      case "certifications":
        if (r.certifications?.length > 0) {
          return (
            <section key="certifications" className="mb-4">
              <h3 className="text-[10px] font-bold uppercase tracking-widest text-sky-700 border-b border-sky-200 pb-1 mb-2.5">
                <Editable value={getSectionTitle(r, "certifications", "Certifications")} onChange={update && (v => updateSectionTitle(r, on, "certifications", v))} />
              </h3>
              <Editable as="div" multiline value={r.certifications.join("\n")} onChange={update && (v => on({ certifications: v.split("\n").map(x => x.trim()).filter(Boolean) }))} className="text-[10px] whitespace-pre-wrap leading-relaxed" />
            </section>
          );
        }
        return null;
      default:
        return null;
    }
  };

  return (
    <div className="bg-white text-neutral-900 shadow-elegant rounded-none overflow-hidden font-sans text-[11px] leading-snug" style={{ minHeight: "var(--page-h, auto)", fontSize: r.settings?.fontSize ? `${r.settings.fontSize}px` : undefined, fontFamily: r.settings?.fontFamily || undefined }}>
      <div
        className="relative text-white px-6 py-5 flex items-center gap-4 group/header cursor-pointer transition-colors"
        style={{ backgroundColor: r.settings?.headerBg || r.settings?.primaryColor || "#1e293b" }}
        data-color-target="header"
        data-color-label="Header Banner"
        data-current-color={r.settings?.headerBg || r.settings?.primaryColor || "#1e293b"}
        title={update ? "Click to change color" : undefined}
      >
        {update && (
          <div className="preview-only-badge absolute top-2 right-2 opacity-0 group-hover/header:opacity-100 transition-opacity bg-black/60 hover:bg-black/80 text-white text-[10px] font-semibold px-2.5 py-1 rounded-full flex items-center gap-1.5 pointer-events-none shadow backdrop-blur-sm z-10">
            <span>🎨 Change Color</span>
          </div>
        )}
        <div className="flex-1 min-w-0">
          <Editable as="div" value={r.name || "Your Name"} onChange={update && (v => on({ name: v }))} className="font-extrabold text-2xl tracking-tight" />
          <Editable as="div" value={r.title} onChange={update && (v => on({ title: v }))} className="text-sky-300 text-[11px] font-medium mt-0.5" />
          <div className="flex flex-wrap gap-x-3 mt-2 text-[10px] text-slate-200">
            <Editable value={r.phone} onChange={update && (v => on({ phone: v }))} />
            <Editable value={r.email} onChange={update && (v => on({ email: v }))} />
            <Editable value={r.location} onChange={update && (v => on({ location: v }))} />
            {r.links?.filter(l => l && (l.url || l.label)).map((l, i) => (
              <Editable key={i} value={l.url || l.label} onChange={update && (v => on({ links: r.links.map((x, j) => j === i ? { ...x, url: v } : x) }))} />
            ))}
          </div>
        </div>
        <div className="h-16 w-16 rounded-full bg-white/20 ring-2 ring-white/30 flex items-center justify-center text-lg font-bold shrink-0">
          {initials(r.name)}
        </div>
      </div>
      <div className="grid grid-cols-[minmax(0,1fr)_240px] gap-5 p-6">
        <div>
          {sectionOrder.filter(k => leftKeys.includes(k)).map(k => renderMainSection(k))}
        </div>
        <div>
          {sectionOrder.filter(k => rightKeys.includes(k)).map(k => renderSideSection(k))}
        </div>
      </div>
    </div>
  );
}

/* ---------- Centered Serif (Alexander Taylor): centered header, rule-lined sections ---------- */
function CenteredSerifPreview({ r, update }: { r: ResumeData; update?: UpdateFn }) {
  const on = (patch: Partial<ResumeData>) => update?.(patch);
  const sectionOrder = getNormalizedSectionOrder(r.settings?.sectionOrder, r);

  const renderSection = (key: string) => {
    let content = null;
    let defaultTitle = "";
    switch (key) {
      case "summary":
        if (r.summary && r.summary.trim()) {
          defaultTitle = "Summary";
          content = <Editable as="p" multiline value={r.summary} onChange={update && (v => on({ summary: v }))} className="text-left text-[10.5px] whitespace-pre-wrap px-1" />;
        }
        break;
      case "experience":
        if (r.experience?.length > 0) {
          defaultTitle = "Experience";
          content = (
            <div>
              {r.experience.map((e, i) => {
                const upd = makeExpUpdater(update, r, i);
                return (
                  <div key={i} className="mb-2">
                    <div className="flex justify-between"><span className="font-semibold text-neutral-700"><Editable value={e.company} onChange={update && (v => upd({ company: v }))} /></span><span className="text-[10px] text-neutral-600"><Editable value={e.location} onChange={update && (v => upd({ location: v }))} /></span></div>
                    <div className="flex justify-between italic"><span><Editable value={e.role} onChange={update && (v => upd({ role: v }))} /></span><span className="text-[10px]"><Editable value={e.start} onChange={update && (v => upd({ start: v }))} /> – <Editable value={e.end} onChange={update && (v => upd({ end: v }))} /></span></div>
                    <BulletsEditor bullets={e.bullets || []} onChange={update && (v => upd({ bullets: v }))} className="list-disc pl-5 mt-0.5 text-[10.5px] space-y-0.5" />
                  </div>
                );
              })}
            </div>
          );
        }
        break;
      case "leadership":
        if (r.leadership && r.leadership.length > 0) {
          defaultTitle = "Leadership";
          content = (
            <div>
              {r.leadership.map((l, i) => {
                const upd = makeLeadershipUpdater(update, r, i);
                return (
                  <div key={i} className="mb-2">
                    <div className="flex justify-between"><span className="font-semibold text-neutral-700"><Editable value={l.organization} onChange={update && (v => upd({ organization: v }))} /></span><span className="text-[10px] text-neutral-600"><Editable value={l.location || ""} onChange={update && (v => upd({ location: v }))} /></span></div>
                    <div className="flex justify-between italic"><span><Editable value={l.role} onChange={update && (v => upd({ role: v }))} /></span><span className="text-[10px]"><Editable value={l.start || ""} onChange={update && (v => upd({ start: v }))} /> – <Editable value={l.end || ""} onChange={update && (v => upd({ end: v }))} /></span></div>
                    <BulletsEditor bullets={l.bullets || []} onChange={update && (v => upd({ bullets: v }))} className="list-disc pl-5 mt-0.5 text-[10.5px] space-y-0.5" />
                  </div>
                );
              })}
            </div>
          );
        }
        break;
      case "skills":
        if (r.skills?.length > 0) {
          defaultTitle = "Skills";
          content = (
            <div className="space-y-1 text-left px-1">
              {r.skills.map((s, i) => {
                const upd = makeSkillUpdater(update, r, i);
                return (
                  <div key={i} className="text-[10.5px] leading-relaxed">
                    <SkillCat value={s.category} onChange={update && (v => upd({ category: v }))} className="font-bold" colon />{" "}
                    <Editable as="span" multiline value={s.items.join(", ")} onChange={update && (v => upd({ items: v.split(/[\n,]/).map(x => x.trim()).filter(Boolean) }))} className="whitespace-pre-wrap" />
                  </div>
                );
              })}
            </div>
          );
        }
        break;
      case "education":
        if (r.education?.length > 0) {
          defaultTitle = "Education";
          content = (
            <div>
              {r.education.map((e, i) => {
                const upd = makeEduUpdater(update, r, i);
                return (
                  <div key={i} className="flex justify-between mb-1">
                    <span><Editable value={e.school} onChange={update && (v => upd({ school: v }))} /> — <span className="italic"><Editable value={e.degree} onChange={update && (v => upd({ degree: v }))} /></span></span>
                    <span className="text-[10px]"><Editable value={e.start} onChange={update && (v => upd({ start: v }))} /> – <Editable value={e.end} onChange={update && (v => upd({ end: v }))} /></span>
                  </div>
                );
              })}
            </div>
          );
        }
        break;
      case "certifications":
        if (r.certifications?.length > 0) {
          defaultTitle = "Certifications";
          content = (
            <div className="text-center text-[10.5px]">
              <Editable value={r.certifications.join(" • ")} onChange={update && (v => on({ certifications: v.split("•").map(x => x.trim()).filter(Boolean) }))} />
            </div>
          );
        }
        break;
    }
    if (!content) return null;

    return (
      <div key={key} className="mb-3">
        <div className="relative my-3">
          <div className="absolute inset-0 flex items-center" aria-hidden="true">
            <div className="w-full border-t border-neutral-300" />
          </div>
          <div className="relative flex justify-start">
            <span className="bg-white pr-3 text-[11px] font-bold uppercase tracking-wider text-neutral-800">
              <Editable
                value={getSectionTitle(r, key, defaultTitle)}
                onChange={update && (v => updateSectionTitle(r, on, key, v))}
              />
            </span>
          </div>
        </div>
        {content}
      </div>
    );
  };

  return (
    <div className="bg-white text-neutral-900 shadow-elegant rounded-lg p-8 font-serif text-[11px] leading-snug" style={{ minHeight: "var(--page-h, auto)", fontSize: r.settings?.fontSize ? `${r.settings.fontSize}px` : undefined, fontFamily: r.settings?.fontFamily || undefined }}>
      <div className="text-center">
        <Editable as="div" value={r.name || "Your Name"} onChange={update && (v => on({ name: v }))} className="font-bold text-[26px] tracking-tight" />
        <Editable as="div" value={r.title} onChange={update && (v => on({ title: v }))} className="text-neutral-700 text-[11px] mt-0.5" />
        <div className="text-[10px] text-neutral-600 mt-1 flex flex-wrap gap-x-3 justify-center">
          <Editable value={r.phone} onChange={update && (v => on({ phone: v }))} />
          <Editable value={r.email} onChange={update && (v => on({ email: v }))} />
          {r.links?.filter(l => l && (l.label || l.url)).map((l, i) => (<Editable key={i} value={l.label || l.url} onChange={update && (v => on({ links: r.links.map((x, j) => j === i ? { ...x, label: v } : x) }))} />))}
          <Editable value={r.location} onChange={update && (v => on({ location: v }))} />
        </div>
      </div>
      {sectionOrder.map(k => renderSection(k))}
    </div>
  );
}

/* ---------- Banner Photo (Harper Garcia): navy top banner + photo, two-col body ---------- */
function BannerPhotoPreview({ r, update }: { r: ResumeData; update?: UpdateFn }) {
  const on = (patch: Partial<ResumeData>) => update?.(patch);
  const sectionOrder = getNormalizedSectionOrder(r.settings?.sectionOrder, r);
  const leftKeys = ["summary", "experience", "leadership", "education", "projects"];
  const rightKeys = ["skills", "certifications", "languages", "custom"];

  const renderMainSection = (key: string) => {
    switch (key) {
      case "summary":
        if (r.summary && r.summary.trim()) {
          return (
            <section key="summary" className="mb-3">
              <h3 className="text-[10px] font-bold uppercase tracking-widest text-[#0f2340] mb-1">
                <Editable value={getSectionTitle(r, "summary", "Summary")} onChange={update && (v => updateSectionTitle(r, on, "summary", v))} />
              </h3>
              <Editable as="p" multiline value={r.summary} onChange={update && (v => on({ summary: v }))} className="whitespace-pre-wrap text-[10.5px]" />
            </section>
          );
        }
        return null;
      case "experience":
        if (r.experience?.length > 0) {
          return (
            <section key="experience" className="mb-3">
              <h3 className="text-[10px] font-bold uppercase tracking-widest text-[#0f2340] border-b border-slate-300 pb-0.5 mb-1.5">
                <Editable value={getSectionTitle(r, "experience", "Experience")} onChange={update && (v => updateSectionTitle(r, on, "experience", v))} />
              </h3>
              {r.experience.map((e, i) => {
                const upd = makeExpUpdater(update, r, i);
                return (
                  <div key={i} className="mb-2">
                    <div className="font-semibold text-[11px]"><Editable value={e.role} onChange={update && (v => upd({ role: v }))} /></div>
                    <div className="flex justify-between text-[10px] text-slate-600"><span><Editable value={e.company} onChange={update && (v => upd({ company: v }))} /> · <Editable value={e.location} onChange={update && (v => upd({ location: v }))} /></span><span><Editable value={e.start} onChange={update && (v => upd({ start: v }))} /> – <Editable value={e.end} onChange={update && (v => upd({ end: v }))} /></span></div>
                    <BulletsEditor bullets={e.bullets || []} onChange={update && (v => upd({ bullets: v }))} className="list-disc pl-4 mt-0.5 text-[10px] space-y-0.5" />
                  </div>
                );
              })}
            </section>
          );
        }
        return null;
      case "leadership":
        if (r.leadership && r.leadership.length > 0) {
          return (
            <section key="leadership" className="mb-3">
              <h3 className="text-[10px] font-bold uppercase tracking-widest text-[#0f2340] border-b border-slate-300 pb-0.5 mb-1.5">
                <Editable value={getSectionTitle(r, "leadership", "Leadership")} onChange={update && (v => updateSectionTitle(r, on, "leadership", v))} />
              </h3>
              {r.leadership.map((l, i) => {
                const upd = makeLeadershipUpdater(update, r, i);
                return (
                  <div key={i} className="mb-2">
                    <div className="font-semibold text-[11px]"><Editable value={l.role} onChange={update && (v => upd({ role: v }))} /></div>
                    <div className="flex justify-between text-[10px] text-slate-600"><span><Editable value={l.organization} onChange={update && (v => upd({ organization: v }))} /> · <Editable value={l.location || ""} onChange={update && (v => upd({ location: v }))} /></span><span><Editable value={l.start || ""} onChange={update && (v => upd({ start: v }))} /> – <Editable value={l.end || ""} onChange={update && (v => upd({ end: v }))} /></span></div>
                    <BulletsEditor bullets={l.bullets || []} onChange={update && (v => upd({ bullets: v }))} className="list-disc pl-4 mt-0.5 text-[10px] space-y-0.5" />
                  </div>
                );
              })}
            </section>
          );
        }
        return null;
      case "education":
        if (r.education?.length > 0) {
          return (
            <section key="education">
              <h3 className="text-[10px] font-bold uppercase tracking-widest text-[#0f2340] border-b border-slate-300 pb-0.5 mb-1.5">
                <Editable value={getSectionTitle(r, "education", "Education")} onChange={update && (v => updateSectionTitle(r, on, "education", v))} />
              </h3>
              {r.education.map((e, i) => {
                const upd = makeEduUpdater(update, r, i);
                return (
                  <div key={i} className="mb-1">
                    <div className="font-semibold text-[10.5px]"><Editable value={e.degree} onChange={update && (v => upd({ degree: v }))} /></div>
                    <div className="text-[10px] text-slate-600"><Editable value={e.school} onChange={update && (v => upd({ school: v }))} /> · <Editable value={e.start} onChange={update && (v => upd({ start: v }))} />–<Editable value={e.end} onChange={update && (v => upd({ end: v }))} /></div>
                  </div>
                );
              })}
            </section>
          );
        }
        return null;
      default:
        return null;
    }
  };

  const renderSideSection = (key: string) => {
    switch (key) {
      case "skills":
        if (r.skills?.length > 0) {
          return (
            <section key="skills" className="mb-3 bg-emerald-50 rounded-lg p-3 border border-emerald-100">
              <h3 className="text-[10px] font-bold uppercase tracking-widest text-emerald-800 mb-1.5">
                <Editable value={getSectionTitle(r, "skills", "Key Achievements")} onChange={update && (v => updateSectionTitle(r, on, "skills", v))} />
              </h3>
              {r.skills.map((s, i) => {
                const upd = makeSkillUpdater(update, r, i);
                return (
                  <div key={i} className="mb-2">
                    <SkillCat as="div" value={s.category} onChange={update && (v => upd({ category: v }))} className="font-semibold text-[10.5px] text-emerald-900" />
                    <Editable as="div" multiline value={s.items.join(", ")} onChange={update && (v => upd({ items: v.split(/[\n,]/).map(x => x.trim()).filter(Boolean) }))} className="text-[10px] text-emerald-800 whitespace-pre-wrap leading-relaxed" />
                  </div>
                );
              })}
            </section>
          );
        }
        return null;
      case "certifications":
        if (r.certifications?.length > 0) {
          return (
            <section key="certifications">
              <h3 className="text-[10px] font-bold uppercase tracking-widest text-[#0f2340] mb-1">
                <Editable value={getSectionTitle(r, "certifications", "Training / Courses")} onChange={update && (v => updateSectionTitle(r, on, "certifications", v))} />
              </h3>
              <Editable as="div" multiline value={r.certifications.join("\n")} onChange={update && (v => on({ certifications: v.split("\n").map(x => x.trim()).filter(Boolean) }))} className="text-[10px] whitespace-pre-wrap" />
            </section>
          );
        }
        return null;
      default:
        return null;
    }
  };

  return (
    <div className="bg-white text-neutral-900 shadow-elegant rounded-none overflow-hidden font-sans text-[11px] leading-snug" style={{ minHeight: "var(--page-h, auto)", fontSize: r.settings?.fontSize ? `${r.settings.fontSize}px` : undefined, fontFamily: r.settings?.fontFamily || undefined }}>
      <div
        className="text-white px-6 py-6 flex items-center gap-5 relative group/header cursor-pointer transition-colors"
        style={{ backgroundColor: r.settings?.headerBg || r.settings?.primaryColor || "#0f2340" }}
        data-color-target="header"
        data-color-label="Navy Header Banner"
        data-current-color={r.settings?.headerBg || r.settings?.primaryColor || "#0f2340"}
        title={update ? "Click to change color" : undefined}
      >
        {update && (
          <div className="preview-only-badge absolute top-2 right-2 opacity-0 group-hover/header:opacity-100 transition-opacity bg-black/60 hover:bg-black/80 text-white text-[10px] font-semibold px-2 py-0.5 rounded-full flex items-center gap-1 pointer-events-none shadow backdrop-blur-sm z-10">
            <span>🎨 Color</span>
          </div>
        )}
        <div className="flex-1 min-w-0">
          <Editable as="div" value={r.name || "Your Name"} onChange={update && (v => on({ name: v }))} className="font-bold text-2xl tracking-tight uppercase" />
          <Editable as="div" value={r.title} onChange={update && (v => on({ title: v }))} className="text-sky-200 text-[11px] mt-1" />
          <div className="flex flex-wrap gap-x-4 mt-3 text-[10px] text-slate-100">
            <Editable value={r.phone} onChange={update && (v => on({ phone: v }))} />
            <Editable value={r.email} onChange={update && (v => on({ email: v }))} />
            <Editable value={r.location} onChange={update && (v => on({ location: v }))} />
            {r.links?.filter(l => l && (l.url || l.label)).map((l, i) => (
              <Editable key={i} value={l.url || l.label} onChange={update && (v => on({ links: r.links.map((x, j) => j === i ? { ...x, url: v } : x) }))} />
            ))}
          </div>
        </div>
        <div className="h-20 w-20 rounded-full bg-white/10 ring-4 ring-white/30 flex items-center justify-center text-xl font-bold shrink-0">{initials(r.name)}</div>
      </div>
      <div className="grid grid-cols-[minmax(0,1fr)_240px] gap-5 p-6">
        <div>
          {sectionOrder.filter(k => leftKeys.includes(k)).map(k => renderMainSection(k))}
        </div>
        <div>
          {sectionOrder.filter(k => rightKeys.includes(k)).map(k => renderSideSection(k))}
        </div>
      </div>
    </div>
  );
}

/* ---------- Teal Left (Emma Smith): solid teal left rail ---------- */
function TealLeftPreview({ r, update }: { r: ResumeData; update?: UpdateFn }) {
  const on = (patch: Partial<ResumeData>) => update?.(patch);
  const sectionOrder = getNormalizedSectionOrder(r.settings?.sectionOrder, r);
  const leftKeys = ["skills", "certifications", "languages", "custom"];
  const rightKeys = ["summary", "experience", "leadership", "education", "projects"];

  const renderSideSection = (key: string) => {
    switch (key) {
      case "skills":
        if (r.skills?.length > 0) {
          return (
            <div key="skills" className="mt-5">
              <div className="uppercase tracking-widest text-[9px] font-bold border-b border-teal-400 pb-1 mb-2">
                <Editable value={getSectionTitle(r, "skills", "Key Skills & Achievements")} onChange={update && (v => updateSectionTitle(r, on, "skills", v))} />
              </div>
              {r.skills.map((s, i) => {
                const upd = makeSkillUpdater(update, r, i);
                return (
                  <div key={i} className="mb-3 flex gap-2">
                    <div className="h-6 w-6 rounded-full bg-teal-500/30 border border-teal-300 flex items-center justify-center text-[10px] font-bold shrink-0">★</div>
                    <div className="flex-1">
                      <SkillCat as="div" value={s.category} onChange={update && (v => upd({ category: v }))} className="font-semibold text-[10px]" />
                      <Editable as="div" multiline value={s.items.join(", ")} onChange={update && (v => upd({ items: v.split(/[\n,]/).map(x => x.trim()).filter(Boolean) }))} className="text-[9.5px] text-teal-100 leading-snug whitespace-pre-wrap" />
                    </div>
                  </div>
                );
              })}
            </div>
          );
        }
        return null;
      case "certifications":
        if (r.certifications?.length > 0) {
          return (
            <div key="certifications" className="mt-4">
              <div className="uppercase tracking-widest text-[9px] font-bold border-b border-teal-400 pb-1 mb-2">
                <Editable value={getSectionTitle(r, "certifications", "Certifications")} onChange={update && (v => updateSectionTitle(r, on, "certifications", v))} />
              </div>
              <Editable as="div" multiline value={r.certifications.join("\n")} onChange={update && (v => on({ certifications: v.split("\n").map(x => x.trim()).filter(Boolean) }))} className="text-[10px] whitespace-pre-wrap" />
            </div>
          );
        }
        return null;
      default:
        return null;
    }
  };

  const renderMainSection = (key: string) => {
    switch (key) {
      case "summary":
        if (r.summary && r.summary.trim()) {
          return (
            <section key="summary" className="mb-3">
              <h3 className="uppercase text-[10px] font-bold tracking-widest text-teal-800 border-b-2 border-teal-800 pb-1 mb-2">
                <Editable value={getSectionTitle(r, "summary", "Summary")} onChange={update && (v => updateSectionTitle(r, on, "summary", v))} />
              </h3>
              <Editable as="p" multiline value={r.summary} onChange={update && (v => on({ summary: v }))} className="whitespace-pre-wrap text-[10.5px]" />
            </section>
          );
        }
        return null;
      case "experience":
        if (r.experience?.length > 0) {
          return (
            <section key="experience" className="mb-3">
              <h3 className="uppercase text-[10px] font-bold tracking-widest text-teal-800 border-b-2 border-teal-800 pb-1 mb-2">
                <Editable value={getSectionTitle(r, "experience", "Experience")} onChange={update && (v => updateSectionTitle(r, on, "experience", v))} />
              </h3>
              {r.experience.map((e, i) => {
                const upd = makeExpUpdater(update, r, i);
                return (
                  <div key={i} className="mb-2">
                    <div className="flex justify-between"><span className="font-semibold text-[11px]"><Editable value={e.role} onChange={update && (v => upd({ role: v }))} /></span><span className="text-[10px] text-neutral-600"><Editable value={e.start} onChange={update && (v => upd({ start: v }))} /> – <Editable value={e.end} onChange={update && (v => upd({ end: v }))} /></span></div>
                    <div className="text-[10px] text-teal-700"><Editable value={e.company} onChange={update && (v => upd({ company: v }))} /></div>
                    <BulletsEditor bullets={e.bullets || []} onChange={update && (v => upd({ bullets: v }))} className="list-disc pl-4 mt-0.5 text-[10px] space-y-0.5" />
                  </div>
                );
              })}
            </section>
          );
        }
        return null;
      case "leadership":
        if (r.leadership && r.leadership.length > 0) {
          return (
            <section key="leadership" className="mb-3">
              <h3 className="uppercase text-[10px] font-bold tracking-widest text-teal-800 border-b-2 border-teal-800 pb-1 mb-2">
                <Editable value={getSectionTitle(r, "leadership", "Leadership")} onChange={update && (v => updateSectionTitle(r, on, "leadership", v))} />
              </h3>
              {r.leadership.map((l, i) => {
                const upd = makeLeadershipUpdater(update, r, i);
                return (
                  <div key={i} className="mb-2">
                    <div className="flex justify-between"><span className="font-semibold text-[11px]"><Editable value={l.role} onChange={update && (v => upd({ role: v }))} /></span><span className="text-[10px] text-neutral-600"><Editable value={l.start || ""} onChange={update && (v => upd({ start: v }))} /> – <Editable value={l.end || ""} onChange={update && (v => upd({ end: v }))} /></span></div>
                    <div className="text-[10px] text-teal-700"><Editable value={l.organization} onChange={update && (v => upd({ organization: v }))} /></div>
                    <BulletsEditor bullets={l.bullets || []} onChange={update && (v => upd({ bullets: v }))} className="list-disc pl-4 mt-0.5 text-[10px] space-y-0.5" />
                  </div>
                );
              })}
            </section>
          );
        }
        return null;
      case "education":
        if (r.education?.length > 0) {
          return (
            <section key="education">
              <h3 className="uppercase text-[10px] font-bold tracking-widest text-teal-800 border-b-2 border-teal-800 pb-1 mb-2">
                <Editable value={getSectionTitle(r, "education", "Education")} onChange={update && (v => updateSectionTitle(r, on, "education", v))} />
              </h3>
              {r.education.map((e, i) => {
                const upd = makeEduUpdater(update, r, i);
                return (
                  <div key={i} className="mb-1">
                    <div className="font-semibold text-[10.5px]"><Editable value={e.degree} onChange={update && (v => upd({ degree: v }))} /></div>
                    <div className="text-[10px] text-neutral-600"><Editable value={e.school} onChange={update && (v => upd({ school: v }))} /> · <Editable value={e.start} onChange={update && (v => upd({ start: v }))} />–<Editable value={e.end} onChange={update && (v => upd({ end: v }))} /></div>
                  </div>
                );
              })}
            </section>
          );
        }
        return null;
      default:
        return null;
    }
  };

  return (
    <div className="bg-white text-neutral-900 shadow-elegant rounded-none overflow-hidden font-sans text-[11px] leading-snug" style={{ minHeight: "var(--page-h, auto)", fontSize: r.settings?.fontSize ? `${r.settings.fontSize}px` : undefined, fontFamily: r.settings?.fontFamily || undefined }}>
      <div className="grid grid-cols-[240px_minmax(0,1fr)] h-full">
        <div
          className="text-teal-50 p-5 relative group/sidebar cursor-pointer transition-colors"
          style={{ backgroundColor: r.settings?.sidebarBg || r.settings?.primaryColor || "#0f766e" }}
          data-color-target="sidebar"
          data-color-label="Teal Left Sidebar"
          data-current-color={r.settings?.sidebarBg || r.settings?.primaryColor || "#0f766e"}
          title={update ? "Click to change color" : undefined}
        >
          {update && (
            <div className="preview-only-badge absolute top-2 right-2 opacity-0 group-hover/sidebar:opacity-100 transition-opacity bg-black/60 hover:bg-black/80 text-white text-[10px] font-semibold px-2 py-0.5 rounded-full flex items-center gap-1 pointer-events-none shadow backdrop-blur-sm z-10">
              <span>🎨 Color</span>
            </div>
          )}
          <Editable as="div" value={r.name || "Your Name"} onChange={update && (v => on({ name: v }))} className="font-bold text-lg leading-tight uppercase" />
          <Editable as="div" value={r.title} onChange={update && (v => on({ title: v }))} className="text-teal-100 text-[10px] mt-1" />
          <div className="mt-3 text-[10px] space-y-1 break-words">
            <Editable as="div" value={r.phone} onChange={update && (v => on({ phone: v }))} />
            <Editable as="div" value={r.email} onChange={update && (v => on({ email: v }))} />
            <Editable as="div" value={r.location} onChange={update && (v => on({ location: v }))} />
            {r.links?.filter(l => l && (l.label || l.url)).map((l, i) => (<Editable key={i} as="div" value={l.label && l.url ? l.label + ": " + l.url : (l.url || l.label)} onChange={update && (v => { const [label, ...rest] = v.split(":"); on({ links: r.links.map((x, j) => j === i ? { label: (label || "").trim(), url: rest.join(":").trim() } : x) }); })} />))}
          </div>
          {sectionOrder.filter(k => leftKeys.includes(k)).map(k => renderSideSection(k))}
        </div>
        <div className="p-5">
          {sectionOrder.filter(k => rightKeys.includes(k)).map(k => renderMainSection(k))}
        </div>
      </div>
    </div>
  );
}

/* ---------- Photo Grid (Jackson Miller): centered photo header + 3-col achievement boxes ---------- */
function PhotoGridPreview({ r, update }: { r: ResumeData; update?: UpdateFn }) {
  const on = (patch: Partial<ResumeData>) => update?.(patch);
  const sectionOrder = getNormalizedSectionOrder(r.settings?.sectionOrder, r);
  const achievements = r.skills?.slice(0, 3) ?? [];

  const renderSection = (key: string) => {
    switch (key) {
      case "summary":
        if (r.summary && r.summary.trim()) {
          return (
            <section key="summary" className="mt-3">
              <h3 className="text-[10px] font-bold uppercase tracking-widest text-neutral-800 mb-1">
                <Editable value={getSectionTitle(r, "summary", "Summary")} onChange={update && (v => updateSectionTitle(r, on, "summary", v))} />
              </h3>
              <Editable as="p" multiline value={r.summary} onChange={update && (v => on({ summary: v }))} className="whitespace-pre-wrap text-[10.5px]" />
            </section>
          );
        }
        return null;
      case "skills":
        if (achievements.length > 0) {
          return (
            <section key="skills" className="mt-3">
              <h3 className="text-[10px] font-bold uppercase tracking-widest text-neutral-800 mb-2 text-center">
                <Editable value={getSectionTitle(r, "skills", "Key Achievements")} onChange={update && (v => updateSectionTitle(r, on, "skills", v))} />
              </h3>
              <div className="grid grid-cols-3 gap-3">
                {achievements.map((s, i) => {
                  const upd = makeSkillUpdater(update, r, i);
                  return (
                    <div key={i} className="border border-neutral-200 rounded-lg p-3 bg-neutral-50">
                      <SkillCat as="div" value={s.category} onChange={update && (v => upd({ category: v }))} className="font-semibold text-[10.5px] text-sky-800 mb-1" />
                      <Editable as="div" multiline value={s.items.join(", ")} onChange={update && (v => upd({ items: v.split(/[\n,]/).map(x => x.trim()).filter(Boolean) }))} className="text-[9.5px] text-neutral-700 leading-snug whitespace-pre-wrap" />
                    </div>
                  );
                })}
              </div>
            </section>
          );
        }
        return null;
      case "experience":
        if (r.experience?.length > 0) {
          return (
            <section key="experience" className="mt-3">
              <h3 className="text-[10px] font-bold uppercase tracking-widest text-neutral-800 mb-1">
                <Editable value={getSectionTitle(r, "experience", "Experience")} onChange={update && (v => updateSectionTitle(r, on, "experience", v))} />
              </h3>
              {r.experience.map((e, i) => {
                const upd = makeExpUpdater(update, r, i);
                return (
                  <div key={i} className="mb-2">
                    <div className="flex justify-between"><span className="font-semibold text-[11px]"><Editable value={e.role} onChange={update && (v => upd({ role: v }))} /></span><span className="text-[10px] text-neutral-600"><Editable value={e.start} onChange={update && (v => upd({ start: v }))} /> – <Editable value={e.end} onChange={update && (v => upd({ end: v }))} /></span></div>
                    <div className="text-[10px] text-sky-700"><Editable value={e.company} onChange={update && (v => upd({ company: v }))} /> · <Editable value={e.location} onChange={update && (v => upd({ location: v }))} /></div>
                    <BulletsEditor bullets={e.bullets || []} onChange={update && (v => upd({ bullets: v }))} className="list-disc pl-4 mt-0.5 text-[10px] space-y-0.5" />
                  </div>
                );
              })}
            </section>
          );
        }
        return null;
      case "leadership":
        if (r.leadership && r.leadership.length > 0) {
          return (
            <section key="leadership" className="mt-3">
              <h3 className="text-[10px] font-bold uppercase tracking-widest text-neutral-800 mb-1">
                <Editable value={getSectionTitle(r, "leadership", "Leadership")} onChange={update && (v => updateSectionTitle(r, on, "leadership", v))} />
              </h3>
              {r.leadership.map((l, i) => {
                const upd = makeLeadershipUpdater(update, r, i);
                return (
                  <div key={i} className="mb-2">
                    <div className="flex justify-between"><span className="font-semibold text-[11px]"><Editable value={l.role} onChange={update && (v => upd({ role: v }))} /></span><span className="text-[10px] text-neutral-600"><Editable value={l.start || ""} onChange={update && (v => upd({ start: v }))} /> – <Editable value={l.end || ""} onChange={update && (v => upd({ end: v }))} /></span></div>
                    <div className="text-[10px] text-sky-700"><Editable value={l.organization} onChange={update && (v => upd({ organization: v }))} /> · <Editable value={l.location || ""} onChange={update && (v => upd({ location: v }))} /></div>
                    <BulletsEditor bullets={l.bullets || []} onChange={update && (v => upd({ bullets: v }))} className="list-disc pl-4 mt-0.5 text-[10px] space-y-0.5" />
                  </div>
                );
              })}
            </section>
          );
        }
        return null;
      case "education":
        if (r.education?.length > 0) {
          return (
            <section key="education" className="mt-2">
              <h3 className="text-[10px] font-bold uppercase tracking-widest text-neutral-800 mb-1">
                <Editable value={getSectionTitle(r, "education", "Education")} onChange={update && (v => updateSectionTitle(r, on, "education", v))} />
              </h3>
              {r.education.map((e, i) => {
                const upd = makeEduUpdater(update, r, i);
                return (
                  <div key={i} className="flex justify-between mb-1">
                    <span><span className="font-semibold"><Editable value={e.degree} onChange={update && (v => upd({ degree: v }))} /></span> · <Editable value={e.school} onChange={update && (v => upd({ school: v }))} /></span>
                    <span className="text-[10px] text-neutral-600"><Editable value={e.start} onChange={update && (v => upd({ start: v }))} />–<Editable value={e.end} onChange={update && (v => upd({ end: v }))} /></span>
                  </div>
                );
              })}
            </section>
          );
        }
        return null;
      default:
        return null;
    }
  };

  return (
    <div className="bg-white text-neutral-900 shadow-elegant rounded-lg p-8 font-sans text-[11px] leading-snug" style={{ minHeight: "var(--page-h, auto)", fontSize: r.settings?.fontSize ? `${r.settings.fontSize}px` : undefined, fontFamily: r.settings?.fontFamily || undefined }}>
      <div className="flex flex-col items-center text-center pb-4 border-b border-neutral-300">
        <div className="h-16 w-16 rounded-full bg-neutral-200 ring-2 ring-neutral-300 flex items-center justify-center text-lg font-bold text-neutral-700 mb-2">{initials(r.name)}</div>
        <Editable as="div" value={r.name || "Your Name"} onChange={update && (v => on({ name: v }))} className="font-bold text-[22px] tracking-tight" />
        <Editable as="div" value={r.title} onChange={update && (v => on({ title: v }))} className="text-sky-700 text-[11px] mt-0.5" />
        <div className="text-[10px] text-neutral-600 mt-1 flex flex-wrap gap-x-3 justify-center">
          <Editable value={r.phone} onChange={update && (v => on({ phone: v }))} />
          <Editable value={r.email} onChange={update && (v => on({ email: v }))} />
          <Editable value={r.location} onChange={update && (v => on({ location: v }))} />
        </div>
      </div>
      {sectionOrder.map(k => renderSection(k))}
    </div>
  );
}

/* ---------- Logo Boxed (Olivia Davis): centered header, initials-tile per company ---------- */
function LogoBoxedPreview({ r, update }: { r: ResumeData; update?: UpdateFn }) {
  const on = (patch: Partial<ResumeData>) => update?.(patch);
  const sectionOrder = getNormalizedSectionOrder(r.settings?.sectionOrder, r);

  const logoTile = (name: string) => {
    const c = (name || "?").trim().charAt(0).toUpperCase();
    const palette = ["bg-sky-100 text-sky-700", "bg-emerald-100 text-emerald-700", "bg-amber-100 text-amber-700", "bg-rose-100 text-rose-700", "bg-indigo-100 text-indigo-700"];
    const cls = palette[(c.charCodeAt(0) || 0) % palette.length];
    return <div className={`h-7 w-7 rounded ${cls} flex items-center justify-center text-[12px] font-bold shrink-0`}>{c}</div>;
  };

  const renderSection = (key: string) => {
    switch (key) {
      case "summary":
        if (r.summary && r.summary.trim()) {
          return (
            <div key="summary">
              <div className="text-center text-[12px] font-semibold tracking-wide text-neutral-800 border-b border-neutral-300 pb-1 mb-2 mt-3">
                <Editable value={getSectionTitle(r, "summary", "Summary")} onChange={update && (v => updateSectionTitle(r, on, "summary", v))} />
              </div>
              <Editable as="p" multiline value={r.summary} onChange={update && (v => on({ summary: v }))} className="whitespace-pre-wrap text-[10.5px]" />
            </div>
          );
        }
        return null;
      case "experience":
        if (r.experience?.length > 0) {
          return (
            <div key="experience">
              <div className="text-center text-[12px] font-semibold tracking-wide text-neutral-800 border-b border-neutral-300 pb-1 mb-2 mt-3">
                <Editable value={getSectionTitle(r, "experience", "Experience")} onChange={update && (v => updateSectionTitle(r, on, "experience", v))} />
              </div>
              {r.experience.map((e, i) => {
                const upd = makeExpUpdater(update, r, i);
                return (
                  <div key={i} className="mb-3 flex gap-3">
                    {logoTile(e.company)}
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between gap-2"><span className="font-semibold text-sky-800"><Editable value={e.company} onChange={update && (v => upd({ company: v }))} /></span><span className="text-[10px] text-neutral-600 whitespace-nowrap"><Editable value={e.location} onChange={update && (v => upd({ location: v }))} /></span></div>
                      <div className="flex justify-between text-[10px]"><span className="italic"><Editable value={e.role} onChange={update && (v => upd({ role: v }))} /></span><span><Editable value={e.start} onChange={update && (v => upd({ start: v }))} /> – <Editable value={e.end} onChange={update && (v => upd({ end: v }))} /></span></div>
                      <BulletsEditor bullets={e.bullets || []} onChange={update && (v => upd({ bullets: v }))} className="list-disc pl-4 mt-0.5 text-[10px] space-y-0.5" />
                    </div>
                  </div>
                );
              })}
            </div>
          );
        }
        return null;
      case "leadership":
        if (r.leadership && r.leadership.length > 0) {
          return (
            <div key="leadership">
              <div className="text-center text-[12px] font-semibold tracking-wide text-neutral-800 border-b border-neutral-300 pb-1 mb-2 mt-3">
                <Editable value={getSectionTitle(r, "leadership", "Leadership")} onChange={update && (v => updateSectionTitle(r, on, "leadership", v))} />
              </div>
              {r.leadership.map((l, i) => {
                const upd = makeLeadershipUpdater(update, r, i);
                return (
                  <div key={i} className="mb-3 flex gap-3">
                    {logoTile(l.organization)}
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between gap-2"><span className="font-semibold text-sky-800"><Editable value={l.organization} onChange={update && (v => upd({ organization: v }))} /></span><span className="text-[10px] text-neutral-600 whitespace-nowrap"><Editable value={l.location || ""} onChange={update && (v => upd({ location: v }))} /></span></div>
                      <div className="flex justify-between text-[10px]"><span className="italic"><Editable value={l.role} onChange={update && (v => upd({ role: v }))} /></span><span><Editable value={l.start || ""} onChange={update && (v => upd({ start: v }))} /> – <Editable value={l.end || ""} onChange={update && (v => upd({ end: v }))} /></span></div>
                      <BulletsEditor bullets={l.bullets || []} onChange={update && (v => upd({ bullets: v }))} className="list-disc pl-4 mt-0.5 text-[10px] space-y-0.5" />
                    </div>
                  </div>
                );
              })}
            </div>
          );
        }
        return null;
      case "education":
        if (r.education?.length > 0) {
          return (
            <div key="education">
              <div className="text-center text-[12px] font-semibold tracking-wide text-neutral-800 border-b border-neutral-300 pb-1 mb-2 mt-3">
                <Editable value={getSectionTitle(r, "education", "Education")} onChange={update && (v => updateSectionTitle(r, on, "education", v))} />
              </div>
              {r.education.map((e, i) => {
                const upd = makeEduUpdater(update, r, i);
                return (
                  <div key={i} className="mb-2 flex gap-3">
                    {logoTile(e.school)}
                    <div className="flex-1">
                      <div className="flex justify-between"><span className="font-semibold text-sky-800"><Editable value={e.school} onChange={update && (v => upd({ school: v }))} /></span><span className="text-[10px] text-neutral-600"><Editable value={e.start} onChange={update && (v => upd({ start: v }))} />–<Editable value={e.end} onChange={update && (v => upd({ end: v }))} /></span></div>
                      <div className="italic text-[10.5px]"><Editable value={e.degree} onChange={update && (v => upd({ degree: v }))} /></div>
                    </div>
                  </div>
                );
              })}
            </div>
          );
        }
        return null;
      case "skills":
        if (r.skills?.length > 0) {
          return (
            <div key="skills">
              <div className="text-center text-[12px] font-semibold tracking-wide text-neutral-800 border-b border-neutral-300 pb-1 mb-2 mt-3">
                <Editable value={getSectionTitle(r, "skills", "Skills")} onChange={update && (v => updateSectionTitle(r, on, "skills", v))} />
              </div>
              <div className="space-y-1">
                {r.skills.map((s, i) => {
                  const upd = makeSkillUpdater(update, r, i);
                  return (
                    <div key={i} className="text-[10px] leading-relaxed">
                      <SkillCat value={s.category} onChange={update && (v => upd({ category: v }))} className="font-semibold text-sky-800" colon />{" "}
                      <Editable as="span" multiline value={s.items.join(", ")} onChange={update && (v => upd({ items: v.split(/[\n,]/).map(x => x.trim()).filter(Boolean) }))} className="whitespace-pre-wrap" />
                    </div>
                  );
                })}
              </div>
            </div>
          );
        }
        return null;
      case "certifications":
        if (r.certifications?.length > 0) {
          return (
            <div key="certifications">
              <div className="text-center text-[12px] font-semibold tracking-wide text-neutral-800 border-b border-neutral-300 pb-1 mb-2 mt-3">
                <Editable value={getSectionTitle(r, "certifications", "Certifications")} onChange={update && (v => updateSectionTitle(r, on, "certifications", v))} />
              </div>
              <Editable as="div" multiline value={r.certifications.join("\n")} onChange={update && (v => on({ certifications: v.split("\n").map(x => x.trim()).filter(Boolean) }))} className="text-[10.5px] whitespace-pre-wrap" />
            </div>
          );
        }
        return null;
      default:
        return null;
    }
  };

  return (
    <div className="bg-white text-neutral-900 shadow-elegant rounded-lg p-8 font-sans text-[11px] leading-snug" style={{ minHeight: "var(--page-h, auto)", fontSize: r.settings?.fontSize ? `${r.settings.fontSize}px` : undefined, fontFamily: r.settings?.fontFamily || undefined }}>
      <div className="text-center pb-2">
        <Editable as="div" value={r.name || "Your Name"} onChange={update && (v => on({ name: v }))} className="font-bold text-[22px] text-sky-800 tracking-tight" />
        <Editable as="div" value={r.title} onChange={update && (v => on({ title: v }))} className="text-neutral-700 text-[11px] mt-0.5" />
        <div className="text-[10px] text-neutral-600 mt-1 flex flex-wrap gap-x-3 justify-center">
          <Editable value={r.phone} onChange={update && (v => on({ phone: v }))} />
          <Editable value={r.email} onChange={update && (v => on({ email: v }))} />
          <Editable value={r.location} onChange={update && (v => on({ location: v }))} />
        </div>
      </div>
      {sectionOrder.map(k => renderSection(k))}
    </div>
  );
}

/* ---------- Nordic Minimal: Scandinavian aesthetic with slate-gray accents, tag pills, sleek border ---------- */
function NordicPreview({ r, update }: { r: ResumeData; update?: UpdateFn }) {
  const on = (patch: Partial<ResumeData>) => update?.(patch);
  const sectionOrder = getNormalizedSectionOrder(r.settings?.sectionOrder, r);

  const renderSection = (key: string) => {
    switch (key) {
      case "summary":
        if (r.summary && r.summary.trim()) {
          return (
            <section key="summary" className="mb-4">
              <h3 className="text-[10.5px] font-bold uppercase tracking-[0.2em] text-slate-700 border-l-2 border-slate-700 pl-2.5 mb-2">
                <Editable value={getSectionTitle(r, "summary", "Summary")} onChange={update && (v => updateSectionTitle(r, on, "summary", v))} />
              </h3>
              <Editable as="p" multiline value={r.summary} onChange={update && (v => on({ summary: v }))} className="text-[10.5px] text-slate-700 leading-relaxed whitespace-pre-wrap pl-2.5" />
            </section>
          );
        }
        return null;
      case "experience":
        if (r.experience?.length > 0) {
          return (
            <section key="experience" className="mb-4">
              <h3 className="text-[10.5px] font-bold uppercase tracking-[0.2em] text-slate-700 border-l-2 border-slate-700 pl-2.5 mb-2">
                <Editable value={getSectionTitle(r, "experience", "Experience")} onChange={update && (v => updateSectionTitle(r, on, "experience", v))} />
              </h3>
              <div className="space-y-3 pl-2.5">
                {r.experience.map((e, i) => {
                  const upd = makeExpUpdater(update, r, i);
                  return (
                    <div key={i} className="mb-2">
                      <div className="flex justify-between font-bold text-[11px] text-slate-900 gap-2">
                        <span><Editable value={e.role} onChange={update && (v => upd({ role: v }))} /> <span className="font-normal text-slate-500">· <Editable value={e.company} onChange={update && (v => upd({ company: v }))} /></span></span>
                        <span className="text-[9.5px] font-medium text-slate-500 whitespace-nowrap"><Editable value={e.start} onChange={update && (v => upd({ start: v }))} /> – <Editable value={e.end} onChange={update && (v => upd({ end: v }))} /></span>
                      </div>
                      {e.location && <div className="text-[9px] text-slate-400"><Editable value={e.location} onChange={update && (v => upd({ location: v }))} /></div>}
                      <BulletsEditor bullets={e.bullets || []} onChange={update && (v => upd({ bullets: v }))} className="list-disc pl-4 mt-1 text-[10px] space-y-0.5 text-slate-700" />
                    </div>
                  );
                })}
              </div>
            </section>
          );
        }
        return null;
      case "leadership":
        if (r.leadership && r.leadership.length > 0) {
          return (
            <section key="leadership" className="mb-4">
              <h3 className="text-[10.5px] font-bold uppercase tracking-[0.2em] text-slate-700 border-l-2 border-slate-700 pl-2.5 mb-2">
                <Editable value={getSectionTitle(r, "leadership", "Leadership")} onChange={update && (v => updateSectionTitle(r, on, "leadership", v))} />
              </h3>
              <div className="space-y-3 pl-2.5">
                {r.leadership.map((l, i) => {
                  const upd = makeLeadershipUpdater(update, r, i);
                  return (
                    <div key={i} className="mb-2">
                      <div className="flex justify-between font-bold text-[11px] text-slate-900 gap-2">
                        <span><Editable value={l.role} onChange={update && (v => upd({ role: v }))} /> <span className="font-normal text-slate-500">· <Editable value={l.organization} onChange={update && (v => upd({ organization: v }))} /></span></span>
                        <span className="text-[9.5px] font-medium text-slate-500 whitespace-nowrap"><Editable value={l.start || ""} onChange={update && (v => upd({ start: v }))} /> – <Editable value={l.end || ""} onChange={update && (v => upd({ end: v }))} /></span>
                      </div>
                      {l.location && <div className="text-[9px] text-slate-400"><Editable value={l.location} onChange={update && (v => upd({ location: v }))} /></div>}
                      <BulletsEditor bullets={l.bullets || []} onChange={update && (v => upd({ bullets: v }))} className="list-disc pl-4 mt-1 text-[10px] space-y-0.5 text-slate-700" />
                    </div>
                  );
                })}
              </div>
            </section>
          );
        }
        return null;
      case "education":
        if (r.education?.length > 0) {
          return (
            <section key="education" className="mb-4">
              <h3 className="text-[10.5px] font-bold uppercase tracking-[0.2em] text-slate-700 border-l-2 border-slate-700 pl-2.5 mb-2">
                <Editable value={getSectionTitle(r, "education", "Education")} onChange={update && (v => updateSectionTitle(r, on, "education", v))} />
              </h3>
              <div className="space-y-2 pl-2.5">
                {r.education.map((e, i) => {
                  const upd = makeEduUpdater(update, r, i);
                  return (
                    <div key={i} className="flex justify-between text-[10.5px]">
                      <div>
                        <span className="font-bold text-slate-900"><Editable value={e.degree} onChange={update && (v => upd({ degree: v }))} /></span>
                        <span className="text-slate-600">, <Editable value={e.school} onChange={update && (v => upd({ school: v }))} /></span>
                        {e.details && <div className="text-[9.5px] text-slate-500"><Editable value={e.details} onChange={update && (v => upd({ details: v }))} /></div>}
                      </div>
                      <span className="text-[9.5px] text-slate-500 whitespace-nowrap"><Editable value={e.start} onChange={update && (v => upd({ start: v }))} /> – <Editable value={e.end} onChange={update && (v => upd({ end: v }))} /></span>
                    </div>
                  );
                })}
              </div>
            </section>
          );
        }
        return null;
      case "projects":
        if (r.projects?.length > 0) {
          return (
            <section key="projects" className="mb-4">
              <h3 className="text-[10.5px] font-bold uppercase tracking-[0.2em] text-slate-700 border-l-2 border-slate-700 pl-2.5 mb-2">
                <Editable value={getSectionTitle(r, "projects", "Projects")} onChange={update && (v => updateSectionTitle(r, on, "projects", v))} />
              </h3>
              <div className="space-y-2 pl-2.5">
                {r.projects.map((p, i) => {
                  const upd = makeProjUpdater(update, r, i);
                  return (
                    <div key={i} className="mb-1">
                      <div className="font-bold text-[11px] text-slate-900"><Editable value={p.name} onChange={update && (v => upd({ name: v }))} /> <span className="font-normal text-[9.5px] text-slate-500">· <Editable value={p.tech} onChange={update && (v => upd({ tech: v }))} /></span></div>
                      <BulletsEditor bullets={p.bullets || []} onChange={update && (v => upd({ bullets: v }))} className="list-disc pl-4 mt-0.5 text-[10px] space-y-0.5 text-slate-700" />
                    </div>
                  );
                })}
              </div>
            </section>
          );
        }
        return null;
      case "skills":
        if (r.skills?.length > 0) {
          return (
            <section key="skills" className="mb-4">
              <h3 className="text-[10.5px] font-bold uppercase tracking-[0.2em] text-slate-700 border-l-2 border-slate-700 pl-2.5 mb-2">
                <Editable value={getSectionTitle(r, "skills", "Skills & Competencies")} onChange={update && (v => updateSectionTitle(r, on, "skills", v))} />
              </h3>
              <div className="space-y-1.5 pl-2.5">
                {r.skills.map((s, i) => {
                  const upd = makeSkillUpdater(update, r, i);
                  return (
                    <div key={i} className="flex items-start text-[10px]">
                      <SkillCat as="span" value={s.category} onChange={update && (v => upd({ category: v }))} className="font-bold text-slate-800 w-36 shrink-0" colon />
                      <div className="flex flex-wrap gap-1 flex-1">
                        {s.items.map((it, idx) => (
                          <span key={idx} className="bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded text-[9.5px] border border-slate-200">
                            {it}
                          </span>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          );
        }
        return null;
      case "certifications":
        if (r.certifications?.length > 0) {
          return (
            <section key="certifications">
              <h3 className="text-[10.5px] font-bold uppercase tracking-[0.2em] text-slate-700 border-l-2 border-slate-700 pl-2.5 mb-2">
                <Editable value={getSectionTitle(r, "certifications", "Certifications")} onChange={update && (v => updateSectionTitle(r, on, "certifications", v))} />
              </h3>
              <div className="pl-2.5 text-[10px] text-slate-700">
                <Editable value={r.certifications.join("  •  ")} onChange={update && (v => on({ certifications: v.split("•").map(x => x.trim()).filter(Boolean) }))} />
              </div>
            </section>
          );
        }
        return null;
      default:
        return null;
    }
  };

  return (
    <div
      className="bg-white text-slate-900 shadow-elegant rounded-lg p-8 font-sans text-[11px] leading-snug border-t-4 border-slate-700"
      style={{
        minHeight: "var(--page-h, auto)",
        fontSize: r.settings?.fontSize ? `${r.settings.fontSize}px` : undefined,
        fontFamily: r.settings?.fontFamily || undefined,
      }}
    >
      <div className="flex justify-between items-baseline pb-4 mb-4 border-b border-slate-200">
        <div>
          <Editable as="div" value={r.name || "Your Name"} onChange={update && (v => on({ name: v }))} className="font-extrabold text-[24px] tracking-tight text-slate-900" />
          <Editable as="div" value={r.title} onChange={update && (v => on({ title: v }))} className="text-slate-600 text-[11px] font-medium tracking-wide mt-0.5" />
        </div>
        <div className="text-right text-[9.5px] text-slate-500 space-y-0.5">
          <Editable as="div" value={r.email} onChange={update && (v => on({ email: v }))} />
          <Editable as="div" value={r.phone} onChange={update && (v => on({ phone: v }))} />
          <Editable as="div" value={r.location} onChange={update && (v => on({ location: v }))} />
          {r.links?.filter(l => l && (l.url || l.label)).map((l, i) => (
            <Editable key={i} as="div" value={l.url || l.label} onChange={update && (v => on({ links: r.links.map((x, j) => j === i ? { ...x, url: v } : x) }))} />
          ))}
        </div>
      </div>
      {sectionOrder.map(k => renderSection(k))}
    </div>
  );
}

/* ---------- Ivy League Academic: Formal serif, centered header, horizontal rules ---------- */
function IvyLeaguePreview({ r, update }: { r: ResumeData; update?: UpdateFn }) {
  const on = (patch: Partial<ResumeData>) => update?.(patch);
  const sectionOrder = getNormalizedSectionOrder(r.settings?.sectionOrder, r);

  const renderSection = (key: string) => {
    let content = null;
    let defaultTitle = "";
    switch (key) {
      case "summary":
        if (r.summary && r.summary.trim()) {
          defaultTitle = "Professional Summary";
          content = <Editable as="p" multiline value={r.summary} onChange={update && (v => on({ summary: v }))} className="text-[10.5px] leading-relaxed text-justify whitespace-pre-wrap" />;
        }
        break;
      case "education":
        if (r.education?.length > 0) {
          defaultTitle = "Education";
          content = (
            <div>
              {r.education.map((e, i) => {
                const upd = makeEduUpdater(update, r, i);
                return (
                  <div key={i} className="mb-2">
                    <div className="flex justify-between font-bold text-[11.5px]">
                      <span><Editable value={e.school} onChange={update && (v => upd({ school: v }))} />, <Editable value={e.location} onChange={update && (v => upd({ location: v }))} /></span>
                      <span className="font-normal text-[10px] italic"><Editable value={e.start} onChange={update && (v => upd({ start: v }))} /> – <Editable value={e.end} onChange={update && (v => upd({ end: v }))} /></span>
                    </div>
                    <div className="italic text-[10.5px]"><Editable value={e.degree} onChange={update && (v => upd({ degree: v }))} /></div>
                    {e.details && <div className="text-[10px] text-neutral-700 mt-0.5"><Editable value={e.details} onChange={update && (v => upd({ details: v }))} /></div>}
                  </div>
                );
              })}
            </div>
          );
        }
        break;
      case "experience":
        if (r.experience?.length > 0) {
          defaultTitle = "Professional Experience";
          content = (
            <div>
              {r.experience.map((e, i) => {
                const upd = makeExpUpdater(update, r, i);
                return (
                  <div key={i} className="mb-3">
                    <div className="flex justify-between font-bold text-[11.5px]">
                      <span><Editable value={e.company} onChange={update && (v => upd({ company: v }))} />{e.location ? `, ` : ""}<Editable value={e.location} onChange={update && (v => upd({ location: v }))} /></span>
                      <span className="font-normal text-[10px] italic"><Editable value={e.start} onChange={update && (v => upd({ start: v }))} /> – <Editable value={e.end} onChange={update && (v => upd({ end: v }))} /></span>
                    </div>
                    <div className="italic text-[10.5px] font-semibold text-neutral-800"><Editable value={e.role} onChange={update && (v => upd({ role: v }))} /></div>
                    <BulletsEditor bullets={e.bullets || []} onChange={update && (v => upd({ bullets: v }))} className="list-disc pl-5 mt-1 text-[10.5px] space-y-0.5 leading-relaxed" />
                  </div>
                );
              })}
            </div>
          );
        }
        break;
      case "leadership":
        if (r.leadership && r.leadership.length > 0) {
          defaultTitle = "Leadership & Service";
          content = (
            <div>
              {r.leadership.map((l, i) => {
                const upd = makeLeadershipUpdater(update, r, i);
                return (
                  <div key={i} className="mb-2">
                    <div className="flex justify-between font-bold text-[11.5px]">
                      <span><Editable value={l.organization} onChange={update && (v => upd({ organization: v }))} />{l.location ? `, ` : ""}<Editable value={l.location || ""} onChange={update && (v => upd({ location: v }))} /></span>
                      <span className="font-normal text-[10px] italic"><Editable value={l.start || ""} onChange={update && (v => upd({ start: v }))} /> – <Editable value={l.end || ""} onChange={update && (v => upd({ end: v }))} /></span>
                    </div>
                    <div className="italic text-[10.5px]"><Editable value={l.role} onChange={update && (v => upd({ role: v }))} /></div>
                    <BulletsEditor bullets={l.bullets || []} onChange={update && (v => upd({ bullets: v }))} className="list-disc pl-5 mt-0.5 text-[10.5px] space-y-0.5 leading-relaxed" />
                  </div>
                );
              })}
            </div>
          );
        }
        break;
      case "projects":
        if (r.projects?.length > 0) {
          defaultTitle = "Selected Projects & Publications";
          content = (
            <div>
              {r.projects.map((p, i) => {
                const upd = makeProjUpdater(update, r, i);
                return (
                  <div key={i} className="mb-2">
                    <div className="font-bold text-[11px]"><Editable value={p.name} onChange={update && (v => upd({ name: v }))} /> <span className="font-normal italic text-[10px]">· <Editable value={p.tech} onChange={update && (v => upd({ tech: v }))} /></span></div>
                    <BulletsEditor bullets={p.bullets || []} onChange={update && (v => upd({ bullets: v }))} className="list-disc pl-5 mt-0.5 text-[10.5px]" />
                  </div>
                );
              })}
            </div>
          );
        }
        break;
      case "skills":
        if (r.skills?.length > 0) {
          defaultTitle = "Skills & Certifications";
          content = (
            <div className="space-y-1 text-[10.5px] leading-relaxed">
              {r.skills.map((s, i) => {
                const upd = makeSkillUpdater(update, r, i);
                return (
                  <div key={i}>
                    <SkillCat as="span" value={s.category} onChange={update && (v => upd({ category: v }))} className="font-bold" colon />{" "}
                    <Editable as="span" multiline value={s.items.join(", ")} onChange={update && (v => upd({ items: v.split(/[\n,]/).map(x => x.trim()).filter(Boolean) }))} className="whitespace-pre-wrap" />
                  </div>
                );
              })}
              {r.certifications?.length > 0 && (
                <div>
                  <span className="font-bold">Certifications: </span>
                  <Editable value={r.certifications.join(", ")} onChange={update && (v => on({ certifications: v.split(",").map(x => x.trim()).filter(Boolean) }))} />
                </div>
              )}
            </div>
          );
        }
        break;
    }
    if (!content) return null;

    return (
      <section key={key} className="mb-3">
        <div className="my-3 border-b-2 border-slate-900 pb-0.5">
          <h3 className="text-[11px] font-bold uppercase tracking-[0.15em] text-slate-900">
            <Editable
              value={getSectionTitle(r, key, defaultTitle)}
              onChange={update && (v => updateSectionTitle(r, on, key, v))}
            />
          </h3>
        </div>
        {content}
      </section>
    );
  };

  return (
    <div
      className="bg-white text-neutral-900 shadow-elegant rounded-lg p-10 font-serif text-[11px] leading-snug"
      style={{
        minHeight: "var(--page-h, auto)",
        fontSize: r.settings?.fontSize ? `${r.settings.fontSize}px` : undefined,
        fontFamily: r.settings?.fontFamily || "'Times New Roman', Times, serif",
      }}
    >
      <div className="text-center pb-3 mb-2 border-b border-neutral-300">
        <Editable as="div" value={r.name || "Your Name"} onChange={update && (v => on({ name: v }))} className="font-bold text-[28px] tracking-tight uppercase" />
        <Editable as="div" value={r.title} onChange={update && (v => on({ title: v }))} className="italic text-[12px] text-neutral-700 mt-0.5" />
        <div className="text-[10px] text-neutral-600 mt-2 flex flex-wrap justify-center gap-x-3">
          <Editable value={r.location} onChange={update && (v => on({ location: v }))} />
          <span>•</span>
          <Editable value={r.email} onChange={update && (v => on({ email: v }))} />
          <span>•</span>
          <Editable value={r.phone} onChange={update && (v => on({ phone: v }))} />
          {r.links?.filter(l => l && (l.url || l.label)).map((l, i) => (
            <React.Fragment key={i}>
              <span>•</span>
              <Editable value={l.label && l.url ? l.label + ": " + l.url : (l.url || l.label)} onChange={update && (v => {
                const [lbl, ...rst] = v.split(":");
                on({ links: r.links.map((x, j) => j === i ? { label: (lbl || "").trim(), url: rst.join(":").trim() } : x) });
              })} />
            </React.Fragment>
          ))}
        </div>
      </div>
      {sectionOrder.map(k => renderSection(k))}
    </div>
  );
}

/* ---------- Modern Tech Lead: Charcoal slate header, cyan accents, monospace skills ---------- */
function TechDarkPreview({ r, update }: { r: ResumeData; update?: UpdateFn }) {
  const on = (patch: Partial<ResumeData>) => update?.(patch);
  const sectionOrder = getNormalizedSectionOrder(r.settings?.sectionOrder, r);
  const leftKeys = ["summary", "experience", "leadership", "projects"];
  const rightKeys = ["skills", "education", "certifications", "languages", "custom"];

  const renderMainSection = (key: string) => {
    switch (key) {
      case "summary":
        if (r.summary && r.summary.trim()) {
          return (
            <section key="summary" className="mb-4">
              <h3 className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-900 border-b border-slate-200 pb-1 mb-2 flex items-center gap-1.5">
                <span className="text-cyan-600">//</span>
                <Editable value={getSectionTitle(r, "summary", "Summary")} onChange={update && (v => updateSectionTitle(r, on, "summary", v))} />
              </h3>
              <Editable as="p" multiline value={r.summary} onChange={update && (v => on({ summary: v }))} className="text-[10.5px] text-slate-700 leading-relaxed whitespace-pre-wrap" />
            </section>
          );
        }
        return null;
      case "experience":
        if (r.experience?.length > 0) {
          return (
            <section key="experience" className="mb-4">
              <h3 className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-900 border-b border-slate-200 pb-1 mb-2 flex items-center gap-1.5">
                <span className="text-cyan-600">//</span>
                <Editable value={getSectionTitle(r, "experience", "Experience")} onChange={update && (v => updateSectionTitle(r, on, "experience", v))} />
              </h3>
              {r.experience.map((e, i) => {
                const upd = makeExpUpdater(update, r, i);
                return (
                  <div key={i} className="mb-3">
                    <div className="flex justify-between font-bold text-[11px] text-slate-900">
                      <span><Editable value={e.role} onChange={update && (v => upd({ role: v }))} /></span>
                      <span className="text-[9.5px] font-mono text-slate-500 whitespace-nowrap"><Editable value={e.start} onChange={update && (v => upd({ start: v }))} /> – <Editable value={e.end} onChange={update && (v => upd({ end: v }))} /></span>
                    </div>
                    <div className="text-[10px] text-cyan-700 font-medium"><Editable value={e.company} onChange={update && (v => upd({ company: v }))} />{e.location ? ` · ` : ""}<Editable value={e.location} onChange={update && (v => upd({ location: v }))} /></div>
                    <BulletsEditor bullets={e.bullets || []} onChange={update && (v => upd({ bullets: v }))} className="list-disc pl-4 mt-1 text-[10px] space-y-0.5 text-slate-700" />
                  </div>
                );
              })}
            </section>
          );
        }
        return null;
      case "leadership":
        if (r.leadership && r.leadership.length > 0) {
          return (
            <section key="leadership" className="mb-4">
              <h3 className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-900 border-b border-slate-200 pb-1 mb-2 flex items-center gap-1.5">
                <span className="text-cyan-600">//</span>
                <Editable value={getSectionTitle(r, "leadership", "Leadership")} onChange={update && (v => updateSectionTitle(r, on, "leadership", v))} />
              </h3>
              {r.leadership.map((l, i) => {
                const upd = makeLeadershipUpdater(update, r, i);
                return (
                  <div key={i} className="mb-3">
                    <div className="flex justify-between font-bold text-[11px] text-slate-900">
                      <span><Editable value={l.role} onChange={update && (v => upd({ role: v }))} /></span>
                      <span className="text-[9.5px] font-mono text-slate-500 whitespace-nowrap"><Editable value={l.start || ""} onChange={update && (v => upd({ start: v }))} /> – <Editable value={l.end || ""} onChange={update && (v => upd({ end: v }))} /></span>
                    </div>
                    <div className="text-[10px] text-cyan-700 font-medium"><Editable value={l.organization} onChange={update && (v => upd({ organization: v }))} /></div>
                    <BulletsEditor bullets={l.bullets || []} onChange={update && (v => upd({ bullets: v }))} className="list-disc pl-4 mt-1 text-[10px] space-y-0.5 text-slate-700" />
                  </div>
                );
              })}
            </section>
          );
        }
        return null;
      case "projects":
        if (r.projects?.length > 0) {
          return (
            <section key="projects" className="mb-4">
              <h3 className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-900 border-b border-slate-200 pb-1 mb-2 flex items-center gap-1.5">
                <span className="text-cyan-600">//</span>
                <Editable value={getSectionTitle(r, "projects", "Featured Projects")} onChange={update && (v => updateSectionTitle(r, on, "projects", v))} />
              </h3>
              {r.projects.map((p, i) => {
                const upd = makeProjUpdater(update, r, i);
                return (
                  <div key={i} className="mb-2">
                    <div className="font-bold text-[11px] text-slate-900"><Editable value={p.name} onChange={update && (v => upd({ name: v }))} /> <span className="font-mono text-[9px] text-cyan-600 font-normal">[ <Editable value={p.tech} onChange={update && (v => upd({ tech: v }))} /> ]</span></div>
                    <BulletsEditor bullets={p.bullets || []} onChange={update && (v => upd({ bullets: v }))} className="list-disc pl-4 mt-0.5 text-[10px] text-slate-700" />
                  </div>
                );
              })}
            </section>
          );
        }
        return null;
      default:
        return null;
    }
  };

  const renderSideSection = (key: string) => {
    switch (key) {
      case "skills":
        if (r.skills?.length > 0) {
          return (
            <section key="skills" className="bg-slate-50 p-3.5 rounded-lg border border-slate-200">
              <h3 className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-900 border-b border-slate-200 pb-1 mb-2 flex items-center gap-1.5">
                <span className="text-cyan-600">#</span>
                <Editable value={getSectionTitle(r, "skills", "Tech Stack")} onChange={update && (v => updateSectionTitle(r, on, "skills", v))} />
              </h3>
              <div className="space-y-2.5">
                {r.skills.map((s, i) => {
                  const upd = makeSkillUpdater(update, r, i);
                  return (
                    <div key={i}>
                      <SkillCat as="div" value={s.category} onChange={update && (v => upd({ category: v }))} className="font-mono font-bold text-[9.5px] text-slate-700 mb-1" />
                      <div className="flex flex-wrap gap-1">
                        {s.items.map((it, idx) => (
                          <span key={idx} className="bg-white font-mono text-[9px] text-slate-800 px-1.5 py-0.5 rounded border border-slate-300">
                            {it}
                          </span>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          );
        }
        return null;
      case "education":
        if (r.education?.length > 0) {
          return (
            <section key="education" className="bg-slate-50 p-3.5 rounded-lg border border-slate-200">
              <h3 className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-900 border-b border-slate-200 pb-1 mb-2 flex items-center gap-1.5">
                <span className="text-cyan-600">#</span>
                <Editable value={getSectionTitle(r, "education", "Education")} onChange={update && (v => updateSectionTitle(r, on, "education", v))} />
              </h3>
              {r.education.map((e, i) => {
                const upd = makeEduUpdater(update, r, i);
                return (
                  <div key={i} className="mb-1 text-[10px]">
                    <div className="font-bold text-slate-900"><Editable value={e.degree} onChange={update && (v => upd({ degree: v }))} /></div>
                    <div className="text-slate-600"><Editable value={e.school} onChange={update && (v => upd({ school: v }))} /></div>
                    <div className="font-mono text-[9px] text-slate-400"><Editable value={e.start} onChange={update && (v => upd({ start: v }))} />–<Editable value={e.end} onChange={update && (v => upd({ end: v }))} /></div>
                  </div>
                );
              })}
            </section>
          );
        }
        return null;
      case "certifications":
        if (r.certifications?.length > 0) {
          return (
            <section key="certifications" className="bg-slate-50 p-3.5 rounded-lg border border-slate-200">
              <h3 className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-900 border-b border-slate-200 pb-1 mb-2 flex items-center gap-1.5">
                <span className="text-cyan-600">#</span>
                <Editable value={getSectionTitle(r, "certifications", "Certifications")} onChange={update && (v => updateSectionTitle(r, on, "certifications", v))} />
              </h3>
              <Editable as="div" multiline value={r.certifications.join("\n")} onChange={update && (v => on({ certifications: v.split("\n").map(x => x.trim()).filter(Boolean) }))} className="text-[9.5px] font-mono text-slate-700 whitespace-pre-wrap leading-relaxed" />
            </section>
          );
        }
        return null;
      default:
        return null;
    }
  };

  return (
    <div
      className="bg-white text-slate-900 shadow-elegant rounded-none overflow-hidden font-sans text-[11px] leading-snug w-full"
      style={{
        minHeight: "var(--page-h, auto)",
        fontSize: r.settings?.fontSize ? `${r.settings.fontSize}px` : undefined,
        fontFamily: r.settings?.fontFamily || undefined,
      }}
    >
      <div
        className="text-white p-6 border-b-2 border-cyan-500 relative group/header cursor-pointer transition-colors"
        style={{ backgroundColor: r.settings?.headerBg || r.settings?.primaryColor || "#020617" }}
        data-color-target="header"
        data-color-label="Dark Tech Header"
        data-current-color={r.settings?.headerBg || r.settings?.primaryColor || "#020617"}
        title={update ? "Click to change color" : undefined}
      >
        {update && (
          <div className="preview-only-badge absolute top-2 right-2 opacity-0 group-hover/header:opacity-100 transition-opacity bg-black/60 hover:bg-black/80 text-white text-[10px] font-semibold px-2 py-0.5 rounded-full flex items-center gap-1 pointer-events-none shadow backdrop-blur-sm z-10">
            <span>🎨 Color</span>
          </div>
        )}
        <div className="flex justify-between items-start">
          <div>
            <div className="flex items-center gap-2">
              <Editable as="div" value={r.name || "Your Name"} onChange={update && (v => on({ name: v }))} className="font-black text-2xl tracking-tight text-white" />
              <span className="px-2 py-0.5 rounded-full text-[9px] font-mono bg-cyan-950 text-cyan-400 border border-cyan-500/40">TECH LEAD</span>
            </div>
            <Editable as="div" value={r.title} onChange={update && (v => on({ title: v }))} className="text-cyan-400 font-mono text-[11px] mt-0.5" />
          </div>
          <div className="text-right text-[9.5px] font-mono text-slate-300 space-y-0.5">
            <Editable as="div" value={r.email} onChange={update && (v => on({ email: v }))} />
            <Editable as="div" value={r.phone} onChange={update && (v => on({ phone: v }))} />
            <Editable as="div" value={r.location} onChange={update && (v => on({ location: v }))} />
          </div>
        </div>
        {r.links?.filter(l => l && (l.url || l.label))?.length > 0 && (
          <div className="mt-3 pt-2 border-t border-slate-800 flex flex-wrap gap-x-4 text-[9.5px] font-mono text-slate-400">
            {r.links.filter(l => l && (l.url || l.label)).map((l, i) => (
              <Editable key={i} value={l.label && l.url ? `${l.label}: ${l.url}` : (l.url || l.label)} onChange={update && (v => {
                const [lbl, ...rst] = v.split(":");
                on({ links: r.links.map((x, j) => j === i ? { label: (lbl || "").trim(), url: rst.join(":").trim() } : x) });
              })} />
            ))}
          </div>
        )}
      </div>

      <div className="grid grid-cols-[minmax(0,1fr)_250px] gap-5 p-6">
        <div>
          {sectionOrder.filter(k => leftKeys.includes(k)).map(k => renderMainSection(k))}
        </div>
        <div className="space-y-4">
          {sectionOrder.filter(k => rightKeys.includes(k)).map(k => renderSideSection(k))}
        </div>
      </div>
    </div>
  );
}

/* =========================================================================
 * 10 NEW HIGH-CONVERTING TEMPLATES (MATCHING EXACT UPLOADED DESIGNS)
 * ========================================================================= */

function getInitials(name: string): string {
  const parts = (name || "").trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function renderBulletSkills2Col(skills: ResumeData["skills"] = [], update?: UpdateFn, dotColor = "text-black") {
  const allItems = (skills || []).flatMap(s => s.items || []).filter(Boolean);
  if (allItems.length === 0) return null;
  const half = Math.ceil(allItems.length / 2);
  const col1 = allItems.slice(0, half);
  const col2 = allItems.slice(half);

  return (
    <div className="grid grid-cols-2 gap-x-6 text-[10px] leading-relaxed text-black">
      <ul className="space-y-1">
        {col1.map((item, idx) => (
          <li key={idx} className="flex items-start gap-1.5">
            <span className={`text-[10px] leading-none mt-0.5 ${dotColor}`}>•</span>
            <span>{item}</span>
          </li>
        ))}
      </ul>
      <ul className="space-y-1">
        {col2.map((item, idx) => (
          <li key={idx} className="flex items-start gap-1.5">
            <span className={`text-[10px] leading-none mt-0.5 ${dotColor}`}>•</span>
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function renderLanguagesSection(r: ResumeData, barColor = "bg-slate-700") {
  const langSkill = (r.skills || []).find(s => s.category?.toLowerCase().includes("lang"));
  const langItems = langSkill?.items?.filter(Boolean) || [];
  if (langItems.length === 0) return null;

  return (
    <div className="space-y-2 text-[10px] text-black">
      <div className="grid grid-cols-2 gap-3">
        {langItems.map((lang, idx) => (
          <div key={idx}>
            <div className="flex justify-between text-[9.5px]">
              <span className="font-semibold text-black">{lang}</span>
            </div>
            <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden mt-0.5">
              <div className={`h-full ${barColor} rounded-full`} style={{ width: "85%" }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* 1. Classic Monogram Blue Frame */
function MonogramBlueFramePreview({ r, update }: { r: ResumeData; update?: UpdateFn }) {
  const on = (patch: Partial<ResumeData>) => update?.(patch);
  const initials = getInitials(r.name);

  return (
    <div className="bg-white text-black p-6 font-sans text-[10.5px] leading-snug w-full min-h-[var(--page-h,auto)]">
      <div className="border-[3px] border-[#2563eb] rounded-2xl p-7 space-y-4">
        {/* Header */}
        <div className="text-center space-y-1.5">
          {initials && (
            <div className="h-16 w-16 rounded-full border-2 border-slate-700 flex items-center justify-center font-bold text-xl text-slate-800 mx-auto">
              {initials}
            </div>
          )}
          <Editable as="h1" value={r.name || ""} onChange={update && (v => on({ name: v }))} className="text-2xl font-black tracking-wider uppercase text-slate-900 text-center" />
          <div className="text-[9.5px] text-slate-600 text-center flex justify-center items-center gap-2 flex-wrap">
            {r.email && <Editable value={r.email} onChange={update && (v => on({ email: v }))} />}
            {r.email && r.phone && <span>|</span>}
            {r.phone && <Editable value={r.phone} onChange={update && (v => on({ phone: v }))} />}
            {(r.email || r.phone) && r.location && <span>|</span>}
            {r.location && <Editable value={r.location} onChange={update && (v => on({ location: v }))} />}
          </div>
        </div>

        {/* Summary */}
        {r.summary?.trim() && (
          <section data-rs-sec="summary" className="space-y-1.5">
            <div className="font-bold text-xs uppercase tracking-wider text-slate-900 flex items-center gap-2">
              <span data-rs-head="1">{getSectionTitle(r, "summary", "Summary")}</span>
              <span className="flex-1 border-b border-slate-300" />
            </div>
            <Editable as="p" multiline value={r.summary} onChange={update && (v => on({ summary: v }))} className="text-[10px] leading-relaxed text-black whitespace-pre-wrap" />
          </section>
        )}

        {/* Skills */}
        {r.skills?.some(s => (s.items || []).filter(Boolean).length > 0) && (
          <section data-rs-sec="skills" className="space-y-1.5">
            <div className="font-bold text-xs uppercase tracking-wider text-slate-900 flex items-center gap-2">
              <span data-rs-head="1">{getSectionTitle(r, "skills", "Skills")}</span>
              <span className="flex-1 border-b border-slate-300" />
            </div>
            {renderBulletSkills2Col(r.skills, update)}
          </section>
        )}

        {/* Experience */}
        {r.experience?.length > 0 && (
          <section data-rs-sec="experience" className="space-y-2">
            <div className="font-bold text-xs uppercase tracking-wider text-slate-900 flex items-center gap-2">
              <span data-rs-head="1">{getSectionTitle(r, "experience", "Experience")}</span>
              <span className="flex-1 border-b border-slate-300" />
            </div>
            <div className="space-y-3">
              {r.experience.map((e, i) => {
                const upd = makeExpUpdater(update, r, i);
                return (
                  <div key={i} className="grid grid-cols-[170px_1fr] gap-4">
                    <div>
                      <div className="text-[9.5px] text-slate-700 font-medium">
                        <Editable value={e.company} onChange={update && (v => upd({ company: v }))} />
                        {e.location && <span> | <Editable value={e.location} onChange={update && (v => upd({ location: v }))} /></span>}
                      </div>
                      <div className="font-bold text-[10.5px] text-black">
                        <Editable value={e.role} onChange={update && (v => upd({ role: v }))} />
                      </div>
                      <div className="text-[9px] italic text-slate-600">
                        <Editable value={e.start} onChange={update && (v => upd({ start: v }))} /> - <Editable value={e.end} onChange={update && (v => upd({ end: v }))} />
                      </div>
                    </div>
                    <div>
                      <BulletsEditor bullets={e.bullets || []} onChange={update && (v => upd({ bullets: v }))} className="list-disc pl-4 text-[10px] space-y-1 text-black" />
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* Leadership */}
        {r.leadership && r.leadership.length > 0 && (
          <section data-rs-sec="leadership" className="space-y-2">
            <div className="font-bold text-xs uppercase tracking-wider text-slate-900 flex items-center gap-2">
              <span data-rs-head="1">{getSectionTitle(r, "leadership", "Leadership Experience")}</span>
              <span className="flex-1 border-b border-slate-300" />
            </div>
            <div className="space-y-3">
              {r.leadership.map((l, i) => {
                const upd = makeLeadershipUpdater(update, r, i);
                return (
                  <div key={i} className="grid grid-cols-[170px_1fr] gap-4">
                    <div>
                      <div className="text-[9.5px] text-slate-700 font-medium">
                        <Editable value={l.organization} onChange={update && (v => upd({ organization: v }))} />
                        {l.location && <span> | <Editable value={l.location} onChange={update && (v => upd({ location: v }))} /></span>}
                      </div>
                      <div className="font-bold text-[10.5px] text-black">
                        <Editable value={l.role} onChange={update && (v => upd({ role: v }))} />
                      </div>
                      <div className="text-[9px] italic text-slate-600">
                        <Editable value={l.start || ""} onChange={update && (v => upd({ start: v }))} /> - <Editable value={l.end || ""} onChange={update && (v => upd({ end: v }))} />
                      </div>
                    </div>
                    <div>
                      <BulletsEditor bullets={l.bullets || []} onChange={update && (v => upd({ bullets: v }))} className="list-disc pl-4 text-[10px] space-y-1 text-black" />
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* Education and Training */}
        {r.education?.length > 0 && (
          <section data-rs-sec="education" className="space-y-1.5">
            <div className="font-bold text-xs uppercase tracking-wider text-slate-900 flex items-center gap-2">
              <span data-rs-head="1">{getSectionTitle(r, "education", "Education and Training")}</span>
              <span className="flex-1 border-b border-slate-300" />
            </div>
            <div className="space-y-2">
              {r.education.map((e, i) => {
                const upd = makeEduUpdater(update, r, i);
                return (
                  <div key={i} className="text-[10px]">
                    <div className="text-slate-700 font-medium">
                      <Editable value={e.school} onChange={update && (v => upd({ school: v }))} />
                      {e.location && <span> | <Editable value={e.location} onChange={update && (v => upd({ location: v }))} /></span>}
                    </div>
                    <div className="font-bold text-black">
                      <Editable value={e.degree} onChange={update && (v => upd({ degree: v }))} />
                    </div>
                    <div className="text-[9px] italic text-slate-600">
                      <Editable value={e.start || e.end} onChange={update && (v => upd({ start: v }))} />
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* Projects */}
        {r.projects?.length > 0 && (
          <section data-rs-sec="projects" className="space-y-1.5">
            <div className="font-bold text-xs uppercase tracking-wider text-slate-900 flex items-center gap-2">
              <span data-rs-head="1">{getSectionTitle(r, "projects", "Projects")}</span>
              <span className="flex-1 border-b border-slate-300" />
            </div>
            <div className="space-y-2">
              {r.projects.map((p, i) => {
                const upd = makeProjUpdater(update, r, i);
                return (
                  <div key={i} className="text-[10px]">
                    <div className="font-bold text-black"><Editable value={p.name} onChange={update && (v => upd({ name: v }))} /> <span className="font-normal text-slate-600">({p.tech})</span></div>
                    <BulletsEditor bullets={p.bullets || []} onChange={update && (v => upd({ bullets: v }))} className="list-disc pl-4 text-[10px] space-y-0.5 text-black" />
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* Certifications */}
        {r.certifications?.filter(Boolean).length > 0 && (
          <section data-rs-sec="certifications" className="space-y-1.5">
            <div className="font-bold text-xs uppercase tracking-wider text-slate-900 flex items-center gap-2">
              <span data-rs-head="1">{getSectionTitle(r, "certifications", "Certifications")}</span>
              <span className="flex-1 border-b border-slate-300" />
            </div>
            <div className="text-[10px] space-y-0.5">
              {r.certifications.map((c, i) => <div key={i}>• {c}</div>)}
            </div>
          </section>
        )}

        {/* Languages (Only if provided) */}
        {(() => {
          const langContent = renderLanguagesSection(r, "bg-[#2563eb]");
          if (!langContent) return null;
          return (
            <section data-rs-sec="languages" className="space-y-1.5">
              <div className="font-bold text-xs uppercase tracking-wider text-slate-900 flex items-center gap-2">
                <span data-rs-head="1">{getSectionTitle(r, "languages", "Languages")}</span>
                <span className="flex-1 border-b border-slate-300" />
              </div>
              {langContent}
            </section>
          );
        })()}
      </div>
    </div>
  );
}

/* 2. Emerald Left Timeline */
function EmeraldTimelinePreview({ r, update }: { r: ResumeData; update?: UpdateFn }) {
  const on = (patch: Partial<ResumeData>) => update?.(patch);
  const nameParts = (r.name || "").split(" ");
  const firstName = nameParts[0] || "";
  const restName = nameParts.slice(1).join(" ");

  return (
    <div className="bg-white text-black p-8 font-sans text-[10.5px] leading-snug w-full min-h-[var(--page-h,auto)] space-y-4">
      {/* Header */}
      <div className="space-y-1">
        <h1 className="text-3xl font-black tracking-wide">
          <span className="text-[#06b6d4]">{firstName}</span>{" "}
          <span className="text-[#059669]">{restName}</span>
        </h1>
        <div className="text-[9.5px] text-slate-700 flex items-center gap-2 flex-wrap">
          {r.location && <Editable value={r.location} onChange={update && (v => on({ location: v }))} />}
          {r.location && r.phone && <span>|</span>}
          {r.phone && <Editable value={r.phone} onChange={update && (v => on({ phone: v }))} />}
          {(r.location || r.phone) && r.email && <span>|</span>}
          {r.email && <Editable value={r.email} onChange={update && (v => on({ email: v }))} />}
        </div>
      </div>

      {/* Summary */}
      {r.summary?.trim() && (
        <section data-rs-sec="summary" className="space-y-1">
          <div data-rs-head="1" className="font-bold text-xs uppercase tracking-wider text-[#059669]">{getSectionTitle(r, "summary", "SUMMARY")}</div>
          <Editable as="p" multiline value={r.summary} onChange={update && (v => on({ summary: v }))} className="text-[10px] leading-relaxed text-black whitespace-pre-wrap" />
        </section>
      )}

      {/* Skills */}
      {r.skills?.some(s => (s.items || []).filter(Boolean).length > 0) && (
        <section data-rs-sec="skills" className="space-y-1.5">
          <div data-rs-head="1" className="font-bold text-xs uppercase tracking-wider text-[#059669]">{getSectionTitle(r, "skills", "SKILLS")}</div>
          {renderBulletSkills2Col(r.skills, update, "text-[#059669]")}
        </section>
      )}

      {/* Experience */}
      {r.experience?.length > 0 && (
        <section data-rs-sec="experience" className="space-y-2">
          <div data-rs-head="1" className="font-bold text-xs uppercase tracking-wider text-[#059669]">{getSectionTitle(r, "experience", "EXPERIENCE")}</div>
          <div className="space-y-3">
            {r.experience.map((e, i) => {
              const upd = makeExpUpdater(update, r, i);
              return (
                <div key={i} className="grid grid-cols-[115px_1fr] gap-3">
                  <div className="text-[9.5px] font-bold text-slate-900">
                    <Editable value={e.start} onChange={update && (v => upd({ start: v }))} /> - <Editable value={e.end} onChange={update && (v => upd({ end: v }))} />
                  </div>
                  <div className="space-y-0.5">
                    <div className="font-bold text-[10.5px] text-black">
                      <Editable value={e.role} onChange={update && (v => upd({ role: v }))} />
                    </div>
                    <div className="text-[9.5px] font-semibold text-slate-800">
                      <Editable value={e.company} onChange={update && (v => upd({ company: v }))} />
                      {e.location && <span className="font-normal text-slate-600"> - <Editable value={e.location} onChange={update && (v => upd({ location: v }))} /></span>}
                    </div>
                    <BulletsEditor bullets={e.bullets || []} onChange={update && (v => upd({ bullets: v }))} className="list-disc pl-4 text-[10px] space-y-0.5 text-black mt-1" />
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Education */}
      {r.education?.length > 0 && (
        <section data-rs-sec="education" className="space-y-1.5">
          <div data-rs-head="1" className="font-bold text-xs uppercase tracking-wider text-[#059669]">{getSectionTitle(r, "education", "EDUCATION AND TRAINING")}</div>
          <div className="space-y-2">
            {r.education.map((e, i) => {
              const upd = makeEduUpdater(update, r, i);
              return (
                <div key={i} className="grid grid-cols-[115px_1fr] gap-3 text-[10px]">
                  <div className="text-[9.5px] font-bold text-slate-900">
                    <Editable value={e.end || e.start} onChange={update && (v => upd({ end: v }))} />
                  </div>
                  <div>
                    <div className="font-bold text-black"><Editable value={e.degree} onChange={update && (v => upd({ degree: v }))} /></div>
                    <div className="text-[9.5px] font-semibold text-slate-800">
                      <Editable value={e.school} onChange={update && (v => upd({ school: v }))} />
                      {e.location && <span className="font-normal text-slate-600"> - <Editable value={e.location} onChange={update && (v => upd({ location: v }))} /></span>}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Leadership */}
      {r.leadership && r.leadership.length > 0 && (
        <section data-rs-sec="leadership" className="space-y-1.5">
          <div data-rs-head="1" className="font-bold text-xs uppercase tracking-wider text-[#059669]">{getSectionTitle(r, "leadership", "LEADERSHIP EXPERIENCE")}</div>
          <div className="space-y-2">
            {r.leadership.map((l, i) => {
              const upd = makeLeadershipUpdater(update, r, i);
              return (
                <div key={i} className="grid grid-cols-[115px_1fr] gap-3 text-[10px]">
                  <div className="text-[9.5px] font-bold text-slate-900">{l.start} - {l.end}</div>
                  <div>
                    <div className="font-bold text-black"><Editable value={l.role} onChange={update && (v => upd({ role: v }))} /></div>
                    <div className="text-[9.5px] font-semibold text-slate-800"><Editable value={l.organization} onChange={update && (v => upd({ organization: v }))} /></div>
                    <BulletsEditor bullets={l.bullets || []} onChange={update && (v => upd({ bullets: v }))} className="list-disc pl-4 text-[10px] space-y-0.5 text-black mt-0.5" />
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Projects */}
      {r.projects?.length > 0 && (
        <section data-rs-sec="projects" className="space-y-1.5">
          <div data-rs-head="1" className="font-bold text-xs uppercase tracking-wider text-[#059669]">{getSectionTitle(r, "projects", "PROJECTS")}</div>
          <div className="space-y-2">
            {r.projects.map((p, i) => {
              const upd = makeProjUpdater(update, r, i);
              return (
                <div key={i} className="text-[10px]">
                  <div className="font-bold text-black"><Editable value={p.name} onChange={update && (v => upd({ name: v }))} /> <span className="font-normal text-slate-600">({p.tech})</span></div>
                  <BulletsEditor bullets={p.bullets || []} onChange={update && (v => upd({ bullets: v }))} className="list-disc pl-4 text-[10px] space-y-0.5 text-black" />
                </div>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
}

/* 3. Hexagon Monogram Editorial Two-Column */
function HexagonEditorialPreview({ r, update }: { r: ResumeData; update?: UpdateFn }) {
  const on = (patch: Partial<ResumeData>) => update?.(patch);
  const initials = getInitials(r.name);

  return (
    <div className="bg-white text-black p-8 font-sans text-[10.5px] leading-snug w-full min-h-[var(--page-h,auto)] space-y-4">
      {/* Header with Hexagon Badge */}
      <div className="flex justify-between items-center pb-4 border-b border-slate-300">
        <div className="flex items-center gap-4">
          {initials && (
            <div className="relative h-16 w-16 flex items-center justify-center">
              <svg viewBox="0 0 100 100" className="absolute inset-0 h-full w-full stroke-[#2563eb] stroke-[3] fill-none">
                <polygon points="50 3, 93 25, 93 75, 50 97, 7 75, 7 25" />
              </svg>
              <span className="font-serif font-bold text-2xl text-[#2563eb] z-10">{initials}</span>
            </div>
          )}
          <div>
            <Editable as="h1" value={r.name || ""} onChange={update && (v => on({ name: v }))} className="font-serif text-3xl font-bold text-[#1d4ed8]" />
            {r.title && <Editable as="div" value={r.title} onChange={update && (v => on({ title: v }))} className="text-xs text-slate-600 mt-0.5" />}
          </div>
        </div>
        <div className="text-right text-[9.5px] text-slate-700 space-y-0.5">
          {r.email && <Editable as="div" value={r.email} onChange={update && (v => on({ email: v }))} />}
          {r.phone && <Editable as="div" value={r.phone} onChange={update && (v => on({ phone: v }))} />}
          {r.location && <Editable as="div" value={r.location} onChange={update && (v => on({ location: v }))} />}
        </div>
      </div>

      {/* Two Column Layout */}
      <div className="grid grid-cols-[0.38fr_0.62fr] gap-6">
        {/* Left Column */}
        <div className="space-y-4">
          {r.summary?.trim() && (
            <section data-rs-sec="summary" className="space-y-1.5">
              <h3 data-rs-head="1" className="font-serif font-bold text-sm text-[#1d4ed8] border-b border-slate-200 pb-1">{getSectionTitle(r, "summary", "Summary")}</h3>
              <Editable as="p" multiline value={r.summary} onChange={update && (v => on({ summary: v }))} className="text-[10px] leading-relaxed text-black whitespace-pre-wrap" />
            </section>
          )}

          {r.skills?.some(s => (s.items || []).filter(Boolean).length > 0) && (
            <section data-rs-sec="skills" className="space-y-1.5">
              <h3 data-rs-head="1" className="font-serif font-bold text-sm text-[#1d4ed8] border-b border-slate-200 pb-1">{getSectionTitle(r, "skills", "Skills")}</h3>
              <ul className="space-y-1 text-[10px] text-black">
                {(r.skills?.flatMap(s => s.items) || []).filter(Boolean).map((sk, i) => (
                  <li key={i} className="flex items-start gap-1.5">
                    <span className="text-[#2563eb]">•</span>
                    <span>{sk}</span>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {r.education?.length > 0 && (
            <section data-rs-sec="education" className="space-y-1.5">
              <h3 data-rs-head="1" className="font-serif font-bold text-sm text-[#1d4ed8] border-b border-slate-200 pb-1">{getSectionTitle(r, "education", "Education and Training")}</h3>
              {r.education.map((e, i) => {
                const upd = makeEduUpdater(update, r, i);
                return (
                  <div key={i} className="text-[10px] space-y-0.5">
                    <div className="font-bold text-black"><Editable value={e.degree} onChange={update && (v => upd({ degree: v }))} /></div>
                    <div className="text-slate-700"><Editable value={e.school} onChange={update && (v => upd({ school: v }))} /></div>
                    <div className="text-slate-500 text-[9px]"><Editable value={e.location} onChange={update && (v => upd({ location: v }))} /></div>
                    <div className="text-slate-600 font-semibold text-[9px]"><Editable value={e.end || e.start} onChange={update && (v => upd({ end: v }))} /></div>
                  </div>
                );
              })}
            </section>
          )}
        </div>

        {/* Right Column */}
        <div className="space-y-4">
          {r.experience?.length > 0 && (
            <section data-rs-sec="experience" className="space-y-2">
              <h3 data-rs-head="1" className="font-serif font-bold text-sm text-[#1d4ed8] border-b border-slate-200 pb-1">{getSectionTitle(r, "experience", "Experience")}</h3>
              <div className="space-y-3">
                {r.experience.map((e, i) => {
                  const upd = makeExpUpdater(update, r, i);
                  return (
                    <div key={i} className="space-y-1">
                      <div className="font-bold text-[11px] uppercase tracking-wide text-black">
                        <Editable value={e.company} onChange={update && (v => upd({ company: v }))} />
                      </div>
                      <div className="flex justify-between items-center text-[10px] text-slate-700 italic">
                        <span><Editable value={e.role} onChange={update && (v => upd({ role: v }))} /> | <Editable value={e.location} onChange={update && (v => upd({ location: v }))} /></span>
                        <span className="not-italic font-medium text-slate-800"><Editable value={e.start} onChange={update && (v => upd({ start: v }))} /> to <Editable value={e.end} onChange={update && (v => upd({ end: v }))} /></span>
                      </div>
                      <BulletsEditor bullets={e.bullets || []} onChange={update && (v => upd({ bullets: v }))} className="list-disc pl-4 text-[10px] space-y-0.5 text-black" />
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          {r.leadership && r.leadership.length > 0 && (
            <section data-rs-sec="leadership" className="space-y-2">
              <h3 data-rs-head="1" className="font-serif font-bold text-sm text-[#1d4ed8] border-b border-slate-200 pb-1">{getSectionTitle(r, "leadership", "Leadership Experience")}</h3>
              <div className="space-y-3">
                {r.leadership.map((l, i) => {
                  const upd = makeLeadershipUpdater(update, r, i);
                  return (
                    <div key={i} className="space-y-1">
                      <div className="font-bold text-[11px] uppercase tracking-wide text-black">
                        <Editable value={l.organization} onChange={update && (v => upd({ organization: v }))} />
                      </div>
                      <div className="flex justify-between items-center text-[10px] text-slate-700 italic">
                        <span><Editable value={l.role} onChange={update && (v => upd({ role: v }))} /></span>
                        <span className="not-italic font-medium text-slate-800"><Editable value={l.start || ""} onChange={update && (v => upd({ start: v }))} /> to <Editable value={l.end || ""} onChange={update && (v => upd({ end: v }))} /></span>
                      </div>
                      <BulletsEditor bullets={l.bullets || []} onChange={update && (v => upd({ bullets: v }))} className="list-disc pl-4 text-[10px] space-y-0.5 text-black" />
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          {/* Languages (Only if provided) */}
          {(() => {
            const langContent = renderLanguagesSection(r, "bg-[#2563eb]");
            if (!langContent) return null;
            return (
              <section data-rs-sec="languages" className="space-y-1.5 pt-2 border-t border-slate-200">
                <h3 data-rs-head="1" className="font-serif font-bold text-sm text-[#1d4ed8] pb-1">{getSectionTitle(r, "languages", "Languages")}</h3>
                {langContent}
              </section>
            );
          })()}
        </div>
      </div>
    </div>
  );
}

/* 4. Slate Node Timeline Spine */
function SlateNodeTimelinePreview({ r, update }: { r: ResumeData; update?: UpdateFn }) {
  const on = (patch: Partial<ResumeData>) => update?.(patch);

  return (
    <div className="bg-white text-black font-sans text-[10.5px] leading-snug w-full min-h-[var(--page-h,auto)]">
      {/* Dark Slate Top Bar */}
      <div className="bg-[#334155] h-5 w-full" />
      <div className="p-8 space-y-3">
        {/* Name Header */}
        <div className="text-center">
          <Editable as="h1" value={r.name || ""} onChange={update && (v => on({ name: v }))} className="text-3xl font-extrabold tracking-wider uppercase text-slate-900" />
          <div className="text-[10px] text-slate-600 text-center py-2 border-y border-slate-200 mt-2 flex justify-center items-center gap-3">
            {r.location && <Editable value={r.location} onChange={update && (v => on({ location: v }))} />}
            {r.location && r.phone && <span>•</span>}
            {r.phone && <Editable value={r.phone} onChange={update && (v => on({ phone: v }))} />}
            {(r.location || r.phone) && r.email && <span>•</span>}
            {r.email && <Editable value={r.email} onChange={update && (v => on({ email: v }))} />}
          </div>
        </div>

        {/* Dual Column with Dot Spine */}
        <div className="grid grid-cols-[0.62fr_0.38fr] gap-8 pt-3 relative">
          {/* Left Column */}
          <div className="space-y-4 pr-4">
            {r.summary?.trim() && (
              <section data-rs-sec="summary" className="space-y-1">
                <h3 data-rs-head="1" className="font-bold text-xs uppercase tracking-wider text-slate-900">{getSectionTitle(r, "summary", "SUMMARY")}</h3>
                <Editable as="p" multiline value={r.summary} onChange={update && (v => on({ summary: v }))} className="text-[10px] leading-relaxed text-black whitespace-pre-wrap" />
              </section>
            )}

            {r.experience?.length > 0 && (
              <section data-rs-sec="experience" className="space-y-2">
                <h3 data-rs-head="1" className="font-bold text-xs uppercase tracking-wider text-slate-900">{getSectionTitle(r, "experience", "EXPERIENCE")}</h3>
                <div className="space-y-3">
                  {r.experience.map((e, i) => {
                    const upd = makeExpUpdater(update, r, i);
                    return (
                      <div key={i} className="space-y-0.5">
                        <div className="font-bold text-[10.5px] text-black">
                          <Editable value={e.role} onChange={update && (v => upd({ role: v }))} />, <span className="font-normal text-slate-700">{e.start} - {e.end}</span>
                        </div>
                        <div className="font-semibold text-slate-900 text-[10px]">
                          <Editable value={e.company} onChange={update && (v => upd({ company: v }))} /> - <Editable value={e.location} onChange={update && (v => upd({ location: v }))} />
                        </div>
                        <BulletsEditor bullets={e.bullets || []} onChange={update && (v => upd({ bullets: v }))} className="list-disc pl-4 text-[10px] space-y-0.5 text-black" />
                      </div>
                    );
                  })}
                </div>
              </section>
            )}

            {r.leadership && r.leadership.length > 0 && (
              <section data-rs-sec="leadership" className="space-y-2">
                <h3 data-rs-head="1" className="font-bold text-xs uppercase tracking-wider text-slate-900">{getSectionTitle(r, "leadership", "LEADERSHIP EXPERIENCE")}</h3>
                <div className="space-y-3">
                  {r.leadership.map((l, i) => {
                    const upd = makeLeadershipUpdater(update, r, i);
                    return (
                      <div key={i} className="space-y-0.5">
                        <div className="font-bold text-[10.5px] text-black">
                          <Editable value={l.role} onChange={update && (v => upd({ role: v }))} />
                        </div>
                        <div className="font-semibold text-slate-900 text-[10px]">
                          <Editable value={l.organization} onChange={update && (v => upd({ organization: v }))} />
                        </div>
                        <BulletsEditor bullets={l.bullets || []} onChange={update && (v => upd({ bullets: v }))} className="list-disc pl-4 text-[10px] space-y-0.5 text-black" />
                      </div>
                    );
                  })}
                </div>
              </section>
            )}

            {(() => {
              const langContent = renderLanguagesSection(r, "bg-[#334155]");
              if (!langContent) return null;
              return (
                <section data-rs-sec="languages" className="space-y-1 pt-2">
                  <h3 data-rs-head="1" className="font-bold text-xs uppercase tracking-wider text-slate-900">{getSectionTitle(r, "languages", "LANGUAGES")}</h3>
                  {langContent}
                </section>
              );
            })()}
          </div>

          {/* Right Column with Spine Border */}
          <div className="border-l-2 border-slate-300 pl-6 space-y-4 relative">
            {r.skills?.some(s => (s.items || []).filter(Boolean).length > 0) && (
              <section data-rs-sec="skills" className="space-y-1.5">
                <div className="absolute -left-[5px] top-1.5 h-2 w-2 rounded-full bg-slate-700" />
                <h3 data-rs-head="1" className="font-bold text-xs uppercase tracking-wider text-slate-900">{getSectionTitle(r, "skills", "SKILLS")}</h3>
                <ul className="space-y-1 text-[10px] text-black">
                  {(r.skills?.flatMap(s => s.items) || []).filter(Boolean).map((sk, i) => (
                    <li key={i} className="flex items-start gap-1.5">
                      <span className="text-slate-800">•</span>
                      <span>{sk}</span>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {r.education?.length > 0 && (
              <section data-rs-sec="education" className="space-y-1.5 relative pt-2">
                <div className="absolute -left-[31px] top-3.5 h-2 w-2 rounded-full bg-slate-700" />
                <h3 data-rs-head="1" className="font-bold text-xs uppercase tracking-wider text-slate-900">{getSectionTitle(r, "education", "EDUCATION AND TRAINING")}</h3>
                {r.education.map((e, i) => {
                  const upd = makeEduUpdater(update, r, i);
                  return (
                    <div key={i} className="text-[10px] space-y-0.5">
                      <div className="font-bold text-black"><Editable value={e.degree} onChange={update && (v => upd({ degree: v }))} />, {e.end || e.start}</div>
                      <div className="font-semibold text-slate-800"><Editable value={e.school} onChange={update && (v => upd({ school: v }))} /> - <Editable value={e.location} onChange={update && (v => upd({ location: v }))} /></div>
                    </div>
                  );
                })}
              </section>
            )}

            {r.projects?.length > 0 && (
              <section data-rs-sec="projects" className="space-y-1.5 relative pt-2">
                <h3 data-rs-head="1" className="font-bold text-xs uppercase tracking-wider text-slate-900">{getSectionTitle(r, "projects", "PROJECTS")}</h3>
                {r.projects.map((p, i) => {
                  const upd = makeProjUpdater(update, r, i);
                  return (
                    <div key={i} className="text-[10px] space-y-0.5">
                      <div className="font-bold text-black"><Editable value={p.name} onChange={update && (v => upd({ name: v }))} /></div>
                      <BulletsEditor bullets={p.bullets || []} onChange={update && (v => upd({ bullets: v }))} className="list-disc pl-4 text-[10px] space-y-0.5 text-black" />
                    </div>
                  );
                })}
              </section>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/* 5. Centered Minimalist Dual-Column */
function CenteredDualColumnPreview({ r, update }: { r: ResumeData; update?: UpdateFn }) {
  const on = (patch: Partial<ResumeData>) => update?.(patch);

  return (
    <div className="bg-white text-black p-8 font-sans text-[10.5px] leading-snug w-full min-h-[var(--page-h,auto)] space-y-4">
      {/* Header */}
      <div className="text-center pt-2">
        <Editable as="h1" value={r.name || ""} onChange={update && (v => on({ name: v }))} className="text-3xl font-extrabold tracking-tight text-slate-900" />
        <div className="text-[9.5px] text-slate-600 text-center py-2 border-y border-slate-200 mt-2 flex justify-center items-center gap-2">
          {r.email && <Editable value={r.email} onChange={update && (v => on({ email: v }))} />}
          {r.email && r.phone && <span>/</span>}
          {r.phone && <Editable value={r.phone} onChange={update && (v => on({ phone: v }))} />}
          {(r.email || r.phone) && r.location && <span>/</span>}
          {r.location && <Editable value={r.location} onChange={update && (v => on({ location: v }))} />}
        </div>
      </div>

      {/* Dual Column Layout */}
      <div className="grid grid-cols-2 gap-6 pt-2">
        {/* Left Column */}
        <div className="space-y-4">
          {r.summary?.trim() && (
            <section data-rs-sec="summary" className="space-y-1">
              <h3 data-rs-head="1" className="font-bold text-xs text-slate-900">{getSectionTitle(r, "summary", "Summary")}</h3>
              <Editable as="p" multiline value={r.summary} onChange={update && (v => on({ summary: v }))} className="text-[10px] leading-relaxed text-black whitespace-pre-wrap" />
            </section>
          )}

          {r.experience?.length > 0 && (
            <section data-rs-sec="experience" className="space-y-2">
              <h3 data-rs-head="1" className="font-bold text-xs text-slate-900">{getSectionTitle(r, "experience", "Experience")}</h3>
              <div className="space-y-3">
                {r.experience.map((e, i) => {
                  const upd = makeExpUpdater(update, r, i);
                  return (
                    <div key={i} className="space-y-0.5">
                      <div className="flex justify-between items-center text-[10.5px]">
                        <span className="font-bold text-black"><Editable value={e.company} onChange={update && (v => upd({ company: v }))} /> - <Editable value={e.role} onChange={update && (v => upd({ role: v }))} /></span>
                        <span className="text-[9px] italic text-slate-600">{e.start} - {e.end}</span>
                      </div>
                      <div className="text-[9.5px] text-slate-700"><Editable value={e.location} onChange={update && (v => upd({ location: v }))} /></div>
                      <BulletsEditor bullets={e.bullets || []} onChange={update && (v => upd({ bullets: v }))} className="list-disc pl-4 text-[10px] space-y-0.5 text-black" />
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          {r.leadership && r.leadership.length > 0 && (
            <section data-rs-sec="leadership" className="space-y-2">
              <h3 data-rs-head="1" className="font-bold text-xs text-slate-900">{getSectionTitle(r, "leadership", "Leadership Experience")}</h3>
              <div className="space-y-3">
                {r.leadership.map((l, i) => {
                  const upd = makeLeadershipUpdater(update, r, i);
                  return (
                    <div key={i} className="space-y-0.5">
                      <div className="font-bold text-black"><Editable value={l.role} onChange={update && (v => upd({ role: v }))} /> - <Editable value={l.organization} onChange={update && (v => upd({ organization: v }))} /></div>
                      <BulletsEditor bullets={l.bullets || []} onChange={update && (v => upd({ bullets: v }))} className="list-disc pl-4 text-[10px] space-y-0.5 text-black" />
                    </div>
                  );
                })}
              </div>
            </section>
          )}
        </div>

        {/* Right Column */}
        <div className="space-y-4">
          {r.skills?.some(s => (s.items || []).filter(Boolean).length > 0) && (
            <section data-rs-sec="skills" className="space-y-1">
              <h3 data-rs-head="1" className="font-bold text-xs text-slate-900">{getSectionTitle(r, "skills", "Skills")}</h3>
              <ul className="space-y-1 text-[10px] text-black">
                {(r.skills?.flatMap(s => s.items) || []).filter(Boolean).map((sk, i) => (
                  <li key={i} className="flex items-start gap-1.5">
                    <span>•</span>
                    <span>{sk}</span>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {r.education?.length > 0 && (
            <section data-rs-sec="education" className="space-y-1">
              <h3 data-rs-head="1" className="font-bold text-xs text-slate-900">{getSectionTitle(r, "education", "Education and Training")}</h3>
              {r.education.map((e, i) => {
                const upd = makeEduUpdater(update, r, i);
                return (
                  <div key={i} className="text-[10px] space-y-0.5">
                    <div className="text-[9px] italic text-slate-600">{e.end || e.start}</div>
                    <div className="font-bold text-black"><Editable value={e.school} onChange={update && (v => upd({ school: v }))} /></div>
                    <div className="text-slate-700"><Editable value={e.location} onChange={update && (v => upd({ location: v }))} /></div>
                    <div className="font-semibold text-slate-900"><Editable value={e.degree} onChange={update && (v => upd({ degree: v }))} /></div>
                  </div>
                );
              })}
            </section>
          )}

          {r.projects?.length > 0 && (
            <section data-rs-sec="projects" className="space-y-1">
              <h3 data-rs-head="1" className="font-bold text-xs text-slate-900">{getSectionTitle(r, "projects", "Projects")}</h3>
              {r.projects.map((p, i) => {
                const upd = makeProjUpdater(update, r, i);
                return (
                  <div key={i} className="text-[10px] space-y-0.5">
                    <div className="font-bold text-black"><Editable value={p.name} onChange={update && (v => upd({ name: v }))} /></div>
                    <BulletsEditor bullets={p.bullets || []} onChange={update && (v => upd({ bullets: v }))} className="list-disc pl-4 text-[10px] space-y-0.5 text-black" />
                  </div>
                );
              })}
            </section>
          )}

          {(() => {
            const langContent = renderLanguagesSection(r, "bg-slate-800");
            if (!langContent) return null;
            return (
              <section data-rs-sec="languages" className="space-y-1 pt-2">
                <h3 data-rs-head="1" className="font-bold text-xs text-slate-900">{getSectionTitle(r, "languages", "Languages")}</h3>
                {langContent}
              </section>
            );
          })()}
        </div>
      </div>
    </div>
  );
}

/* 6. Teal Duo-Tone Executive */
function TealDuoBannerPreview({ r, update }: { r: ResumeData; update?: UpdateFn }) {
  const on = (patch: Partial<ResumeData>) => update?.(patch);

  return (
    <div className="bg-white text-black font-sans text-[10.5px] leading-snug w-full min-h-[var(--page-h,auto)]">
      {/* Top Banner */}
      <div className="bg-[#374151] text-white py-3 px-6 text-center text-[10px] flex justify-center items-center gap-6">
        {r.location && <Editable value={r.location} onChange={update && (v => on({ location: v }))} />}
        {r.location && r.phone && <span>|</span>}
        {r.phone && <Editable value={r.phone} onChange={update && (v => on({ phone: v }))} />}
        {(r.location || r.phone) && r.email && <span>|</span>}
        {r.email && <Editable value={r.email} onChange={update && (v => on({ email: v }))} />}
      </div>
      <div className="h-2 bg-[#0d9488] w-full" />

      {/* Name Title */}
      <div className="p-8 space-y-4">
        <div className="text-center py-2">
          <Editable as="h1" value={r.name || ""} onChange={update && (v => on({ name: v }))} className="text-3xl font-light tracking-wide text-slate-900" />
        </div>

        {/* Section Row Layout */}
        <div className="space-y-4 divide-y divide-slate-200">
          {r.summary?.trim() && (
            <div data-rs-sec="summary" className="grid grid-cols-[130px_1fr] gap-4 pt-3">
              <div data-rs-head="1" className="font-bold text-xs text-slate-900">{getSectionTitle(r, "summary", "Summary")}</div>
              <Editable as="p" multiline value={r.summary} onChange={update && (v => on({ summary: v }))} className="text-[10px] leading-relaxed text-black whitespace-pre-wrap" />
            </div>
          )}

          {r.skills?.some(s => (s.items || []).filter(Boolean).length > 0) && (
            <div data-rs-sec="skills" className="grid grid-cols-[130px_1fr] gap-4 pt-3">
              <div data-rs-head="1" className="font-bold text-xs text-slate-900">{getSectionTitle(r, "skills", "Skills")}</div>
              <div>{renderBulletSkills2Col(r.skills, update, "text-[#0d9488]")}</div>
            </div>
          )}

          {r.experience?.length > 0 && (
            <div data-rs-sec="experience" className="grid grid-cols-[130px_1fr] gap-4 pt-3">
              <div data-rs-head="1" className="font-bold text-xs text-slate-900">{getSectionTitle(r, "experience", "Experience")}</div>
              <div className="space-y-3">
                {r.experience.map((e, i) => {
                  const upd = makeExpUpdater(update, r, i);
                  return (
                    <div key={i} className="space-y-0.5">
                      <div className="font-bold text-[10.5px] text-black">
                        <Editable value={e.role} onChange={update && (v => upd({ role: v }))} /> <span className="font-normal text-slate-700">{e.start} - {e.end}</span>
                      </div>
                      <div className="font-bold text-slate-800 text-[10px]">
                        <Editable value={e.company} onChange={update && (v => upd({ company: v }))} />, <Editable value={e.location} onChange={update && (v => upd({ location: v }))} />
                      </div>
                      <BulletsEditor bullets={e.bullets || []} onChange={update && (v => upd({ bullets: v }))} className="list-disc pl-4 text-[10px] space-y-0.5 text-black mt-1" />
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {r.education?.length > 0 && (
            <div data-rs-sec="education" className="grid grid-cols-[130px_1fr] gap-4 pt-3">
              <div data-rs-head="1" className="font-bold text-xs text-slate-900">{getSectionTitle(r, "education", "Education and Training")}</div>
              <div className="space-y-2">
                {r.education.map((e, i) => {
                  const upd = makeEduUpdater(update, r, i);
                  return (
                    <div key={i} className="text-[10px] space-y-0.5">
                      <div className="font-bold text-black"><Editable value={e.degree} onChange={update && (v => upd({ degree: v }))} />, {e.end || e.start}</div>
                      <div className="text-slate-800 font-semibold"><Editable value={e.school} onChange={update && (v => upd({ school: v }))} />, <Editable value={e.location} onChange={update && (v => upd({ location: v }))} /></div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {(() => {
            const langContent = renderLanguagesSection(r, "bg-[#0d9488]");
            if (!langContent) return null;
            return (
              <div data-rs-sec="languages" className="grid grid-cols-[130px_1fr] gap-4 pt-3">
                <div data-rs-head="1" className="font-bold text-xs text-slate-900">{getSectionTitle(r, "languages", "Languages")}</div>
                <div>{langContent}</div>
              </div>
            );
          })()}
        </div>
      </div>
    </div>
  );
}

/* 7. Warm Taupe Executive Split */
function TaupeHeaderSplitPreview({ r, update }: { r: ResumeData; update?: UpdateFn }) {
  const on = (patch: Partial<ResumeData>) => update?.(patch);

  return (
    <div className="bg-white text-black font-sans text-[10.5px] leading-snug w-full min-h-[var(--page-h,auto)]">
      {/* Warm Taupe Header */}
      <div className="bg-[#a89689] text-white p-7 flex justify-between items-center">
        <div>
          <Editable as="h1" value={r.name || ""} onChange={update && (v => on({ name: v }))} className="text-3xl font-extrabold tracking-widest uppercase text-white" />
          {r.title && <Editable as="div" value={r.title} onChange={update && (v => on({ title: v }))} className="text-xs text-white/90 mt-0.5" />}
        </div>
        <div className="text-right text-[9.5px] text-white/95 space-y-0.5">
          {r.email && <Editable as="div" value={r.email} onChange={update && (v => on({ email: v }))} />}
          {r.phone && <Editable as="div" value={r.phone} onChange={update && (v => on({ phone: v }))} />}
          {r.location && <Editable as="div" value={r.location} onChange={update && (v => on({ location: v }))} />}
        </div>
      </div>

      {/* Body with Left Column Titles */}
      <div className="p-7 space-y-4">
        {r.summary?.trim() && (
          <div data-rs-sec="summary" className="grid grid-cols-[130px_1fr] gap-5">
            <div data-rs-head="1" className="font-bold text-xs uppercase tracking-wider text-[#a89689] text-right pr-4 border-r border-slate-300">{getSectionTitle(r, "summary", "SUMMARY")}</div>
            <Editable as="p" multiline value={r.summary} onChange={update && (v => on({ summary: v }))} className="text-[10px] leading-relaxed text-black whitespace-pre-wrap" />
          </div>
        )}

        {r.skills?.some(s => (s.items || []).filter(Boolean).length > 0) && (
          <div data-rs-sec="skills" className="grid grid-cols-[130px_1fr] gap-5">
            <div data-rs-head="1" className="font-bold text-xs uppercase tracking-wider text-[#a89689] text-right pr-4 border-r border-slate-300">{getSectionTitle(r, "skills", "SKILLS")}</div>
            <div>{renderBulletSkills2Col(r.skills, update, "text-[#a89689]")}</div>
          </div>
        )}

        {r.experience?.length > 0 && (
          <div data-rs-sec="experience" className="grid grid-cols-[130px_1fr] gap-5">
            <div data-rs-head="1" className="font-bold text-xs uppercase tracking-wider text-[#a89689] text-right pr-4 border-r border-slate-300">{getSectionTitle(r, "experience", "EXPERIENCE")}</div>
            <div className="space-y-3">
              {r.experience.map((e, i) => {
                const upd = makeExpUpdater(update, r, i);
                return (
                  <div key={i} className="space-y-0.5">
                    <div className="font-bold text-[10.5px] uppercase tracking-wide text-black">
                      <Editable value={e.role} onChange={update && (v => upd({ role: v }))} /> | <span className="font-normal text-slate-700">{e.start} to {e.end}</span>
                    </div>
                    <div className="font-semibold text-slate-800 text-[10px]">
                      <Editable value={e.company} onChange={update && (v => upd({ company: v }))} /> - <Editable value={e.location} onChange={update && (v => upd({ location: v }))} />
                    </div>
                    <BulletsEditor bullets={e.bullets || []} onChange={update && (v => upd({ bullets: v }))} className="list-disc pl-4 text-[10px] space-y-0.5 text-black" />
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {r.education?.length > 0 && (
          <div data-rs-sec="education" className="grid grid-cols-[130px_1fr] gap-5">
            <div data-rs-head="1" className="font-bold text-xs uppercase tracking-wider text-[#a89689] text-right pr-4 border-r border-slate-300">{getSectionTitle(r, "education", "EDUCATION AND TRAINING")}</div>
            <div className="space-y-2">
              {r.education.map((e, i) => {
                const upd = makeEduUpdater(update, r, i);
                return (
                  <div key={i} className="text-[10px] space-y-0.5">
                    <div className="text-slate-800 font-semibold"><Editable value={e.school} onChange={update && (v => upd({ school: v }))} /> - <Editable value={e.location} onChange={update && (v => upd({ location: v }))} /></div>
                    <div className="font-bold text-black"><Editable value={e.degree} onChange={update && (v => upd({ degree: v }))} /></div>
                    <div className="text-slate-600 text-[9px]">{e.end || e.start}</div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {(() => {
          const langContent = renderLanguagesSection(r, "bg-[#a89689]");
          if (!langContent) return null;
          return (
            <div data-rs-sec="languages" className="grid grid-cols-[130px_1fr] gap-5">
              <div data-rs-head="1" className="font-bold text-xs uppercase tracking-wider text-[#a89689] text-right pr-4 border-r border-slate-300">{getSectionTitle(r, "languages", "LANGUAGES")}</div>
              <div>{langContent}</div>
            </div>
          );
        })()}
      </div>
    </div>
  );
}

/* 8. Amber Gold Ribbon Classic */
function AmberRibbonPreview({ r, update }: { r: ResumeData; update?: UpdateFn }) {
  const on = (patch: Partial<ResumeData>) => update?.(patch);
  const nameParts = (r.name || "").split(" ");
  const first = nameParts[0] || "";
  const rest = nameParts.slice(1).join(" ");

  return (
    <div className="bg-white text-black font-sans text-[10.5px] leading-snug w-full min-h-[var(--page-h,auto)]">
      {/* Amber Golden Ribbon */}
      <div className="bg-[#fbbf24] h-7 w-full" />
      <div className="p-8 space-y-3.5">
        {/* Name Header */}
        <div className="text-center">
          <h1 className="text-3xl font-black tracking-wide">
            <span className="text-slate-700">{first}</span>{" "}
            <span className="text-[#7f1d1d]">{rest}</span>
          </h1>
          <div className="text-[9.5px] text-slate-600 text-center mt-1 flex justify-center items-center gap-2">
            {r.location && <Editable value={r.location} onChange={update && (v => on({ location: v }))} />}
            {r.location && r.phone && <span>|</span>}
            {r.phone && <Editable value={r.phone} onChange={update && (v => on({ phone: v }))} />}
            {(r.location || r.phone) && r.email && <span>|</span>}
            {r.email && <Editable value={r.email} onChange={update && (v => on({ email: v }))} />}
          </div>
        </div>

        {/* Sections */}
        {r.summary?.trim() && (
          <section data-rs-sec="summary" className="space-y-1">
            <h3 data-rs-head="1" className="font-bold text-xs text-[#7f1d1d] border-b border-slate-200 pb-0.5">{getSectionTitle(r, "summary", "Summary")}</h3>
            <Editable as="p" multiline value={r.summary} onChange={update && (v => on({ summary: v }))} className="text-[10px] leading-relaxed text-black whitespace-pre-wrap" />
          </section>
        )}

        {r.skills?.some(s => (s.items || []).filter(Boolean).length > 0) && (
          <section data-rs-sec="skills" className="space-y-1">
            <h3 data-rs-head="1" className="font-bold text-xs text-[#7f1d1d] border-b border-slate-200 pb-0.5">{getSectionTitle(r, "skills", "Skills")}</h3>
            {renderBulletSkills2Col(r.skills, update, "text-[#7f1d1d]")}
          </section>
        )}

        {r.experience?.length > 0 && (
          <section data-rs-sec="experience" className="space-y-2">
            <h3 data-rs-head="1" className="font-bold text-xs text-[#7f1d1d] border-b border-slate-200 pb-0.5">{getSectionTitle(r, "experience", "Experience")}</h3>
            <div className="space-y-3">
              {r.experience.map((e, i) => {
                const upd = makeExpUpdater(update, r, i);
                return (
                  <div key={i} className="space-y-0.5">
                    <div className="flex justify-between items-center text-[10.5px]">
                      <span className="font-bold text-black"><Editable value={e.role} onChange={update && (v => upd({ role: v }))} /></span>
                      <span className="text-[9.5px] text-slate-700">{e.start} to {e.end}</span>
                    </div>
                    <div className="font-bold text-slate-900 text-[10px]">
                      <Editable value={e.company} onChange={update && (v => upd({ company: v }))} /> — <Editable value={e.location} onChange={update && (v => upd({ location: v }))} />
                    </div>
                    <BulletsEditor bullets={e.bullets || []} onChange={update && (v => upd({ bullets: v }))} className="list-disc pl-4 text-[10px] space-y-0.5 text-black" />
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {r.education?.length > 0 && (
          <section data-rs-sec="education" className="space-y-1.5">
            <h3 data-rs-head="1" className="font-bold text-xs text-[#7f1d1d] border-b border-slate-200 pb-0.5">{getSectionTitle(r, "education", "Education and Training")}</h3>
            <div className="space-y-2">
              {r.education.map((e, i) => {
                const upd = makeEduUpdater(update, r, i);
                return (
                  <div key={i} className="text-[10px] space-y-0.5">
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-black"><Editable value={e.degree} onChange={update && (v => upd({ degree: v }))} /></span>
                      <span className="text-[9px] text-slate-600">{e.end || e.start}</span>
                    </div>
                    <div className="text-slate-800"><Editable value={e.school} onChange={update && (v => upd({ school: v }))} /> — <Editable value={e.location} onChange={update && (v => upd({ location: v }))} /></div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {(() => {
          const langContent = renderLanguagesSection(r, "bg-[#fbbf24]");
          if (!langContent) return null;
          return (
            <section data-rs-sec="languages" className="space-y-1">
              <h3 data-rs-head="1" className="font-bold text-xs text-[#7f1d1d] border-b border-slate-200 pb-0.5">{getSectionTitle(r, "languages", "Languages")}</h3>
              {langContent}
            </section>
          );
        })()}
      </div>
    </div>
  );
}

/* 9. Slate Frame Modern Sidebar */
function SlateFrameSidebarPreview({ r, update }: { r: ResumeData; update?: UpdateFn }) {
  const on = (patch: Partial<ResumeData>) => update?.(patch);

  return (
    <div className="bg-white text-black p-6 font-sans text-[10px] leading-snug w-full min-h-[var(--page-h,auto)]">
      <div className="border-[8px] border-[#475569] p-6 min-h-[1050px]">
        <div className="grid grid-cols-[0.34fr_0.66fr] gap-6">
          {/* Left Sidebar */}
          <div className="space-y-4 pr-4 border-r border-slate-200">
            <div className="space-y-1 text-[9.5px] text-slate-800 font-medium">
              {r.email && <Editable as="div" value={r.email} onChange={update && (v => on({ email: v }))} />}
              {r.phone && <Editable as="div" value={r.phone} onChange={update && (v => on({ phone: v }))} />}
              {r.location && <Editable as="div" value={r.location} onChange={update && (v => on({ location: v }))} />}
            </div>

            {r.skills?.some(s => (s.items || []).filter(Boolean).length > 0) && (
              <section data-rs-sec="skills" className="space-y-1.5">
                <h3 data-rs-head="1" className="font-bold text-xs text-slate-900">{getSectionTitle(r, "skills", "Skills")}</h3>
                <ul className="space-y-1 text-[9.5px] text-black">
                  {(r.skills?.flatMap(s => s.items) || []).filter(Boolean).map((sk, i) => (
                    <li key={i} className="flex items-start gap-1">
                      <span>•</span>
                      <span>{sk}</span>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {r.education?.length > 0 && (
              <section data-rs-sec="education" className="space-y-1">
                <h3 data-rs-head="1" className="font-bold text-xs text-slate-900">{getSectionTitle(r, "education", "Education and Training")}</h3>
                {r.education.map((e, i) => {
                  const upd = makeEduUpdater(update, r, i);
                  return (
                    <div key={i} className="text-[9.5px] space-y-0.5">
                      <div className="italic text-slate-600 text-[8.5px]">{e.end || e.start}</div>
                      <div className="font-bold text-black"><Editable value={e.degree} onChange={update && (v => upd({ degree: v }))} /></div>
                      <div className="font-semibold text-slate-800"><Editable value={e.school} onChange={update && (v => upd({ school: v }))} /></div>
                      {e.location && <div className="text-slate-600 text-[8.5px]"><Editable value={e.location} onChange={update && (v => upd({ location: v }))} /></div>}
                    </div>
                  );
                })}
              </section>
            )}

            {(() => {
              const langContent = renderLanguagesSection(r, "bg-[#475569]");
              if (!langContent) return null;
              return (
                <section data-rs-sec="languages" className="space-y-1">
                  <h3 data-rs-head="1" className="font-bold text-xs text-slate-900">{getSectionTitle(r, "languages", "Languages")}</h3>
                  {langContent}
                </section>
              );
            })()}
          </div>

          {/* Right Main Column */}
          <div className="space-y-4">
            <div className="flex items-center gap-3 pb-2 border-b border-slate-200">
              <div className="w-1.5 h-9 bg-teal-600 rounded-sm" />
              <Editable as="h1" value={r.name || ""} onChange={update && (v => on({ name: v }))} className="text-3xl font-light text-slate-900 tracking-wide" />
            </div>

            {r.summary?.trim() && (
              <section data-rs-sec="summary" className="space-y-1">
                <h3 data-rs-head="1" className="font-bold text-xs text-slate-900">{getSectionTitle(r, "summary", "Summary")}</h3>
                <Editable as="p" multiline value={r.summary} onChange={update && (v => on({ summary: v }))} className="text-[10px] leading-relaxed text-black whitespace-pre-wrap" />
              </section>
            )}

            {r.experience?.length > 0 && (
              <section data-rs-sec="experience" className="space-y-2">
                <h3 data-rs-head="1" className="font-bold text-xs text-slate-900">{getSectionTitle(r, "experience", "Experience")}</h3>
                <div className="space-y-3">
                  {r.experience.map((e, i) => {
                    const upd = makeExpUpdater(update, r, i);
                    return (
                      <div key={i} className="space-y-0.5">
                        <div className="font-bold text-[10.5px] text-black">
                          <Editable value={e.company} onChange={update && (v => upd({ company: v }))} /> - <Editable value={e.role} onChange={update && (v => upd({ role: v }))} />
                        </div>
                        <div className="text-[9px] italic text-slate-600">
                          <Editable value={e.location} onChange={update && (v => upd({ location: v }))} /> • {e.start} - {e.end}
                        </div>
                        <BulletsEditor bullets={e.bullets || []} onChange={update && (v => upd({ bullets: v }))} className="list-disc pl-4 text-[10px] space-y-0.5 text-black mt-1" />
                      </div>
                    );
                  })}
                </div>
              </section>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/* 10. Burgundy Boxed Monogram Executive */
function BurgundyBoxedMonogramPreview({ r, update }: { r: ResumeData; update?: UpdateFn }) {
  const on = (patch: Partial<ResumeData>) => update?.(patch);
  const initials = getInitials(r.name);

  return (
    <div className="bg-white text-black font-sans text-[10.5px] leading-snug w-full min-h-[var(--page-h,auto)] p-6">
      {/* Header Banner */}
      <div className="flex items-stretch mb-4">
        {initials && (
          <div className="h-28 w-28 border-2 border-[#7f1d1d] flex flex-col items-center justify-center font-bold text-3xl text-black shrink-0 bg-white">
            <div className="w-8 h-[2px] bg-slate-400 mb-1" />
            <span>{initials}</span>
            <div className="w-8 h-[2px] bg-slate-400 mt-1" />
          </div>
        )}
        <div className="flex-1 bg-[#6b1d1d] text-white p-6 flex flex-col justify-center">
          <Editable as="h1" value={r.name || ""} onChange={update && (v => on({ name: v }))} className="text-2xl font-black tracking-widest uppercase text-white" />
          <div className="h-2 bg-slate-800 w-full mt-2" />
        </div>
      </div>

      {/* Two Column Layout */}
      <div className="grid grid-cols-[0.32fr_0.68fr] gap-6">
        {/* Left Column */}
        <div className="space-y-4">
          <div className="space-y-1.5 text-[9.5px] text-slate-800 font-medium">
            {r.location && (
              <div className="flex items-center gap-2 p-1 border-b border-slate-200">
                <span className="h-5 w-5 rounded bg-[#6b1d1d] text-white flex items-center justify-center text-[10px]">📍</span>
                <Editable value={r.location} onChange={update && (v => on({ location: v }))} />
              </div>
            )}
            {r.phone && (
              <div className="flex items-center gap-2 p-1 border-b border-slate-200">
                <span className="h-5 w-5 rounded bg-[#6b1d1d] text-white flex items-center justify-center text-[10px]">📞</span>
                <Editable value={r.phone} onChange={update && (v => on({ phone: v }))} />
              </div>
            )}
            {r.email && (
              <div className="flex items-center gap-2 p-1 border-b border-slate-200">
                <span className="h-5 w-5 rounded bg-[#6b1d1d] text-white flex items-center justify-center text-[10px]">✉️</span>
                <Editable value={r.email} onChange={update && (v => on({ email: v }))} />
              </div>
            )}
          </div>

          {r.education?.length > 0 && (
            <section data-rs-sec="education" className="space-y-1.5 pt-2">
              <h3 data-rs-head="1" className="font-bold text-xs uppercase tracking-wider text-slate-900 border-b border-slate-200 pb-1">{getSectionTitle(r, "education", "EDUCATION AND TRAINING")}</h3>
              {r.education.map((e, i) => {
                const upd = makeEduUpdater(update, r, i);
                return (
                  <div key={i} className="text-[10px] space-y-0.5">
                    <div className="font-bold text-black"><Editable value={e.degree} onChange={update && (v => upd({ degree: v }))} /></div>
                    <div className="text-slate-800"><Editable value={e.school} onChange={update && (v => upd({ school: v }))} />, <Editable value={e.location} onChange={update && (v => upd({ location: v }))} /></div>
                    <div className="text-slate-600 text-[9px]">{e.end || e.start}</div>
                  </div>
                );
              })}
            </section>
          )}
        </div>

        {/* Right Main Column */}
        <div className="space-y-4">
          {r.summary?.trim() && (
            <section data-rs-sec="summary" className="space-y-1">
              <h3 data-rs-head="1" className="font-bold text-xs uppercase tracking-wider text-slate-900 border-b border-slate-200 pb-1">{getSectionTitle(r, "summary", "SUMMARY")}</h3>
              <Editable as="p" multiline value={r.summary} onChange={update && (v => on({ summary: v }))} className="text-[10px] leading-relaxed text-black whitespace-pre-wrap" />
            </section>
          )}

          {r.skills?.some(s => (s.items || []).filter(Boolean).length > 0) && (
            <section data-rs-sec="skills" className="space-y-1">
              <h3 data-rs-head="1" className="font-bold text-xs uppercase tracking-wider text-slate-900 border-b border-slate-200 pb-1">{getSectionTitle(r, "skills", "SKILLS")}</h3>
              {renderBulletSkills2Col(r.skills, update, "text-[#6b1d1d]")}
            </section>
          )}

          {r.experience?.length > 0 && (
            <section data-rs-sec="experience" className="space-y-2">
              <h3 data-rs-head="1" className="font-bold text-xs uppercase tracking-wider text-slate-900 border-b border-slate-200 pb-1">{getSectionTitle(r, "experience", "EXPERIENCE")}</h3>
              <div className="space-y-3">
                {r.experience.map((e, i) => {
                  const upd = makeExpUpdater(update, r, i);
                  return (
                    <div key={i} className="space-y-0.5">
                      <div className="font-bold text-[10.5px] uppercase tracking-wide text-black">
                        <Editable value={e.role} onChange={update && (v => upd({ role: v }))} />
                      </div>
                      <div className="text-[9.5px] text-slate-700 italic">
                        <Editable value={e.company} onChange={update && (v => upd({ company: v }))} /> | <Editable value={e.location} onChange={update && (v => upd({ location: v }))} /> | {e.start} - {e.end}
                      </div>
                      <BulletsEditor bullets={e.bullets || []} onChange={update && (v => upd({ bullets: v }))} className="list-disc pl-4 text-[10px] space-y-0.5 text-black" />
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          {(() => {
            const langContent = renderLanguagesSection(r, "bg-[#6b1d1d]");
            if (!langContent) return null;
            return (
              <section data-rs-sec="languages" className="space-y-1 pt-2">
                <h3 data-rs-head="1" className="font-bold text-xs uppercase tracking-wider text-slate-900 border-b border-slate-200 pb-1">{getSectionTitle(r, "languages", "LANGUAGES")}</h3>
                {langContent}
              </section>
            );
          })()}
        </div>
      </div>
    </div>
  );
}

/** Scaled mini preview component for template pickers and cards */
export function TemplateMiniPreview({
  template,
  data,
  className = "",
  scale = 0.25,
}: {
  template: TemplateId;
  data?: ResumeData;
  className?: string;
  scale?: number;
}) {
  const resume = data || SAMPLE_RESUME_DATA;
  return (
    <div className={`relative w-full h-full overflow-hidden bg-white select-none pointer-events-none rounded flex items-start justify-center ${className}`}>
      <div
        className="shrink-0"
        style={{
          width: "794px",
          minHeight: "1123px",
          transform: `scale(${scale})`,
          transformOrigin: "top center",
        }}
      >
        <ResumePreview template={template} data={resume} isMini={true} />
      </div>
    </div>
  );
}

/* ---------- Per-section styling (works across every template) ---------- */
const SECTION_MATCHERS: { key: ResumeSectionKey; re: RegExp }[] = [
  { key: "summary", re: /^(summary|profile|about|professional summary)$/i },
  { key: "experience", re: /^(experience|work experience|professional experience|employment)$/i },
  { key: "leadership", re: /^(leadership experience|leadership|volunteer experience|community leadership|extracurricular activities|activities|leadership & activities)$/i },
  { key: "education", re: /^(education|academics|education and training)$/i },
  { key: "skills", re: /^(skills|key skills.*|core skills|technical skills|skills & optimization)$/i },
  { key: "projects", re: /^(projects|selected projects|key projects)$/i },
  { key: "certifications", re: /^(certifications|licenses|courses|certificates)$/i },
];

export function tagSections(root: HTMLElement | null, customTitles?: Partial<Record<string, string>>) {
  if (!root) return;
  const headings = Array.from(root.querySelectorAll<HTMLElement>("h1, h2, h3, [data-rs-head], section > div:first-child"));
  for (const el of headings) {
    const txt = (el.textContent || "").trim();
    if (!txt || txt.length > 50) continue;
    
    // Check user custom titles first
    let matchKey: ResumeSectionKey | null = null;
    if (customTitles) {
      for (const [key, title] of Object.entries(customTitles)) {
        if (title && txt.toLowerCase() === title.trim().toLowerCase()) {
          matchKey = key as ResumeSectionKey;
          break;
        }
      }
    }
    if (!matchKey) {
      const match = SECTION_MATCHERS.find(m => m.re.test(txt));
      if (match) matchKey = match.key;
    }
    if (!matchKey) continue;

    el.setAttribute("data-rs-head", "1");
    const container = el.closest("section");
    if (container && container !== root) {
      container.setAttribute("data-rs-sec", matchKey);
    }
  }
}

function sectionCss(scope: string, settings?: ResumeSettings) {
  const baseRules: string[] = [
    `${scope} .resume-page-sheet, ${scope} [data-rs-export], ${scope} > div > div:first-child, ${scope} .rounded-lg, ${scope} .rounded-xl, ${scope} .rounded-2xl { border-radius: 0 !important; }`,
    `${scope} ul.list-disc { list-style-type: none !important; list-style: none !important; padding-left: 0 !important; }`,
    `${scope} ul.list-disc > li { position: relative !important; list-style-type: none !important; list-style: none !important; padding-left: 0.95rem !important; line-height: inherit !important; }`,
    `${scope} ul.list-disc > li::before { content: "•" !important; position: absolute !important; left: 0.1rem !important; top: 0 !important; line-height: inherit !important; font-size: 1.1em !important; color: inherit !important; display: inline-block !important; vertical-align: baseline !important; pointer-events: none !important; }`,
    `${scope} [data-rs-head] { display: block !important; }`,
  ];
  if (!settings) return baseRules.join("\n");
  const sections = settings.sections;

  if (settings.fontFamily) {
    baseRules.push(`${scope}, ${scope} * { font-family: ${settings.fontFamily} !important; }`);
  }
  if (settings.textOpacity != null && settings.textOpacity < 1) {
    baseRules.push(`${scope} p, ${scope} li, ${scope} span, ${scope} div:not([data-color-target]):not([data-page-badge]) { opacity: ${settings.textOpacity} !important; }`);
  }
  if (settings.primaryColor) {
    baseRules.push(`${scope} [data-rs-head] { color: ${settings.primaryColor} !important; border-color: ${settings.primaryColor} !important; }`);
    baseRules.push(`${scope} .text-primary, ${scope} .text-emerald-800, ${scope} .text-sky-700, ${scope} .text-indigo-700, ${scope} .text-teal-700, ${scope} .text-amber-800 { color: ${settings.primaryColor} !important; }`);
    baseRules.push(`${scope} .border-primary, ${scope} .border-emerald-800, ${scope} .border-sky-200, ${scope} .border-sky-300, ${scope} .border-indigo-600, ${scope} .border-teal-600, ${scope} .border-amber-600 { border-color: ${settings.primaryColor} !important; }`);
  }
  if (settings.headerBg) {
    baseRules.push(`${scope} [data-color-target="header"], ${scope} .bg-slate-800, ${scope} .bg-slate-900, ${scope} .bg-indigo-900, ${scope} .bg-emerald-900, ${scope} .bg-teal-900 { background-color: ${settings.headerBg} !important; }`);
  }
  if (settings.sidebarBg) {
    baseRules.push(`${scope} [data-color-target="sidebar"], ${scope} .bg-emerald-800, ${scope} .bg-teal-800 { background-color: ${settings.sidebarBg} !important; }`);
  }
  if (settings.fontSize) {
    baseRules.push(`${scope} p, ${scope} li, ${scope} div:not([data-rs-head]):not(h1):not(h2):not(h3), ${scope} span:not([data-rs-head]) { font-size: ${settings.fontSize}px; }`);
  }
  if (settings.lineSpacing) {
    baseRules.push(`${scope} p, ${scope} li, ${scope} .resume-root-container { line-height: ${settings.lineSpacing} !important; }`);
  }
  if (settings.headingSize) {
    baseRules.push(`${scope} h1, ${scope} h2, ${scope} h3, ${scope} [data-rs-head] { font-size: ${settings.headingSize}px !important; line-height: 1.3 !important; }`);
  }
  if (settings.sectionSpacing != null) {
    baseRules.push(`${scope} section, ${scope} [data-rs-sec] { margin-bottom: ${settings.sectionSpacing}px !important; }`);
  }
  if (settings.paragraphSpacing != null) {
    baseRules.push(`${scope} p, ${scope} .space-y-1 > *, ${scope} .space-y-2 > *, ${scope} .mb-3, ${scope} .mb-2 { margin-bottom: ${settings.paragraphSpacing}px !important; }`);
  }
  if (settings.paragraphIndent != null && settings.paragraphIndent > 0) {
    baseRules.push(`${scope} p, ${scope} li { text-indent: ${settings.paragraphIndent}px; }`);
  }
  if (settings.marginTopBottom != null || settings.marginSide != null) {
    const tb = settings.marginTopBottom ?? 0;
    const lr = settings.marginSide ?? 0;
    if (tb > 0 || lr > 0) {
      baseRules.push(`${scope} .resume-page-sheet, ${scope} > div > div:first-child { padding-top: ${tb}px !important; padding-bottom: ${tb}px !important; padding-left: ${lr}px !important; padding-right: ${lr}px !important; }`);
    }
  }

  const rule = (sel: string, s?: SectionStyle) => {
    if (!s) return "";
    const decls = [
      s.fontSize ? `font-size:${s.fontSize}px !important` : "",
      s.fontFamily ? `font-family:${s.fontFamily} !important` : "",
      s.bold === true ? "font-weight:700 !important" : s.bold === false ? "font-weight:400 !important" : "",
      s.italic ? "font-style:italic !important" : "",
      s.letterSpacing != null ? `letter-spacing:${s.letterSpacing}px !important` : "",
    ].filter(Boolean).join(";");
    return decls ? `${sel},${sel} * {${decls}}` : "";
  };
  const body = (["summary", "experience", "leadership", "education", "skills", "projects", "certifications"] as ResumeSectionKey[])
    .map(k => rule(`${scope} [data-rs-sec="${k}"]`, sections?.[k]))
    .join("\n");
  // headings last so they win over section body rules
  const headingRule = rule(`${scope} [data-rs-head]`, sections?.headings);

  return `${baseRules.join("\n")}\n${body}\n${headingRule}`;
}

export function ResumePreview({
  template, data, onChange, isMini = false, isExport = false,
}: {
  template: TemplateId;
  data: ResumeData;
  onChange?: (data: ResumeData) => void;
  isMini?: boolean;
  isExport?: boolean;
}) {
  const update: UpdateFn = (!isMini && !isExport && onChange) ? (patch) => onChange({ ...data, ...patch }) : undefined;
  const rootRef = useRef<HTMLDivElement>(null);
  const scopeId = React.useId().replace(/[:]/g, "");
  const [contextMenu, setContextMenu] = useState<ContextMenuPosition | null>(null);
  const [copiedFormat, setCopiedFormat] = useState<TextFormat | null>(null);
  const [colorPrompt, setColorPrompt] = useState<{
    isOpen: boolean;
    targetKey: "headerBg" | "sidebarBg" | "primaryColor" | "accentColor";
    label: string;
    currentColor: string;
  } | null>(null);

  const inner =
    template === "modern" ? <ModernPreview r={data} update={update} /> :
    template === "compact" ? <CompactPreview r={data} update={update} /> :
    template === "executive" ? <ExecutivePreview r={data} update={update} /> :
    template === "creative" ? <CreativePreview r={data} update={update} /> :
    template === "minimal" ? <MinimalPreview r={data} update={update} /> :
    template === "timeline" ? <TimelinePreview r={data} update={update} /> :
    template === "elegant" ? <ElegantPreview r={data} update={update} /> :
    template === "sidebar-dark" ? <SidebarDarkPreview r={data} update={update} /> :
    template === "photo-header" ? <PhotoHeaderPreview r={data} update={update} /> :
    template === "centered-serif" ? <CenteredSerifPreview r={data} update={update} /> :
    template === "banner-photo" ? <BannerPhotoPreview r={data} update={update} /> :
    template === "teal-left" ? <TealLeftPreview r={data} update={update} /> :
    template === "photo-grid" ? <PhotoGridPreview r={data} update={update} /> :
    template === "logo-boxed" ? <LogoBoxedPreview r={data} update={update} /> :
    template === "nordic" ? <NordicPreview r={data} update={update} /> :
    template === "ivy-league" ? <IvyLeaguePreview r={data} update={update} /> :
    template === "tech-dark" ? <TechDarkPreview r={data} update={update} /> :
    template === "monogram-blue-frame" ? <MonogramBlueFramePreview r={data} update={update} /> :
    template === "emerald-timeline" ? <EmeraldTimelinePreview r={data} update={update} /> :
    template === "hexagon-editorial" ? <HexagonEditorialPreview r={data} update={update} /> :
    template === "slate-node-timeline" ? <SlateNodeTimelinePreview r={data} update={update} /> :
    template === "centered-dual-column" ? <CenteredDualColumnPreview r={data} update={update} /> :
    template === "teal-duo-banner" ? <TealDuoBannerPreview r={data} update={update} /> :
    template === "taupe-header-split" ? <TaupeHeaderSplitPreview r={data} update={update} /> :
    template === "amber-ribbon" ? <AmberRibbonPreview r={data} update={update} /> :
    template === "slate-frame-sidebar" ? <SlateFrameSidebarPreview r={data} update={update} /> :
    template === "burgundy-boxed-monogram" ? <BurgundyBoxedMonogramPreview r={data} update={update} /> :
    <ClassicPreview r={data} update={update} />;

  useEffect(() => {
    if (isMini) return;
    const timer = setTimeout(() => tagSections(rootRef.current, data.settings?.customSectionTitles), 30);
    return () => clearTimeout(timer);
  }, [isMini, template, data.settings?.sectionOrder, data.settings?.customSectionTitles, data.experience?.length, data.education?.length, data.projects?.length, data.skills?.length]);

  // Handle mouseup selection inside resume preview
  useEffect(() => {
    const root = rootRef.current;
    if (!root || !onChange || isMini || isExport) return;

    const handleMouseUp = (e: MouseEvent) => {
      // Ignore if clicking inside the context menu itself or right-click
      const target = e.target as HTMLElement;
      if (e.button !== 0 || target.closest('[role="menu"]')) return;

      setTimeout(() => {
        const selection = window.getSelection();
        if (
          selection &&
          !selection.isCollapsed &&
          selection.toString().trim().length > 0 &&
          selection.rangeCount > 0
        ) {
          const range = selection.getRangeAt(0);
          if (root.contains(range.commonAncestorContainer)) {
            const rect = range.getBoundingClientRect();
            const targetElem = (
              range.commonAncestorContainer.nodeType === Node.ELEMENT_NODE
                ? range.commonAncestorContainer
                : range.commonAncestorContainer.parentElement
            ) as HTMLElement;

            const li = targetElem?.closest("li");
            let lineIdx: number | undefined = undefined;
            if (li && li.parentElement) {
              const lis = Array.from(li.parentElement.querySelectorAll("li"));
              lineIdx = lis.indexOf(li);
            }

            const menuHeight = 360;
            const y = rect.top > menuHeight + 20 ? rect.top - 10 : rect.bottom + 10;
            const x = rect.left + rect.width / 2;

            setContextMenu({
              x,
              y,
              targetElement: targetElem,
              targetLineIndex: lineIdx,
              selectedText: selection.toString(),
              savedRange: range.cloneRange(),
            });
          }
        }
      }, 30);
    };

    root.addEventListener("mouseup", handleMouseUp);
    return () => {
      root.removeEventListener("mouseup", handleMouseUp);
    };
  }, [onChange, isMini, isExport]);

  const handleContextMenu = (e: React.MouseEvent) => {
    if (!onChange || isMini || isExport) return;
    e.preventDefault();

    const target = e.target as HTMLElement;
    const li = target.closest("li");
    let lineIdx: number | undefined = undefined;
    if (li && li.parentElement) {
      const lis = Array.from(li.parentElement.querySelectorAll("li"));
      lineIdx = lis.indexOf(li);
    }

    const selection = window.getSelection();
    let savedRange: Range | null = null;
    if (selection && selection.rangeCount > 0) {
      savedRange = selection.getRangeAt(0).cloneRange();
    }
    const selText = selection ? selection.toString() : "";

    setContextMenu({
      x: e.clientX,
      y: e.clientY,
      targetElement: target,
      targetLineIndex: lineIdx,
      selectedText: selText,
      savedRange,
    });
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

  const handleMoveLineUp = () => {
    if (!contextMenu?.targetElement || !onChange) return;
    const li = contextMenu.targetElement.closest("li");
    const ul = (li?.parentElement || contextMenu.targetElement.closest("ul")) as HTMLUListElement | null;
    if (ul) {
      const lis = Array.from(ul.querySelectorAll("li"));
      const idx = li ? lis.indexOf(li) : (contextMenu.targetLineIndex ?? -1);
      if (idx > 0 && idx < lis.length) {
        const textArr = lis.map(l => (l.innerHTML || "").trim());
        const temp = textArr[idx];
        textArr[idx] = textArr[idx - 1];
        textArr[idx - 1] = temp;
        ul.dispatchEvent(new CustomEvent("bullets-update", { detail: textArr, bubbles: true }));
      }
    }
  };

  const handleMoveLineDown = () => {
    if (!contextMenu?.targetElement || !onChange) return;
    const li = contextMenu.targetElement.closest("li");
    const ul = (li?.parentElement || contextMenu.targetElement.closest("ul")) as HTMLUListElement | null;
    if (ul) {
      const lis = Array.from(ul.querySelectorAll("li"));
      const idx = li ? lis.indexOf(li) : (contextMenu.targetLineIndex ?? -1);
      if (idx !== -1 && idx < lis.length - 1) {
        const textArr = lis.map(l => (l.innerHTML || "").trim());
        const temp = textArr[idx];
        textArr[idx] = textArr[idx + 1];
        textArr[idx + 1] = temp;
        ul.dispatchEvent(new CustomEvent("bullets-update", { detail: textArr, bubbles: true }));
      }
    }
  };

  const handleDuplicateLine = () => {
    if (!contextMenu?.targetElement || !onChange) return;
    const li = contextMenu.targetElement.closest("li");
    const ul = (li?.parentElement || contextMenu.targetElement.closest("ul")) as HTMLUListElement | null;
    if (ul) {
      const lis = Array.from(ul.querySelectorAll("li"));
      const idx = li ? lis.indexOf(li) : (contextMenu.targetLineIndex ?? -1);
      if (idx !== -1 && idx < lis.length) {
        const textArr = lis.map(l => (l.innerHTML || "").trim());
        textArr.splice(idx + 1, 0, textArr[idx]);
        ul.dispatchEvent(new CustomEvent("bullets-update", { detail: textArr, bubbles: true }));
      }
    }
  };

  const handleAddLineBelow = () => {
    if (!contextMenu?.targetElement || !onChange) return;
    const li = contextMenu.targetElement.closest("li");
    const ul = (li?.parentElement || contextMenu.targetElement.closest("ul")) as HTMLUListElement | null;
    if (ul) {
      const lis = Array.from(ul.querySelectorAll("li"));
      const idx = li ? lis.indexOf(li) : (contextMenu.targetLineIndex ?? -1);
      const textArr = lis.map(l => (l.innerHTML || "").trim());
      textArr.splice(idx !== -1 ? idx + 1 : textArr.length, 0, "New bullet point...");
      ul.dispatchEvent(new CustomEvent("bullets-update", { detail: textArr, bubbles: true }));
    }
  };

  const handleDeleteLine = () => {
    if (!contextMenu?.targetElement || !onChange) return;
    const li = contextMenu.targetElement.closest("li");
    const ul = (li?.parentElement || contextMenu.targetElement.closest("ul")) as HTMLUListElement | null;
    if (ul) {
      const lis = Array.from(ul.querySelectorAll("li"));
      const idx = li ? lis.indexOf(li) : (contextMenu.targetLineIndex ?? -1);
      if (idx !== -1 && idx < lis.length) {
        const textArr = lis.map(l => (l.innerHTML || "").trim());
        textArr.splice(idx, 1);
        ul.dispatchEvent(new CustomEvent("bullets-update", { detail: textArr, bubbles: true }));
      }
    }
  };

  const handleFormatText = (command: string, value: string = "") => {
    try {
      applyFormatToSelection(command, value);
    } catch (e) {
      console.warn("Formatting failed:", e);
    }
    if (contextMenu?.targetElement) {
      const el = contextMenu.targetElement.closest('[contenteditable="true"]') as HTMLElement | null;
      if (el) {
        el.dispatchEvent(new Event("input", { bubbles: true }));
        el.dispatchEvent(new FocusEvent("blur", { bubbles: true }));
      }
    }
  };

  const handleContainerClick = (e: React.MouseEvent) => {
    if (isMini || isExport || !onChange) return;
    const target = e.target as HTMLElement;
    if (
      target.isContentEditable ||
      target.closest('[contenteditable="true"]') ||
      target.closest('input') ||
      target.closest('textarea') ||
      target.closest('[role="menu"]') ||
      target.closest('.preview-only-badge')
    ) {
      return;
    }

    const colorTarget = target.closest("[data-color-target]") as HTMLElement | null;
    const headTarget = target.closest("[data-rs-head], h1, h2, h3") as HTMLElement | null;
    const bannerTarget = target.closest("header, .bg-slate-800, .bg-slate-900, .bg-slate-950, .bg-emerald-800, .bg-emerald-900, .bg-indigo-900, .bg-teal-700, .bg-teal-800, .bg-teal-900") as HTMLElement | null;

    if (colorTarget) {
      const targetType = (colorTarget.getAttribute("data-color-target") || "header") as "header" | "sidebar" | "primary" | "accent";
      const label = colorTarget.getAttribute("data-color-label") || "Design Element";
      const key = targetType === "header" ? "headerBg" : targetType === "sidebar" ? "sidebarBg" : targetType === "accent" ? "accentColor" : "primaryColor";
      const currentColor = (data.settings as any)?.[key] || data.settings?.primaryColor || colorTarget.getAttribute("data-current-color") || "#1e293b";

      setColorPrompt({
        isOpen: true,
        targetKey: key,
        label,
        currentColor,
      });
    } else if (headTarget) {
      setColorPrompt({
        isOpen: true,
        targetKey: "primaryColor",
        label: "Section Heading & Accent Color",
        currentColor: data.settings?.primaryColor || "#0f172a",
      });
    } else if (bannerTarget) {
      setColorPrompt({
        isOpen: true,
        targetKey: "headerBg",
        label: "Header / Banner Color",
        currentColor: data.settings?.headerBg || data.settings?.primaryColor || "#1e293b",
      });
    }
  };

  return (
    <div
      ref={rootRef}
      data-rs-root={isMini ? undefined : scopeId}
      data-rs-mini={isMini ? "true" : undefined}
      data-rs-export={isExport ? "true" : undefined}
      data-main-resume-preview={!isMini && !isExport ? "true" : undefined}
      data-rs-template={template}
      className={`resume-root-container resume-page-sheet relative ${isMini ? "pointer-events-none" : ""}`}
      style={{
        width: `${A4_WIDTH_PX}px`,
        minWidth: `${A4_WIDTH_PX}px`,
        maxWidth: `${A4_WIDTH_PX}px`,
        minHeight: `${A4_HEIGHT_PX}px`,
        boxSizing: "border-box",
        "--page-h": `${A4_HEIGHT_PX}px`,
      } as React.CSSProperties}
      onContextMenu={handleContextMenu}
      onClick={handleContainerClick}
    >
      <style dangerouslySetInnerHTML={{ __html: sectionCss(isMini ? `[data-rs-mini="true"]` : `[data-rs-root="${scopeId}"]`, data.settings) }} />
      <PagedSheet isMini={isMini} isExport={isExport}>{inner}</PagedSheet>

      {/* Unified context & text formatting menu */}
      {!isMini && !isExport && contextMenu && (
        <ResumeContextMenu
          position={contextMenu}
          onClose={() => setContextMenu(null)}
          onMoveLineUp={contextMenu.targetLineIndex != null ? handleMoveLineUp : undefined}
          onMoveLineDown={contextMenu.targetLineIndex != null ? handleMoveLineDown : undefined}
          onDuplicateLine={contextMenu.targetLineIndex != null ? handleDuplicateLine : undefined}
          onAddLineBelow={contextMenu.targetLineIndex != null ? handleAddLineBelow : undefined}
          onDeleteLine={contextMenu.targetLineIndex != null ? handleDeleteLine : undefined}
          onFormatText={handleFormatText}
          onCopyFormat={handleCopyFormat}
          onPasteFormat={handlePasteFormat}
          copiedFormatLabel={copiedFormat ? describeFormat(copiedFormat) : null}
        />
      )}

      {/* Interactive Color Change Prompt Modal */}
      {!isMini && !isExport && colorPrompt?.isOpen && typeof document !== "undefined" && createPortal(
        <div
          className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-150"
          onClick={() => setColorPrompt(null)}
        >
          <div
            className="bg-[#1c243c] border border-white/20 text-white rounded-2xl p-5 w-full max-w-sm shadow-2xl space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400">
                  <Palette className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-white">Change Color?</h3>
                  <p className="text-[11px] text-white/60">Customize color for {colorPrompt.label}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setColorPrompt(null)}
                className="text-white/60 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors"
                title="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-white/90 block mb-2">Preset Color Palette</label>
                <div className="grid grid-cols-6 gap-2">
                  {[
                    { label: "Slate Gray", color: "#1e293b" },
                    { label: "Midnight Navy", color: "#0f172a" },
                    { label: "Royal Blue", color: "#1e3a8a" },
                    { label: "Deep Emerald", color: "#064e3b" },
                    { label: "Modern Teal", color: "#0f766e" },
                    { label: "Royal Indigo", color: "#4338ca" },
                    { label: "Ruby Burgundy", color: "#881337" },
                    { label: "Crimson Red", color: "#b91c1c" },
                    { label: "Warm Amber", color: "#b45309" },
                    { label: "Jet Black", color: "#18181b" },
                    { label: "Cool Steel", color: "#334155" },
                    { label: "Sky Cyan", color: "#0284c7" },
                  ].map((p) => (
                    <button
                      key={p.color}
                      type="button"
                      onClick={() => {
                        onChange?.({
                          ...data,
                          settings: {
                            ...data.settings,
                            [colorPrompt.targetKey]: p.color,
                            primaryColor: p.color,
                          },
                        });
                        setColorPrompt(null);
                        toast.success(`${colorPrompt.label} color updated!`);
                      }}
                      title={p.label}
                      className={`w-9 h-9 rounded-xl border-2 transition-all transform hover:scale-110 flex items-center justify-center ${
                        colorPrompt.currentColor.toLowerCase() === p.color.toLowerCase()
                          ? "border-emerald-400 ring-2 ring-emerald-400/50 shadow-lg scale-105"
                          : "border-white/20 hover:border-white/60"
                      }`}
                      style={{ backgroundColor: p.color }}
                    >
                      {colorPrompt.currentColor.toLowerCase() === p.color.toLowerCase() && (
                        <Check className="w-4 h-4 text-white stroke-[3] drop-shadow" />
                      )}
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-2 border-t border-white/10 space-y-2">
                <label className="text-xs font-semibold text-white/90 block">Or Choose Custom Color</label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={colorPrompt.currentColor.startsWith("#") && colorPrompt.currentColor.length === 7 ? colorPrompt.currentColor : "#1e293b"}
                    onChange={(e) => {
                      setColorPrompt(prev => prev ? { ...prev, currentColor: e.target.value } : null);
                    }}
                    className="w-10 h-9 p-0.5 bg-[#28334f] border border-white/20 rounded-xl cursor-pointer"
                  />
                  <input
                    type="text"
                    value={colorPrompt.currentColor}
                    onChange={(e) => {
                      setColorPrompt(prev => prev ? { ...prev, currentColor: e.target.value } : null);
                    }}
                    className="flex-1 h-9 px-3 bg-[#28334f] border border-white/20 rounded-xl font-mono text-xs text-white uppercase focus:outline-none focus:ring-1 focus:ring-emerald-400"
                    placeholder="#1E293B"
                  />
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-white/10 flex items-center gap-2 justify-end">
              <button
                type="button"
                onClick={() => {
                  const newSettings = { ...data.settings };
                  delete (newSettings as any)[colorPrompt.targetKey];
                  delete newSettings.primaryColor;
                  onChange?.({ ...data, settings: newSettings });
                  setColorPrompt(null);
                  toast.success(`${colorPrompt.label} color reset to template default!`);
                }}
                className="px-3 py-1.5 rounded-xl text-xs font-medium text-white/70 hover:text-white hover:bg-white/10 transition-colors"
              >
                Reset Default
              </button>
              <button
                type="button"
                onClick={() => {
                  onChange?.({
                    ...data,
                    settings: {
                      ...data.settings,
                      [colorPrompt.targetKey]: colorPrompt.currentColor,
                      primaryColor: colorPrompt.currentColor,
                    },
                  });
                  setColorPrompt(null);
                  toast.success(`${colorPrompt.label} color applied!`);
                }}
                className="px-4 py-1.5 rounded-xl text-xs font-bold bg-emerald-500 hover:bg-emerald-400 text-slate-950 transition-colors shadow-md"
              >
                Apply Color
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}


/* ---------- PDF export ---------- */
export async function downloadResumePdfFromData(rawData: ResumeData, template: TemplateId) {
  const data = normalizeResumeSkills(rawData);
  const safe = safeName(data.name);

  // 1. Create an isolated off-screen export container to render exact data without interference from DOM previews
  const wrapper = document.createElement("div");
  wrapper.id = "rs-pdf-export-wrapper";
  wrapper.style.cssText = `position: absolute; left: 0; top: 0; width: ${A4_WIDTH_PX}px; min-width: ${A4_WIDTH_PX}px; max-width: ${A4_WIDTH_PX}px; min-height: ${A4_HEIGHT_PX}px; background: #ffffff; z-index: -9999; opacity: 0; pointer-events: none; margin: 0; padding: 0; overflow: visible;`;
  document.body.appendChild(wrapper);

  let root: any = null;
  try {
    const { createRoot } = await import("react-dom/client");
    root = createRoot(wrapper);
    root.render(
      <React.StrictMode>
        <ResumePreview template={template} data={data} isExport={true} />
      </React.StrictMode>
    );

    // Wait for fonts & layout rendering to settle
    if (document.fonts) {
      try {
        await document.fonts.ready;
      } catch (_) {}
    }
    await new Promise(r => setTimeout(r, 300));

    // Tag sections synchronously to ensure all custom headings, spacing, and typography rules apply
    tagSections(wrapper.querySelector(".resume-root-container") || wrapper, data.settings?.customSectionTitles);

    const sheetEl = (wrapper.querySelector(".resume-root-container") as HTMLElement) || wrapper;
    const rawHeight = Math.max(sheetEl.scrollHeight, wrapper.scrollHeight, A4_HEIGHT_PX);
    const totalPages = Math.max(1, Math.ceil((rawHeight - 25) / A4_HEIGHT_PX));
    const targetHeight = totalPages * A4_HEIGHT_PX;

    const canvas = await html2canvas(wrapper, {
      scale: 3, // 300+ DPI print-grade ultra-sharp resolution
      useCORS: true,
      allowTaint: true,
      backgroundColor: "#ffffff",
      logging: false,
      scrollX: 0,
      scrollY: 0,
      width: A4_WIDTH_PX,
      height: targetHeight,
      windowWidth: A4_WIDTH_PX,
      windowHeight: targetHeight,
      onclone: (clonedDoc) => {
        const el = clonedDoc.getElementById("rs-pdf-export-wrapper");
        if (el) {
          el.style.opacity = "1";
          el.style.zIndex = "99999";
          el.style.textRendering = "geometricPrecision";
          (el.style as any).webkitFontSmoothing = "antialiased";
          (el.style as any).mozOsxFontSmoothing = "grayscale";
        }
      },
    });

    const pdf = new jsPDF({
      orientation: "portrait",
      unit: "pt",
      format: "a4",
      compress: true,
    });

    const pdfWidth = A4_WIDTH_PT; // 595.28 pt
    const pdfHeight = A4_HEIGHT_PT; // 841.89 pt
    const pageCanvasHeight = Math.round(canvas.width * A4_RATIO);

    if (totalPages === 1) {
      const imgData = canvas.toDataURL("image/png", 1.0);
      pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight, undefined, "MEDIUM");
    } else {
      // Multi-page export with clean slice per page
      for (let i = 0; i < totalPages; i++) {
        const sliceCanvas = document.createElement("canvas");
        sliceCanvas.width = canvas.width;
        sliceCanvas.height = pageCanvasHeight;

        const sliceY = i * pageCanvasHeight;
        const remainingHeight = canvas.height - sliceY;
        const thisSliceHeight = Math.min(pageCanvasHeight, remainingHeight);

        const ctx = sliceCanvas.getContext("2d");
        if (ctx) {
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = "high";
          ctx.fillStyle = "#ffffff";
          ctx.fillRect(0, 0, sliceCanvas.width, sliceCanvas.height);
          ctx.drawImage(
            canvas,
            0, sliceY, canvas.width, thisSliceHeight,
            0, 0, canvas.width, thisSliceHeight
          );
        }

        const sliceData = sliceCanvas.toDataURL("image/png", 1.0);
        if (i > 0) {
          pdf.addPage("a4", "portrait");
        }
        pdf.addImage(sliceData, "PNG", 0, 0, pdfWidth, pdfHeight, undefined, "MEDIUM");
      }
    }

    pdf.save(`${safe}-${template}.pdf`);
  } catch (err) {
    console.error("PDF export failed:", err);
    if (typeof window !== "undefined") {
      import("sonner").then(({ toast }) => toast.error("Export failed. Please try again."));
    }
  } finally {
    if (root) {
      try {
        root.unmount();
      } catch (_) {}
    }
    if (wrapper.parentNode) {
      wrapper.parentNode.removeChild(wrapper);
    }
  }
}


/* ---------- DOCX export (editable in Word / Google Docs) ---------- */

export type TemplateLayoutType = "single-column" | "sidebar-left" | "sidebar-right" | "banner-sidebar-right";

export interface TemplateDocxConfig {
  layout: TemplateLayoutType;
  font: string;
  accent: string;
  sidebarWidthDXA?: number; // total printable width is 9360 DXA
  mainWidthDXA?: number;
  sidebarBg?: string; // hex fill for sidebar cell
  sidebarTextColor?: string; // text color in sidebar (e.g. FFFFFF or 111111)
  sidebarSubTextColor?: string; // e.g. D1FAE5
  sidebarHeadingColor?: string; // e.g. A7F3D0
  sidebarBorderColor?: string;
  bannerBg?: string; // e.g. 4338CA for creative, 1E293B for photo-header, 0F2340 for banner-photo
  bannerTextColor?: string;
  namePlacement: "sidebar" | "banner" | "header-centered" | "header-split" | "header-left" | "header-executive";
  sidebarSections?: string[];
  mainSections?: string[];
  skillsFormat?: "chips" | "bullets" | "categories" | "inline";
}

export const TEMPLATE_DOCX_CONFIGS: Record<TemplateId, TemplateDocxConfig> = {
  modern: {
    layout: "sidebar-left",
    font: "Calibri",
    accent: "065F46",
    sidebarWidthDXA: 3280,
    mainWidthDXA: 6080,
    sidebarBg: "065F46",
    sidebarTextColor: "FFFFFF",
    sidebarSubTextColor: "D1FAE5",
    sidebarHeadingColor: "A7F3D0",
    sidebarBorderColor: "059669",
    namePlacement: "sidebar",
    sidebarSections: ["skills", "certifications"],
    mainSections: ["summary", "experience", "projects", "education"],
    skillsFormat: "chips",
  },
  "teal-left": {
    layout: "sidebar-left",
    font: "Calibri",
    accent: "0F766E",
    sidebarWidthDXA: 3280,
    mainWidthDXA: 6080,
    sidebarBg: "0F766E",
    sidebarTextColor: "FFFFFF",
    sidebarSubTextColor: "CCFBF1",
    sidebarHeadingColor: "99F6E4",
    sidebarBorderColor: "14B8A6",
    namePlacement: "sidebar",
    sidebarSections: ["skills", "certifications"],
    mainSections: ["summary", "experience", "education", "projects"],
    skillsFormat: "bullets",
  },
  "sidebar-dark": {
    layout: "sidebar-right",
    font: "Calibri",
    accent: "115E59",
    sidebarWidthDXA: 3280,
    mainWidthDXA: 6080,
    sidebarBg: "115E59",
    sidebarTextColor: "FFFFFF",
    sidebarSubTextColor: "CCFBF1",
    sidebarHeadingColor: "99F6E4",
    sidebarBorderColor: "14B8A6",
    namePlacement: "header-left",
    sidebarSections: ["skills", "certifications"],
    mainSections: ["summary", "experience", "education", "projects"],
    skillsFormat: "bullets",
  },
  creative: {
    layout: "banner-sidebar-right",
    font: "Calibri",
    accent: "4F46E5",
    bannerBg: "4338CA",
    bannerTextColor: "FFFFFF",
    sidebarWidthDXA: 3280,
    mainWidthDXA: 6080,
    sidebarBg: "F5F3FF",
    sidebarTextColor: "1E1B4B",
    sidebarHeadingColor: "4338CA",
    namePlacement: "banner",
    sidebarSections: ["skills", "education", "certifications"],
    mainSections: ["summary", "experience", "projects"],
    skillsFormat: "chips",
  },
  "photo-header": {
    layout: "banner-sidebar-right",
    font: "Calibri",
    accent: "0284C7",
    bannerBg: "1E293B",
    bannerTextColor: "FFFFFF",
    sidebarWidthDXA: 3744,
    mainWidthDXA: 5616,
    sidebarBg: "F8FAFC",
    sidebarTextColor: "0F172A",
    sidebarHeadingColor: "0369A1",
    namePlacement: "banner",
    sidebarSections: ["skills", "certifications"],
    mainSections: ["summary", "experience", "education", "projects"],
    skillsFormat: "chips",
  },
  "banner-photo": {
    layout: "banner-sidebar-right",
    font: "Calibri",
    accent: "0F2340",
    bannerBg: "0F2340",
    bannerTextColor: "FFFFFF",
    sidebarWidthDXA: 3560,
    mainWidthDXA: 5800,
    sidebarBg: "ECFDF5",
    sidebarTextColor: "064E3B",
    sidebarHeadingColor: "065F46",
    namePlacement: "banner",
    sidebarSections: ["skills", "certifications"],
    mainSections: ["summary", "experience", "education", "projects"],
    skillsFormat: "categories",
  },
  classic: {
    layout: "single-column",
    font: "Times New Roman",
    accent: "111111",
    namePlacement: "header-centered",
  },
  compact: {
    layout: "single-column",
    font: "Calibri",
    accent: "1F1F1F",
    namePlacement: "header-split",
  },
  executive: {
    layout: "single-column",
    font: "Times New Roman",
    accent: "92400E",
    namePlacement: "header-executive",
  },
  minimal: {
    layout: "single-column",
    font: "Calibri",
    accent: "404040",
    namePlacement: "header-left",
  },
  timeline: {
    layout: "single-column",
    font: "Calibri",
    accent: "0F766E",
    namePlacement: "header-left",
  },
  elegant: {
    layout: "single-column",
    font: "Times New Roman",
    accent: "78350F",
    namePlacement: "header-centered",
  },
  "centered-serif": {
    layout: "single-column",
    font: "Times New Roman",
    accent: "1E1E1E",
    namePlacement: "header-centered",
  },
  "photo-grid": {
    layout: "single-column",
    font: "Calibri",
    accent: "0369A1",
    namePlacement: "header-centered",
  },
  "logo-boxed": {
    layout: "single-column",
    font: "Calibri",
    accent: "0369A1",
    namePlacement: "header-centered",
  },
  nordic: {
    layout: "single-column",
    font: "Calibri",
    accent: "334155",
    namePlacement: "header-left",
  },
  "ivy-league": {
    layout: "single-column",
    font: "Times New Roman",
    accent: "0F172A",
    namePlacement: "header-centered",
  },
  "tech-dark": {
    layout: "banner-sidebar-right",
    font: "Calibri",
    accent: "0284C7",
    bannerBg: "020617",
    bannerTextColor: "FFFFFF",
    sidebarWidthDXA: 3280,
    mainWidthDXA: 6080,
    sidebarBg: "F8FAFC",
    sidebarTextColor: "0F172A",
    sidebarHeadingColor: "0284C7",
    namePlacement: "banner",
    sidebarSections: ["skills", "education", "certifications"],
    mainSections: ["summary", "experience", "leadership", "projects"],
    skillsFormat: "chips",
  },
  "monogram-blue-frame": {
    layout: "single-column",
    font: "Calibri",
    accent: "2563EB",
    namePlacement: "header-centered",
    skillsFormat: "bullets",
  },
  "emerald-timeline": {
    layout: "single-column",
    font: "Calibri",
    accent: "059669",
    namePlacement: "header-left",
    skillsFormat: "bullets",
  },
  "hexagon-editorial": {
    layout: "sidebar-left",
    font: "Times New Roman",
    accent: "1D4ED8",
    sidebarWidthDXA: 3560,
    mainWidthDXA: 5800,
    namePlacement: "header-split",
    sidebarSections: ["summary", "skills", "education"],
    mainSections: ["experience", "projects", "certifications"],
    skillsFormat: "bullets",
  },
  "slate-node-timeline": {
    layout: "sidebar-right",
    font: "Calibri",
    accent: "334155",
    sidebarWidthDXA: 3560,
    mainWidthDXA: 5800,
    namePlacement: "header-centered",
    sidebarSections: ["skills", "education", "certifications"],
    mainSections: ["summary", "experience", "leadership", "projects"],
    skillsFormat: "bullets",
  },
  "centered-dual-column": {
    layout: "single-column",
    font: "Calibri",
    accent: "0F172A",
    namePlacement: "header-centered",
    skillsFormat: "bullets",
  },
  "teal-duo-banner": {
    layout: "single-column",
    font: "Calibri",
    accent: "0D9488",
    namePlacement: "header-centered",
    skillsFormat: "bullets",
  },
  "taupe-header-split": {
    layout: "single-column",
    font: "Calibri",
    accent: "A89689",
    namePlacement: "header-split",
    skillsFormat: "bullets",
  },
  "amber-ribbon": {
    layout: "single-column",
    font: "Calibri",
    accent: "7F1D1D",
    namePlacement: "header-centered",
    skillsFormat: "bullets",
  },
  "slate-frame-sidebar": {
    layout: "sidebar-left",
    font: "Calibri",
    accent: "475569",
    sidebarWidthDXA: 3280,
    mainWidthDXA: 6080,
    namePlacement: "header-left",
    sidebarSections: ["skills", "education", "certifications"],
    mainSections: ["summary", "experience", "leadership", "projects"],
    skillsFormat: "bullets",
  },
  "burgundy-boxed-monogram": {
    layout: "sidebar-left",
    font: "Calibri",
    accent: "6B1D1D",
    sidebarWidthDXA: 3280,
    mainWidthDXA: 6080,
    namePlacement: "header-split",
    sidebarSections: ["education", "certifications"],
    mainSections: ["summary", "skills", "experience", "leadership", "projects"],
    skillsFormat: "bullets",
  },
};

/** Templates whose React preview renders a sidebar / two-column layout. */
export const MULTI_COLUMN_TEMPLATES: TemplateId[] = [
  "modern", "sidebar-dark", "teal-left", "creative",
  "photo-header", "banner-photo", "tech-dark",
];

export function isMultiColumnTemplate(template: TemplateId) {
  const cfg = TEMPLATE_DOCX_CONFIGS[template];
  return cfg ? cfg.layout !== "single-column" : MULTI_COLUMN_TEMPLATES.includes(template);
}

/** Resolves web / CSS font family names to standard universal Word fonts */
export function resolveDocxFont(fontName?: string, defaultFont = "Calibri"): string {
  if (!fontName) return defaultFont;
  const clean = fontName.replace(/['"]/g, "").trim();
  const lower = clean.toLowerCase();

  // Monospace
  if (
    lower.includes("monospace") ||
    lower.includes("courier") ||
    lower.includes("consolas") ||
    lower.includes("jetbrains mono") ||
    lower.includes("fira code") ||
    lower.includes("source code") ||
    /\bmono\b/.test(lower)
  ) {
    if (lower.includes("courier")) return "Courier New";
    return "Consolas";
  }

  // Specific font mappings
  if (lower.includes("century gothic") || lower.includes("quicksand")) return "Century Gothic";
  if (lower.includes("tahoma")) return "Tahoma";
  if (lower.includes("trebuchet")) return "Trebuchet MS";
  if (lower.includes("verdana")) return "Verdana";
  if (lower.includes("bodoni")) return "Bodoni MT";
  if (lower.includes("palatino")) return "Palatino Linotype";

  // Check sans-serif first to avoid substring matching "serif" in "sans-serif"
  if (
    lower.includes("sans-serif") ||
    lower.includes("inter") ||
    lower.includes("roboto") ||
    lower.includes("arial") ||
    lower.includes("helvetica") ||
    lower.includes("calibri") ||
    lower.includes("system-ui") ||
    lower.includes("jakarta") ||
    lower.includes("aptos") ||
    lower.includes("poppins") ||
    lower.includes("public sans") ||
    lower.includes("karla") ||
    lower.includes("rubik")
  ) {
    if (lower.includes("arial") || lower.includes("public sans")) return "Arial";
    if (lower.includes("aptos")) return "Aptos";
    return "Calibri";
  }

  // Check serif fonts
  if (
    lower.includes("serif") ||
    lower.includes("baskerville") ||
    lower.includes("georgia") ||
    lower.includes("times") ||
    lower.includes("garamond") ||
    lower.includes("merriweather") ||
    lower.includes("playfair") ||
    lower.includes("cambria") ||
    lower.includes("forum") ||
    lower.includes("noto") ||
    lower.includes("fraunces")
  ) {
    if (lower.includes("times")) return "Times New Roman";
    if (lower.includes("garamond")) return "Garamond";
    if (lower.includes("cambria")) return "Cambria";
    return "Georgia";
  }

  const first = clean.split(",")[0].trim();
  if (first && first !== "sans-serif" && first !== "serif" && first !== "monospace" && first !== "system-ui") {
    return first;
  }
  return "Calibri";
}


/** Builds the docx body children for a resume. Exported for tests. */
export function buildResumeDocxBody(rawData: ResumeData, template: TemplateId) {
  const data = normalizeResumeSkills(rawData);
  const cfg = TEMPLATE_DOCX_CONFIGS[template] || TEMPLATE_DOCX_CONFIGS.modern;
  const userGlobalFont = data.settings?.fontFamily;
  const font = resolveDocxFont(userGlobalFont, cfg.font || "Calibri");
  const accent = cfg.accent || "065F46";
  const baseSize = (data.settings?.fontSize || 11) * 2; // docx uses half-points
  const secStyles = data.settings?.sections;

  const parseDocxRichText = (text: string) => parseRichSegments(text);
  const defaultParagraphSpacing = data.settings?.paragraphSpacing != null ? Math.round(data.settings.paragraphSpacing * 15) : 80;
  const defaultSectionSpacing = data.settings?.sectionSpacing != null ? Math.round(data.settings.sectionSpacing * 15) : 200;
  const lineSpacingRule = data.settings?.lineSpacing ? Math.round(data.settings.lineSpacing * 240) : undefined;
  const indentObj = data.settings?.paragraphIndent != null && data.settings.paragraphIndent > 0 ? { left: Math.round(data.settings.paragraphIndent * 15) } : undefined;

  const P = (text: string, opts: {
    bold?: boolean;
    italic?: boolean;
    size?: number;
    color?: string;
    align?: any;
    sectionKey?: ResumeSectionKey;
    fontFamily?: string;
    spacing?: { before?: number; after?: number; line?: number };
    indent?: { left?: number };
  } = {}) => {
    const parts = parseDocxRichText(text);
    const secStyle = opts.sectionKey ? secStyles?.[opts.sectionKey] : undefined;
    const defaultBold = opts.bold || secStyle?.bold === true;
    const defaultItalic = opts.italic || secStyle?.italic === true;
    const fontSize = opts.size ?? (secStyle?.fontSize ? secStyle.fontSize * 2 : baseSize);
    const pFont = resolveDocxFont(opts.fontFamily || secStyle?.fontFamily, font);

    return new Paragraph({
      alignment: opts.align,
      spacing: opts.spacing || { after: defaultParagraphSpacing, line: lineSpacingRule },
      indent: opts.indent || indentObj,
      children: parts.map(p => new TextRun({
        text: p.text,
        bold: p.bold || defaultBold,
        italics: p.italic || defaultItalic,
        underline: p.underline ? {} : undefined,
        size: p.fontSize ? Math.round(p.fontSize * 2) : fontSize,
        color: opts.color,
        font: p.fontFamily ? resolveDocxFont(p.fontFamily, pFont) : pFont,
      })),
    });
  };

  const H = (text: string, isSidebar = false) => {
    const headFont = resolveDocxFont(secStyles?.headings?.fontFamily, font);
    const headSize = secStyles?.headings?.fontSize ? secStyles.headings.fontSize * 2 : (data.settings?.headingSize ? data.settings.headingSize * 2 : (baseSize + 4));
    const beforeSpacing = Math.round(defaultSectionSpacing * 0.7);
    const afterSpacing = Math.round(defaultSectionSpacing * 0.3);

    if (isSidebar && cfg.sidebarTextColor === "FFFFFF") {
      return new Paragraph({
        spacing: { before: beforeSpacing, after: afterSpacing },
        border: cfg.sidebarBorderColor ? { bottom: { color: cfg.sidebarBorderColor, size: 6, style: BorderStyle.SINGLE, space: 6 } } : undefined,
        children: [new TextRun({ text: text.toUpperCase(), bold: true, size: Math.round(headSize * 0.9), color: cfg.sidebarHeadingColor || "FFFFFF", font: headFont })],
      });
    }
    return new Paragraph({
      spacing: { before: beforeSpacing, after: afterSpacing },
      border: { bottom: { color: accent, size: 8, style: BorderStyle.SINGLE, space: 6 } },
      children: [new TextRun({ text: text.toUpperCase(), bold: true, size: headSize, color: accent, font: headFont })],
    });
  };

  const bullet = (text: string, isSidebar = false, sectionKey?: ResumeSectionKey) => {
    const parts = parseDocxRichText(text);
    const secStyle = sectionKey ? secStyles?.[sectionKey] : undefined;
    const defaultBold = secStyle?.bold === true;
    const defaultItalic = secStyle?.italic === true;
    const fontSize = secStyle?.fontSize ? secStyle.fontSize * 2 : (isSidebar ? Math.round(baseSize * 0.9) : baseSize);
    const textColor = isSidebar && cfg.sidebarTextColor === "FFFFFF" ? "FFFFFF" : undefined;
    const bulletFont = resolveDocxFont(secStyle?.fontFamily, font);

    if (isSidebar) {
      return new Paragraph({
        spacing: { after: 30 },
        children: [
          new TextRun({ text: "▪ ", size: Math.round(fontSize * 0.8), color: cfg.sidebarHeadingColor || "FFFFFF", font: bulletFont }),
          ...parts.map(p => new TextRun({
            text: p.text,
            bold: p.bold || defaultBold,
            italics: p.italic || defaultItalic,
            underline: p.underline ? {} : undefined,
            size: p.fontSize ? Math.round(p.fontSize * 2) : fontSize,
            color: p.bold ? "FFFFFF" : textColor,
            font: p.fontFamily ? resolveDocxFont(p.fontFamily, bulletFont) : bulletFont,
          })),
        ],
      });
    }

    return new Paragraph({
      numbering: { reference: "bullets", level: 0 },
      children: parts.map(p => new TextRun({
        text: p.text,
        bold: p.bold || defaultBold,
        italics: p.italic || defaultItalic,
        underline: p.underline ? {} : undefined,
        size: p.fontSize ? Math.round(p.fontSize * 2) : fontSize,
        font: p.fontFamily ? resolveDocxFont(p.fontFamily, bulletFont) : bulletFont,
      })),
    });
  };


  const contactLines = [data.email, data.phone, data.location, ...(data.links?.map(l => `${l.label}: ${l.url}`) ?? [])].filter(Boolean) as string[];

  /* ----- per-section content renderer ----- */
  const sectionParagraphs = (key: ResumeSectionKey | string, isSidebar = false): Paragraph[] => {
    const out: Paragraph[] = [];
    const secTextColor = isSidebar && cfg.sidebarTextColor === "FFFFFF" ? "FFFFFF" : undefined;
    const secSubColor = isSidebar && cfg.sidebarSubTextColor ? cfg.sidebarSubTextColor : "666666";

    switch (key) {
      case "summary":
        if (data.summary) {
          out.push(H(getSectionTitle(data, "summary", "Summary"), isSidebar));
          out.push(P(data.summary, { sectionKey: "summary", color: secTextColor, size: isSidebar ? Math.round(baseSize * 0.95) : baseSize }));
        }
        break;
      case "experience":
        if (data.experience?.length) {
          out.push(H(getSectionTitle(data, "experience", "Experience"), isSidebar));
          const secStyle = secStyles?.experience;
          const fontSize = secStyle?.fontSize ? secStyle.fontSize * 2 : baseSize;
          data.experience.forEach(e => {
            out.push(new Paragraph({
              children: [
                new TextRun({ text: `${e.role}`, bold: true, size: fontSize, font, color: secTextColor }),
                new TextRun({ text: ` — ${e.company}`, size: fontSize, font, color: isSidebar ? secTextColor : accent }),
                e.location ? new TextRun({ text: `, ${e.location}`, size: fontSize, font, color: secSubColor }) : new TextRun({ text: "" }),
                new TextRun({ text: `\t${e.start} – ${e.end}`, italics: true, size: fontSize - 2, color: secSubColor, font }),
              ],
              tabStops: [{ type: AlignmentType.RIGHT, position: 9000 }],
            }));
            e.bullets?.forEach(b => out.push(bullet(b, isSidebar, "experience")));
            out.push(new Paragraph({ spacing: { after: 100 } }));
          });
        }
        break;
      case "leadership":
        if (data.leadership?.length) {
          out.push(H(getSectionTitle(data, "leadership", "Leadership Experience"), isSidebar));
          const secStyle = secStyles?.leadership;
          const fontSize = secStyle?.fontSize ? secStyle.fontSize * 2 : baseSize;
          data.leadership.forEach(l => {
            out.push(new Paragraph({
              children: [
                new TextRun({ text: `${l.role}`, bold: true, size: fontSize, font, color: secTextColor }),
                new TextRun({ text: ` — ${l.organization}`, size: fontSize, font, color: isSidebar ? secTextColor : accent }),
                l.location ? new TextRun({ text: `, ${l.location}`, size: fontSize, font, color: secSubColor }) : new TextRun({ text: "" }),
                new TextRun({ text: `\t${l.start || ""} – ${l.end || ""}`, italics: true, size: fontSize - 2, color: secSubColor, font }),
              ],
              tabStops: [{ type: AlignmentType.RIGHT, position: 9000 }],
            }));
            l.bullets?.forEach(b => out.push(bullet(b, isSidebar, "leadership")));
            out.push(new Paragraph({ spacing: { after: 100 } }));
          });
        }
        break;
      case "projects":
        if (data.projects?.length) {
          out.push(H(getSectionTitle(data, "projects", "Projects"), isSidebar));
          const secStyle = secStyles?.projects;
          const fontSize = secStyle?.fontSize ? secStyle.fontSize * 2 : baseSize;
          data.projects.forEach(p => {
            out.push(new Paragraph({
              children: [
                new TextRun({ text: p.name, bold: true, size: fontSize, font, color: secTextColor }),
                p.tech ? new TextRun({ text: ` — ${p.tech}`, italics: true, size: fontSize - 2, color: secSubColor, font }) : new TextRun(""),
              ],
            }));
            p.bullets?.forEach(b => out.push(bullet(b, isSidebar, "projects")));
          });
        }
        break;
      case "education":
        if (data.education?.length) {
          out.push(H(getSectionTitle(data, "education", "Education"), isSidebar));
          const secStyle = secStyles?.education;
          const fontSize = secStyle?.fontSize ? secStyle.fontSize * 2 : baseSize;
          data.education.forEach(e => {
            out.push(new Paragraph({
              children: [
                new TextRun({ text: e.degree, bold: true, size: fontSize, font, color: secTextColor }),
                new TextRun({ text: ` — ${e.school}${e.location ? `, ${e.location}` : ""}`, size: fontSize, font, color: secTextColor }),
                new TextRun({ text: `   ${e.start} – ${e.end}`, italics: true, size: fontSize - 2, color: secSubColor, font }),
              ],
            }));
            if (e.details) out.push(P(e.details, { size: fontSize - 2, sectionKey: "education", color: secSubColor }));
          });
        }
        break;
      case "skills":
        if (data.skills?.length) {
          out.push(H(getSectionTitle(data, "skills", "Skills"), isSidebar));
          const secStyle = secStyles?.skills;
          const fontSize = secStyle?.fontSize ? secStyle.fontSize * 2 : (isSidebar ? Math.round(baseSize * 0.9) : baseSize);
          
          if (isSidebar) {
            const allItems = data.skills.flatMap(s => s.items);
            allItems.forEach(it => {
              out.push(new Paragraph({
                spacing: { after: 30 },
                children: [
                  new TextRun({ text: "▪ ", size: Math.round(fontSize * 0.8), color: cfg.sidebarHeadingColor || "FFFFFF", font }),
                  new TextRun({ text: it, size: fontSize, color: secTextColor || "FFFFFF", font }),
                ],
              }));
            });
          } else {
            data.skills.forEach(s => out.push(new Paragraph({
              children: [
                new TextRun({ text: isGenericSkillCategory(s.category) ? "" : `${s.category}: `, bold: true, size: fontSize, font }),
                new TextRun({ text: s.items.join(", "), size: fontSize, font }),
              ],
            })));
          }
        }
        break;
      case "certifications":
        if (data.certifications?.length) {
          out.push(H(getSectionTitle(data, "certifications", "Certifications"), isSidebar));
          data.certifications.forEach(c => out.push(bullet(c, isSidebar, "certifications")));
        }
        break;
    }
    return out;
  };

  const order = getNormalizedSectionOrder(data.settings?.sectionOrder, data);


  /* =========================================================================
   * SINGLE COLUMN LAYOUTS (classic, compact, executive, minimal, timeline, elegant, centered-serif, photo-grid, logo-boxed)
   * ========================================================================= */
  if (cfg.layout === "single-column") {
    const children: (Paragraph | Table)[] = [];
    const contact = contactLines.join("  •  ");

    if (cfg.namePlacement === "header-centered") {
      children.push(P(data.name || "Your Name", { bold: true, size: (secStyles?.headings?.fontSize || 22) * 2, align: AlignmentType.CENTER, color: accent }));
      if (data.title) children.push(P(data.title, { size: baseSize + 2, align: AlignmentType.CENTER, italic: template === "elegant" }));
      if (contact) children.push(P(contact, { size: baseSize - 2, align: AlignmentType.CENTER, color: "555555", spacing: { after: 120 } }));
    } else if (cfg.namePlacement === "header-split") {
      // Split header for compact / executive
      children.push(new Paragraph({
        border: { bottom: { color: accent, size: 12, style: BorderStyle.SINGLE, space: 6 } },
        spacing: { after: 120 },
        children: [
          new TextRun({ text: data.name || "Your Name", bold: true, size: (secStyles?.headings?.fontSize || 20) * 2, font, color: accent }),
          new TextRun({ text: data.title ? `\n${data.title}` : "", size: baseSize, italics: true, color: "555555", font }),
          new TextRun({ text: `\t${contactLines.join("  |  ")}`, size: baseSize - 2, color: "666666", font }),
        ],
        tabStops: [{ type: AlignmentType.RIGHT, position: 9000 }],
      }));
    } else if (cfg.namePlacement === "header-executive") {
      children.push(new Paragraph({
        border: { bottom: { color: "92400E", size: 16, style: BorderStyle.SINGLE, space: 6 } },
        spacing: { after: 140 },
        children: [
          new TextRun({ text: data.name || "Your Name", bold: true, size: 48, font, color: "92400E" }),
          new TextRun({ text: data.title ? `\n${data.title}` : "", size: baseSize + 2, italics: true, color: "444444", font }),
          new TextRun({ text: `\t${contactLines.join("  •  ")}`, size: baseSize - 2, color: "666666", font }),
        ],
        tabStops: [{ type: AlignmentType.RIGHT, position: 9000 }],
      }));
    } else {
      // Left aligned (minimal, timeline)
      children.push(P(data.name || "Your Name", { bold: true, size: (secStyles?.headings?.fontSize || 22) * 2, color: accent }));
      if (data.title) children.push(P(data.title, { size: baseSize + 2, color: "555555" }));
      if (contact) children.push(P(contactLines.join("   ·   "), { size: baseSize - 2, color: "777777", spacing: { after: 120 } }));
    }

    order.forEach(key => children.push(...sectionParagraphs(key, false)));
    return { layout: "single-column" as const, children };
  }

  /* =========================================================================
   * TWO-COLUMN LAYOUTS (modern, teal-left, sidebar-dark, creative, photo-header, banner-photo)
   * ========================================================================= */
  const TOTAL = 9360;
  const LEFT_WIDTH = cfg.sidebarWidthDXA || 3280;
  const RIGHT_WIDTH = TOTAL - LEFT_WIDTH;
  const noBorder = { style: BorderStyle.NONE, size: 0, color: "FFFFFF" };
  const cellBorders = { top: noBorder, bottom: noBorder, left: noBorder, right: noBorder };

  const sidebarSections = cfg.sidebarSections || ["skills", "certifications"];
  const sidebarItems: Paragraph[] = [];
  const mainItems: Paragraph[] = [];

  // 1. Sidebar Header (Name, Title, Contact) for left sidebar templates (e.g. Modern, Teal-Left)
  if (cfg.namePlacement === "sidebar") {
    sidebarItems.push(new Paragraph({
      spacing: { before: 40, after: 30 },
      children: [new TextRun({ text: data.name || "Your Name", bold: true, size: Math.round(baseSize * 1.5), color: cfg.sidebarTextColor || "FFFFFF", font })],
    }));
    if (data.title) {
      sidebarItems.push(new Paragraph({
        spacing: { after: 100 },
        children: [new TextRun({ text: data.title, size: baseSize, color: cfg.sidebarSubTextColor || "D1FAE5", font })],
      }));
    }
    if (contactLines.length) {
      contactLines.forEach(line => {
        sidebarItems.push(new Paragraph({
          spacing: { after: 20 },
          children: [new TextRun({ text: line, size: Math.round(baseSize * 0.85), color: cfg.sidebarSubTextColor || "E2E8F0", font })],
        }));
      });
      sidebarItems.push(new Paragraph({ spacing: { after: 80 } }));
    }
  }

  // 2. Main Header for sidebar-dark (where Name is on the left main column)
  if (cfg.namePlacement === "header-left") {
    mainItems.push(P(data.name || "Your Name", { bold: true, size: (secStyles?.headings?.fontSize || 22) * 2, color: accent }));
    if (data.title) mainItems.push(P(data.title, { size: baseSize + 2, color: accent }));
    if (contactLines.length) {
      mainItems.push(P(contactLines.join("  •  "), { size: baseSize - 2, color: "555555", spacing: { after: 120 } }));
    }
  }

  // 3. Populate Sidebar and Main items based on template section distribution
  order.forEach(key => {
    if (sidebarSections.includes(key as string)) {
      sidebarItems.push(...sectionParagraphs(key, true));
    } else {
      mainItems.push(...sectionParagraphs(key, false));
    }
  });

  // 4. Build Table based on layout type
  const isLeftSidebar = cfg.layout === "sidebar-left";
  const leftCellWidth = isLeftSidebar ? LEFT_WIDTH : RIGHT_WIDTH;
  const rightCellWidth = isLeftSidebar ? RIGHT_WIDTH : LEFT_WIDTH;
  const leftCellChildren = isLeftSidebar ? sidebarItems : mainItems;
  const rightCellChildren = isLeftSidebar ? mainItems : sidebarItems;
  const leftBg = isLeftSidebar ? (cfg.sidebarBg || "065F46") : "FFFFFF";
  const rightBg = isLeftSidebar ? "FFFFFF" : (cfg.sidebarBg || "F3F4F6");

  const table = new Table({
    width: { size: TOTAL, type: WidthType.DXA },
    columnWidths: [leftCellWidth, rightCellWidth],
    borders: {
      top: noBorder, bottom: noBorder, left: noBorder, right: noBorder,
      insideHorizontal: noBorder, insideVertical: noBorder,
    },
    rows: [
      new TableRow({
        children: [
          new TableCell({
            width: { size: leftCellWidth, type: WidthType.DXA },
            borders: cellBorders,
            margins: { top: 120, bottom: 120, left: 160, right: 160 },
            shading: { fill: leftBg, type: ShadingType.CLEAR, color: "auto" },
            verticalAlign: VerticalAlign.TOP,
            children: leftCellChildren.length ? leftCellChildren : [new Paragraph({})],
          }),
          new TableCell({
            width: { size: rightCellWidth, type: WidthType.DXA },
            borders: cellBorders,
            margins: { top: 120, bottom: 120, left: 200, right: 160 },
            shading: { fill: rightBg, type: ShadingType.CLEAR, color: "auto" },
            verticalAlign: VerticalAlign.TOP,
            children: rightCellChildren.length ? rightCellChildren : [new Paragraph({})],
          }),
        ],
      }),
    ],
  });

  // 5. Top Banner for banner layouts (creative, photo-header, banner-photo)
  if (cfg.namePlacement === "banner") {
    const bannerItems: Paragraph[] = [];
    bannerItems.push(new Paragraph({
      spacing: { before: 80, after: 40 },
      children: [new TextRun({ text: data.name || "Your Name", bold: true, size: 40, color: cfg.bannerTextColor || "FFFFFF", font })],
    }));
    if (data.title) {
      bannerItems.push(new Paragraph({
        spacing: { after: 60 },
        children: [new TextRun({ text: data.title, size: baseSize + 2, color: "E0E7FF", font })],
      }));
    }
    if (contactLines.length) {
      bannerItems.push(new Paragraph({
        spacing: { after: 80 },
        children: [new TextRun({ text: contactLines.join("   ·   "), size: baseSize - 2, color: "C7D2FE", font })],
      }));
    }

    const bannerTable = new Table({
      width: { size: TOTAL, type: WidthType.DXA },
      columnWidths: [TOTAL],
      borders: {
        top: noBorder, bottom: noBorder, left: noBorder, right: noBorder,
        insideHorizontal: noBorder, insideVertical: noBorder,
      },
      rows: [
        new TableRow({
          children: [
            new TableCell({
              width: { size: TOTAL, type: WidthType.DXA },
              borders: cellBorders,
              margins: { top: 140, bottom: 140, left: 200, right: 200 },
              shading: { fill: cfg.bannerBg || "4338CA", type: ShadingType.CLEAR, color: "auto" },
              children: bannerItems,
            }),
          ],
        }),
      ],
    });

    return { layout: "two-column" as const, children: [bannerTable, new Paragraph({ spacing: { after: 100 } }), table] as (Paragraph | Table)[] };
  }

  return { layout: "two-column" as const, children: [table] as (Paragraph | Table)[] };
}

export function buildResumeDocument(rawData: ResumeData, template: TemplateId) {
  const { children } = buildResumeDocxBody(rawData, template);
  return new Document({
    numbering: {
      config: [{
        reference: "bullets",
        levels: [{ level: 0, format: LevelFormat.BULLET, text: "•", alignment: AlignmentType.LEFT,
          style: { paragraph: { indent: { left: 480, hanging: 260 } } } }],
      }],
    },
    sections: [{
      properties: { page: { margin: { top: 720, right: 720, bottom: 720, left: 720 } } },
      children,
    }],
  });
}

export async function downloadResumeDocxFromData(rawData: ResumeData, template: TemplateId) {
  const data = normalizeResumeSkills(rawData);
  const doc = buildResumeDocument(rawData, template);
  const blob = await Packer.toBlob(doc);
  saveBlob(blob, `${safeName(data.name)}-${template}-Editable.docx`);
}

/* ---------- Structured plain-text / markdown exports ---------- */
function stripRich(text: string) {
  return parseRichSegments(text || "").map(s => s.text).join("");
}

export function buildResumeText(rawData: ResumeData): string {
  const data = normalizeResumeSkills(rawData);
  const L: string[] = [];
  L.push((data.name || "Resume").toUpperCase());
  if (data.title) L.push(stripRich(data.title));
  const contact = [data.email, data.phone, data.location, ...(data.links?.map(l => `${l.label}: ${l.url}`) ?? [])].filter(Boolean);
  if (contact.length) L.push(contact.join(" | "));
  L.push("");
  const head = (t: string) => { L.push(t.toUpperCase()); L.push("-".repeat(60)); };
  let order = getNormalizedSectionOrder(data.settings?.sectionOrder, data);
  order.forEach(key => {
    switch (key) {
      case "summary":
        if (data.summary) { head(getSectionTitle(data, "summary", "Professional Summary")); L.push(stripRich(data.summary)); L.push(""); }
        break;
      case "experience":
        if (data.experience?.length) {
          head(getSectionTitle(data, "experience", "Experience"));
          data.experience.forEach(e => {
            L.push(`${stripRich(e.role)} — ${stripRich(e.company)}${e.location ? `, ${e.location}` : ""} (${e.start} – ${e.end})`);
            e.bullets?.forEach(b => L.push(`* ${stripRich(b)}`));
            L.push("");
          });
        }
        break;
      case "leadership":
        if (data.leadership?.length) {
          head(getSectionTitle(data, "leadership", "Leadership Experience"));
          data.leadership.forEach(l => {
            L.push(`${stripRich(l.role)} — ${stripRich(l.organization)}${l.location ? `, ${l.location}` : ""} (${l.start || ""} – ${l.end || ""})`);
            l.bullets?.forEach(b => L.push(`* ${stripRich(b)}`));
            L.push("");
          });
        }
        break;
      case "education":
        if (data.education?.length) {
          head(getSectionTitle(data, "education", "Education"));
          data.education.forEach(e => {
            L.push(`${stripRich(e.degree)} — ${stripRich(e.school)}${e.location ? `, ${e.location}` : ""} (${e.start} – ${e.end})`);
            if (e.details) L.push(stripRich(e.details));
          });
          L.push("");
        }
        break;
      case "projects":
        if (data.projects?.length) {
          head(getSectionTitle(data, "projects", "Projects"));
          data.projects.forEach(p => {
            L.push(`${stripRich(p.name)}${p.tech ? ` — ${stripRich(p.tech)}` : ""}`);
            p.bullets?.forEach(b => L.push(`* ${stripRich(b)}`));
          });
          L.push("");
        }
        break;
      case "skills":
        if (data.skills?.length) {
          head(getSectionTitle(data, "skills", "Skills"));
          data.skills.forEach(s => L.push(`${isGenericSkillCategory(s.category) ? "" : `${s.category}: `}${s.items.join(", ")}`));
          L.push("");
        }
        break;
      case "certifications":
        if (data.certifications?.length) {
          head(getSectionTitle(data, "certifications", "Certifications"));
          data.certifications.forEach(c => L.push(`* ${stripRich(c)}`));
          L.push("");
        }
        break;
    }
  });
  return L.join("\n");
}

export function buildResumeMarkdown(rawData: ResumeData): string {
  const data = normalizeResumeSkills(rawData);
  const M: string[] = [];
  M.push(`# ${data.name || "Resume"}`);
  if (data.title) M.push(`**${stripRich(data.title)}**`);
  const contact = [data.email, data.phone, data.location, ...(data.links?.map(l => `[${l.label}](${l.url})`) ?? [])].filter(Boolean);
  if (contact.length) M.push(contact.join(" · "));
  M.push("");
  let order = getNormalizedSectionOrder(data.settings?.sectionOrder, data);
  order.forEach(key => {
    switch (key) {
      case "summary":
        if (data.summary) { M.push(`## ${getSectionTitle(data, "summary", "Professional Summary")}`); M.push(stripRich(data.summary)); M.push(""); }
        break;
      case "experience":
        if (data.experience?.length) {
          M.push(`## ${getSectionTitle(data, "experience", "Experience")}`);
          data.experience.forEach(e => {
            M.push(`### ${stripRich(e.role)} — ${stripRich(e.company)}`);
            M.push(`*${[e.location, `${e.start} – ${e.end}`].filter(Boolean).join(" · ")}*`);
            e.bullets?.forEach(b => M.push(`- ${stripRich(b)}`));
            M.push("");
          });
        }
        break;
      case "leadership":
        if (data.leadership?.length) {
          M.push(`## ${getSectionTitle(data, "leadership", "Leadership Experience")}`);
          data.leadership.forEach(l => {
            M.push(`### ${stripRich(l.role)} — ${stripRich(l.organization)}`);
            M.push(`*${[l.location, `${l.start || ""} – ${l.end || ""}`].filter(Boolean).join(" · ")}*`);
            l.bullets?.forEach(b => M.push(`- ${stripRich(b)}`));
            M.push("");
          });
        }
        break;
      case "education":
        if (data.education?.length) {
          M.push(`## ${getSectionTitle(data, "education", "Education")}`);
          data.education.forEach(e => {
            M.push(`**${stripRich(e.degree)}** — ${stripRich(e.school)}${e.location ? `, ${e.location}` : ""} *(${e.start} – ${e.end})*`);
            if (e.details) M.push(stripRich(e.details));
          });
          M.push("");
        }
        break;
      case "projects":
        if (data.projects?.length) {
          M.push(`## ${getSectionTitle(data, "projects", "Projects")}`);
          data.projects.forEach(p => {
            M.push(`### ${stripRich(p.name)}${p.tech ? ` — ${stripRich(p.tech)}` : ""}`);
            p.bullets?.forEach(b => M.push(`- ${stripRich(b)}`));
            M.push("");
          });
        }
        break;
      case "skills":
        if (data.skills?.length) {
          M.push(`## ${getSectionTitle(data, "skills", "Skills")}`);
          data.skills.forEach(s => M.push(`- ${isGenericSkillCategory(s.category) ? "" : `**${s.category}:** `}${s.items.join(", ")}`));
          M.push("");
        }
        break;
      case "certifications":
        if (data.certifications?.length) {
          M.push(`## ${getSectionTitle(data, "certifications", "Certifications")}`);
          data.certifications.forEach(c => M.push(`- ${stripRich(c)}`));
          M.push("");
        }
        break;
    }
  });
  return M.join("\n");
}

export function downloadResumeTxtFromData(rawData: ResumeData) {
  const blob = new Blob([buildResumeText(rawData)], { type: "text/plain;charset=utf-8" });
  saveBlob(blob, `${safeName(rawData.name)}.txt`);
}

export function downloadResumeMarkdownFromData(rawData: ResumeData) {
  const blob = new Blob([buildResumeMarkdown(rawData)], { type: "text/markdown;charset=utf-8" });
  saveBlob(blob, `${safeName(rawData.name)}.md`);
}

function safeName(name: string) {
  const safe = (name || "resume").replace(/[^a-z0-9-_ ]/gi, "").replace(/\s+/g, "-").toLowerCase();
  return safe || "resume";
}

/* ---------- Build ResumeData verbatim from raw user input (no AI) ---------- */
export interface RawProfileInput {
  name: string; title: string; email: string; phone: string; location: string;
  linkedin?: string; github?: string; portfolio?: string;
  summary: string;
  experience: { company: string; role: string; location: string; start: string; end: string; description: string }[];
  leadership?: { role: string; organization: string; location?: string; start?: string; end?: string; description?: string; bullets?: string[] }[];
  education: { school: string; degree: string; location: string; start: string; end: string; details: string }[];
  projects: { name: string; tech: string; description: string }[];
  skills: string;         // raw textarea
  certifications: string; // raw textarea
  settings?: ResumeData["settings"];

}

export function buildResumeDataVerbatim(input: RawProfileInput): ResumeData {
  const toBullets = (text: string) => {
    if (!text) return [];
    return text
      .split(/\r?\n/)
      .map(l => l.replace(/^\s*[-*•]\s?/, "").trim())
      .filter(Boolean);
  };

  const parseSkills = (raw: string): ResumeData["skills"] => {
    if (!raw) return [];
    const lines = raw.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
    const grouped: ResumeData["skills"] = [];
    const flat: string[] = [];
    for (const l of lines) {
      const m = l.match(/^([^:]+):\s*(.+)$/);
      if (m) {
        grouped.push({ category: m[1].trim(), items: m[2].split(",").map(s => s.trim()).filter(Boolean) });
      } else {
        flat.push(l);
      }
    }
    if (flat.length) {
      grouped.push({ category: "Skills", items: flat });
    }
    return grouped;
  };

  return {
    name: input.name || "",
    title: input.title || "",
    email: input.email || "",
    phone: input.phone || "",
    location: input.location || "",
    links: (input as any).links || [
      input.linkedin && { label: "LinkedIn", url: input.linkedin },
      input.github && { label: "GitHub", url: input.github },
      input.portfolio && { label: "Portfolio", url: input.portfolio },
    ].filter(Boolean),
    summary: input.summary || "",
    experience: (input.experience || []).map(e => ({
      company: e.company || "",
      role: e.role || "",
      location: e.location || "",
      start: e.start || "",
      end: e.end || "",
      bullets: toBullets(e.description),
    })),
    leadership: input.leadership?.map(l => ({
      role: l.role || "",
      organization: l.organization || "",
      location: l.location || "",
      start: l.start || "",
      end: l.end || "",
      bullets: l.bullets || toBullets(l.description || ""),
    })),
    education: (input.education || []).map(e => ({
      school: e.school || "",
      degree: e.degree || "",
      location: e.location || "",
      start: e.start || "",
      end: e.end || "",
      details: e.details || "",
    })),
    projects: (input.projects || []).map(p => ({
      name: p.name || "",
      tech: p.tech || "",
      bullets: toBullets(p.description),
    })),
    skills: parseSkills(input.skills),
    certifications: input.certifications ? input.certifications.split(/\r?\n/).map(s => s.trim()).filter(Boolean) : [],
    settings: input.settings,
  };
}

