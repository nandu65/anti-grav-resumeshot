import { test, expect } from 'vitest';
import { normalizeResumeSkills, isGenericSkillCategory, parseRichSegments } from '../../lib/resumeTemplates';

test('Resume Export Data Mapping Integrity', () => {
  const mockData = {
    name: "Test User",
    skills: [
      { category: "Technical Skills", items: ["React", "TypeScript"] },
      { category: "General", items: ["Communication"] }
    ]
  };
  
  const normalized = normalizeResumeSkills(mockData as any);
  expect(normalized.skills).toHaveLength(2);
  expect(normalized.skills[0].category).toBe("Skills"); // Merged "General"
  expect(normalized.skills[0].items).toContain("Communication");
  expect(normalized.skills[1].category).toBe("Technical Skills");
});

test('isGenericSkillCategory correctly identifies generic labels', () => {
  expect(isGenericSkillCategory("Skills")).toBe(true);
  expect(isGenericSkillCategory("Key Skills")).toBe(true);
  expect(isGenericSkillCategory("General")).toBe(true);
  expect(isGenericSkillCategory("Technical")).toBe(false);
});

test('parseRichSegments handles HTML formatting', () => {
  const html = "<b>Bold</b> and <i>Italic</i>";
  const segments = parseRichSegments(html);
  
  expect(segments).toHaveLength(3);
  expect(segments[0].text).toBe("Bold");
  expect(segments[0].bold).toBe(true);
  expect(segments[1].text).toBe(" and ");
  expect(segments[1].bold).toBe(false);
  expect(segments[2].text).toBe("Italic");
  expect(segments[2].italic).toBe(true);
});

test('DOCX layout parity: multi-column templates use a Table, single-column do not', async () => {
  const { buildResumeDocxBody, isMultiColumnTemplate, TEMPLATE_DOCX_CONFIGS } = await import('../../lib/resumeTemplates');
  const { Table } = await import('docx');

  const data: any = {
    name: "Nandu Naidu L",
    title: "Aspiring Financial Analyst",
    email: "nandunaidu65@gmail.com",
    phone: "+91 9972964842",
    location: "Bengaluru, India",
    summary: "Results-oriented B.Com graduate with foundational knowledge in finance.",
    experience: [{ role: "Placement Coordinator", company: "Christ Academy", location: "Bengaluru", start: "Jan 2023", end: "Aug 2024", bullets: ["Coordinated placement activities"] }],
    education: [{ degree: "Bachelor of Commerce (B.Com)", school: "Christ Academy", location: "Bengaluru", start: "2021", end: "2024", details: "" }],
    projects: [],
    certifications: ["Digital Marketing Fundamentals (Google Digital Garage)"],
    skills: [{ category: "Skills", items: ["Investment Banking", "Data Analysis", "Market Research"] }],
  };

  expect(isMultiColumnTemplate('modern')).toBe(true);
  expect(isMultiColumnTemplate('teal-left')).toBe(true);
  expect(isMultiColumnTemplate('sidebar-dark')).toBe(true);
  expect(isMultiColumnTemplate('creative')).toBe(true);
  expect(isMultiColumnTemplate('classic')).toBe(false);
  expect(isMultiColumnTemplate('executive')).toBe(false);

  // Modern Template Fidelity:
  const modern = buildResumeDocxBody(data, 'modern');
  expect(modern.layout).toBe('two-column');
  expect(modern.children.length).toBeGreaterThan(0);
  const table = modern.children.find((c: any) => c instanceof Table) as any;
  expect(table).toBeDefined();
  
  // Verify Modern template config
  expect(TEMPLATE_DOCX_CONFIGS.modern.sidebarBg).toBe("065F46");
  expect(TEMPLATE_DOCX_CONFIGS.modern.sidebarTextColor).toBe("FFFFFF");
  expect(TEMPLATE_DOCX_CONFIGS.modern.namePlacement).toBe("sidebar");
  expect(TEMPLATE_DOCX_CONFIGS.modern.mainSections).toContain("education");
  expect(TEMPLATE_DOCX_CONFIGS.modern.sidebarSections).toContain("skills");

  // Single Column Fidelity:
  const classic = buildResumeDocxBody(data, 'classic');
  expect(classic.layout).toBe('single-column');
  expect(classic.children.some((c: any) => c instanceof Table)).toBe(false);

  // Banner Template Fidelity:
  const creative = buildResumeDocxBody(data, 'creative');
  expect(creative.layout).toBe('two-column');
  // Creative has a banner table + spacing + main table
  const tables = creative.children.filter((c: any) => c instanceof Table);
  expect(tables.length).toBe(2);
});
