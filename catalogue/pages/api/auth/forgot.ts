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
    // Don't reveal whether email exists
    return res.status(200).json({
      message: "If that email exists, a reset link will be sent.",
    });
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

  // Beautiful HTML Email
  const html = `
  <div style="font-family: 'Helvetica', sans-serif; background-color: #fdf8f3; padding: 30px;">
    <div style="max-width: 600px; margin: 0 auto; background-color: #fffdfb; border-radius: 16px; box-shadow: 0 8px 20px rgba(0,0,0,0.1); border: 2px solid #c7a332; overflow: hidden;">
      
      <div style="background-color: #c7a332; padding: 20px; text-align: center;">
        <h1 style="color: #fffdfb; margin: 0; font-size: 28px;">Bloudan Jewellery</h1>
      </div>
      
      <div style="padding: 30px; text-align: center; color: #0b1a3d;">
        <h2 style="font-size: 22px; margin-bottom: 20px;">Password Reset Request</h2>
        <p style="font-size: 16px; line-height: 1.5;">
          You requested to reset your password. Click the button below to set a new password. <br />
          <strong>This link will expire in 1 hour.</strong>
        </p>
        
        <a href="${resetLink}" 
          style="
            display: inline-block;
            margin-top: 25px;
            padding: 12px 25px;
            background-color: #c7a332;
            color: #fffdfb;
            text-decoration: none;
            font-weight: bold;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(199,163,50,0.4);
            transition: all 0.3s;
          "
          onmouseover="this.style.backgroundColor='#b8972a'"
          onmouseout="this.style.backgroundColor='#c7a332'"
        >
          Reset Password
        </a>

        <p style="margin-top: 25px; font-size: 14px; color: #555;">
          If you didn’t request a password reset, you can safely ignore this email.
        </p>
      </div>

      <div style="background-color: #f1e7c0; padding: 15px; text-align: center; font-size: 12px; color: #0b1a3d;">
        © ${new Date().getFullYear()} Bloudan Jewellery. All rights reserved.
      </div>
    </div>
  </div>
  `;

  try {
    await sendEmail(user.email, "Reset your Bloudan Jewellery password", html);
    res.status(200).json({ message: "Reset link sent if account exists." });
  } catch (err) {
    console.error("Email send failed:", err);
    res.status(500).json({ error: "Failed to send email." });
  }
}