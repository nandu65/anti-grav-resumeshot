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
  leadership?: { organization: string; role: string; location: string; start: string; end: string; bullets: string[] }[];
  education: { school: string; degree: string; location: string; start: string; end: string; details: string }[];
  projects: { name: string; tech: string; bullets: string[] }[];
  skills: { category: string; items: string[] }[];
  certifications: string[];
}

const KNOWN_LOCATIONS = /\b(Bengaluru|Bangalore|Chennai|Mumbai|Delhi|New Delhi|Hyderabad|Pune|Kolkata|Noida|Gurugram|Gurgaon|Ahmedabad|Remote|India|USA|UK|San Francisco|New York|London|California|Texas|Seattle|Boston)\b/i;

const LEADERSHIP_ROLE_KEYWORDS = /\b(placement coordinator|coordinator|event coordinator|program coordinator|volunteer|volunteering|social worker|class representative|cr\b|student representative|representative|head boy|head girl|captain|house captain|vice captain|sports captain|team captain|school band|band member|choir|president|vice president|vp\b|secretary|joint secretary|treasurer|student council|student body|council member|committee member|club lead|chapter lead|campus lead|community lead|campus ambassador|student ambassador|mentor|peer mentor|organizer|co-organizer|event head|cultural head|fest coordinator|ncc|nss|rotaract|leo club)\b/i;

const LEADERSHIP_ORG_KEYWORDS = /\b(club|society|chapter|student council|school band|house team|red house|blue house|green house|yellow house|committee|cell|rotaract|leo club|nss|ncc|ngo|foundation|student branch|eminence club|cultural committee|placement cell)\b/i;

export function isLeadershipEntry(entry: { role?: string; company?: string; organization?: string; bullets?: string[] }): boolean {
  const role = (entry.role || "").trim();
  const org = (entry.organization || entry.company || "").trim();
  const bulletsStr = (entry.bullets || []).join(" ");

  if (LEADERSHIP_ROLE_KEYWORDS.test(role)) return true;
  if (LEADERSHIP_ORG_KEYWORDS.test(org)) return true;
  if (/\b(volunteer|volunteered|coordinated placement|organized college|student representative|sports victory|house captain|school band)\b/i.test(bulletsStr)) return true;

  return false;
}

export function separateExperienceAndLeadership(
  experience: { company: string; role: string; location: string; start: string; end: string; bullets: string[] }[],
  leadership: { organization: string; role: string; location: string; start: string; end: string; bullets: string[] }[] = []
): {
  experience: { company: string; role: string; location: string; start: string; end: string; bullets: string[] }[];
  leadership: { organization: string; role: string; location: string; start: string; end: string; bullets: string[] }[];
} {
  const cleanExp: typeof experience = [];
  const cleanLead: typeof leadership = [...leadership];

  for (const exp of experience) {
    if (isLeadershipEntry(exp)) {
      cleanLead.push({
        organization: exp.company,
        role: exp.role || "Member",
        location: exp.location,
        start: exp.start,
        end: exp.end,
        bullets: exp.bullets,
      });
    } else {
      cleanExp.push(exp);
    }
  }

  return { experience: cleanExp, leadership: cleanLead };
}

const DATE_RANGE_REGEX = /((?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\.?\s*\d{2,4}|\d{4})\s*(?:[-–—to\s]+|\s*-\s*)\s*((?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\.?\s*\d{2,4}|\d{4}|Present|Current)/i;
const SINGLE_DATE_REGEX = /(?:Graduation Date:\s*|(?:Completed|Graduated|Passing Year|Date):\s*)?((?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\.?\s*\d{2,4}|\b(?:19|20)\d{2}\b)/i;

function extractDateAndText(line: string): { text: string; start: string; end: string } {
  const rangeMatch = line.match(DATE_RANGE_REGEX);
  if (rangeMatch) {
    const rawMatch = rangeMatch[0];
    const textWithoutDate = line.replace(rawMatch, "").replace(/[,|·]/g, " ").trim();
    const parts = rawMatch.split(/[-–—]|to/i).map(d => d.trim().replace(/([a-zA-Z]+)(\d{4})/, "$1 $2"));
    return {
      text: textWithoutDate,
      start: parts[0] || "",
      end: parts[1] || "",
    };
  }

  const singleMatch = line.match(SINGLE_DATE_REGEX);
  if (singleMatch && (line.toLowerCase().includes("graduation date") || line.toLowerCase().includes("graduated") || line.toLowerCase().includes("date") || line.length < 35)) {
    const dateStr = singleMatch[1].replace(/([a-zA-Z]+)(\d{4})/, "$1 $2").trim();
    const textWithoutDate = line.replace(singleMatch[0], "").replace(/[,|·]/g, " ").trim();
    return {
      text: textWithoutDate,
      start: "",
      end: dateStr,
    };
  }

  return { text: line, start: "", end: "" };
}

function extractLocation(text: string): { cleanText: string; location: string } {
  let location = "";
  let cleanText = text.trim();

  // Check remote
  const remoteMatch = cleanText.match(/\((remote)\)|(?:\b|\s)remote\b/i);
  if (remoteMatch) {
    location = "Remote";
    cleanText = cleanText.replace(remoteMatch[0], "").trim();
  }

  const locMatch = cleanText.match(KNOWN_LOCATIONS);
  if (locMatch) {
    const locIdx = cleanText.search(KNOWN_LOCATIONS);
    const locPart = cleanText.slice(locIdx).replace(/^[,\s|·—–-]+/, "").trim();
    location = location ? (locPart ? `${locPart} (${location})` : location) : locPart;
    cleanText = cleanText.slice(0, locIdx).replace(/[,\s|·—–-]+$/, "").trim();
  }

  return { cleanText: cleanText || text.trim(), location };
}

const COMMON_ROLE_TITLES = /\b(lead|chapter lead|coordinator|placement coordinator|event coordinator|engineer|developer|intern|hr intern|freelancer|representative|class representative|captain|member|president|vice president|volunteer|analyst|manager|specialist|consultant|associate|officer|assistant|director|head|founder|co-founder|designer|administrator|executive)\b/i;

function parseExperienceLikeSection(lines: string[], defaultOrgKey: "company" | "organization") {
  const entries: any[] = [];
  let current: any = null;

  for (let i = 0; i < lines.length; i++) {
    const rawLine = lines[i].trim();
    if (!rawLine) continue;

    const isBullet = /^[•\-\*\u2022\u25E6\u25AA▪\d+\.]\s*/.test(rawLine);

    if (isBullet) {
      const bulletText = rawLine.replace(/^[•\-\*\u2022\u25E6\u25AA▪\d+\.]\s*/, "").trim();
      if (!current) {
        current = {
          [defaultOrgKey]: "Organization",
          role: "Member",
          location: "",
          start: "",
          end: "",
          bullets: [bulletText],
        };
      } else {
        current.bullets.push(bulletText);
      }
      continue;
    }

    const { text: lineWithoutDate, start, end } = extractDateAndText(rawLine);
    const hasDates = Boolean(start || end);

    // Extract location from the text portion
    const { cleanText, location: loc } = extractLocation(lineWithoutDate);

    // Case 1: Line has comma/pipe/dash separating Role and Org (e.g. "Chapter Lead , Women in Tech" or "Placement Coordinator , Christ Academy")
    const separatorMatch = cleanText.match(/^([^,|–—\-]+)[,|–—\-](.+)$/);
    if (separatorMatch && !hasDates && (current === null || current.bullets.length > 0 || Boolean(current.role && (current.start || current.end)))) {
      if (current) entries.push(current);

      const part1 = separatorMatch[1].trim();
      const part2 = separatorMatch[2].trim();

      let role = part1;
      let org = part2;

      if (!COMMON_ROLE_TITLES.test(part1) && COMMON_ROLE_TITLES.test(part2)) {
        org = part1;
        role = part2;
      }

      current = {
        [defaultOrgKey]: org,
        role,
        location: loc,
        start: "",
        end: "",
        bullets: [],
      };
      continue;
    }

    // Case 2: Line has dates
    if (hasDates) {
      if (current && (!current.start && !current.end)) {
        // Attach dates to current entry
        current.start = start;
        current.end = end;
        if (cleanText) {
          if (!current.role || current.role === "Role" || current.role === "Member") {
            current.role = cleanText;
          } else if (!current.location && loc) {
            current.location = loc;
          }
        }
        if (loc && !current.location) current.location = loc;
      } else {
        // New entry starting with a dated line
        if (current) entries.push(current);
        let role = cleanText;
        let org = "Organization";

        if (cleanText.includes(",")) {
          const parts = cleanText.split(",").map(p => p.trim());
          role = parts[0];
          org = parts[1] || org;
        }

        current = {
          [defaultOrgKey]: org,
          role: role || (defaultOrgKey === "company" ? "Professional" : "Member"),
          location: loc,
          start,
          end,
          bullets: [],
        };
      }
      continue;
    }

    // Case 3: Line without date
    if (!current) {
      current = {
        [defaultOrgKey]: cleanText || rawLine,
        role: "",
        location: loc,
        start: "",
        end: "",
        bullets: [],
      };
    } else if (!current.role) {
      // Second line of header: role
      current.role = cleanText || rawLine;
      if (loc && !current.location) current.location = loc;
    } else {
      // Already has org and role. If previous has bullets or this is a new header line
      const isNewEntry = current.bullets.length > 0 || (current.role && (current.start || current.end)) || COMMON_ROLE_TITLES.test(cleanText) || KNOWN_LOCATIONS.test(rawLine);
      if (isNewEntry) {
        entries.push(current);
        current = {
          [defaultOrgKey]: cleanText || rawLine,
          role: "",
          location: loc,
          start: "",
          end: "",
          bullets: [],
        };
      } else {
        current.bullets.push(rawLine);
      }
    }
  }

  if (current) entries.push(current);

  // Post-sanitize entries
  return entries.map(e => {
    let role = (e.role || "").trim();
    let org = (e[defaultOrgKey] || "").trim();
    let loc = (e.location || "").trim();

    if (!role && org.includes(",")) {
      const parts = org.split(",").map((p: string) => p.trim());
      role = parts[0];
      org = parts[1] || org;
    }

    if (role === "Role" || !role) {
      if (COMMON_ROLE_TITLES.test(org)) {
        role = org;
        org = defaultOrgKey === "company" ? "Company" : "Organization";
      } else {
        role = defaultOrgKey === "company" ? "Professional" : "Member";
      }
    }

    return {
      [defaultOrgKey]: org,
      role,
      location: loc,
      start: e.start || "",
      end: e.end || "",
      bullets: e.bullets || [],
    };
  });
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
    leadership: [],
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
  for (let i = 0; i < Math.min(6, lines.length); i++) {
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
    } else if (!result.title && line.length < 60 && !/^(summary|experience|leadership|education|skills|work)/i.test(line)) {
      result.title = line.replace(/[•|·]/g, "").trim();
      break;
    }
  }

  // 5. Section Partitioning
  const sectionHeaders: { index: number; type: string; header: string }[] = [];
  const sectionKeywords: [string, RegExp][] = [
    ["summary", /^(professional summary|summary|profile|about me|executive summary|personal statement)$/i],
    ["leadership", /^(leadership experience|leadership|volunteer experience|volunteering|community leadership|community service|extracurricular activities|extra-curricular activities|co-curricular activities|extracurriculars|activities|leadership & activities|leadership and activities|leadership & involvement|leadership and involvement|leadership & volunteering|leadership and volunteering|positions of responsibility|position of responsibility|student leadership|campus involvement)$/i],
    ["experience", /^(work experience|professional experience|experience|employment history|work history|career history|internships|internship experience)$/i],
    ["education", /^(education|academic background|academics|qualifications|academic history)$/i],
    ["skills", /^(skills|core competencies|technical skills|key skills|technologies|areas of expertise|competencies)$/i],
    ["projects", /^(projects|academic projects|key projects|personal projects|technical projects)$/i],
    ["certifications", /^(certifications|licenses & certifications|certificates|credentials|licenses)$/i],
  ];

  lines.forEach((line, idx) => {
    // Section headers should not be bullet points, contain dates or email/urls
    if (/^[•\-\*\u2022\u25E6\u25AA▪\d+\.]\s+/.test(line)) return;
    if (/\b(?:19|20)\d{2}\b|present|current|@|https?:\/\//i.test(line)) return;

    const clean = line
      .replace(/^[\d\.\)\s•\-\*▪\u2022\u25E6\u25AA]+/g, "")
      .replace(/[:\-—–_#|]/g, " ")
      .replace(/\s+/g, " ")
      .trim();

    if (!clean || clean.length > 50) return;

    for (const [type, re] of sectionKeywords) {
      if (re.test(clean)) {
        sectionHeaders.push({ index: idx, type, header: line });
        break;
      }
    }
  });


  let rawExperience: any[] = [];
  let rawLeadership: any[] = [];

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
      rawExperience = parseExperienceLikeSection(sectionLines, "company");
    } else if (current.type === "leadership") {
      rawLeadership = parseExperienceLikeSection(sectionLines, "organization");
    } else if (current.type === "education") {
      const eduEntries: { school: string; degree: string; location: string; start: string; end: string; details: string }[] = [];
      let currentEdu: { school: string; degree: string; location: string; start: string; end: string; details: string } | null = null;

      for (let i = 0; i < sectionLines.length; i++) {
        const line = sectionLines[i];
        const isBullet = /^[•\-\*]/.test(line);
        const { text: lineWithoutDate, start, end } = extractDateAndText(line);

        if (isBullet && currentEdu) {
          currentEdu.details = (currentEdu.details ? currentEdu.details + "\n" : "") + line.replace(/^[•\-\*]\s*/, "");
        } else if (!currentEdu) {
          let school = lineWithoutDate || line;
          let loc = "";
          const locMatch = line.match(KNOWN_LOCATIONS);
          if (locMatch) {
            loc = locMatch[0];
            school = school.replace(locMatch[0], "").trim();
          }
          currentEdu = {
            school: school || line,
            degree: "",
            location: loc,
            start: start || "",
            end: end || "",
            details: "",
          };
        } else if (!currentEdu.degree) {
          currentEdu.degree = lineWithoutDate || line;
          if (start || end) {
            if (start) currentEdu.start = start;
            if (end) currentEdu.end = end;
          }
        } else {
          // Check if this line is another school
          eduEntries.push(currentEdu);
          let school = lineWithoutDate || line;
          let loc = "";
          const locMatch = line.match(KNOWN_LOCATIONS);
          if (locMatch) {
            loc = locMatch[0];
            school = school.replace(locMatch[0], "").trim();
          }
          currentEdu = {
            school: school || line,
            degree: "",
            location: loc,
            start: start || "",
            end: end || "",
            details: "",
          };
        }
      }
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

  // Separate any leadership roles that were accidentally grouped in experience
  const { experience, leadership } = separateExperienceAndLeadership(rawExperience, rawLeadership);
  result.experience = experience;
  result.leadership = leadership;

  return result;
}

