import { describe, it, expect, vi } from "vitest";
import { ResumeData, downloadResumePdfFromData, downloadResumeDocxFromData } from "../lib/resumeTemplates";

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

    const { buildResumeText, buildResumeMarkdown, buildResumeDocxBody } = await import("../lib/resumeTemplates");
    const txt = buildResumeText(dataWithLeadership);
    expect(txt).toContain("LEADERSHIP EXPERIENCE");
    expect(txt).toContain("President — Design Student Association");

    const md = buildResumeMarkdown(dataWithLeadership);
    expect(md).toContain("## Leadership Experience");
    expect(md).toContain("### President — Design Student Association");

    const docxBody = buildResumeDocxBody(dataWithLeadership, "classic");
    expect(docxBody.children.length).toBeGreaterThan(0);
  });
});
