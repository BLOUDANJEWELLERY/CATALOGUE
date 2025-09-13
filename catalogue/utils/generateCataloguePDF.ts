import puppeteer from 'puppeteer';
import path from 'path';

export const generateCataloguePDF = async (items: any[], filter: "Adult" | "Kids" | "Both") => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();

  const htmlPath = `file://${path.resolve('./public/catalogue-template.html')}?data=${encodeURIComponent(JSON.stringify(items))}&filter=${filter}`;
  await page.goto(htmlPath, { waitUntil: 'networkidle0' });

  await page.pdf({
    path: `BLOUDAN_BANGLES_CATALOGUE_${filter}.pdf`,
    format: 'A4',
    printBackground: true,
    displayHeaderFooter: false,
    margin: { top: '20mm', bottom: '25mm', left: '8mm', right: '8mm' }
  });

  await browser.close();
};