// pages/api/auth/forgot.ts
import type { NextApiRequest, NextApiResponse } from "next";
import crypto from "crypto";
import { prisma } from "../../../lib/prisma";
import { sendEmail } from "../../../lib/mailer";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).end();

  const { email } = req.body;
  if (!email) return res.status(400).json({ error: "Email is required" });

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    // Don't reveal if email exists
    return res.status(200).json({ message: "If that email exists, a reset link will be sent." });
  }

  const token = crypto.randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

  await prisma.passwordResetToken.create({
    data: {
      token,
      userId: user.id,
      expiresAt,
    },
  });

  const resetLink = `${process.env.NEXTAUTH_URL}/reset-password?token=${token}`;

  // Send email
  const html = `
    <h2>Password Reset Request</h2>
    <p>Click the link below to reset your password. The link expires in 1 hour.</p>
    <a href="${resetLink}">Reset Password</a>
  `;

  try {
    await sendEmail(user.email, "Reset your password", html);
    res.status(200).json({ message: "Reset link sent if account exists." });
  } catch (err) {
    console.error("Email send failed:", err);
    res.status(500).json({ error: "Failed to send email." });
  }
}