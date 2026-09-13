import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType } from "docx";
import {
  saveBlob,
  A4_WIDTH_PX,
  A4_HEIGHT_PX,
  A4_RATIO,
  A4_WIDTH_PT,
  A4_HEIGHT_PT,
} from "./resumeTemplates";

export interface ExportData {
  title?: string | null;
  company?: string | null;
  role?: string | null;
  professional_summary: string | null;
  improved_bullets: { original: string; improved: string }[] | null;
  skills_to_add: string[] | null;
  missing_keywords: string[] | null;
  ats_score: number | null;
  cover_letter?: string | null;
}

function safeName(opt: ExportData, ext: string) {
  const base = (opt.title || opt.company || "tailored-resume").replace(/[^a-z0-9-_ ]/gi, "").replace(/\s+/g, "-").toLowerCase();
  return `${base || "tailored-resume"}.${ext}`;
}

/* ---------- PDF ---------- */
export async function downloadResumePdf(opt: ExportData) {
  const potentialRoots = Array.from(
    document.querySelectorAll(`[data-rs-root], .resume-root-container, .resume-export-target`)
  ) as HTMLElement[];

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

  const element = visibleElement || potentialRoots[0] || (document.querySelector(".resume-root-container") as HTMLElement);

  if (!element) {
    console.error("Resume preview not found for PDF export.");
    return;
  }

  const wrapper = document.createElement("div");
  wrapper.id = "rs-pdf-export-wrapper-opt";
  wrapper.style.cssText = `position: absolute; left: 0; top: 0; width: ${A4_WIDTH_PX}px; min-width: ${A4_WIDTH_PX}px; max-width: ${A4_WIDTH_PX}px; min-height: ${A4_HEIGHT_PX}px; background: #ffffff; z-index: -9999; opacity: 0; pointer-events: none; margin: 0; padding: 0; overflow: visible;`;

  const clone = element.cloneNode(true) as HTMLElement;
  clone.style.cssText = `transform: none !important; margin: 0 !important; width: ${A4_WIDTH_PX}px !important; min-width: ${A4_WIDTH_PX}px !important; max-width: ${A4_WIDTH_PX}px !important; min-height: ${A4_HEIGHT_PX}px !important; box-shadow: none !important; background: #ffffff !important; display: block !important; opacity: 1 !important; visibility: visible !important;`;

  clone.querySelectorAll('.border-dashed, [aria-hidden="true"]').forEach(el => {
    if (el.textContent?.includes("Page") || el.querySelector(".border-dashed") || el.classList.contains("border-dashed")) {
      el.remove();
    }
  });
  clone.querySelectorAll('[data-rs-toolbar], .selection-toolbar, [role="tooltip"]').forEach(el => el.remove());

  clone.style.setProperty("--page-h", `${A4_HEIGHT_PX}px`);

  wrapper.appendChild(clone);
  document.body.appendChild(wrapper);

  try {
    if (document.fonts) {
      try {
        await document.fonts.ready;
      } catch (_) {}
    }
    await new Promise(r => setTimeout(r, 250));

    const rawHeight = Math.max(clone.scrollHeight, wrapper.scrollHeight, A4_HEIGHT_PX);
    const totalPages = Math.max(1, Math.ceil((rawHeight - 25) / A4_HEIGHT_PX));
    const targetHeight = totalPages * A4_HEIGHT_PX;

    const canvas = await html2canvas(clone, {
      scale: 3,
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
        const el = clonedDoc.getElementById("rs-pdf-export-wrapper-opt");
        if (el) {
          el.style.opacity = "1";
          el.style.zIndex = "99999";
          el.style.textRendering = "geometricPrecision";
          (el.style as any).webkitFontSmoothing = "antialiased";
          (el.style as any).mozOsxFontSmoothing = "grayscale";
        }
      },
    });

    const doc = new jsPDF({ orientation: "portrait", unit: "pt", format: "a4", compress: true });
    const pdfWidth = A4_WIDTH_PT;
    const pdfHeight = A4_HEIGHT_PT;
    const pageCanvasHeight = Math.round(canvas.width * A4_RATIO);

    if (totalPages === 1) {
      const imgData = canvas.toDataURL("image/png", 1.0);
      doc.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight, undefined, "MEDIUM");
    } else {
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
          ctx.drawImage(canvas, 0, sliceY, canvas.width, thisSliceHeight, 0, 0, canvas.width, thisSliceHeight);
        }

        const sliceData = sliceCanvas.toDataURL("image/png", 1.0);
        if (i > 0) doc.addPage("a4", "portrait");
        doc.addImage(sliceData, "PNG", 0, 0, pdfWidth, pdfHeight, undefined, "MEDIUM");
      }
    }

    doc.save(safeName(opt, "pdf"));
  } catch (err) {
    console.error("PDF export failed:", err);
  } finally {
    if (wrapper.parentNode) {
      wrapper.parentNode.removeChild(wrapper);
    }
  }
}

/* ---------- DOCX ---------- */
export async function downloadResumeDocx(opt: ExportData) {
  const sections: Paragraph[] = [];
  sections.push(new Paragraph({
    children: [new TextRun({ text: opt.title || "Tailored Resume", bold: true, size: 40 })],
    spacing: { after: 120 },
  }));
  sections.push(new Paragraph({
    children: [new TextRun({ text: `ATS Match Score: ${opt.ats_score ?? "—"}/100`, italics: true, color: "777777", size: 20 })],
    spacing: { after: 240 },
  }));

  const addHeading = (t: string) => sections.push(new Paragraph({
    children: [new TextRun({ text: t.toUpperCase(), bold: true, size: 26, color: "146E50" })],
    spacing: { before: 240, after: 120 },
  }));

  if (opt.professional_summary) {
    addHeading("Professional Summary");
    sections.push(new Paragraph({ children: [new TextRun({ text: opt.professional_summary, size: 22 })] }));
  }
  if (opt.improved_bullets?.length) {
    addHeading("Experience Highlights");
    opt.improved_bullets.forEach(b => {
      sections.push(new Paragraph({
        children: [new TextRun({ text: b.improved, size: 22 })],
        bullet: { level: 0 },
      }));
    });
  }
  if (opt.skills_to_add?.length) {
    addHeading("Key Skills");
    sections.push(new Paragraph({ children: [new TextRun({ text: opt.skills_to_add.join(" · "), size: 22 })] }));
  }
  if (opt.missing_keywords?.length) {
    addHeading("Keywords Incorporated");
    sections.push(new Paragraph({ children: [new TextRun({ text: opt.missing_keywords.join(", "), size: 22 })] }));
  }

  const doc = new Document({ sections: [{ children: sections }] });
  const blob = await Packer.toBlob(doc);
  saveBlob(blob, safeName(opt, "docx"));
}

/* ---------- Plain text (ATS) ---------- */
export function downloadResumeTxt(opt: ExportData) {
  const lines: string[] = [];
  lines.push((opt.title || "TAILORED RESUME").toUpperCase());
  lines.push("=".repeat(60));
  lines.push(`ATS Match Score: ${opt.ats_score ?? "—"}/100`);
  lines.push("");
  if (opt.professional_summary) {
    lines.push("PROFESSIONAL SUMMARY"); lines.push("-".repeat(60));
    lines.push(opt.professional_summary); lines.push("");
  }
  if (opt.improved_bullets?.length) {
    lines.push("EXPERIENCE HIGHLIGHTS"); lines.push("-".repeat(60));
    opt.improved_bullets.forEach(b => lines.push(`* ${b.improved}`));
    lines.push("");
  }
  if (opt.skills_to_add?.length) {
    lines.push("KEY SKILLS"); lines.push("-".repeat(60));
    lines.push(opt.skills_to_add.join(", ")); lines.push("");
  }
  if (opt.missing_keywords?.length) {
    lines.push("KEYWORDS"); lines.push("-".repeat(60));
    lines.push(opt.missing_keywords.join(", "));
  }
  const blob = new Blob([lines.join("\n")], { type: "text/plain;charset=utf-8" });
  saveBlob(blob, safeName(opt, "txt"));
}

/* ---------- Markdown ---------- */
export function downloadResumeMarkdown(opt: ExportData) {
  const md: string[] = [];
  md.push(`# ${opt.title || "Tailored Resume"}`);
  md.push(`*ATS Match Score: **${opt.ats_score ?? "—"}/100***`);
  md.push("");
  if (opt.professional_summary) { md.push("## Professional Summary"); md.push(opt.professional_summary); md.push(""); }
  if (opt.improved_bullets?.length) {
    md.push("## Experience Highlights");
    opt.improved_bullets.forEach(b => md.push(`- ${b.improved}`));
    md.push("");
  }
  if (opt.skills_to_add?.length) { md.push("## Key Skills"); md.push(opt.skills_to_add.map(s => `\`${s}\``).join(" · ")); md.push(""); }
  if (opt.missing_keywords?.length) { md.push("## Keywords Incorporated"); md.push(opt.missing_keywords.join(", ")); }
  const blob = new Blob([md.join("\n")], { type: "text/markdown;charset=utf-8" });
  saveBlob(blob, safeName(opt, "md"));
}

/* ---------- Cover letter exports ---------- */
export function downloadCoverLetterPdf(opt: ExportData, text: string) {
  const doc = new jsPDF({ unit: "pt", format: "letter" });
  const margin = 56;
  const maxWidth = doc.internal.pageSize.getWidth() - margin * 2;
  let y = margin;
  doc.setFont("helvetica", "bold"); doc.setFontSize(18); doc.setTextColor(15, 50, 40);
  doc.text("Cover Letter", margin, y); y += 24;
  doc.setFont("helvetica", "normal"); doc.setFontSize(11); doc.setTextColor(30, 30, 30);
  text.split(/\n+/).forEach(para => {
    const lines = doc.splitTextToSize(para, maxWidth);
    lines.forEach((line: string) => {
      if (y > doc.internal.pageSize.getHeight() - margin) { doc.addPage(); y = margin; }
      doc.text(line, margin, y); y += 14;
    });
    y += 8;
  });
  doc.save(safeName(opt, "cover.pdf"));
}
