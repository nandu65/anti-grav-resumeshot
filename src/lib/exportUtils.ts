import { ResumeData } from "@/types/resume";

/**
 * Format resume data into pure ATS Raw Text
 * Ideal for pasting directly into Workday, Taleo, and Greenhouse form textboxes.
 */
export function formatResumeToPlainText(data: ResumeData): string {
  const lines: string[] = [];

  // Header
  const { fullName, email, phone, location, website, linkedin, github } = data.personalInfo;
  lines.push(fullName.toUpperCase());
  const contactParts = [email, phone, location, website, linkedin, github].filter(Boolean);
  if (contactParts.length > 0) {
    lines.push(contactParts.join(" | "));
  }
  lines.push("");

  // Summary
  if (data.personalInfo.summary?.trim()) {
    lines.push("PROFESSIONAL SUMMARY");
    lines.push("--------------------");
    lines.push(data.personalInfo.summary.trim());
    lines.push("");
  }

  // Work Experience
  if (data.workExperience && data.workExperience.length > 0) {
    lines.push("PROFESSIONAL EXPERIENCE");
    lines.push("-----------------------");
    for (const exp of data.workExperience) {
      const dates = `${exp.startDate || ""} - ${exp.current ? "Present" : exp.endDate || ""}`.trim();
      const roleLine = `${exp.jobTitle} - ${exp.company}${exp.location ? `, ${exp.location}` : ""} (${dates})`;
      lines.push(roleLine);

      if (exp.bulletPoints && exp.bulletPoints.length > 0) {
        for (const bullet of exp.bulletPoints) {
          if (bullet.trim()) {
            lines.push(`• ${bullet.trim()}`);
          }
        }
      }
      lines.push("");
    }
  }

  // Projects
  if (data.projects && data.projects.length > 0) {
    lines.push("KEY PROJECTS");
    lines.push("------------");
    for (const proj of data.projects) {
      lines.push(`${proj.title}${proj.technologies ? ` [${proj.technologies}]` : ""}`);
      if (proj.bulletPoints && proj.bulletPoints.length > 0) {
        for (const bullet of proj.bulletPoints) {
          if (bullet.trim()) {
            lines.push(`• ${bullet.trim()}`);
          }
        }
      }
      lines.push("");
    }
  }

  // Skills
  if (data.skills) {
    const hasSkills =
      (data.skills.technical && data.skills.technical.length > 0) ||
      (data.skills.soft && data.skills.soft.length > 0) ||
      (data.skills.tools && data.skills.tools.length > 0);

    if (hasSkills) {
      lines.push("SKILLS & CORE COMPETENCIES");
      lines.push("--------------------------");
      if (data.skills.technical?.length) {
        lines.push(`Technical: ${data.skills.technical.join(", ")}`);
      }
      if (data.skills.tools?.length) {
        lines.push(`Tools & Platforms: ${data.skills.tools.join(", ")}`);
      }
      if (data.skills.soft?.length) {
        lines.push(`Soft Skills: ${data.skills.soft.join(", ")}`);
      }
      lines.push("");
    }
  }

  // Education
  if (data.education && data.education.length > 0) {
    lines.push("EDUCATION");
    lines.push("---------");
    for (const edu of data.education) {
      const dates = `${edu.startDate || ""} - ${edu.endDate || ""}`.trim();
      lines.push(`${edu.degree} in ${edu.fieldOfStudy} - ${edu.institution} (${dates})`);
      if (edu.gpa) lines.push(`GPA/Grade: ${edu.gpa}`);
    }
    lines.push("");
  }

  // Certifications
  if (data.certifications && data.certifications.length > 0) {
    lines.push("CERTIFICATIONS");
    lines.push("--------------");
    for (const cert of data.certifications) {
      lines.push(`${cert.name} - ${cert.issuer} (${cert.issueDate || ""})`);
    }
    lines.push("");
  }

  return lines.join("\n");
}

/**
 * Trigger download of plain-text ATS Raw Text (.txt)
 */
export function downloadPlainTextResume(data: ResumeData, filename?: string) {
  const text = formatResumeToPlainText(data);
  const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  const name = filename || `${data.personalInfo.fullName.replace(/\s+/g, "_")}_ATS_Resume.txt`;
  link.href = url;
  link.download = name;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Generate and download Word Document (.doc / .docx compatible)
 */
export function downloadWordResume(data: ResumeData, filename?: string) {
  const plainText = formatResumeToPlainText(data);
  const htmlContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <title>${data.personalInfo.fullName} Resume</title>
        <style>
          body { font-family: Calibri, 'Times New Roman', sans-serif; font-size: 11pt; line-height: 1.35; color: #111; margin: 1in; }
          h1 { font-size: 18pt; margin: 0 0 4pt; text-align: center; color: #000; text-transform: uppercase; }
          .contact { text-align: center; font-size: 10pt; color: #444; margin-bottom: 12pt; border-bottom: 1pt solid #ccc; padding-bottom: 6pt; }
          h2 { font-size: 12pt; text-transform: uppercase; color: #059669; border-bottom: 1pt solid #059669; margin: 12pt 0 4pt; padding-bottom: 2pt; }
          .job-title { font-weight: bold; }
          .company { font-style: italic; }
          .date { float: right; }
          ul { margin: 4pt 0 8pt 18pt; padding: 0; }
          li { margin-bottom: 3pt; }
        </style>
      </head>
      <body>
        <h1>${data.personalInfo.fullName}</h1>
        <div class="contact">
          ${[data.personalInfo.email, data.personalInfo.phone, data.personalInfo.location, data.personalInfo.linkedin].filter(Boolean).join(" &bull; ")}
        </div>
        <pre style="font-family: Calibri, sans-serif; white-space: pre-wrap; font-size: 11pt;">${plainText}</pre>
      </body>
    </html>
  `;

  const blob = new Blob(["\ufeff", htmlContent], { type: "application/msword" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  const name = filename || `${data.personalInfo.fullName.replace(/\s+/g, "_")}_Resume.doc`;
  link.href = url;
  link.download = name;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
