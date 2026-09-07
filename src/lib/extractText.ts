import * as pdfjsLib from "pdfjs-dist";
import mammoth from "mammoth";

// @ts-ignore - vite worker import
import workerSrc from "pdfjs-dist/build/pdf.worker.min.mjs?url";

if (typeof window !== "undefined") {
  try {
    pdfjsLib.GlobalWorkerOptions.workerSrc =
      workerSrc || `https://unpkg.com/pdfjs-dist@${pdfjsLib.version || "4.10.38"}/build/pdf.worker.min.mjs`;
  } catch (e) {
    console.warn("Could not set workerSrc:", e);
  }
}

interface TextItemObj {
  str: string;
  x: number;
  y: number;
  hasEOL?: boolean;
}

export async function extractTextFromFile(file: File): Promise<string> {
  const name = file.name.toLowerCase();

  if (name.endsWith(".pdf")) {
    const buf = await file.arrayBuffer();
    const uint8 = new Uint8Array(buf);

    let pdf: any;
    try {
      if (!pdfjsLib.GlobalWorkerOptions.workerSrc) {
        pdfjsLib.GlobalWorkerOptions.workerSrc =
          workerSrc || `https://unpkg.com/pdfjs-dist@${pdfjsLib.version || "4.10.38"}/build/pdf.worker.min.mjs`;
      }
      pdf = await pdfjsLib.getDocument({
        data: uint8,
        useSystemFonts: true,
      }).promise;
    } catch (err) {
      console.warn("Initial PDF loading error, retrying with unpkg worker:", err);
      try {
        pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version || "4.10.38"}/build/pdf.worker.min.mjs`;
        pdf = await pdfjsLib.getDocument({ data: uint8 }).promise;
      } catch (fallbackErr) {
        console.error("PDF fallback failed:", fallbackErr);
        throw new Error("Could not load PDF document. Please ensure it is not password protected or corrupted.");
      }
    }

    let fullText = "";
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const content = await page.getTextContent();

      // Collect items with positions
      const items: TextItemObj[] = [];
      for (const item of content.items) {
        if ("str" in item && typeof (item as any).str === "string") {
          const str = (item as any).str;
          const transform = (item as any).transform;
          const x = transform ? transform[4] : 0;
          const y = transform ? transform[5] : 0;
          items.push({
            str,
            x,
            y,
            hasEOL: (item as any).hasEOL,
          });
        }
      }

      // Sort items by Y (descending: top-of-page to bottom-of-page)
      // Group items with Y within 3 points as the same line, sorted by X (left-to-right)
      items.sort((a, b) => {
        const yDiff = b.y - a.y;
        if (Math.abs(yDiff) > 3) {
          return yDiff;
        }
        return a.x - b.x;
      });

      let pageText = "";
      let lastY: number | null = null;

      for (const item of items) {
        if (lastY !== null && Math.abs(item.y - lastY) > 3) {
          pageText += "\n";
        } else if (pageText && !pageText.endsWith("\n") && !pageText.endsWith(" ") && item.str.trim()) {
          pageText += " ";
        }
        pageText += item.str;
        if (item.hasEOL) {
          pageText += "\n";
        }
        lastY = item.y;
      }

      fullText += pageText + "\n\n";
    }

    const cleanText = fullText
      .replace(/[ \t]+/g, " ")
      .replace(/\n{3,}/g, "\n\n")
      .trim();

    if (!cleanText) {
      throw new Error("Could not extract readable text from PDF. The document may be scanned or image-based.");
    }
    return cleanText;
  }

  if (name.endsWith(".docx")) {
    const buf = await file.arrayBuffer();
    const { value } = await mammoth.extractRawText({ arrayBuffer: buf });
    return value.trim();
  }

  if (name.endsWith(".txt")) {
    return await file.text();
  }

  throw new Error("Unsupported file type. Please upload PDF, DOCX, or TXT.");
}
