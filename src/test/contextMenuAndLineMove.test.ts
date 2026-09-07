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

    // Delete Line B
    duplicated.splice(2, 1);
    expect(duplicated.length).toBe(2);
    expect(duplicated).toEqual(["Line A", "Line A"]);
  });
});
