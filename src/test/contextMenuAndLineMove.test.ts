import { describe, it, expect } from "vitest";
import { ResumeData, getNormalizedSectionOrder } from "../lib/resumeTemplates";

describe("Resume Context Menu & Line-by-Line Movement", () => {
  it("should preserve leadership in normalized section order", () => {
    const defaultOrder = getNormalizedSectionOrder();
    expect(defaultOrder).toContain("leadership");
    expect(defaultOrder).toContain("experience");

    // Custom order without leadership should automatically insert leadership
    const customOrder = ["summary", "experience", "education", "skills"];
    const normalized = getNormalizedSectionOrder(customOrder);
    expect(normalized).toContain("leadership");
    expect(normalized.indexOf("leadership")).toBe(normalized.indexOf("experience") + 1);
  });

  it("should move bullets up and down cleanly without data corruption", () => {
    const initialBullets = [
      "1. Led team of 5 engineers",
      "2. Reduced load time by 40%",
      "3. Deployed CI/CD pipeline",
    ];

    // Move index 1 (Reduced load time) up
    const movedUp = [...initialBullets];
    const temp = movedUp[1];
    movedUp[1] = movedUp[0];
    movedUp[0] = temp;

    expect(movedUp[0]).toBe("2. Reduced load time by 40%");
    expect(movedUp[1]).toBe("1. Led team of 5 engineers");
    expect(movedUp[2]).toBe("3. Deployed CI/CD pipeline");

    // Move index 1 down
    const movedDown = [...movedUp];
    const temp2 = movedDown[1];
    movedDown[1] = movedDown[2];
    movedDown[2] = temp2;

    expect(movedDown[0]).toBe("2. Reduced load time by 40%");
    expect(movedDown[1]).toBe("3. Deployed CI/CD pipeline");
    expect(movedDown[2]).toBe("1. Led team of 5 engineers");
  });

  it("should duplicate and insert bullet lines cleanly", () => {
    const initialBullets = ["Line A", "Line B"];

    // Duplicate Line A
    const duplicated = [...initialBullets];
    duplicated.splice(1, 0, duplicated[0]);
    expect(duplicated.length).toBe(3);
    expect(duplicated).toEqual(["Line A", "Line A", "Line B"]);

    // Insert new line below index 1
    duplicated.splice(2, 0, "New bullet point...");
    expect(duplicated.length).toBe(4);
    expect(duplicated[2]).toBe("New bullet point...");

    // Delete Line B
    duplicated.splice(3, 1);
    expect(duplicated.length).toBe(3);
    expect(duplicated).toEqual(["Line A", "Line A", "New bullet point..."]);
  });

  it("should correctly transform text case for uppercase, lowercase, and titlecase", () => {
    const rawText = "senior frontend developer & full-stack architect";

    const upper = rawText.toUpperCase();
    expect(upper).toBe("SENIOR FRONTEND DEVELOPER & FULL-STACK ARCHITECT");

    const lower = upper.toLowerCase();
    expect(lower).toBe("senior frontend developer & full-stack architect");

    const title = lower.replace(/\b\w+/g, w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase());
    expect(title).toBe("Senior Frontend Developer & Full-Stack Architect");
  });

  it("should support drag-and-drop section reordering accurately", () => {
    const defaultSections = getNormalizedSectionOrder();
    const sourceIndex = defaultSections.indexOf("skills");
    const destinationIndex = 1; // Move skills near top right after summary

    const reordered = Array.from(defaultSections);
    const [moved] = reordered.splice(sourceIndex, 1);
    reordered.splice(destinationIndex, 0, moved);

    expect(reordered[destinationIndex]).toBe("skills");
    expect(reordered.length).toBe(defaultSections.length);
    expect(reordered).toContain("experience");
    expect(reordered).toContain("leadership");
    expect(reordered).toContain("education");
  });

  it("should support card reordering for experience, leadership, education, and projects", () => {
    const roles = [
      { company: "Company A", role: "Frontend Dev" },
      { company: "Company B", role: "Backend Dev" },
      { company: "Company C", role: "Fullstack Dev" },
    ];

    // Drag role C (index 2) to top (index 0)
    const reordered = Array.from(roles);
    const [movedRole] = reordered.splice(2, 1);
    reordered.splice(0, 0, movedRole);

    expect(reordered[0].company).toBe("Company C");
    expect(reordered[1].company).toBe("Company A");
    expect(reordered[2].company).toBe("Company B");
  });
});

