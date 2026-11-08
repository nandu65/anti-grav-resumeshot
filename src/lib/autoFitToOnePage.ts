import { ResumeSettings, A4_HEIGHT_PX } from "./resumeTemplates";

export interface AutoFitResult {
  settings: ResumeSettings;
  description: string;
  isAlreadySinglePage: boolean;
  savedPxEstimate: number;
}

/**
 * Calculates optimal typography and spacing parameters to snap an overflowing
 * resume onto a single A4 page (1123px).
 */
export function calculateFitToOnePageSettings(
  currentSettings: ResumeSettings = {},
  contentHeightPx: number
): AutoFitResult {
  const currentHeight = Math.max(contentHeightPx, A4_HEIGHT_PX);
  const overflowPx = currentHeight - (A4_HEIGHT_PX + 20);

  if (overflowPx <= 0) {
    return {
      settings: currentSettings,
      description: "Already optimal single page layout",
      isAlreadySinglePage: true,
      savedPxEstimate: 0,
    };
  }

  // Baseline from current or defaults
  let newSkillsLayout: "horizontal" | "columns" | "vertical" = "horizontal";
  let newSectionSpacing = currentSettings.sectionSpacing ?? 16;
  let newParagraphSpacing = currentSettings.paragraphSpacing ?? 6;
  let newLineSpacing = currentSettings.lineSpacing ?? 1.35;
  let newFontSize = currentSettings.fontSize ?? 11;
  let newHeadingSize = currentSettings.headingSize ?? 14;
  let newMarginTB = currentSettings.marginTopBottom ?? 0;

  // Level 1: Minor overflow (<= 70px) — light spacing tighten
  if (overflowPx <= 70) {
    newSectionSpacing = Math.max(12, newSectionSpacing - 3);
    newParagraphSpacing = Math.max(4, newParagraphSpacing - 2);
    newLineSpacing = Math.max(1.28, newLineSpacing - 0.05);
  }
  // Level 2: Moderate overflow (71 - 170px) — spacing + slight font tweak
  else if (overflowPx <= 170) {
    newSectionSpacing = Math.max(10, newSectionSpacing - 5);
    newParagraphSpacing = Math.max(3, newParagraphSpacing - 3);
    newLineSpacing = Math.max(1.22, newLineSpacing - 0.1);
    newFontSize = Math.max(10.5, newFontSize - 0.5);
    newHeadingSize = Math.max(13, newHeadingSize - 1);
  }
  // Level 3: Significant overflow (171 - 320px) — compact font & spacing
  else if (overflowPx <= 320) {
    newSectionSpacing = Math.max(9, newSectionSpacing - 6);
    newParagraphSpacing = Math.max(2, newParagraphSpacing - 3);
    newLineSpacing = Math.max(1.18, newLineSpacing - 0.15);
    newFontSize = Math.max(10, newFontSize - 1);
    newHeadingSize = Math.max(12.5, newHeadingSize - 1.5);
    newMarginTB = Math.min(newMarginTB, -4);
  }
  // Level 4: Heavy overflow (> 320px) — maximum single-page budget
  else {
    newSectionSpacing = 8;
    newParagraphSpacing = 2;
    newLineSpacing = 1.15;
    newFontSize = 9.5;
    newHeadingSize = 12;
    newMarginTB = -8;
  }

  const updatedSettings: ResumeSettings = {
    ...currentSettings,
    skillsLayout: newSkillsLayout,
    sectionSpacing: newSectionSpacing,
    paragraphSpacing: newParagraphSpacing,
    lineSpacing: Number(newLineSpacing.toFixed(2)),
    fontSize: Number(newFontSize.toFixed(2)),
    headingSize: Number(newHeadingSize.toFixed(2)),
    marginTopBottom: newMarginTB,
  };

  const description = `Section: ${newSectionSpacing}px, Font: ${newFontSize}pt, Line: ${newLineSpacing}`;

  return {
    settings: updatedSettings,
    description,
    isAlreadySinglePage: false,
    savedPxEstimate: overflowPx + 40,
  };
}

