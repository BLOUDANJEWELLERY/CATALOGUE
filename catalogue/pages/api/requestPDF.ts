import type { NextApiRequest, NextApiResponse } from "next";
import { jsPDF } from "jspdf";
import html2canvas from "html2canvas";
import nodemailer from "nodemailer";

// Helper for colors
const hexToRgb = (hex: string): [number, number, number] => {
  const match = hex.replace("#", "").match(/.{1,2}/g);
  if (!match) return [0, 0, 0];
  return match.map((x) => parseInt(x, 16)) as [number, number, number];
};

// Dummy function to fetch catalogue items - replace with your actual DB fetching
async function getCatalogueItems() {
  // return array of items with {sizes, weightAdult, weightKids, image, modelNumber}
  return [];
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST")
    return res.status(405).json({ success: false, error: "Method not allowed" });

  const { email, filter } = req.body as { email: string; filter: "Adult" | "Kids" | "Both" };
  if (!email || !filter) return res.status(400).json({ success: false, error: "Email & filter required" });

  // Respond immediately
  res.status(200).json({
    success: true,
    message: "Your PDF request has been received. It will be emailed to you shortly!",
  });

  // Generate and send PDF asynchronously
  setTimeout(async () => {
    try {
      const items = await getCatalogueItems();
      const doc = new jsPDF("p", "mm", "a4");

      const filteredItems = items.filter((item) => {
        if (filter === "Adult") return item.sizes?.includes("Adult");
        if (filter === "Kids") return item.sizes?.includes("Kids");
        if (filter === "Both") return item.sizes?.includes("Adult") || item.sizes?.includes("Kids");
        return false;
      });

      const itemsPerPage = 4;
      const pages = Math.ceil(filteredItems.length / itemsPerPage);

      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const margin = 8;

      const accentColor = "#c7a332";
      const cardBg = "#fff";

      for (let pageIndex = 0; pageIndex < pages; pageIndex++) {
        const pageItems = filteredItems.slice(
          pageIndex * itemsPerPage,
          (pageIndex + 1) * itemsPerPage
        );

        // Header
        doc.setFillColor(...hexToRgb(accentColor));
        doc.rect(0, 0, pageWidth, 25, "F");

        doc.setFontSize(20);
        doc.setTextColor(...hexToRgb("#0b1a3d"));
        doc.setFont("helvetica", "bold");
        doc.text("BLOUDAN JEWELLERY", pageWidth / 2, 12, { align: "center" });

        doc.setFontSize(16);
        doc.setFont("helvetica", "normal");
        doc.text("BANGLES CATALOGUE", pageWidth / 2, 20, { align: "center" });

        // Loop items and add images/text
        for (let i = 0; i < pageItems.length; i++) {
          const item = pageItems[i];

          // Convert image URL to Base64
          let imgDataUrl = "";
          if (item.image) {
            try {
              const resImg = await fetch(item.image);
              const blob = await resImg.blob();
              imgDataUrl = await new Promise<string>((resolve) => {
                const reader = new FileReader();
                reader.onloadend = () => resolve(reader.result as string);
                reader.readAsDataURL(blob);
              });
            } catch (err) {
              console.error(`Failed to load image for B${item.modelNumber}`, err);
            }
          }

          const col = i % 2;
          const row = Math.floor(i / 2);
          const x = margin + col * 100;
          const y = 35 + row * 115 + row * 5;

          if (imgDataUrl) doc.addImage(imgDataUrl, "PNG", x, y, 85, 115);

          // Model Number
          doc.setFontSize(12);
          doc.setTextColor(...hexToRgb("#0b1a3d"));
          doc.setFont("helvetica", "bold");
          doc.text(`B${item.modelNumber}`, x + 5, y + 120);

          // Weights
          const weights: string[] = [];
          if ((filter === "Adult" || filter === "Both") && item.sizes?.includes("Adult") && item.weightAdult)
            weights.push(`Adult - ${item.weightAdult}g`);
          if ((filter === "Kids" || filter === "Both") && item.sizes?.includes("Kids") && item.weightKids)
            weights.push(`Kids - ${item.weightKids}g`);

          doc.setFontSize(10);
          doc.setFont("helvetica", "normal");
          doc.text(weights.join(" | "), x + 5, y + 128);
        }

        // Footer
        const footerHeight = 12;
        doc.setFillColor(...hexToRgb(accentColor));
        doc.rect(0, pageHeight - footerHeight, pageWidth, footerHeight, "F");
        doc.setFontSize(12);
        doc.setTextColor(...hexToRgb("#0b1a3d"));
        doc.setFont("helvetica", "bold");
        doc.text(`Page ${pageIndex + 1}`, pageWidth / 2, pageHeight - 4, { align: "center" });

        if (pageIndex < pages - 1) doc.addPage();
      }

      // Send email
      const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS,
        },
      });

      await transporter.sendMail({
        from: process.env.EMAIL_USER,
        to: email,
        subject: "Your BLOUDAN BANGLES PDF Catalogue",
        text: "Here’s your requested PDF catalogue.",
        attachments: [{ filename: `BLOUDAN_BANGLES_${filter}.pdf`, content: Buffer.from(doc.output("arraybuffer")) }],
      });

      console.log(`PDF emailed to ${email}`);
    } catch (err) {
      console.error("Error generating/sending PDF:", err);
    }
  }, 100);
}