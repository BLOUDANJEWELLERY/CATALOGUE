// pages/api/requestPDF.ts:
import type { NextApiRequest, NextApiResponse } from "next";
import { generatePDF } from "@/utils/generatePDF";
import { sendEmailWithAttachment } from "@/utils/email";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).json({ success: false });

  const { email, filter } = req.body;
  if (!email || !filter) return res.status(400).json({ success: false, error: "Email & filter required" });

  try {
    // Respond immediately to user
    res.status(200).json({ success: true, message: "PDF request received. It will be emailed shortly." });

    // Process PDF asynchronously
    setTimeout(async () => {
      try {
        const pdfBuffer = await generatePDF(filter);
        await sendEmailWithAttachment(email, "Your PDF Catalogue", "Here’s your requested PDF.", pdfBuffer);
        console.log(`PDF sent to ${email}`);
      } catch (err) {
        console.error("Failed to generate/send PDF:", err);
      }
    }, 100); // short delay
  } catch (err) {
    console.error(err);
  }
}