import * as pdfjsLib from "pdfjs-dist";
import mammoth from "mammoth";

// @ts-ignore - vite worker import
import workerSrc from "pdfjs-dist/build/pdf.worker.min.mjs?url";

if (typeof window !== "undefined") {
  pdfjsLib.GlobalWorkerOptions.workerSrc = workerSrc || `https://unpkg.com/pdfjs-dist@${pdfjsLib.version || "4.10.38"}/build/pdf.worker.min.mjs`;
}

export async function extractTextFromFile(file: File): Promise<string> {
  const name = file.name.toLowerCase();
  
  if (name.endsWith(".pdf")) {
    const buf = await file.arrayBuffer();
    const uint8 = new Uint8Array(buf);
    
    let pdf: any;
    try {
      pdf = await pdfjsLib.getDocument({
        data: uint8,
        useSystemFonts: true,
        isEvalSupported: false,
      }).promise;
    } catch (err) {
      console.warn("Initial PDF loading error, retrying with fallback worker:", err);
      pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version || "4.10.38"}/build/pdf.worker.min.mjs`;
      pdf = await pdfjsLib.getDocument({ data: uint8 }).promise;
    }

    let fullText = "";
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const content = await page.getTextContent();
      
      let lastY: number | null = null;
      let pageText = "";
      
      for (const item of content.items) {
        if ("str" in item) {
          const str = (item as any).str;
          const transform = (item as any).transform;
          const y = transform ? transform[5] : null;
          
          if (lastY !== null && y !== null && Math.abs(y - lastY) > 4) {
            pageText += "\n";
          } else if (pageText && !pageText.endsWith("\n") && !pageText.endsWith(" ")) {
            pageText += " ";
          }
          pageText += str;
          if ((item as any).hasEOL) {
            pageText += "\n";
          }
          lastY = y;
        }
      }
      fullText += pageText + "\n\n";
    }
    
    const cleanText = fullText.replace(/[ \t]+/g, " ").replace(/\n{3,}/g, "\n\n").trim();
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
