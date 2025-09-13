// pages/api/generatePDF.ts
import type { NextApiRequest, NextApiResponse } from "next";
import chromium from "chrome-aws-lambda";
import puppeteer from "puppeteer-core";
import { generateCatalogueHTML } from "../../utils/generateCatalogueHTML";

type CatalogueItem = {
  image?: object;
  modelNumber: string;
  sizes?: ("Adult" | "Kids")[];
  weightAdult?: number;
  weightKids?: number;
};

type PDFRequestBody = {
  items: CatalogueItem[];
  filter?: "Adult" | "Kids" | "Both";
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed. Use POST." });
  }

  try {
    const { items, filter } = req.body as PDFRequestBody;

    // Validate items
    if (!items || !Array.isArray(items)) {
      return res.status(400).json({ error: "Invalid items array", received: items });
    }

    // Validate filter
    if (filter && !["Adult", "Kids", "Both"].includes(filter)) {
      return res.status(400).json({ error: "Invalid filter value", received: filter });
    }

    // Generate HTML
    let htmlContent: string;
    try {
      htmlContent = generateCatalogueHTML(items, filter || "Both");
    } catch (htmlErr) {
      console.error("HTML generation error:", htmlErr);
      return res.status(500).json({ error: "Failed to generate HTML", details: htmlErr });
    }

    // Determine executable path (fallback for local dev)
    let executablePath: string | undefined;
    try {
      executablePath = await chromium.executablePath;
      if (!executablePath) {
        console.warn("chromium.executablePath returned null, falling back to puppeteer's default.");
      }
    } catch (execErr) {
      console.error("Error getting Chromium path:", execErr);
      executablePath = undefined;
    }

    // Launch Puppeteer
    let browser;
    try {
      browser = await puppeteer.launch({
        args: chromium.args,
        defaultViewport: chromium.defaultViewport,
        executablePath, // undefined fallback works in local dev
        headless: chromium.headless,
      });
    } catch (launchErr) {
      console.error("Puppeteer launch error:", launchErr);
      return res.status(500).json({ error: "Failed to launch Puppeteer", details: launchErr });
    }

    // Create page and set content
    let page;
    try {
      page = await browser.newPage();
      await page.setContent(htmlContent, { waitUntil: "networkidle0" });
    } catch (pageErr) {
      console.error("Error setting page content:", pageErr);
      await browser.close();
      return res.status(500).json({ error: "Failed to set HTML content", details: pageErr });
    }

    // Generate PDF
    let pdfBuffer: Buffer;
    try {
      pdfBuffer = await page.pdf({
        format: "a4", // lowercase 'a4' required
        printBackground: true,
        margin: { top: "10mm", bottom: "10mm", left: "8mm", right: "8mm" },
      });
    } catch (pdfErr) {
      console.error("PDF generation error:", pdfErr);
      await browser.close();
      return res.status(500).json({ error: "Failed to generate PDF", details: pdfErr });
    }

    await browser.close();

    // Send PDF response
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename=BLOUDAN_BANGLES_CATALOGUE.pdf`);
    res.send(pdfBuffer);

  } catch (err) {
    console.error("Unexpected API error:", err);
    res.status(500).json({ error: "Unexpected error", details: err });
  }
}