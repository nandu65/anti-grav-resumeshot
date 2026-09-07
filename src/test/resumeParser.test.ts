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

  it("should extract leadership experience section when present", () => {
    const rawText = `
Jane Doe
Product Lead
jane@example.com

LEADERSHIP EXPERIENCE
Chapter Lead , Women in Tech
Jan 2022 – Present
• Mentored 40+ early career engineers.
• Led monthly community meetups with 200+ attendees.

EDUCATION
B.S. Computer Science , MIT
2018 – 2022
    `;

    const parsed = parseResumeTextLocally(rawText);
    expect(parsed.leadership).toBeDefined();
    expect(parsed.leadership?.length).toBe(1);
    expect(parsed.leadership?.[0].organization).toBe("Women in Tech");
    expect(parsed.leadership?.[0].role).toBe("Chapter Lead");
    expect(parsed.leadership?.[0].bullets.length).toBe(2);
  });

  it("should cleanly separate work experience and leadership experience with numbered/varied headers", () => {
    const rawText = `
Alex Morgan
Senior Software Engineer
alex@example.com • 555-0199 • New York, NY

1. SUMMARY
Experienced full-stack engineer with 6+ years building web applications.

2. WORK EXPERIENCE
Software Engineer , Stripe
2021 – Present
• Developed payment settlement pipelines processing $10M daily.
• Optimized Postgres query latencies by 35%.

Frontend Developer , Acme Corp
2019 – 2021
• Built reusable component design system.

3. LEADERSHIP & ACTIVITIES
President , ACM Student Chapter
2018 – 2019
• Organized hackathons and weekly technical workshops.

Team Lead , Open Source Collective
2020 – 2022
• Coordinated 15 volunteer open-source maintainers.

4. EDUCATION
B.S. in Computer Science , NYU
2015 – 2019
    `;

    const parsed = parseResumeTextLocally(rawText);

    // Verify work experience only contains Stripe and Acme
    expect(parsed.experience.length).toBe(2);
    expect(parsed.experience[0].company).toContain("Stripe");
    expect(parsed.experience[1].company).toContain("Acme Corp");

    // Verify leadership only contains ACM and Open Source Collective
    expect(parsed.leadership).toBeDefined();
    expect(parsed.leadership?.length).toBe(2);
    expect(parsed.leadership?.[0].organization).toContain("ACM Student Chapter");
    expect(parsed.leadership?.[0].role).toBe("President");
    expect(parsed.leadership?.[1].organization).toContain("Open Source Collective");
    expect(parsed.leadership?.[1].role).toBe("Team Lead");
  });
});
