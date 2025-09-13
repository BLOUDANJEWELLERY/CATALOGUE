import type { NextApiRequest, NextApiResponse } from 'next';
import puppeteer from 'puppeteer';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { items, filter } = req.body;

  if (!items || !Array.isArray(items)) {
    return res.status(400).json({ error: "Invalid items array" });
  }

  try {
    const browser = await puppeteer.launch({
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });
    const page = await browser.newPage();

    // Build HTML for the catalogue
    const htmlContent = generateHTML(items, filter); // We'll define this function next

    await page.setContent(htmlContent, { waitUntil: 'networkidle0' });

    // Optional: set page size to A4
    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: { top: '20mm', bottom: '25mm', left: '10mm', right: '10mm' },
    });

    await browser.close();

    res.setHeader('Content-Disposition', `attachment; filename=BLOUDAN_BANGLES_CATALOGUE_${filter}.pdf`);
    res.setHeader('Content-Type', 'application/pdf');
    res.send(pdfBuffer);

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "PDF generation failed" });
  }
}