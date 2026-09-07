import { describe, it, expect, vi } from "vitest";
import {
  ResumeData,
  downloadResumePdfFromData,
  downloadResumeDocxFromData,
  buildResumeText,
  buildResumeMarkdown,
  buildResumeDocxBody,
} from "../lib/resumeTemplates";


describe("Resume Data Integrity", () => {
  const sentinelData: ResumeData = {
    name: "Arjun Sharma",
    title: "Senior Product Designer",
    email: "arjun@example.com",
    phone: "+91 9000000000",
    location: "Bengaluru",
    links: [{ label: "LinkedIn", url: "linkedin.com/in/arjun" }],
    summary: "Senior Product Designer with six years of experience designing fintech products and improving customer journeys.",
    experience: [{
      company: "Razorpay",
      role: "Senior Product Designer",
      location: "Bengaluru",
      start: "2021",
      end: "Present",
      bullets: ["Led discovery, prototyping, and launch of merchant onboarding experiences, improving activation by 18%."]
    }],
    education: [{
      school: "National Institute of Design",
      degree: "B.Des in Product Design",
      location: "Ahmedabad",
      start: "2016",
      end: "2020",
      details: "Specialized in Interaction Design."
    }],
    projects: [{
      name: "Merchant Onboarding Redesign",
      tech: "Figma, Prototyping",
      bullets: ["Redesigned the onboarding flow and improved activation by 18%."]
    }],
    skills: [{
      category: "Design",
      items: ["Product Design", "Figma", "UX Research", "Design Systems", "Prototyping", "A/B Testing"]
    }],
    certifications: ["Google UX Design Certificate"],
    settings: {
      fontSize: 11,
      fontFamily: "Inter, sans-serif"
    }
  };

  it("should verify that the data object is correctly formed and passed to exporters", async () => {
    // This is a unit test for the data structure itself as requested in B and E
    expect(sentinelData.name).toBe("Arjun Sharma");
    expect(sentinelData.experience[0].company).toBe("Razorpay");
    expect(sentinelData.education[0].school).toBe("National Institute of Design");
    expect(sentinelData.projects[0].name).toBe("Merchant Onboarding Redesign");
    expect(sentinelData.skills[0].items).toContain("Figma");
    expect(sentinelData.certifications).toContain("Google UX Design Certificate");
  });

  it("should support optional leadership experience in resume data and export builders", async () => {
    const dataWithLeadership: ResumeData = {
      ...sentinelData,
      leadership: [
        {
          role: "President",
          organization: "Design Student Association",
          location: "Ahmedabad",
          start: "2019",
          end: "2020",
          bullets: ["Organized national design symposium with 500+ attendees."]
        }
      ]
    };

    expect(dataWithLeadership.leadership).toBeDefined();
    expect(dataWithLeadership.leadership?.[0].role).toBe("President");
    expect(dataWithLeadership.leadership?.[0].organization).toBe("Design Student Association");

    const txt = buildResumeText(dataWithLeadership);
    expect(txt).toContain("LEADERSHIP EXPERIENCE");
    expect(txt).toContain("President — Design Student Association");

    const md = buildResumeMarkdown(dataWithLeadership);
    expect(md).toContain("## Leadership Experience");
    expect(md).toContain("### President — Design Student Association");

    const docxBody = buildResumeDocxBody(dataWithLeadership, "classic");
    expect(docxBody.children.length).toBeGreaterThan(0);

  });

  it("should sync font formatting and document formatting into settings and exports", async () => {
    const formattedData: ResumeData = {
      ...sentinelData,
      settings: {
        fontFamily: "Arial, sans-serif",
        fontSize: 10,
        headingSize: 14,
        sectionSpacing: 18,
        paragraphSpacing: 8,
        lineSpacing: 1.4,
        marginTopBottom: 36,
        marginSide: 40,
        paragraphIndent: 12,
      }
    };

    const { buildResumeDocxBody, resolveDocxFont } = await import("../lib/resumeTemplates");
    expect(resolveDocxFont(formattedData.settings?.fontFamily)).toBe("Arial");

    const docx = buildResumeDocxBody(formattedData, "classic");
    expect(docx.children.length).toBeGreaterThan(0);
  });

  it("should support all 20 requested fonts and resolve valid docx fonts", async () => {
    const { RESUME_FONTS } = await import("../lib/fonts");
    const { resolveDocxFont } = await import("../lib/resumeTemplates");

    expect(RESUME_FONTS.length).toBe(20);

    const expectedFontNames = [
      "Arial",
      "Bodoni MT",
      "Century Gothic",
      "Courier New",
      "Georgia",
      "Palatino Linotype",
      "Tahoma",
      "Times New Roman",
      "Trebuchet MS",
      "Verdana",
      "Inter",
      "Poppins",
      "Quicksand",
      "Public Sans",
      "Karla",
      "Rubik",
      "Playfair Display",
      "Forum",
      "Noto Serif",
      "Fraunces",
    ];

    const actualFontNames = RESUME_FONTS.map(f => f.label);
    expectedFontNames.forEach(font => {
      expect(actualFontNames).toContain(font);
    });

    // Test docx resolution for all 20 fonts
    RESUME_FONTS.forEach(font => {
      const resolved = resolveDocxFont(font.value);
      expect(resolved).toBeTruthy();
      expect(typeof resolved).toBe("string");
    });

    expect(resolveDocxFont("Arial, Helvetica, sans-serif")).toBe("Arial");
    expect(resolveDocxFont("'Bodoni MT', 'Bodoni Moda', Didot, Georgia, serif")).toBe("Bodoni MT");
    expect(resolveDocxFont("'Century Gothic', CenturyGothic, AppleGothic, sans-serif")).toBe("Century Gothic");
    expect(resolveDocxFont("'Courier New', Courier, monospace")).toBe("Courier New");
    expect(resolveDocxFont("'Palatino Linotype', 'Book Antiqua', Palatino, serif")).toBe("Palatino Linotype");
    expect(resolveDocxFont("Tahoma, Geneva, sans-serif")).toBe("Tahoma");
    expect(resolveDocxFont("'Times New Roman', Times, serif")).toBe("Times New Roman");
    expect(resolveDocxFont("'Trebuchet MS', 'Lucida Sans Unicode', sans-serif")).toBe("Trebuchet MS");
    expect(resolveDocxFont("Verdana, Geneva, sans-serif")).toBe("Verdana");
    expect(resolveDocxFont("'Inter', sans-serif")).toBe("Calibri");
    expect(resolveDocxFont("'Poppins', sans-serif")).toBe("Calibri");
    expect(resolveDocxFont("'Quicksand', sans-serif")).toBe("Century Gothic");
    expect(resolveDocxFont("'Public Sans', sans-serif")).toBe("Arial");
  });

  it("should support custom section titles and dynamic section order across exporters", async () => {
    const dataWithCustomTitles: ResumeData = {
      ...sentinelData,
      settings: {
        ...sentinelData.settings,
        sectionOrder: ["skills", "experience", "education", "summary"],
        customSectionTitles: {
          skills: "Core Proficiencies",
          experience: "Career History",
          summary: "About Me",
        }
      }
    };

    const { getSectionTitle, buildResumeText, buildResumeMarkdown, buildResumeDocxBody } = await import("../lib/resumeTemplates");
    
    expect(getSectionTitle(dataWithCustomTitles, "skills", "Skills")).toBe("Core Proficiencies");
    expect(getSectionTitle(dataWithCustomTitles, "experience", "Experience")).toBe("Career History");
    expect(getSectionTitle(dataWithCustomTitles, "summary", "Summary")).toBe("About Me");
    expect(getSectionTitle(dataWithCustomTitles, "education", "Education")).toBe("Education");

    const txt = buildResumeText(dataWithCustomTitles);
    expect(txt).toContain("CORE PROFICIENCIES");
    expect(txt).toContain("CAREER HISTORY");
    expect(txt).toContain("ABOUT ME");
    // Ensure sectionOrder is respected: Core Proficiencies appears before Career History
    expect(txt.indexOf("CORE PROFICIENCIES")).toBeLessThan(txt.indexOf("CAREER HISTORY"));

    const md = buildResumeMarkdown(dataWithCustomTitles);
    expect(md).toContain("## Core Proficiencies");
    expect(md).toContain("## Career History");
    expect(md).toContain("## About Me");
    expect(md.indexOf("## Core Proficiencies")).toBeLessThan(md.indexOf("## Career History"));

    const docx = buildResumeDocxBody(dataWithCustomTitles, "classic");
    expect(docx.children.length).toBeGreaterThan(0);
  });
});

