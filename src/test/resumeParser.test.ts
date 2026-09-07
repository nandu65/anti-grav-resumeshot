import { describe, it, expect } from "vitest";
import { parseResumeTextLocally } from "../lib/resumeParser";

describe("Local Resume Parser", () => {
  it("should extract personal details, experience, education, and skills cleanly", () => {
    const rawText = `
Nandu Naidu L
Aspiring Financial Analyst
nandunaidu65@gmail.com • +91 9972964842 • Bengaluru, India
https://linkedin.com/in/nandunaidu

SUMMARY
Results-oriented B.Com graduate with foundational knowledge in financial analysis.

EXPERIENCE
Placement Coordinator , Christ Academy
Jan 2023 – Aug 2024
• Coordinated comprehensive placement activities for 200+ students.
• Managed logistical arrangements for 15+ drives.

Intern , TVS Motor Company
May 2023 – Jun 2023
• Applied theoretical financial knowledge to real-world scenarios.

EDUCATION
Bachelor of Commerce (B.Com) , Christ Academy
Aug 2024

SKILLS
Financial & Analytical Skills: Investment Banking, Data Analysis, Budgeting
Technical Skills: Microsoft Excel, Computer Skills

CERTIFICATIONS
• Financial Modeling Certificate
    `;

    const parsed = parseResumeTextLocally(rawText);

    expect(parsed.name).toContain("Nandu Naidu");
    expect(parsed.email).toBe("nandunaidu65@gmail.com");
    expect(parsed.phone).toBe("+91 9972964842");
    expect(parsed.summary).toContain("Results-oriented B.Com graduate");
    expect(parsed.experience.length).toBeGreaterThanOrEqual(1);
    expect(parsed.education.length).toBeGreaterThanOrEqual(1);
    expect(parsed.skills.length).toBeGreaterThanOrEqual(1);
    expect(parsed.certifications.length).toBeGreaterThanOrEqual(1);
  });
});
