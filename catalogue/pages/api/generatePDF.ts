// pages/api/generatePDF.ts
import type { NextApiRequest, NextApiResponse } from "next";
import chromium from "chrome-aws-lambda";
import puppeteer from "puppeteer-core";
import { generateCatalogueHTML } from "../../utils/generateCatalogueHTML";
import type { SanityImageSource } from "@sanity/image-url/lib/types/types"; // correct type for images

type CatalogueItem = {
  modelNumber: string | number;
  sizes?: ("Adult" | "Kids")[];
  weightAdult?: number;
  weightKids?: number;
  image?: SanityImageSource;
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { items, filter } = req.body as { items: CatalogueItem[]; filter?: "Adult" | "Kids" | "Both" };

    if (!items || !Array.isArray(items)) {
      return res.status(400).json({ error: "Invalid items array" });
    }

    const htmlContent = generateCatalogueHTML(items, filter || "Both");

    const browser = await puppeteer.launch({
      args: chromium.args,
      executablePath: await chromium.executablePath,
      headless: chromium.headless,
    });

    const page = await browser.newPage();

    await page.setContent(htmlContent, { waitUntil: "networkidle0" });

    await page.evaluate(async () => {
      const imgs = Array.from(document.images) as HTMLImageElement[];
      await Promise.all(
        imgs.map(img => {
          if (img.complete) return Promise.resolve();
          return new Promise<void>(resolve => {
            img.onload = img.onerror = () => resolve();
          });
        })
      );
    });

    const pdfBuffer = await page.pdf({
      format: "a4",
      printBackground: true,
      margin: { top: "10mm", bottom: "10mm", left: "8mm", right: "8mm" },
    });

    await browser.close();

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename=BLOUDAN_BANGLES_CATALOGUE.pdf`);
    res.send(pdfBuffer);
  } catch (error) {
    console.error("PDF generation failed:", error);
    res.status(500).json({ error: "Failed to generate PDF" });
  }
}