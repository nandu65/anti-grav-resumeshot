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

  it("should accurately parse the user's reference resume and cleanly extract leadership roles", () => {
    const rawText = `
Nandu Naidu L
nandunaidu65@gmail.com | +91 9972964842

WORK EXPERIENCE
Cafecoffeeconfessions and Iyengarsovenfresh Bengaluru, India (Remote)
Freelancer Nov 2023 - Present
• Created engaging and informative content for Instagram

McDonald's Bengaluru, India
Intern Mar 2024 - Apr 2024
• Gained valuable insights and real-time experience about product management and service

TVS Motor Company Bengaluru, India
Intern May 2023 - Jun 2023
• Gained valuable experience working within a specific industry, applying learned concepts directly into relevant work situations

Universal Tribes Bengaluru, India
HR Intern May 2025 - Jun 2025
• performed All round Tasks of HR from sourcing to onboarding

EDUCATION
Christ Academy Institute For Advanced Studies Bengaluru
Graduation (B.Com) Graduation Date: Aug 2024

Christ Academy Junior College Bengaluru
2nd PUC Graduation Date: Jun 2021

Gurukula Academy Bengaluru
SSLC Graduation Date: Jul 2019

LEADERSHIP EXPERIENCE
Christ Academy Bengaluru
Placement Coordinator Jan 2023 -Aug2024
• Coordinated placement activities for students

Eminence Club Bengaluru
Volunteer dec 2022 -Aug2024
• Engaged in college volunteer activities

School Bengaluru
Class Representative
• Twice in school and once in college

School Band Bengaluru
Member
• Represented the school in various events

Red House Team Bengaluru
Captain
• Led the team to sports victories
    `;

    const parsed = parseResumeTextLocally(rawText);

    expect(parsed.name).toBe("Nandu Naidu L");
    expect(parsed.email).toBe("nandunaidu65@gmail.com");
    expect(parsed.phone).toBe("+91 9972964842");

    // Work experience should have 4 items
    expect(parsed.experience.length).toBe(4);
    expect(parsed.experience.some(e => e.company.includes("Cafecoffeeconfessions"))).toBe(true);
    expect(parsed.experience.some(e => e.company.includes("McDonald's"))).toBe(true);
    expect(parsed.experience.some(e => e.company.includes("TVS Motor Company"))).toBe(true);
    expect(parsed.experience.some(e => e.company.includes("Universal Tribes"))).toBe(true);

    // Leadership should have 5 items
    expect(parsed.leadership).toBeDefined();
    expect(parsed.leadership?.length).toBe(5);
    expect(parsed.leadership?.some(l => l.role.toLowerCase().includes("placement coordinator"))).toBe(true);
    expect(parsed.leadership?.some(l => l.role.toLowerCase().includes("volunteer"))).toBe(true);
    expect(parsed.leadership?.some(l => l.role.toLowerCase().includes("class representative"))).toBe(true);
    expect(parsed.leadership?.some(l => l.organization.toLowerCase().includes("school band"))).toBe(true);
    expect(parsed.leadership?.some(l => l.organization.toLowerCase().includes("red house team"))).toBe(true);
  });

  it("should extract leadership roles even if listed under WORK EXPERIENCE heading", () => {
    const rawText = `
Nandu Naidu
nandu@example.com

WORK EXPERIENCE
TVS Motor Company
Intern May 2023 - Jun 2023
• Worked on financial accounting.

Christ Academy
Placement Coordinator Jan 2023 - Aug 2024
• Coordinated placements for 200+ batchmates.

Eminence Club
Volunteer Dec 2022 - Aug 2024
• Volunteered for college fest.
    `;

    const parsed = parseResumeTextLocally(rawText);

    expect(parsed.experience.length).toBe(1);
    expect(parsed.experience[0].company).toContain("TVS Motor Company");

    expect(parsed.leadership).toBeDefined();
    expect(parsed.leadership?.length).toBe(2);
    expect(parsed.leadership?.[0].role).toContain("Placement Coordinator");
    expect(parsed.leadership?.[1].role).toContain("Volunteer");
  });
});

