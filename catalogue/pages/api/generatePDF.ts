// pages/api/generatePDF.ts
import type { NextApiRequest, NextApiResponse } from "next";
import chromium from "chrome-aws-lambda";
import puppeteer from "puppeteer-core";
import { generateCatalogueHTML } from "../../utils/generateCatalogueHTML";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed. Use POST." });
  }

  try {
    const { items, filter } = req.body;

    if (!items || !Array.isArray(items)) {
      return res.status(400).json({ error: "Invalid items array", received: items });
    }

    if (filter && !["Adult", "Kids", "Both"].includes(filter)) {
      return res.status(400).json({ error: "Invalid filter value", received: filter });
    }

    let htmlContent: string;
    try {
      htmlContent = generateCatalogueHTML(items, filter || "Both");
    } catch (htmlErr) {
      console.error("Error generating HTML:", htmlErr);
      return res.status(500).json({ error: "Failed to generate HTML", details: htmlErr });
    }

let browser;
try {
  const executablePath = await chromium.executablePath; // await the Promise
  browser = await puppeteer.launch({
    args: chromium.args,
    defaultViewport: chromium.defaultViewport,
    executablePath: executablePath,
    headless: chromium.headless,
  });
} catch (launchErr) {
  console.error("Error launching Puppeteer:", launchErr);
  return res.status(500).json({ error: "Failed to launch Puppeteer", details: launchErr });
}

    let page;
    try {
      page = await browser.newPage();
      await page.setContent(htmlContent, { waitUntil: "networkidle0" });
    } catch (pageErr) {
      console.error("Error setting page content:", pageErr);
      await browser.close();
      return res.status(500).json({ error: "Failed to set HTML content", details: pageErr });
    }

    let pdfBuffer: Buffer;
    try {
      pdfBuffer = await page.pdf({
        format: "a4", // lowercase 'a4' for puppeteer
        printBackground: true,
        margin: { top: "10mm", bottom: "10mm", left: "8mm", right: "8mm" },
      });
    } catch (pdfErr) {
      console.error("Error generating PDF:", pdfErr);
      await browser.close();
      return res.status(500).json({ error: "Failed to generate PDF", details: pdfErr });
    }

    await browser.close();

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=BLOUDAN_BANGLES_CATALOGUE.pdf`
    );
    res.send(pdfBuffer);

  } catch (err) {
    console.error("Unexpected error in API handler:", err);
    res.status(500).json({ error: "Unexpected error", details: err });
  }
}