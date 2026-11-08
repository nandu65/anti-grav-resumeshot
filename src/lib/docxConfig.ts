import { TemplateId } from "./resumeTemplates";

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
  "christ-template": {
    layout: "single-column",
    font: "Times New Roman",
    accent: "000000",
    namePlacement: "header-left",
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
