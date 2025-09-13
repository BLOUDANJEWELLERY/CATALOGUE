// pages/api/generatePDF.ts
import { NextApiRequest, NextApiResponse } from 'next';
import puppeteer from 'puppeteer';
import { generateCatalogueHTML } from '../../utils/generateCatalogueHTML';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    // Accept filter and items from request body
    const { items, filter } = req.body;

    if (!items || !Array.isArray(items)) {
      return res.status(400).json({ error: 'Invalid items array' });
    }

    const htmlContent = generateCatalogueHTML(items, filter || 'Both');

    // Launch Puppeteer
    const browser = await puppeteer.launch({
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });
    const page = await browser.newPage();

    // Set HTML content
    await page.setContent(htmlContent, {
      waitUntil: 'networkidle0',
    });

    // Set PDF options (A4, portrait)
    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: {
        top: '10mm',
        bottom: '10mm',
        left: '8mm',
        right: '8mm',
      },
    });

    await browser.close();

    // Send PDF as response
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename=BLOUDAN_BANGLES_CATALOGUE.pdf');
    res.send(pdfBuffer);
  } catch (error) {
    console.error('PDF generation error:', error);
    res.status(500).json({ error: 'Failed to generate PDF' });
  }
}