export interface ParsedResumeResult {
  name: string;
  title: string;
  email: string;
  phone: string;
  location: string;
  linkedin?: string;
  github?: string;
  portfolio?: string;
  links: { label: string; url: string }[];
  summary: string;
  experience: { company: string; role: string; location: string; start: string; end: string; bullets: string[] }[];
  education: { school: string; degree: string; location: string; start: string; end: string; details: string }[];
  projects: { name: string; tech: string; bullets: string[] }[];
  skills: { category: string; items: string[] }[];
  certifications: string[];
}

export function parseResumeTextLocally(rawText: string): ParsedResumeResult {
  const lines = rawText
    .split(/\r?\n/)
    .map(l => l.trim())
    .filter(Boolean);

  const result: ParsedResumeResult = {
    name: "",
    title: "",
    email: "",
    phone: "",
    location: "",
    links: [],
    summary: "",
    experience: [],
    education: [],
    projects: [],
    skills: [],
    certifications: [],
  };

  if (lines.length === 0) return result;

  // 1. Extract Email
  const emailRegex = /([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/i;
  const emailMatch = rawText.match(emailRegex);
  if (emailMatch) {
    result.email = emailMatch[1];
  }

  // 2. Extract Phone
  const phoneRegex = /(?:(?:\+?\d{1,3}[-.\s]?)?\(?\d{2,4}\)?[-.\s]?\d{3,4}[-.\s]?\d{3,5})/i;
  const phoneMatch = rawText.match(phoneRegex);
  if (phoneMatch && phoneMatch[0].replace(/\D/g, "").length >= 7) {
    result.phone = phoneMatch[0].trim();
  }

  // 3. Extract Links
  const linkedinMatch = rawText.match(/(https?:\/\/(?:www\.)?linkedin\.com\/in\/[^\s\),]+)/i);
  if (linkedinMatch) {
    result.linkedin = linkedinMatch[1];
    result.links.push({ label: "LinkedIn", url: linkedinMatch[1] });
  }

  const githubMatch = rawText.match(/(https?:\/\/(?:www\.)?github\.com\/[^\s\),]+)/i);
  if (githubMatch) {
    result.github = githubMatch[1];
    result.links.push({ label: "GitHub", url: githubMatch[1] });
  }

  const portfolioMatch = rawText.match(/(https?:\/\/(?:www\.)?(?!linkedin|github)[a-zA-Z0-9-]+\.[a-zA-Z]{2,}(?:\/[^\s\),]+)?)/i);
  if (portfolioMatch) {
    result.portfolio = portfolioMatch[1];
    result.links.push({ label: "Portfolio", url: portfolioMatch[1] });
  }

  // 4. Extract Name and Title from top lines
  let nameFound = false;
  for (let i = 0; i < Math.min(5, lines.length); i++) {
    const line = lines[i];
    if (
      line.includes("@") ||
      line.match(phoneRegex) ||
      line.toLowerCase().includes("http") ||
      line.toLowerCase().includes("linkedin") ||
      line.toLowerCase().includes("github") ||
      line.length > 50
    ) {
      continue;
    }
    if (!nameFound) {
      result.name = line.replace(/[•|·]/g, "").trim();
      nameFound = true;
    } else if (!result.title && line.length < 60 && !/^(summary|experience|education|skills)/i.test(line)) {
      result.title = line.replace(/[•|·]/g, "").trim();
      break;
    }
  }

  // 5. Section Partitioning
  const sectionHeaders: { index: number; type: string; header: string }[] = [];
  const sectionKeywords: Record<string, RegExp> = {
    summary: /^(professional summary|summary|profile|about me|executive summary)$/i,
    experience: /^(work experience|professional experience|experience|employment history|work history)$/i,
    education: /^(education|academic background|academics|qualifications)$/i,
    skills: /^(skills|core competencies|technical skills|key skills|technologies)$/i,
    projects: /^(projects|academic projects|key projects|personal projects)$/i,
    certifications: /^(certifications|licenses & certifications|certificates|credentials)$/i,
  };

  lines.forEach((line, idx) => {
    const clean = line.replace(/[:\-—–_#]/g, "").trim();
    for (const [type, re] of Object.entries(sectionKeywords)) {
      if (re.test(clean)) {
        sectionHeaders.push({ index: idx, type, header: line });
        break;
      }
    }
  });

  // Extract content between sections
  for (let s = 0; s < sectionHeaders.length; s++) {
    const current = sectionHeaders[s];
    const nextIndex = s + 1 < sectionHeaders.length ? sectionHeaders[s + 1].index : lines.length;
    const sectionLines = lines.slice(current.index + 1, nextIndex);

    if (current.type === "summary") {
      result.summary = sectionLines.join(" ").trim();
    } else if (current.type === "skills") {
      const allItems: string[] = [];
      const categories: { category: string; items: string[] }[] = [];

      sectionLines.forEach(l => {
        if (l.includes(":")) {
          const [cat, itemsStr] = l.split(":");
          const items = itemsStr.split(/[,•|·]/).map(x => x.trim()).filter(Boolean);
          if (items.length) {
            categories.push({ category: cat.trim(), items });
          }
        } else {
          const items = l.split(/[,•|·]/).map(x => x.trim()).filter(Boolean);
          items.forEach(it => {
            if (it.length < 40) allItems.push(it);
          });
        }
      });

      if (categories.length > 0) {
        result.skills = categories;
      } else if (allItems.length > 0) {
        result.skills = [{ category: "Skills", items: allItems }];
      }
    } else if (current.type === "certifications") {
      result.certifications = sectionLines
        .map(l => l.replace(/^[•\-\*]\s*/, "").trim())
        .filter(Boolean);
    } else if (current.type === "experience") {
      const entries: { company: string; role: string; location: string; start: string; end: string; bullets: string[] }[] = [];
      let currentEntry: { company: string; role: string; location: string; start: string; end: string; bullets: string[] } | null = null;

      const dateRegex = /((?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\.?\s+\d{4}|\d{4})\s*[-–—to\s]+\s*((?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\.?\s+\d{4}|\d{4}|Present|Current)/i;

      sectionLines.forEach(line => {
        const isBullet = /^[•\-\*\u2022\u25E6\u25AA]\s*/.test(line);
        const dateMatch = line.match(dateRegex);

        if (dateMatch && !isBullet) {
          if (currentEntry) entries.push(currentEntry);
          const dateStr = dateMatch[0];
          const dates = dateStr.split(/[-–—]|to/i).map(d => d.trim());
          const otherText = line.replace(dateRegex, "").replace(/[,|·]/g, " ").trim();
          currentEntry = {
            company: otherText || "Company",
            role: "Role",
            location: "",
            start: dates[0] || "",
            end: dates[1] || "",
            bullets: [],
          };
        } else if (isBullet && currentEntry) {
          currentEntry.bullets.push(line.replace(/^[•\-\*\u2022\u25E6\u25AA]\s*/, "").trim());
        } else if (!isBullet && currentEntry) {
          if (currentEntry.role === "Role" && line.length < 50) {
            currentEntry.role = line;
          } else {
            currentEntry.bullets.push(line);
          }
        } else if (!isBullet && !currentEntry) {
          currentEntry = {
            company: line,
            role: "",
            location: "",
            start: "",
            end: "",
            bullets: [],
          };
        }
      });
      if (currentEntry) entries.push(currentEntry);
      result.experience = entries;
    } else if (current.type === "education") {
      const eduEntries: { school: string; degree: string; location: string; start: string; end: string; details: string }[] = [];
      let currentEdu: { school: string; degree: string; location: string; start: string; end: string; details: string } | null = null;

      sectionLines.forEach(line => {
        const isBullet = /^[•\-\*]/.test(line);
        if (!isBullet) {
          if (currentEdu) eduEntries.push(currentEdu);
          currentEdu = {
            school: line,
            degree: "",
            location: "",
            start: "",
            end: "",
            details: "",
          };
        } else if (currentEdu) {
          currentEdu.details = (currentEdu.details ? currentEdu.details + "\n" : "") + line.replace(/^[•\-\*]\s*/, "");
        }
      });
      if (currentEdu) eduEntries.push(currentEdu);
      result.education = eduEntries;
    } else if (current.type === "projects") {
      const projEntries: { name: string; tech: string; bullets: string[] }[] = [];
      let currentProj: { name: string; tech: string; bullets: string[] } | null = null;

      sectionLines.forEach(line => {
        const isBullet = /^[•\-\*]/.test(line);
        if (!isBullet) {
          if (currentProj) projEntries.push(currentProj);
          const [name, tech] = line.split(/[|—–-]/);
          currentProj = {
            name: (name || line).trim(),
            tech: (tech || "").trim(),
            bullets: [],
          };
        } else if (currentProj) {
          currentProj.bullets.push(line.replace(/^[•\-\*]\s*/, "").trim());
        }
      });
      if (currentProj) projEntries.push(currentProj);
      result.projects = projEntries;
    }
  }

  return result;
}
