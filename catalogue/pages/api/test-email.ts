import type { NextApiRequest, NextApiResponse } from "next";
import { sendEmail } from "../../lib/mailer";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).end();

  const { to } = req.body;
  if (!to) return res.status(400).json({ error: "Recipient email required" });

  try {
    await sendEmail(
      to,
      "Test Email from Purity Finder",
      `<h1>Hello Captain</h1><p>This is a test email.</p>`
    );
    res.status(200).json({ success: true });
  } catch (err) {
    console.error("Email send error:", err);
    res.status(500).json({ error: "Failed to send email" });
  }
}