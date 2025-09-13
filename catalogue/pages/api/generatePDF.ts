// pages/api/generatePDF.ts
import type { NextApiRequest, NextApiResponse } from "next";
import chromium from "chrome-aws-lambda";
import puppeteer from "puppeteer-core";
import { generateCatalogueHTML } from "../../utils/generateCatalogueHTML";

type CatalogueItem = {
  modelNumber: string | number;
  sizes?: string[];
  weightAdult?: number;
  weightKids?: number;
  image?: any; // keep it generic for Sanity image
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { items, filter } = req.body;

    if (!items || !Array.isArray(items)) {
      return res.status(400).json({ error: "Invalid items array" });
    }

    // Generate full HTML for catalogue
    const htmlContent = generateCatalogueHTML(items as CatalogueItem[], filter || "Both");

    // Launch Puppeteer with serverless-compatible Chrome
    const browser = await puppeteer.launch({
      args: chromium.args,
      executablePath: await chromium.executablePath,
      headless: chromium.headless,
    });

    const page = await browser.newPage();

    // Set content and wait for all network requests to finish
    await page.setContent(htmlContent, { waitUntil: "networkidle0" });

    // Ensure all images are loaded
    await page.evaluate(async () => {
      const imgs = Array.from(document.images);
      await Promise.all(imgs.map(img => {
        if (img.complete) return;
        return new Promise(resolve => { img.onload = img.onerror = resolve; });
      }));
    });

    // Generate PDF
    const pdfBuffer = await page.pdf({
      format: "A4",
      printBackground: true,
      margin: { top: "10mm", bottom: "10mm", left: "8mm", right: "8mm" },
    });

    await browser.close();

    // Send PDF as download
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=BLOUDAN_BANGLES_CATALOGUE.pdf`
    );
    res.send(pdfBuffer);

  } catch (error) {
    console.error("PDF generation failed:", error);
    res.status(500).json({ error: "Failed to generate PDF" });
  }
}