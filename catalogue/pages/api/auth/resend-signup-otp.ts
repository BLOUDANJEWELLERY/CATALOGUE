import type { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "../../../lib/prisma";
import { sendEmail } from "../../../lib/mailer";
import crypto from "crypto";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).end();

  const { email } = req.body;
  if (!email) return res.status(400).json({ error: "Email is required" });

  const pending = await prisma.pendingUser.findUnique({ where: { email } });
  if (!pending) return res.status(400).json({ error: "No pending signup found for this email" });

  // Generate new OTP
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 mins

  await prisma.pendingUser.update({
    where: { email },
    data: { otp, otpExpiresAt },
  });

  // Send OTP email
  const html = `
    <h2>Verify Your Email</h2>
    <p>Your new OTP is:</p>
    <h1 style="color:#c7a332;">${otp}</h1>
    <p>It expires in 10 minutes.</p>
  `;

  try {
    await sendEmail(email, "Your New Verification OTP", html);
    res.status(200).json({ message: "New OTP sent to email" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to send OTP" });
  }
}