// pages/api/generatePDF.ts
import type { NextApiRequest, NextApiResponse } from "next";
import puppeteer from "puppeteer";
import { generateCatalogueHTML } from "../../utils/generateCatalogueHTML";
import type { SanityImageObject } from "@sanity/types";

type CatalogueItem = {
  image?: SanityImageObject;
  modelNumber: string | number;
  sizes?: ("Adult" | "Kids")[];
  weightAdult?: number;
  weightKids?: number;
};

type PdfRequestBody = {
  items: CatalogueItem[];
  filter?: "Adult" | "Kids" | "Both";
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { items, filter } = req.body as PdfRequestBody;

    if (!items || !Array.isArray(items)) {
      return res.status(400).json({ error: "Invalid items array" });
    }

    const htmlContent = generateCatalogueHTML(items, filter || "Both");

    const browser = await puppeteer.launch({
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });
    const page = await browser.newPage();

    await page.setContent(htmlContent, { waitUntil: "networkidle0" });

    const pdfBuffer = await page.pdf({
      format: "A4",
      printBackground: true,
      margin: { top: "10mm", bottom: "10mm", left: "8mm", right: "8mm" },
    });

    await browser.close();

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      "attachment; filename=BLOUDAN_BANGLES_CATALOGUE.pdf"
    );
    res.send(pdfBuffer);
  } catch (error) {
    console.error("PDF generation error:", error);
    res.status(500).json({ error: "Failed to generate PDF" });
  }
}