import React, { useEffect, useRef, useState } from "react";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import {
  Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType,
  BorderStyle, LevelFormat, PageBreak,
  Table, TableRow, TableCell, WidthType, ShadingType, VerticalAlign,
} from "docx";
import { Droppable, Draggable } from "react-beautiful-dnd";
import { MousePointer2 } from "lucide-react";
import { ResumeContextMenu, ContextMenuPosition } from "@/components/ResumeContextMenu";


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



export interface ResumeSettings {
  fontSize?: number;
  headingSize?: number;
  fontFamily?: string;
  sectionSpacing?: number;
  paragraphSpacing?: number;
  lineSpacing?: number;
  marginTopBottom?: number;
  marginSide?: number;
  paragraphIndent?: number;
  sections?: Partial<Record<ResumeSectionKey, SectionStyle>>;
  sectionOrder?: string[];
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
  | "centered-serif" | "banner-photo" | "teal-left" | "photo-grid" | "logo-boxed";

export const TEMPLATES: { id: TemplateId; name: string; desc: string; previewUrl?: string }[] = [
  { 
    id: "modern", 
    name: "Modern Professional", 
    desc: "Clean sidebar layout with emerald accents, ideal for technology and design roles.",
    previewUrl: "/__l5e/assets-v1/270ae0f4-90a9-4cce-8613-5f0c2759fea3/resume-modern.png" 
  },
  { 
    id: "executive", 
    name: "Executive Serif", 
    desc: "Distinguished typography with amber-toned headers for senior leadership positions.",
    previewUrl: "/__l5e/assets-v1/799a2e4f-96fe-40f9-bdc9-fb2c1276ba9d/resume-executive.png" 
  },
  { 
    id: "creative", 
    name: "Creative Indigo", 
    desc: "Bold gradient header and two-column structure for marketing and creative professionals.",
    previewUrl: "/__l5e/assets-v1/3af83925-7929-49ab-ba75-a80ffe563299/resume-creative.png" 
  },
  { 
    id: "minimal", 
    name: "Ultra Minimal", 
    desc: "Sophisticated use of whitespace and light weights for a modern, airy aesthetic.",
    previewUrl: "/__l5e/assets-v1/4a23c33e-0f60-4bca-8abc-f50a3631fdce/resume-minimal.png" 
  },
  { 
    id: "classic", 
    name: "Classic ATS-Optimized", 
    desc: "Single-column format designed for maximum compatibility with tracking systems.",
    previewUrl: "/__l5e/assets-v1/bce36fa0-e17a-4422-a3b1-2201bb09f002/resume-classic.png" 
  }
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
                ? html.replace(/<div>/gi, multiline ? "<div>" : " ").replace(/<\/div>/gi, "").trim()
                : (e.currentTarget.innerText as string).replace(/\s+/g, " ").trim();
              if (txt !== value) onChange!(txt);
            }
          : undefined
      }
      dangerouslySetInnerHTML={value?.includes("<") ? { __html: value } : undefined}
    >
      {!value?.includes("<") ? value : null}
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

/** Merge all generic-category skill groups into a single group so "Skills" appears once. */
export function normalizeResumeSkills<T extends { skills?: { category: string; items: string[] }[] }>(r: T): T {
  if (!r?.skills?.length) return r;
  const generic: string[] = [];
  const named: { category: string; items: string[] }[] = [];
  for (const g of r.skills) {
    if (isGenericSkillCategory(g.category)) generic.push(...(g.items || []));
    else named.push(g);
  }
  if (generic.length === 0) return r;
  const seen = new Set<string>();
  const items = generic.filter(i => { const k = i.trim().toLowerCase(); if (!k || seen.has(k)) return false; seen.add(k); return true; });
  return { ...r, skills: [{ category: "Skills", items }, ...named] };
}


export type RichSegment = { text: string; bold: boolean; italic: boolean; underline: boolean; fontSize?: number; fontFamily?: string };

/** Parse inline HTML produced by the editable preview into styled segments used by PDF/DOCX export. */
export function parseRichSegments(html: string): RichSegment[] {
  if (!html) return [{ text: "", bold: false, italic: false, underline: false }];
  if (typeof document === "undefined" || !/[<&]/.test(html)) {
    return [{ text: html, bold: false, italic: false, underline: false }];
  }
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

/* ---------- HTML Preview components ---------- */
function ModernPreview({ r, update }: { r: ResumeData; update?: UpdateFn }) {
  const on = (patch: Partial<ResumeData>) => update?.(patch);
  const sectionOrder = getNormalizedSectionOrder(r.settings?.sectionOrder, r);


  const renderSection = (key: string, index: number) => {
    let content = null;
    let title = "";
    
    switch(key) {
      case "summary":
        if (r.summary || update) {
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
              {title}
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
      className="bg-white text-neutral-900 shadow-elegant rounded-lg overflow-hidden font-sans text-[11px] leading-snug" 
      style={{ 
        minHeight: "var(--page-h, auto)",
        fontSize: r.settings?.fontSize ? `${r.settings.fontSize}px` : undefined,
        fontFamily: r.settings?.fontFamily || undefined
      }}
    >
      <div className="grid grid-cols-[35%_65%] h-full min-h-[1056px]">
        <div className="bg-emerald-800 text-white p-5">
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
              <div className="uppercase tracking-wider text-[9px] font-bold border-b border-emerald-600 pb-1 mb-2">Skills</div>
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
              <div className="uppercase tracking-wider text-[9px] font-bold border-b border-emerald-600 pb-1 mb-2">Certifications</div>
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
        if (r.summary || update) {
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
                    <Editable value={s.items.join(", ")} onChange={update && (v => upd({ items: v.split(",").map(x => x.trim()).filter(Boolean) }))} />
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
              {title}
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
        if (r.summary || update) {
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
              <div key={i} className="mb-1"><SkillCat value={s.category} onChange={update && (v => upd({ category: v }))} className="font-semibold" colon /> <Editable value={s.items.join(", ")} onChange={update && (v => upd({ items: v.split(",").map(x => x.trim()).filter(Boolean) }))} /></div>
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
                {title}
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
        if (r.summary || update) {
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
              <div key={i}><SkillCat value={s.category} onChange={update && (v => upd({ category: v }))} className="font-bold" colon /> <Editable value={s.items.join(", ")} onChange={update && (v => upd({ items: v.split(",").map(x => x.trim()).filter(Boolean) }))} /></div>
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
              {title}
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
  return (
    <div className="bg-white text-neutral-900 shadow-elegant rounded-lg overflow-hidden font-sans text-[11px] leading-snug" style={{ minHeight: "var(--page-h, auto)", fontSize: r.settings?.fontSize ? `${r.settings.fontSize}px` : undefined, fontFamily: r.settings?.fontFamily || undefined }}>
      <div className="p-5 bg-gradient-to-r from-indigo-700 via-indigo-600 to-fuchsia-600 text-white">
        <Editable as="div" value={r.name || "Your Name"} onChange={update && (v => on({ name: v }))} className="font-extrabold text-2xl tracking-tight" />
        <Editable as="div" value={r.title} onChange={update && (v => on({ title: v }))} className="text-indigo-100 text-[11px]" />
        <div className="flex flex-wrap gap-x-3 mt-2 text-[10px] text-indigo-50">
          <Editable value={r.email} onChange={update && (v => on({ email: v }))} />
          <Editable value={r.phone} onChange={update && (v => on({ phone: v }))} />
          <Editable value={r.location} onChange={update && (v => on({ location: v }))} />
          {r.links?.map((l, i) => (
            <Editable key={i} value={l.url} onChange={update && (v => on({ links: r.links.map((x, j) => j === i ? { ...x, url: v } : x) }))} />
          ))}
        </div>
      </div>
      <div className="grid grid-cols-[65%_35%] gap-4 p-5">
        <div>
          {(r.summary || update) && (
            <section className="mb-3">
              <h3 className="text-[10px] font-bold uppercase tracking-widest text-indigo-700 mb-1">About</h3>
              <Editable as="p" multiline value={r.summary} onChange={update && (v => on({ summary: v }))} className="whitespace-pre-wrap text-[10px]" />
            </section>
          )}
          {r.experience?.length > 0 && (
            <section className="mb-3">
              <h3 className="text-[10px] font-bold uppercase tracking-widest text-indigo-700 mb-1">Experience</h3>
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
          )}
          {r.projects?.length > 0 && (
            <section className="mb-3">
              <h3 className="text-[10px] font-bold uppercase tracking-widest text-indigo-700 mb-1">Projects</h3>
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
          )}
          {r.leadership && r.leadership.length > 0 && (
            <section className="mb-3">
              <h3 className="text-[10px] font-bold uppercase tracking-widest text-indigo-700 mb-1">Leadership</h3>
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
          )}
        </div>
        <div>
          {r.skills?.length > 0 && (
            <section className="mb-3">
              <h3 className="text-[10px] font-bold uppercase tracking-widest text-indigo-700 mb-1">Skills</h3>
              <div className="space-y-1">
                {r.skills.map((s, i) => {
                  const upd = makeSkillUpdater(update, r, i);
                  return (
                    <div key={i} className="mb-1">
                      <SkillCat as="div" value={s.category} onChange={update && (v => upd({ category: v }))} className="font-semibold text-[10px]" />
                      <Editable as="div" value={s.items.join(", ")} onChange={update && (v => upd({ items: v.split(",").map(x => x.trim()).filter(Boolean) }))} className="text-[9.5px] text-neutral-700 mt-0.5" />
                    </div>
                  );
                })}
              </div>
            </section>
          )}
          {r.education?.length > 0 && (
            <section className="mb-3">
              <h3 className="text-[10px] font-bold uppercase tracking-widest text-indigo-700 mb-1">Education</h3>
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
          )}
          {r.certifications?.length > 0 && (
            <section>
              <h3 className="text-[10px] font-bold uppercase tracking-widest text-indigo-700 mb-1">Certs</h3>
              <Editable as="div" multiline value={r.certifications.join("\n")} onChange={update && (v => on({ certifications: v.split("\n").map(x => x.trim()).filter(Boolean) }))} className="text-[10px] whitespace-pre-wrap" />
            </section>
          )}
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
        if (r.summary || update) {
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
                <div className="text-[10px]"><Editable value={s.items.join(", ")} onChange={update && (v => upd({ items: v.split(",").map(x => x.trim()).filter(Boolean) }))} /></div>
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
              {title}
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
 *  - sets --page-h so the sheet always shows a full US-Letter page even when empty
 *  - overlays dashed "Page 2 / 3 / ..." break lines when content overflows one page
 *    so users can visually confirm content spilling onto additional pages.
 */
function PagedSheet({ children }: { children: React.ReactNode }) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const [pageH, setPageH] = React.useState(0);
  const [totalH, setTotalH] = React.useState(0);

  React.useLayoutEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => {
      const w = el.clientWidth;
      const ph = w * (11 / 8.5);
      setPageH(ph);
      setTotalH(el.scrollHeight);
      el.style.setProperty("--page-h", `${ph}px`);
    });
    ro.observe(el);
    // observe children growth too
    if (el.firstElementChild) ro.observe(el.firstElementChild as Element);
    return () => ro.disconnect();
  }, []);

  const pageCount = pageH > 0 ? Math.max(1, Math.ceil(totalH / pageH)) : 1;
  const breaks: number[] = [];
  for (let i = 1; i < pageCount; i++) breaks.push(i * pageH);

  return (
    <div ref={wrapRef} className="relative">
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
  const H = (t: string) => <h3 className="text-[11px] font-bold tracking-widest uppercase text-teal-700 border-b border-teal-200 pb-0.5 mb-2">{t}</h3>;
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
      {(r.summary || update) && (
        <section className="mb-4">{H("Summary")}<Editable as="p" multiline value={r.summary} onChange={update && (v => on({ summary: v }))} className="whitespace-pre-wrap text-[11px]" /></section>
      )}
      {r.experience?.length > 0 && (
        <section className="mb-4">{H("Experience")}
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
        </section>
      )}
      {r.leadership && r.leadership.length > 0 && (
        <section className="mb-4">{H("Leadership")}
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
        </section>
      )}
      {r.education?.length > 0 && (
        <section className="mb-4">{H("Education")}
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
        </section>
      )}
      {r.skills?.length > 0 && (
        <section className="mb-4">{H("Skills")}
          <div className="space-y-1 text-left">
            {r.skills.map((s, i) => {
              const upd = makeSkillUpdater(update, r, i);
              return (
                <div key={i} className="text-[10px] leading-relaxed">
                  <SkillCat value={s.category} onChange={update && (v => upd({ category: v }))} className="font-semibold text-teal-800" colon />{" "}
                  <Editable value={s.items.join(", ")} onChange={update && (v => upd({ items: v.split(",").map(x => x.trim()).filter(Boolean) }))} />
                </div>
              );
            })}
          </div>
        </section>
      )}
      {r.certifications?.length > 0 && (
        <section>{H("Certifications")}
          <Editable value={r.certifications.join(" • ")} onChange={update && (v => on({ certifications: v.split("•").map(x => x.trim()).filter(Boolean) }))} className="text-[10px]" />
        </section>
      )}
    </div>
  );
}

/* ---------- Elegant: cream bg, centered serif with italic summary ---------- */
function ElegantPreview({ r, update }: { r: ResumeData; update?: UpdateFn }) {
  const on = (patch: Partial<ResumeData>) => update?.(patch);
  const H = (t: string) => <h3 className="text-center text-[10px] font-semibold uppercase tracking-[0.35em] text-stone-600 my-3">{t}</h3>;
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
      {(r.summary || update) && (
        <section className="max-w-[85%] mx-auto text-center">
          <Editable as="p" multiline value={r.summary} onChange={update && (v => on({ summary: v }))} className="italic text-[11px] whitespace-pre-wrap" />
        </section>
      )}
      {r.experience?.length > 0 && (
        <section>{H("Experience")}
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
        </section>
      )}
      {r.leadership && r.leadership.length > 0 && (
        <section>{H("Leadership")}
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
        </section>
      )}
      {r.education?.length > 0 && (
        <section>{H("Education")}
          {r.education.map((e, i) => {
            const upd = makeEduUpdater(update, r, i);
            return (
              <div key={i} className="text-center mb-1">
                <div className="font-semibold"><Editable value={e.degree} onChange={update && (v => upd({ degree: v }))} /></div>
                <div className="italic text-[10px] text-stone-600"><Editable value={e.school} onChange={update && (v => upd({ school: v }))} /> · <Editable value={e.start} onChange={update && (v => upd({ start: v }))} />–<Editable value={e.end} onChange={update && (v => upd({ end: v }))} /></div>
              </div>
            );
          })}
        </section>
      )}
      {r.skills?.length > 0 && (
        <section>{H("Skills")}
          <div className="space-y-1 text-center max-w-[90%] mx-auto">
            {r.skills.map((s, i) => {
              const upd = makeSkillUpdater(update, r, i);
              return (
                <div key={i} className="text-[10.5px] leading-relaxed">
                  <SkillCat value={s.category} onChange={update && (v => upd({ category: v }))} className="font-semibold text-stone-700" colon />{" "}
                  <Editable value={s.items.join(", ")} onChange={update && (v => upd({ items: v.split(",").map(x => x.trim()).filter(Boolean) }))} />
                </div>
              );
            })}
          </div>
        </section>
      )}
      {r.certifications?.length > 0 && (
        <section>{H("Certifications")}
          <div className="text-center"><Editable value={r.certifications.join(" • ")} onChange={update && (v => on({ certifications: v.split("•").map(x => x.trim()).filter(Boolean) }))} /></div>
        </section>
      )}
    </div>
  );
}

/* ---------- Sidebar Dark: main content left, dark teal right rail with avatar ---------- */
function SidebarDarkPreview({ r, update }: { r: ResumeData; update?: UpdateFn }) {
  const on = (patch: Partial<ResumeData>) => update?.(patch);
  return (
    <div className="bg-white text-neutral-900 shadow-elegant rounded-lg overflow-hidden font-sans text-[11px] leading-snug" style={{ minHeight: "var(--page-h, auto)", fontSize: r.settings?.fontSize ? `${r.settings.fontSize}px` : undefined, fontFamily: r.settings?.fontFamily || undefined }}>
      <div className="grid grid-cols-[65%_35%] h-full">
        <div className="p-6">
          <Editable as="div" value={r.name || "Your Name"} onChange={update && (v => on({ name: v }))} className="font-bold text-2xl tracking-tight" />
          <Editable as="div" value={r.title} onChange={update && (v => on({ title: v }))} className="text-teal-700 text-[11px] font-medium mt-0.5" />
          <div className="mt-1 text-[10px] text-neutral-600 flex flex-wrap gap-x-3">
            <Editable value={r.phone} onChange={update && (v => on({ phone: v }))} />
            <Editable value={r.email} onChange={update && (v => on({ email: v }))} />
            <Editable value={r.location} onChange={update && (v => on({ location: v }))} />
          </div>
          {(r.summary || update) && (
            <section className="mt-4">
              <h3 className="uppercase text-[10px] font-bold tracking-widest text-teal-800 mb-1">Summary</h3>
              <Editable as="p" multiline value={r.summary} onChange={update && (v => on({ summary: v }))} className="whitespace-pre-wrap text-[10.5px]" />
            </section>
          )}
          {r.experience?.length > 0 && (
            <section className="mt-4">
              <h3 className="uppercase text-[10px] font-bold tracking-widest text-teal-800 mb-1">Experience</h3>
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
          )}
          {r.leadership && r.leadership.length > 0 && (
            <section className="mt-4">
              <h3 className="uppercase text-[10px] font-bold tracking-widest text-teal-800 mb-1">Leadership</h3>
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
          )}
          {r.education?.length > 0 && (
            <section className="mt-3">
              <h3 className="uppercase text-[10px] font-bold tracking-widest text-teal-800 mb-1">Education</h3>
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
          )}
        </div>
        <div className="bg-teal-800 text-teal-50 p-5">
          <div className="mx-auto mb-3 h-16 w-16 rounded-full bg-teal-600 flex items-center justify-center text-xl font-bold text-white ring-2 ring-teal-300/40">
            {initials(r.name)}
          </div>
          {r.links?.length > 0 && (
            <div className="text-[10px] space-y-1 break-words mb-4">
              {r.links.map((l, i) => (
                <Editable key={i} as="div" value={`${l.label}: ${l.url}`} onChange={update && (v => {
                  const [label, ...rest] = v.split(":");
                  on({ links: r.links.map((x, j) => j === i ? { label: (label || "").trim(), url: rest.join(":").trim() } : x) });
                })} />
              ))}
            </div>
          )}
          {r.skills?.length > 0 && (
            <div className="mb-4">
              <div className="uppercase tracking-widest text-[9px] font-bold border-b border-teal-500 pb-1 mb-2">Skills</div>
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
          )}
          {r.certifications?.length > 0 && (
            <div>
              <div className="uppercase tracking-widest text-[9px] font-bold border-b border-teal-500 pb-1 mb-2">Certifications</div>
              <Editable as="div" multiline value={r.certifications.join("\n")} onChange={update && (v => on({ certifications: v.split("\n").map(x => x.trim()).filter(Boolean) }))} className="text-[10px] whitespace-pre-wrap" />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ---------- Photo Header: dark banner with avatar circle on the right ---------- */
function PhotoHeaderPreview({ r, update }: { r: ResumeData; update?: UpdateFn }) {
  const on = (patch: Partial<ResumeData>) => update?.(patch);
  return (
    <div className="bg-white text-neutral-900 shadow-elegant rounded-lg overflow-hidden font-sans text-[11px] leading-snug" style={{ minHeight: "var(--page-h, auto)", fontSize: r.settings?.fontSize ? `${r.settings.fontSize}px` : undefined, fontFamily: r.settings?.fontFamily || undefined }}>
      <div className="bg-slate-800 text-white px-6 py-5 flex items-center gap-4">
        <div className="flex-1 min-w-0">
          <Editable as="div" value={r.name || "Your Name"} onChange={update && (v => on({ name: v }))} className="font-extrabold text-2xl tracking-tight" />
          <Editable as="div" value={r.title} onChange={update && (v => on({ title: v }))} className="text-sky-300 text-[11px] font-medium mt-0.5" />
          <div className="flex flex-wrap gap-x-3 mt-2 text-[10px] text-slate-200">
            <Editable value={r.phone} onChange={update && (v => on({ phone: v }))} />
            <Editable value={r.email} onChange={update && (v => on({ email: v }))} />
            <Editable value={r.location} onChange={update && (v => on({ location: v }))} />
            {r.links?.map((l, i) => (
              <Editable key={i} value={l.url} onChange={update && (v => on({ links: r.links.map((x, j) => j === i ? { ...x, url: v } : x) }))} />
            ))}
          </div>
        </div>
        <div className="h-16 w-16 rounded-full bg-slate-600 ring-2 ring-white/30 flex items-center justify-center text-lg font-bold shrink-0">
          {initials(r.name)}
        </div>
      </div>
      <div className="grid grid-cols-[60%_40%] gap-5 p-6">
        <div>
          {(r.summary || update) && (
            <section className="mb-3">
              <h3 className="text-[10px] font-bold uppercase tracking-widest text-slate-800 border-b border-slate-300 pb-1 mb-2">Summary</h3>
              <Editable as="p" multiline value={r.summary} onChange={update && (v => on({ summary: v }))} className="whitespace-pre-wrap text-[10.5px]" />
            </section>
          )}
          {r.experience?.length > 0 && (
            <section className="mb-3">
              <h3 className="text-[10px] font-bold uppercase tracking-widest text-slate-800 border-b border-slate-300 pb-1 mb-2">Experience</h3>
              {r.experience.map((e, i) => {
                const upd = makeExpUpdater(update, r, i);
                return (
                  <div key={i} className="mb-2">
                    <div className="font-semibold text-[11px]"><Editable value={e.role} onChange={update && (v => upd({ role: v }))} /></div>
                    <div className="flex justify-between text-[10px] text-slate-600">
                      <span><Editable value={e.company} onChange={update && (v => upd({ company: v }))} /></span>
                      <span><Editable value={e.start} onChange={update && (v => upd({ start: v }))} /> – <Editable value={e.end} onChange={update && (v => upd({ end: v }))} /></span>
                    </div>
                    <BulletsEditor bullets={e.bullets || []} onChange={update && (v => upd({ bullets: v }))} className="list-disc pl-4 mt-0.5 text-[10px] space-y-0.5" />
                  </div>
                );
              })}
            </section>
          )}
          {r.leadership && r.leadership.length > 0 && (
            <section className="mb-3">
              <h3 className="text-[10px] font-bold uppercase tracking-widest text-slate-800 border-b border-slate-300 pb-1 mb-2">Leadership</h3>
              {r.leadership.map((l, i) => {
                const upd = makeLeadershipUpdater(update, r, i);
                return (
                  <div key={i} className="mb-2">
                    <div className="font-semibold text-[11px]"><Editable value={l.role} onChange={update && (v => upd({ role: v }))} /></div>
                    <div className="flex justify-between text-[10px] text-slate-600">
                      <span><Editable value={l.organization} onChange={update && (v => upd({ organization: v }))} /></span>
                      <span><Editable value={l.start || ""} onChange={update && (v => upd({ start: v }))} /> – <Editable value={l.end || ""} onChange={update && (v => upd({ end: v }))} /></span>
                    </div>
                    <BulletsEditor bullets={l.bullets || []} onChange={update && (v => upd({ bullets: v }))} className="list-disc pl-4 mt-0.5 text-[10px] space-y-0.5" />
                  </div>
                );
              })}
            </section>
          )}
          {r.education?.length > 0 && (
            <section>
              <h3 className="text-[10px] font-bold uppercase tracking-widest text-slate-800 border-b border-slate-300 pb-1 mb-2">Education</h3>
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
          )}
        </div>
        <div>
          {r.skills?.length > 0 && (
            <section className="mb-3">
              <h3 className="text-[10px] font-bold uppercase tracking-widest text-sky-700 border-b border-sky-200 pb-1 mb-2">Skills</h3>
              <div className="space-y-1">
                {r.skills.map((s, i) => {
                  const upd = makeSkillUpdater(update, r, i);
                  return (
                    <div key={i} className="text-[10px]">
                      <SkillCat as="div" value={s.category} onChange={update && (v => upd({ category: v }))} className="font-semibold text-[10px]" />
                      <Editable as="div" value={s.items.join(", ")} onChange={update && (v => upd({ items: v.split(",").map(x => x.trim()).filter(Boolean) }))} className="text-[9.5px] text-neutral-700" />
                    </div>
                  );
                })}
              </div>
            </section>
          )}
          {r.certifications?.length > 0 && (
            <section>
              <h3 className="text-[10px] font-bold uppercase tracking-widest text-sky-700 border-b border-sky-200 pb-1 mb-2">Certifications</h3>
              <Editable as="div" multiline value={r.certifications.join("\n")} onChange={update && (v => on({ certifications: v.split("\n").map(x => x.trim()).filter(Boolean) }))} className="text-[10px] whitespace-pre-wrap" />
            </section>
          )}
        </div>
      </div>
    </div>
  );
}

/* ---------- Centered Serif (Alexander Taylor): centered header, rule-lined sections ---------- */
function CenteredSerifPreview({ r, update }: { r: ResumeData; update?: UpdateFn }) {
  const on = (patch: Partial<ResumeData>) => update?.(patch);
  const Rule = ({ label }: { label: string }) => (
    <div className="relative my-3">
      <div className="absolute inset-0 flex items-center" aria-hidden="true">
        <div className="w-full border-t border-neutral-300" />
      </div>
      <div className="relative flex justify-start">
        <span className="bg-white pr-3 text-[11px] font-bold uppercase tracking-wider text-neutral-800">
          {label}
        </span>
      </div>
    </div>
  );
  return (
    <div className="bg-white text-neutral-900 shadow-elegant rounded-lg p-8 font-serif text-[11px] leading-snug" style={{ minHeight: "var(--page-h, auto)", fontSize: r.settings?.fontSize ? `${r.settings.fontSize}px` : undefined, fontFamily: r.settings?.fontFamily || undefined }}>
      <div className="text-center">
        <Editable as="div" value={r.name || "Your Name"} onChange={update && (v => on({ name: v }))} className="font-bold text-[26px] tracking-tight" />
        <Editable as="div" value={r.title} onChange={update && (v => on({ title: v }))} className="text-neutral-700 text-[11px] mt-0.5" />
        <div className="text-[10px] text-neutral-600 mt-1 flex flex-wrap gap-x-3 justify-center">
          <Editable value={r.phone} onChange={update && (v => on({ phone: v }))} />
          <Editable value={r.email} onChange={update && (v => on({ email: v }))} />
          {r.links?.map((l, i) => (<Editable key={i} value={l.label} onChange={update && (v => on({ links: r.links.map((x, j) => j === i ? { ...x, label: v } : x) }))} />))}
          <Editable value={r.location} onChange={update && (v => on({ location: v }))} />
        </div>
      </div>
      {(r.summary || update) && (<><Rule label="Summary" /><Editable as="p" multiline value={r.summary} onChange={update && (v => on({ summary: v }))} className="text-left text-[10.5px] whitespace-pre-wrap px-1" /></>)}
      {r.experience?.length > 0 && (<><Rule label="Experience" />{r.experience.map((e, i) => {
        const upd = makeExpUpdater(update, r, i);
        return (
          <div key={i} className="mb-2">
            <div className="flex justify-between"><span className="font-semibold text-neutral-700"><Editable value={e.company} onChange={update && (v => upd({ company: v }))} /></span><span className="text-[10px] text-neutral-600"><Editable value={e.location} onChange={update && (v => upd({ location: v }))} /></span></div>
            <div className="flex justify-between italic"><span><Editable value={e.role} onChange={update && (v => upd({ role: v }))} /></span><span className="text-[10px]"><Editable value={e.start} onChange={update && (v => upd({ start: v }))} /> – <Editable value={e.end} onChange={update && (v => upd({ end: v }))} /></span></div>
            <BulletsEditor bullets={e.bullets || []} onChange={update && (v => upd({ bullets: v }))} className="list-disc pl-5 mt-0.5 text-[10.5px] space-y-0.5" />
          </div>
        );
      })}</>)}
      {r.leadership && r.leadership.length > 0 && (<><Rule label="Leadership" />{r.leadership.map((l, i) => {
        const upd = makeLeadershipUpdater(update, r, i);
        return (
          <div key={i} className="mb-2">
            <div className="flex justify-between"><span className="font-semibold text-neutral-700"><Editable value={l.organization} onChange={update && (v => upd({ organization: v }))} /></span><span className="text-[10px] text-neutral-600"><Editable value={l.location || ""} onChange={update && (v => upd({ location: v }))} /></span></div>
            <div className="flex justify-between italic"><span><Editable value={l.role} onChange={update && (v => upd({ role: v }))} /></span><span className="text-[10px]"><Editable value={l.start || ""} onChange={update && (v => upd({ start: v }))} /> – <Editable value={l.end || ""} onChange={update && (v => upd({ end: v }))} /></span></div>
            <BulletsEditor bullets={l.bullets || []} onChange={update && (v => upd({ bullets: v }))} className="list-disc pl-5 mt-0.5 text-[10.5px] space-y-0.5" />
          </div>
        );
      })}</>)}
      {r.skills?.length > 0 && (
        <>
          <Rule label="Skills" />
          <div className="space-y-1 text-left px-1">
            {r.skills.map((s, i) => {
              const upd = makeSkillUpdater(update, r, i);
              return (
                <div key={i} className="text-[10.5px] leading-relaxed">
                  <SkillCat value={s.category} onChange={update && (v => upd({ category: v }))} className="font-bold" colon />{" "}
                  <Editable value={s.items.join(", ")} onChange={update && (v => upd({ items: v.split(",").map(x => x.trim()).filter(Boolean) }))} />
                </div>
              );
            })}
          </div>
        </>
      )}
      {r.education?.length > 0 && (<><Rule label="Education" />{r.education.map((e, i) => { const upd = makeEduUpdater(update, r, i); return (
        <div key={i} className="flex justify-between mb-1"><span><Editable value={e.school} onChange={update && (v => upd({ school: v }))} /> — <span className="italic"><Editable value={e.degree} onChange={update && (v => upd({ degree: v }))} /></span></span><span className="text-[10px]"><Editable value={e.start} onChange={update && (v => upd({ start: v }))} /> – <Editable value={e.end} onChange={update && (v => upd({ end: v }))} /></span></div>
      ); })}</>)}
      {r.certifications?.length > 0 && (<><Rule label="Certifications" /><div className="text-center text-[10.5px]"><Editable value={r.certifications.join(" • ")} onChange={update && (v => on({ certifications: v.split("•").map(x => x.trim()).filter(Boolean) }))} /></div></>)}
    </div>
  );
}

/* ---------- Banner Photo (Harper Garcia): navy top banner + photo, two-col body ---------- */
function BannerPhotoPreview({ r, update }: { r: ResumeData; update?: UpdateFn }) {
  const on = (patch: Partial<ResumeData>) => update?.(patch);
  return (
    <div className="bg-white text-neutral-900 shadow-elegant rounded-lg overflow-hidden font-sans text-[11px] leading-snug" style={{ minHeight: "var(--page-h, auto)", fontSize: r.settings?.fontSize ? `${r.settings.fontSize}px` : undefined, fontFamily: r.settings?.fontFamily || undefined }}>
      <div className="bg-[#0f2340] text-white px-6 py-6 flex items-center gap-5">
        <div className="flex-1 min-w-0">
          <Editable as="div" value={r.name || "Your Name"} onChange={update && (v => on({ name: v }))} className="font-bold text-2xl tracking-tight uppercase" />
          <Editable as="div" value={r.title} onChange={update && (v => on({ title: v }))} className="text-sky-200 text-[11px] mt-1" />
          <div className="flex flex-wrap gap-x-4 mt-3 text-[10px] text-slate-100">
            <Editable value={r.phone} onChange={update && (v => on({ phone: v }))} />
            <Editable value={r.email} onChange={update && (v => on({ email: v }))} />
            <Editable value={r.location} onChange={update && (v => on({ location: v }))} />
          </div>
        </div>
        <div className="h-20 w-20 rounded-full bg-white/10 ring-4 ring-white/30 flex items-center justify-center text-xl font-bold shrink-0">{initials(r.name)}</div>
      </div>
      <div className="grid grid-cols-[62%_38%] gap-5 p-6">
        <div>
          {(r.summary || update) && (<section className="mb-3"><h3 className="text-[10px] font-bold uppercase tracking-widest text-[#0f2340] mb-1">Summary</h3><Editable as="p" multiline value={r.summary} onChange={update && (v => on({ summary: v }))} className="whitespace-pre-wrap text-[10.5px]" /></section>)}
          {r.experience?.length > 0 && (<section className="mb-3"><h3 className="text-[10px] font-bold uppercase tracking-widest text-[#0f2340] border-b border-slate-300 pb-0.5 mb-1.5">Experience</h3>{r.experience.map((e, i) => { const upd = makeExpUpdater(update, r, i); return (
            <div key={i} className="mb-2">
              <div className="font-semibold text-[11px]"><Editable value={e.role} onChange={update && (v => upd({ role: v }))} /></div>
              <div className="flex justify-between text-[10px] text-slate-600"><span><Editable value={e.company} onChange={update && (v => upd({ company: v }))} /> · <Editable value={e.location} onChange={update && (v => upd({ location: v }))} /></span><span><Editable value={e.start} onChange={update && (v => upd({ start: v }))} /> – <Editable value={e.end} onChange={update && (v => upd({ end: v }))} /></span></div>
              <BulletsEditor bullets={e.bullets || []} onChange={update && (v => upd({ bullets: v }))} className="list-disc pl-4 mt-0.5 text-[10px] space-y-0.5" />
            </div>
          ); })}</section>)}
          {r.leadership && r.leadership.length > 0 && (<section className="mb-3"><h3 className="text-[10px] font-bold uppercase tracking-widest text-[#0f2340] border-b border-slate-300 pb-0.5 mb-1.5">Leadership</h3>{r.leadership.map((l, i) => { const upd = makeLeadershipUpdater(update, r, i); return (
            <div key={i} className="mb-2">
              <div className="font-semibold text-[11px]"><Editable value={l.role} onChange={update && (v => upd({ role: v }))} /></div>
              <div className="flex justify-between text-[10px] text-slate-600"><span><Editable value={l.organization} onChange={update && (v => upd({ organization: v }))} /> · <Editable value={l.location || ""} onChange={update && (v => upd({ location: v }))} /></span><span><Editable value={l.start || ""} onChange={update && (v => upd({ start: v }))} /> – <Editable value={l.end || ""} onChange={update && (v => upd({ end: v }))} /></span></div>
              <BulletsEditor bullets={l.bullets || []} onChange={update && (v => upd({ bullets: v }))} className="list-disc pl-4 mt-0.5 text-[10px] space-y-0.5" />
            </div>
          ); })}</section>)}
          {r.education?.length > 0 && (<section><h3 className="text-[10px] font-bold uppercase tracking-widest text-[#0f2340] border-b border-slate-300 pb-0.5 mb-1.5">Education</h3>{r.education.map((e, i) => { const upd = makeEduUpdater(update, r, i); return (<div key={i} className="mb-1"><div className="font-semibold text-[10.5px]"><Editable value={e.degree} onChange={update && (v => upd({ degree: v }))} /></div><div className="text-[10px] text-slate-600"><Editable value={e.school} onChange={update && (v => upd({ school: v }))} /> · <Editable value={e.start} onChange={update && (v => upd({ start: v }))} />–<Editable value={e.end} onChange={update && (v => upd({ end: v }))} /></div></div>); })}</section>)}
        </div>
        <div>
          {r.skills?.length > 0 && (<section className="mb-3 bg-emerald-50 rounded-lg p-3 border border-emerald-100"><h3 className="text-[10px] font-bold uppercase tracking-widest text-emerald-800 mb-1.5">Key Achievements</h3>{r.skills.map((s, i) => { const upd = makeSkillUpdater(update, r, i); return (<div key={i} className="mb-2"><SkillCat as="div" value={s.category} onChange={update && (v => upd({ category: v }))} className="font-semibold text-[10.5px] text-emerald-900" /><Editable as="div" value={s.items.join(", ")} onChange={update && (v => upd({ items: v.split(",").map(x => x.trim()).filter(Boolean) }))} className="text-[10px] text-emerald-800" /></div>); })}</section>)}
          {r.certifications?.length > 0 && (<section><h3 className="text-[10px] font-bold uppercase tracking-widest text-[#0f2340] mb-1">Training / Courses</h3><Editable as="div" multiline value={r.certifications.join("\n")} onChange={update && (v => on({ certifications: v.split("\n").map(x => x.trim()).filter(Boolean) }))} className="text-[10px] whitespace-pre-wrap" /></section>)}
        </div>
      </div>
    </div>
  );
}

/* ---------- Teal Left (Emma Smith): solid teal left rail ---------- */
function TealLeftPreview({ r, update }: { r: ResumeData; update?: UpdateFn }) {
  const on = (patch: Partial<ResumeData>) => update?.(patch);
  return (
    <div className="bg-white text-neutral-900 shadow-elegant rounded-lg overflow-hidden font-sans text-[11px] leading-snug" style={{ minHeight: "var(--page-h, auto)", fontSize: r.settings?.fontSize ? `${r.settings.fontSize}px` : undefined, fontFamily: r.settings?.fontFamily || undefined }}>
      <div className="grid grid-cols-[35%_65%] h-full">
        <div className="bg-teal-700 text-teal-50 p-5">
          <Editable as="div" value={r.name || "Your Name"} onChange={update && (v => on({ name: v }))} className="font-bold text-lg leading-tight uppercase" />
          <Editable as="div" value={r.title} onChange={update && (v => on({ title: v }))} className="text-teal-100 text-[10px] mt-1" />
          <div className="mt-3 text-[10px] space-y-1 break-words">
            <Editable as="div" value={r.phone} onChange={update && (v => on({ phone: v }))} />
            <Editable as="div" value={r.email} onChange={update && (v => on({ email: v }))} />
            <Editable as="div" value={r.location} onChange={update && (v => on({ location: v }))} />
            {r.links?.map((l, i) => (<Editable key={i} as="div" value={l.label + ": " + l.url} onChange={update && (v => { const [label, ...rest] = v.split(":"); on({ links: r.links.map((x, j) => j === i ? { label: (label || "").trim(), url: rest.join(":").trim() } : x) }); })} />))}
          </div>
          {r.skills?.length > 0 && (<div className="mt-5"><div className="uppercase tracking-widest text-[9px] font-bold border-b border-teal-400 pb-1 mb-2">Key Skills & Achievements</div>{r.skills.map((s, i) => { const upd = makeSkillUpdater(update, r, i); return (<div key={i} className="mb-3 flex gap-2"><div className="h-6 w-6 rounded-full bg-teal-500/30 border border-teal-300 flex items-center justify-center text-[10px] font-bold shrink-0">★</div><div className="flex-1"><SkillCat as="div" value={s.category} onChange={update && (v => upd({ category: v }))} className="font-semibold text-[10px]" /><Editable as="div" value={s.items.join(", ")} onChange={update && (v => upd({ items: v.split(",").map(x => x.trim()).filter(Boolean) }))} className="text-[9.5px] text-teal-100 leading-snug" /></div></div>); })}</div>)}
          {r.certifications?.length > 0 && (<div className="mt-4"><div className="uppercase tracking-widest text-[9px] font-bold border-b border-teal-400 pb-1 mb-2">Certifications</div><Editable as="div" multiline value={r.certifications.join("\n")} onChange={update && (v => on({ certifications: v.split("\n").map(x => x.trim()).filter(Boolean) }))} className="text-[10px] whitespace-pre-wrap" /></div>)}
        </div>
        <div className="p-5">
          {(r.summary || update) && (<section className="mb-3"><h3 className="uppercase text-[10px] font-bold tracking-widest text-teal-800 border-b-2 border-teal-800 pb-1 mb-2">Summary</h3><Editable as="p" multiline value={r.summary} onChange={update && (v => on({ summary: v }))} className="whitespace-pre-wrap text-[10.5px]" /></section>)}
          {r.experience?.length > 0 && (<section className="mb-3"><h3 className="uppercase text-[10px] font-bold tracking-widest text-teal-800 border-b-2 border-teal-800 pb-1 mb-2">Experience</h3>{r.experience.map((e, i) => { const upd = makeExpUpdater(update, r, i); return (
            <div key={i} className="mb-2">
              <div className="flex justify-between"><span className="font-semibold text-[11px]"><Editable value={e.role} onChange={update && (v => upd({ role: v }))} /></span><span className="text-[10px] text-neutral-600"><Editable value={e.start} onChange={update && (v => upd({ start: v }))} /> – <Editable value={e.end} onChange={update && (v => upd({ end: v }))} /></span></div>
              <div className="text-[10px] text-teal-700"><Editable value={e.company} onChange={update && (v => upd({ company: v }))} /></div>
              <BulletsEditor bullets={e.bullets || []} onChange={update && (v => upd({ bullets: v }))} className="list-disc pl-4 mt-0.5 text-[10px] space-y-0.5" />
            </div>
          ); })}</section>)}
          {r.leadership && r.leadership.length > 0 && (<section className="mb-3"><h3 className="uppercase text-[10px] font-bold tracking-widest text-teal-800 border-b-2 border-teal-800 pb-1 mb-2">Leadership</h3>{r.leadership.map((l, i) => { const upd = makeLeadershipUpdater(update, r, i); return (
            <div key={i} className="mb-2">
              <div className="flex justify-between"><span className="font-semibold text-[11px]"><Editable value={l.role} onChange={update && (v => upd({ role: v }))} /></span><span className="text-[10px] text-neutral-600"><Editable value={l.start || ""} onChange={update && (v => upd({ start: v }))} /> – <Editable value={l.end || ""} onChange={update && (v => upd({ end: v }))} /></span></div>
              <div className="text-[10px] text-teal-700"><Editable value={l.organization} onChange={update && (v => upd({ organization: v }))} /></div>
              <BulletsEditor bullets={l.bullets || []} onChange={update && (v => upd({ bullets: v }))} className="list-disc pl-4 mt-0.5 text-[10px] space-y-0.5" />
            </div>
          ); })}</section>)}
          {r.education?.length > 0 && (<section><h3 className="uppercase text-[10px] font-bold tracking-widest text-teal-800 border-b-2 border-teal-800 pb-1 mb-2">Education</h3>{r.education.map((e, i) => { const upd = makeEduUpdater(update, r, i); return (<div key={i} className="mb-1"><div className="font-semibold text-[10.5px]"><Editable value={e.degree} onChange={update && (v => upd({ degree: v }))} /></div><div className="text-[10px] text-neutral-600"><Editable value={e.school} onChange={update && (v => upd({ school: v }))} /> · <Editable value={e.start} onChange={update && (v => upd({ start: v }))} />–<Editable value={e.end} onChange={update && (v => upd({ end: v }))} /></div></div>); })}</section>)}
        </div>
      </div>
    </div>
  );
}

/* ---------- Photo Grid (Jackson Miller): centered photo header + 3-col achievement boxes ---------- */
function PhotoGridPreview({ r, update }: { r: ResumeData; update?: UpdateFn }) {
  const on = (patch: Partial<ResumeData>) => update?.(patch);
  const achievements = r.skills?.slice(0, 3) ?? [];
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
      {(r.summary || update) && (<section className="mt-3"><h3 className="text-[10px] font-bold uppercase tracking-widest text-neutral-800 mb-1">Summary</h3><Editable as="p" multiline value={r.summary} onChange={update && (v => on({ summary: v }))} className="whitespace-pre-wrap text-[10.5px]" /></section>)}
      {achievements.length > 0 && (
        <section className="mt-3">
          <h3 className="text-[10px] font-bold uppercase tracking-widest text-neutral-800 mb-2 text-center">Key Achievements</h3>
          <div className="grid grid-cols-3 gap-3">
            {achievements.map((s, i) => { const upd = makeSkillUpdater(update, r, i); return (
              <div key={i} className="border border-neutral-200 rounded-lg p-3 bg-neutral-50">
                <SkillCat as="div" value={s.category} onChange={update && (v => upd({ category: v }))} className="font-semibold text-[10.5px] text-sky-800 mb-1" />
                <Editable as="div" value={s.items.join(", ")} onChange={update && (v => upd({ items: v.split(",").map(x => x.trim()).filter(Boolean) }))} className="text-[9.5px] text-neutral-700 leading-snug" />
              </div>
            ); })}
          </div>
        </section>
      )}
      {r.experience?.length > 0 && (<section className="mt-3"><h3 className="text-[10px] font-bold uppercase tracking-widest text-neutral-800 mb-1">Experience</h3>{r.experience.map((e, i) => { const upd = makeExpUpdater(update, r, i); return (
        <div key={i} className="mb-2">
          <div className="flex justify-between"><span className="font-semibold text-[11px]"><Editable value={e.role} onChange={update && (v => upd({ role: v }))} /></span><span className="text-[10px] text-neutral-600"><Editable value={e.start} onChange={update && (v => upd({ start: v }))} /> – <Editable value={e.end} onChange={update && (v => upd({ end: v }))} /></span></div>
          <div className="text-[10px] text-sky-700"><Editable value={e.company} onChange={update && (v => upd({ company: v }))} /> · <Editable value={e.location} onChange={update && (v => upd({ location: v }))} /></div>
          <BulletsEditor bullets={e.bullets || []} onChange={update && (v => upd({ bullets: v }))} className="list-disc pl-4 mt-0.5 text-[10px] space-y-0.5" />
        </div>
      ); })}</section>)}
      {r.leadership && r.leadership.length > 0 && (<section className="mt-3"><h3 className="text-[10px] font-bold uppercase tracking-widest text-neutral-800 mb-1">Leadership</h3>{r.leadership.map((l, i) => { const upd = makeLeadershipUpdater(update, r, i); return (
        <div key={i} className="mb-2">
          <div className="flex justify-between"><span className="font-semibold text-[11px]"><Editable value={l.role} onChange={update && (v => upd({ role: v }))} /></span><span className="text-[10px] text-neutral-600"><Editable value={l.start || ""} onChange={update && (v => upd({ start: v }))} /> – <Editable value={l.end || ""} onChange={update && (v => upd({ end: v }))} /></span></div>
          <div className="text-[10px] text-sky-700"><Editable value={l.organization} onChange={update && (v => upd({ organization: v }))} /> · <Editable value={l.location || ""} onChange={update && (v => upd({ location: v }))} /></div>
          <BulletsEditor bullets={l.bullets || []} onChange={update && (v => upd({ bullets: v }))} className="list-disc pl-4 mt-0.5 text-[10px] space-y-0.5" />
        </div>
      ); })}</section>)}
      {r.education?.length > 0 && (<section className="mt-2"><h3 className="text-[10px] font-bold uppercase tracking-widest text-neutral-800 mb-1">Education</h3>{r.education.map((e, i) => { const upd = makeEduUpdater(update, r, i); return (<div key={i} className="flex justify-between mb-1"><span><span className="font-semibold"><Editable value={e.degree} onChange={update && (v => upd({ degree: v }))} /></span> · <Editable value={e.school} onChange={update && (v => upd({ school: v }))} /></span><span className="text-[10px] text-neutral-600"><Editable value={e.start} onChange={update && (v => upd({ start: v }))} />–<Editable value={e.end} onChange={update && (v => upd({ end: v }))} /></span></div>); })}</section>)}
    </div>
  );
}

/* ---------- Logo Boxed (Olivia Davis): centered header, initials-tile per company ---------- */
function LogoBoxedPreview({ r, update }: { r: ResumeData; update?: UpdateFn }) {
  const on = (patch: Partial<ResumeData>) => update?.(patch);
  const H = (t: string) => <div className="text-center text-[12px] font-semibold tracking-wide text-neutral-800 border-b border-neutral-300 pb-1 mb-2 mt-3">{t}</div>;
  const logoTile = (name: string) => {
    const c = (name || "?").trim().charAt(0).toUpperCase();
    const palette = ["bg-sky-100 text-sky-700", "bg-emerald-100 text-emerald-700", "bg-amber-100 text-amber-700", "bg-rose-100 text-rose-700", "bg-indigo-100 text-indigo-700"];
    const cls = palette[(c.charCodeAt(0) || 0) % palette.length];
    return <div className={`h-7 w-7 rounded ${cls} flex items-center justify-center text-[12px] font-bold shrink-0`}>{c}</div>;
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
      {(r.summary || update) && (<><div>{H("Summary")}</div><Editable as="p" multiline value={r.summary} onChange={update && (v => on({ summary: v }))} className="whitespace-pre-wrap text-[10.5px]" /></>)}
      {r.experience?.length > 0 && (<>{H("Experience")}{r.experience.map((e, i) => { const upd = makeExpUpdater(update, r, i); return (
        <div key={i} className="mb-3 flex gap-3">
          {logoTile(e.company)}
          <div className="flex-1 min-w-0">
            <div className="flex justify-between gap-2"><span className="font-semibold text-sky-800"><Editable value={e.company} onChange={update && (v => upd({ company: v }))} /></span><span className="text-[10px] text-neutral-600 whitespace-nowrap"><Editable value={e.location} onChange={update && (v => upd({ location: v }))} /></span></div>
            <div className="flex justify-between text-[10px]"><span className="italic"><Editable value={e.role} onChange={update && (v => upd({ role: v }))} /></span><span><Editable value={e.start} onChange={update && (v => upd({ start: v }))} /> – <Editable value={e.end} onChange={update && (v => upd({ end: v }))} /></span></div>
            <BulletsEditor bullets={e.bullets || []} onChange={update && (v => upd({ bullets: v }))} className="list-disc pl-4 mt-0.5 text-[10px] space-y-0.5" />
          </div>
        </div>
      ); })}</>)}
      {r.leadership && r.leadership.length > 0 && (<>{H("Leadership")}{r.leadership.map((l, i) => { const upd = makeLeadershipUpdater(update, r, i); return (
        <div key={i} className="mb-3 flex gap-3">
          {logoTile(l.organization)}
          <div className="flex-1 min-w-0">
            <div className="flex justify-between gap-2"><span className="font-semibold text-sky-800"><Editable value={l.organization} onChange={update && (v => upd({ organization: v }))} /></span><span className="text-[10px] text-neutral-600 whitespace-nowrap"><Editable value={l.location || ""} onChange={update && (v => upd({ location: v }))} /></span></div>
            <div className="flex justify-between text-[10px]"><span className="italic"><Editable value={l.role} onChange={update && (v => upd({ role: v }))} /></span><span><Editable value={l.start || ""} onChange={update && (v => upd({ start: v }))} /> – <Editable value={l.end || ""} onChange={update && (v => upd({ end: v }))} /></span></div>
            <BulletsEditor bullets={l.bullets || []} onChange={update && (v => upd({ bullets: v }))} className="list-disc pl-4 mt-0.5 text-[10px] space-y-0.5" />
          </div>
        </div>
      ); })}</>)}
      {r.education?.length > 0 && (<>{H("Education")}{r.education.map((e, i) => { const upd = makeEduUpdater(update, r, i); return (
        <div key={i} className="mb-2 flex gap-3">
          {logoTile(e.school)}
          <div className="flex-1"><div className="flex justify-between"><span className="font-semibold text-sky-800"><Editable value={e.school} onChange={update && (v => upd({ school: v }))} /></span><span className="text-[10px] text-neutral-600"><Editable value={e.start} onChange={update && (v => upd({ start: v }))} />–<Editable value={e.end} onChange={update && (v => upd({ end: v }))} /></span></div><div className="italic text-[10.5px]"><Editable value={e.degree} onChange={update && (v => upd({ degree: v }))} /></div></div>
        </div>
      ); })}</>)}
      {r.skills?.length > 0 && (<>{H("Skills")}<div className="space-y-1">{r.skills.map((s, i) => { const upd = makeSkillUpdater(update, r, i); return (<div key={i} className="text-[10px] leading-relaxed"><SkillCat value={s.category} onChange={update && (v => upd({ category: v }))} className="font-semibold text-sky-800" colon /> <Editable value={s.items.join(", ")} onChange={update && (v => upd({ items: v.split(",").map(x => x.trim()).filter(Boolean) }))} /></div>); })}</div></>)}
      {r.certifications?.length > 0 && (<>{H("Certifications")}<Editable as="div" multiline value={r.certifications.join("\n")} onChange={update && (v => on({ certifications: v.split("\n").map(x => x.trim()).filter(Boolean) }))} className="text-[10.5px] whitespace-pre-wrap" /></>)}
    </div>
  );
}

/* ---------- Per-section styling (works across every template) ---------- */
const SECTION_MATCHERS: { key: ResumeSectionKey; re: RegExp }[] = [
  { key: "summary", re: /^(summary|profile|about|professional summary)$/i },
  { key: "experience", re: /^(experience|work experience|professional experience|employment)$/i },
  { key: "leadership", re: /^(leadership experience|leadership|volunteer experience|community leadership|extracurricular activities|activities|leadership & activities)$/i },
  { key: "education", re: /^(education|academics)$/i },
  { key: "skills", re: /^(skills|key skills.*|core skills|technical skills)$/i },
  { key: "projects", re: /^(projects|selected projects)$/i },
  { key: "certifications", re: /^(certifications|licenses|courses)$/i },
];

function tagSections(root: HTMLElement | null) {
  if (!root) return;
  root.querySelectorAll("[data-rs-sec],[data-rs-head]").forEach(el => {
    el.removeAttribute("data-rs-sec");
    el.removeAttribute("data-rs-head");
  });
  const els = Array.from(root.querySelectorAll<HTMLElement>("*"));
  for (const el of els) {
    const txt = (el.textContent || "").trim();
    if (!txt || txt.length > 40 || el.children.length > 0) continue;
    const match = SECTION_MATCHERS.find(m => m.re.test(txt));
    if (!match) continue;
    el.setAttribute("data-rs-head", "1");
    const container = el.closest("section");
    if (container && container !== root) {
      container.setAttribute("data-rs-sec", match.key);
    } else {
      let n = el.parentElement?.nextElementSibling ?? el.nextElementSibling;
      let guard = 0;
      while (n && guard++ < 12) {
        if (n.querySelector("[data-rs-head]") || n.hasAttribute("data-rs-head")) break;
        n.setAttribute("data-rs-sec", match.key);
        n = n.nextElementSibling;
      }
    }
  }
}

function sectionCss(scope: string, settings?: ResumeSettings) {
  if (!settings) return "";
  const sections = settings.sections;
  const baseRules: string[] = [];

  if (settings.fontFamily) {
    baseRules.push(`${scope}, ${scope} * { font-family: ${settings.fontFamily} !important; }`);
  }
  if (settings.fontSize) {
    baseRules.push(`${scope}, ${scope} * { font-size: ${settings.fontSize}px; }`);
  }
  if (settings.lineSpacing) {
    baseRules.push(`${scope}, ${scope} * { line-height: ${settings.lineSpacing} !important; }`);
  }
  if (settings.headingSize) {
    baseRules.push(`${scope} h1, ${scope} h2, ${scope} h3, ${scope} [data-rs-head] { font-size: ${settings.headingSize}px !important; }`);
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
    const tb = settings.marginTopBottom ?? 32;
    const lr = settings.marginSide ?? 32;
    baseRules.push(`${scope} .resume-page-sheet, ${scope} > div > div:first-child { padding-top: ${tb}px !important; padding-bottom: ${tb}px !important; padding-left: ${lr}px !important; padding-right: ${lr}px !important; }`);
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
  template, data, onChange,
}: { template: TemplateId; data: ResumeData; onChange?: (data: ResumeData) => void }) {
  const update: UpdateFn = onChange ? (patch) => onChange({ ...data, ...patch }) : undefined;
  const rootRef = useRef<HTMLDivElement>(null);
  const scopeId = React.useId().replace(/[:]/g, "");
  const [contextMenu, setContextMenu] = useState<ContextMenuPosition | null>(null);

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
    <ClassicPreview r={data} update={update} />;

  useEffect(() => {
    // Add small delay to ensure DOM is ready for tagging
    const timer = setTimeout(() => tagSections(rootRef.current), 50);
    return () => clearTimeout(timer);
  }, [template, data.settings?.sectionOrder, data.experience.length, data.education.length, data.projects.length, data.skills.length]);

  const handleContextMenu = (e: React.MouseEvent) => {
    if (!onChange) return;
    e.preventDefault();

    const target = e.target as HTMLElement;
    const li = target.closest("li");
    let lineIdx: number | undefined = undefined;
    if (li && li.parentElement) {
      const lis = Array.from(li.parentElement.querySelectorAll("li"));
      lineIdx = lis.indexOf(li);
    }

    const selection = window.getSelection();
    const selText = selection ? selection.toString() : "";

    setContextMenu({
      x: e.clientX,
      y: e.clientY,
      targetElement: target,
      targetLineIndex: lineIdx,
      selectedText: selText,
    });
  };

  const handleMoveLineUp = () => {
    if (!contextMenu?.targetElement || !onChange) return;
    const li = contextMenu.targetElement.closest("li");
    if (li && li.parentElement) {
      const ul = li.parentElement;
      const lis = Array.from(ul.querySelectorAll("li"));
      const idx = lis.indexOf(li);
      if (idx > 0) {
        const textArr = lis.map(l => l.innerHTML.trim());
        const temp = textArr[idx];
        textArr[idx] = textArr[idx - 1];
        textArr[idx - 1] = temp;
        ul.innerHTML = textArr.map((t, i) => `<li data-bullet-line="true" data-bullet-index="${i}">${t}</li>`).join("");
        ul.dispatchEvent(new Event("blur", { bubbles: true }));
      }
    }
  };

  const handleMoveLineDown = () => {
    if (!contextMenu?.targetElement || !onChange) return;
    const li = contextMenu.targetElement.closest("li");
    if (li && li.parentElement) {
      const ul = li.parentElement;
      const lis = Array.from(ul.querySelectorAll("li"));
      const idx = lis.indexOf(li);
      if (idx !== -1 && idx < lis.length - 1) {
        const textArr = lis.map(l => l.innerHTML.trim());
        const temp = textArr[idx];
        textArr[idx] = textArr[idx + 1];
        textArr[idx + 1] = temp;
        ul.innerHTML = textArr.map((t, i) => `<li data-bullet-line="true" data-bullet-index="${i}">${t}</li>`).join("");
        ul.dispatchEvent(new Event("blur", { bubbles: true }));
      }
    }
  };

  const handleDuplicateLine = () => {
    if (!contextMenu?.targetElement || !onChange) return;
    const li = contextMenu.targetElement.closest("li");
    if (li && li.parentElement) {
      const ul = li.parentElement;
      const lis = Array.from(ul.querySelectorAll("li"));
      const idx = lis.indexOf(li);
      if (idx !== -1) {
        const textArr = lis.map(l => l.innerHTML.trim());
        textArr.splice(idx + 1, 0, textArr[idx]);
        ul.innerHTML = textArr.map((t, i) => `<li data-bullet-line="true" data-bullet-index="${i}">${t}</li>`).join("");
        ul.dispatchEvent(new Event("blur", { bubbles: true }));
      }
    }
  };

  const handleAddLineBelow = () => {
    if (!contextMenu?.targetElement || !onChange) return;
    const li = contextMenu.targetElement.closest("li");
    if (li && li.parentElement) {
      const ul = li.parentElement;
      const lis = Array.from(ul.querySelectorAll("li"));
      const idx = lis.indexOf(li);
      const textArr = lis.map(l => l.innerHTML.trim());
      textArr.splice(idx !== -1 ? idx + 1 : textArr.length, 0, "New bullet point...");
      ul.innerHTML = textArr.map((t, i) => `<li data-bullet-line="true" data-bullet-index="${i}">${t}</li>`).join("");
      ul.dispatchEvent(new Event("blur", { bubbles: true }));
    }
  };

  const handleDeleteLine = () => {
    if (!contextMenu?.targetElement || !onChange) return;
    const li = contextMenu.targetElement.closest("li");
    if (li && li.parentElement) {
      const ul = li.parentElement;
      const lis = Array.from(ul.querySelectorAll("li"));
      const idx = lis.indexOf(li);
      if (idx !== -1) {
        const textArr = lis.map(l => l.innerHTML.trim());
        textArr.splice(idx, 1);
        ul.innerHTML = textArr.map((t, i) => `<li data-bullet-line="true" data-bullet-index="${i}">${t}</li>`).join("");
        ul.dispatchEvent(new Event("blur", { bubbles: true }));
      }
    }
  };

  const handleFormatText = (command: string, value: string = "") => {
    document.execCommand(command, false, value);
    if (contextMenu?.targetElement) {
      const el = contextMenu.targetElement;
      el.dispatchEvent(new Event("blur", { bubbles: true }));
    }
  };

  return (
    <div
      ref={rootRef}
      data-rs-root={scopeId}
      data-rs-template={template}
      className="resume-root-container relative"
      onContextMenu={handleContextMenu}
    >
      <style dangerouslySetInnerHTML={{ __html: sectionCss(`[data-rs-root="${scopeId}"]`, data.settings) }} />
      <PagedSheet>{inner}</PagedSheet>

      {/* Right-click formatting & line actions context menu */}
      {contextMenu && (
        <ResumeContextMenu
          position={contextMenu}
          onClose={() => setContextMenu(null)}
          onMoveLineUp={contextMenu.targetLineIndex != null ? handleMoveLineUp : undefined}
          onMoveLineDown={contextMenu.targetLineIndex != null ? handleMoveLineDown : undefined}
          onDuplicateLine={contextMenu.targetLineIndex != null ? handleDuplicateLine : undefined}
          onAddLineBelow={contextMenu.targetLineIndex != null ? handleAddLineBelow : undefined}
          onDeleteLine={contextMenu.targetLineIndex != null ? handleDeleteLine : undefined}
          onFormatText={handleFormatText}
        />
      )}
    </div>
  );
}


/* ---------- PDF export ---------- */
export async function downloadResumePdfFromData(rawData: ResumeData, template: TemplateId) {
  const data = normalizeResumeSkills(rawData);
  const safe = safeName(data.name);

  // 1. Locate the live preview element
  const potentialRoots = Array.from(
    document.querySelectorAll(`[data-rs-root], .resume-root-container, .resume-export-target`)
  ) as HTMLElement[];

  // Find the visible one (to avoid closed mobile sheets or hidden elements)
  let visibleElement: HTMLElement | null = null;
  for (const el of potentialRoots) {
    const rect = el.getBoundingClientRect();
    const style = window.getComputedStyle(el);
    if (
      (rect.width > 50 || el.offsetWidth > 50) &&
      (rect.height > 50 || el.offsetHeight > 50) &&
      style.display !== "none" &&
      style.visibility !== "hidden" &&
      style.opacity !== "0"
    ) {
      visibleElement = el;
      break;
    }
  }

  // Fallback to first matching element if none matched visibility criteria
  const element = visibleElement || potentialRoots[0] || (document.querySelector(".resume-root-container") as HTMLElement);

  if (!element) {
    const msg = "Resume preview not found. Please ensure the preview is visible before exporting.";
    console.error(msg);
    if (typeof window !== "undefined") {
      import("sonner").then(({ toast }) => toast.error(msg));
    }
    return;
  }

  // 2. Create an isolated off-screen wrapper for pixel-perfect html2canvas capture
  const wrapper = document.createElement("div");
  wrapper.id = "rs-pdf-export-wrapper";
  wrapper.style.cssText = "position: fixed; left: -9999px; top: 0; width: 794px; min-height: 1123px; background: #ffffff; z-index: -99999; margin: 0; padding: 0; overflow: visible;";

  // Clone the element so we can strip transforms, drag handles, and dashed break lines safely
  const clone = element.cloneNode(true) as HTMLElement;
  clone.style.cssText = "transform: none !important; margin: 0 !important; width: 794px !important; max-width: 794px !important; min-height: 1123px !important; box-shadow: none !important; background: #ffffff !important; display: block !important; opacity: 1 !important; visibility: visible !important;";

  // Strip preview-only overlays like dashed page breaks, page badges, and toolbars
  clone.querySelectorAll('[data-page-badge], [data-page-indicator], .preview-only-badge, [data-rs-toolbar], .selection-toolbar, [role="tooltip"]').forEach(el => el.remove());
  clone.querySelectorAll('.border-dashed, [aria-hidden="true"]').forEach(el => el.remove());
  clone.querySelectorAll('*').forEach(el => {
    const txt = (el.textContent || "").trim();
    if (/^\d+\s*pages?$/i.test(txt) || /^Page\s*\d+$/i.test(txt) || el.classList.contains("border-dashed") || el.querySelector(".border-dashed")) {
      el.remove();
    }
  });

  // Copy computed CSS custom properties
  const pageH = element.style.getPropertyValue("--page-h");
  if (pageH) {
    clone.style.setProperty("--page-h", pageH);
  }

  wrapper.appendChild(clone);
  document.body.appendChild(wrapper);

  try {
    // Wait for fonts & rendering
    if (document.fonts) {
      try {
        await document.fonts.ready;
      } catch (_) {}
    }
    await new Promise(r => setTimeout(r, 150));

    const targetHeight = Math.max(clone.scrollHeight, 1123);

    const canvas = await html2canvas(clone, {
      scale: 2,
      useCORS: true,
      allowTaint: true,
      backgroundColor: "#ffffff",
      logging: false,
      scrollX: 0,
      scrollY: 0,
      width: 794,
      height: targetHeight,
      windowWidth: 794,
      windowHeight: targetHeight,
    });

    const pdf = new jsPDF({
      orientation: "portrait",
      unit: "pt",
      format: "a4",
      compress: true,
    });

    const pdfWidth = pdf.internal.pageSize.getWidth(); // 595.28 pt
    const pdfHeight = pdf.internal.pageSize.getHeight(); // 841.89 pt
    const a4Ratio = pdfHeight / pdfWidth; // ~1.4142

    const pageCanvasHeight = canvas.width * a4Ratio;
    const totalPages = Math.max(1, Math.ceil((canvas.height - 15) / pageCanvasHeight));

    if (totalPages === 1) {
      const imgData = canvas.toDataURL("image/png", 1.0);
      const renderHeight = (canvas.height * pdfWidth) / canvas.width;
      pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, renderHeight, undefined, "FAST");
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
        pdf.addImage(sliceData, "PNG", 0, 0, pdfWidth, pdfHeight, undefined, "FAST");
      }
    }

    pdf.save(`${safe}-${template}.pdf`);
  } catch (err) {
    console.error("PDF export failed:", err);
    if (typeof window !== "undefined") {
      import("sonner").then(({ toast }) => toast.error("Export failed. Please try again."));
    }
  } finally {
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
};

/** Templates whose React preview renders a sidebar / two-column layout. */
export const MULTI_COLUMN_TEMPLATES: TemplateId[] = [
  "modern", "sidebar-dark", "teal-left", "creative",
  "photo-header", "banner-photo",
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

  if (
    lower.includes("mono") ||
    lower.includes("courier") ||
    lower.includes("consolas") ||
    lower.includes("code") ||
    lower.includes("jetbrains")
  ) {
    return "Consolas";
  }

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
    lower.includes("aptos")
  ) {
    if (lower.includes("arial")) return "Arial";
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
    lower.includes("cambria")
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
          out.push(H("Summary", isSidebar));
          out.push(P(data.summary, { sectionKey: "summary", color: secTextColor, size: isSidebar ? Math.round(baseSize * 0.95) : baseSize }));
        }
        break;
      case "experience":
        if (data.experience?.length) {
          out.push(H("Experience", isSidebar));
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
          out.push(H("Leadership Experience", isSidebar));
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
          out.push(H("Projects", isSidebar));
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
          out.push(H("Education", isSidebar));
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
          out.push(H("Skills", isSidebar));
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
          out.push(H("Certifications", isSidebar));
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
  let order = data.settings?.sectionOrder || ["summary", "experience", "leadership", "education", "projects", "skills", "certifications"];
  if (data.leadership?.length && !order.includes("leadership")) {
    const expIdx = order.indexOf("experience");
    order = expIdx >= 0 ? [...order.slice(0, expIdx + 1), "leadership", ...order.slice(expIdx + 1)] : ["leadership", ...order];
  }
  order.forEach(key => {
    switch (key) {
      case "summary":
        if (data.summary) { head("Professional Summary"); L.push(stripRich(data.summary)); L.push(""); }
        break;
      case "experience":
        if (data.experience?.length) {
          head("Experience");
          data.experience.forEach(e => {
            L.push(`${stripRich(e.role)} — ${stripRich(e.company)}${e.location ? `, ${e.location}` : ""} (${e.start} – ${e.end})`);
            e.bullets?.forEach(b => L.push(`* ${stripRich(b)}`));
            L.push("");
          });
        }
        break;
      case "leadership":
        if (data.leadership?.length) {
          head("Leadership Experience");
          data.leadership.forEach(l => {
            L.push(`${stripRich(l.role)} — ${stripRich(l.organization)}${l.location ? `, ${l.location}` : ""} (${l.start || ""} – ${l.end || ""})`);
            l.bullets?.forEach(b => L.push(`* ${stripRich(b)}`));
            L.push("");
          });
        }
        break;
      case "education":
        if (data.education?.length) {
          head("Education");
          data.education.forEach(e => {
            L.push(`${stripRich(e.degree)} — ${stripRich(e.school)}${e.location ? `, ${e.location}` : ""} (${e.start} – ${e.end})`);
            if (e.details) L.push(stripRich(e.details));
          });
          L.push("");
        }
        break;
      case "projects":
        if (data.projects?.length) {
          head("Projects");
          data.projects.forEach(p => {
            L.push(`${stripRich(p.name)}${p.tech ? ` — ${stripRich(p.tech)}` : ""}`);
            p.bullets?.forEach(b => L.push(`* ${stripRich(b)}`));
          });
          L.push("");
        }
        break;
      case "skills":
        if (data.skills?.length) {
          head("Skills");
          data.skills.forEach(s => L.push(`${isGenericSkillCategory(s.category) ? "" : `${s.category}: `}${s.items.join(", ")}`));
          L.push("");
        }
        break;
      case "certifications":
        if (data.certifications?.length) {
          head("Certifications");
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
  let order = data.settings?.sectionOrder || ["summary", "experience", "leadership", "education", "projects", "skills", "certifications"];
  if (data.leadership?.length && !order.includes("leadership")) {
    const expIdx = order.indexOf("experience");
    order = expIdx >= 0 ? [...order.slice(0, expIdx + 1), "leadership", ...order.slice(expIdx + 1)] : ["leadership", ...order];
  }
  order.forEach(key => {
    switch (key) {
      case "summary":
        if (data.summary) { M.push("## Professional Summary"); M.push(stripRich(data.summary)); M.push(""); }
        break;
      case "experience":
        if (data.experience?.length) {
          M.push("## Experience");
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
          M.push("## Leadership Experience");
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
          M.push("## Education");
          data.education.forEach(e => {
            M.push(`**${stripRich(e.degree)}** — ${stripRich(e.school)}${e.location ? `, ${e.location}` : ""} *(${e.start} – ${e.end})*`);
            if (e.details) M.push(stripRich(e.details));
          });
          M.push("");
        }
        break;
      case "projects":
        if (data.projects?.length) {
          M.push("## Projects");
          data.projects.forEach(p => {
            M.push(`### ${stripRich(p.name)}${p.tech ? ` — ${stripRich(p.tech)}` : ""}`);
            p.bullets?.forEach(b => M.push(`- ${stripRich(b)}`));
            M.push("");
          });
        }
        break;
      case "skills":
        if (data.skills?.length) {
          M.push("## Skills");
          data.skills.forEach(s => M.push(`- ${isGenericSkillCategory(s.category) ? "" : `**${s.category}:** `}${s.items.join(", ")}`));
          M.push("");
        }
        break;
      case "certifications":
        if (data.certifications?.length) {
          M.push("## Certifications");
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

