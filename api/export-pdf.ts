import chromium from "@sparticuz/chromium";
import puppeteer from "puppeteer-core";

export const config = {
  maxDuration: 60,
  api: {
    bodyParser: {
      sizeLimit: "10mb",
    },
    responseLimit: "25mb",
  },
};

export default async function handler(req: any, res: any) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed. Use POST." });
  }

  let browser: any = null;

  try {
    const { html, title = "Resume" } = req.body || {};

    if (!html || typeof html !== "string") {
      return res.status(400).json({ error: "Missing required 'html' string in request body." });
    }

    chromium.setGraphicsMode = false;

    let executablePath: string = "";
    if (process.platform === "win32") {
      const fs = await import("fs");
      const candidates = [
        process.env.CHROME_PATH,
        "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
        "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
        (process.env.LOCALAPPDATA || "") + "\\Google\\Chrome\\Application\\chrome.exe",
        "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
        "C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe",
      ].filter(Boolean) as string[];

      for (const p of candidates) {
        if (fs.existsSync(p)) {
          executablePath = p;
          break;
        }
      }
    }

    if (!executablePath) {
      executablePath = await chromium.executablePath(process.env.CHROMIUM_EXECUTABLE_URL || undefined);
    }

    browser = await puppeteer.launch({
      args: [...chromium.args, "--disable-dev-shm-usage", "--no-sandbox", "--disable-setuid-sandbox"],
      defaultViewport: {
        width: 794,
        height: 1123,
        deviceScaleFactor: 2,
      },
      executablePath,
      headless: chromium.headless,
    });

    const page = await browser.newPage();

    // Set A4 viewport dimensions
    await page.setViewport({
      width: 794,
      height: 1123,
      deviceScaleFactor: 2,
    });

    // Load full HTML with network idle check for external Google fonts
    await page.setContent(html, {
      waitUntil: ["domcontentloaded", "networkidle0"],
      timeout: 30000,
    });

    // Ensure document fonts have loaded
    await page.evaluateHandle("document.fonts.ready");

    // Generate 100% true vector PDF using Chrome's native print engine
    const pdfBuffer = await page.pdf({
      format: "A4",
      printBackground: true,
      preferCSSPageSize: true,
      margin: {
        top: "0px",
        right: "0px",
        bottom: "0px",
        left: "0px",
      },
    });

    await browser.close();
    browser = null;

    const safeTitle = (title || "Resume").replace(/[^a-zA-Z0-9_\- ]/g, "").trim().replace(/\s+/g, "_");

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="${safeTitle}.pdf"`);
    res.setHeader("Content-Length", Buffer.byteLength(pdfBuffer));

    return res.status(200).send(Buffer.from(pdfBuffer));
  } catch (error: any) {
    console.error("Headless Chrome PDF export error:", error);
    if (browser) {
      try {
        await browser.close();
      } catch (_) {}
    }
    return res.status(500).json({
      error: "Failed to generate vector PDF via headless Chrome",
      details: error?.message || String(error),
    });
  }
}
