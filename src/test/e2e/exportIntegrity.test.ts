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
  const { buildResumeDocxBody, isMultiColumnTemplate } = await import('../../lib/resumeTemplates');
  const { Table } = await import('docx');

  const data: any = {
    name: "Harsha Naidu",
    title: "Engineer",
    email: "a@b.com",
    summary: "Summary text",
    experience: [{ role: "Dev", company: "Acme", location: "", start: "2020", end: "2024", bullets: ["Did things"] }],
    education: [{ degree: "BTech", school: "Uni", location: "", start: "2016", end: "2020", details: "" }],
    projects: [],
    certifications: [],
    skills: [{ category: "Skills", items: ["React", "TypeScript"] }],
  };

  expect(isMultiColumnTemplate('modern')).toBe(true);
  expect(isMultiColumnTemplate('teal-left')).toBe(true);
  expect(isMultiColumnTemplate('classic')).toBe(false);

  const multi = buildResumeDocxBody(data, 'modern' as any);
  expect(multi.layout).toBe('two-column');
  expect(multi.children.some((c: any) => c instanceof Table)).toBe(true);

  const single = buildResumeDocxBody(data, 'classic' as any);
  expect(single.layout).toBe('single-column');
  expect(single.children.some((c: any) => c instanceof Table)).toBe(false);
});
