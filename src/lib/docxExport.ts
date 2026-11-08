import {
  Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType,
  BorderStyle, LevelFormat, PageBreak,
  Table, TableRow, TableCell, WidthType, ShadingType, VerticalAlign,
} from "docx";
import {
  TemplateId, ResumeData, normalizeResumeSkills, getNormalizedSectionOrder,
  getSectionTitle, saveBlob, parseRichSegments, safeName, isGenericSkillCategory,
} from "./resumeTemplates";
import {
  TEMPLATE_DOCX_CONFIGS, resolveDocxFont, isMultiColumnTemplate,
} from "./docxConfig";

export * from "./docxConfig";

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
          new TextRun({ text: "• ", size: Math.round(fontSize * 0.8), color: cfg.sidebarHeadingColor || "FFFFFF", font: bulletFont }),
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
                  new TextRun({ text: "• ", size: Math.round(fontSize * 0.8), color: cfg.sidebarHeadingColor || "FFFFFF", font }),
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
      default:
        if (key.startsWith("custom_")) {
          const custom = getCustomSectionFromKey(data, key);
          if (custom && (custom.sec.title || custom.sec.content || custom.sec.bullets?.length)) {
            out.push(H(custom.sec.title || "Custom Section", isSidebar));
            if (custom.sec.content) {
              out.push(P(custom.sec.content, { color: secTextColor, size: isSidebar ? Math.round(baseSize * 0.95) : baseSize }));
            }
            custom.sec.bullets?.forEach(b => out.push(bullet(b, isSidebar)));
          }
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
        levels: [{
          level: 0, format: LevelFormat.BULLET, text: "•", alignment: AlignmentType.LEFT,
          style: { paragraph: { indent: { left: 480, hanging: 260 } } }
        }],
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
