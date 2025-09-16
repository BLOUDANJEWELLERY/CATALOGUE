// pages/api/auth/signup-otp.ts
import type { NextApiRequest, NextApiResponse } from "next";
import crypto from "crypto";
import { prisma } from "../../../lib/prisma";
import { sendEmail } from "../../../lib/mailer";
import bcrypt from "bcryptjs";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).end();

  const { email, password, name } = req.body;
  if (!email || !password || !name) return res.status(400).json({ error: "All fields required" });

  const existingUser = await prisma.user.findUnique({ where: { email } });
  if (existingUser) return res.status(400).json({ error: "Email already in use" });

  const hashedPassword = await bcrypt.hash(password, 10);

  // Generate OTP
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 mins

  // Save temp signup
  await prisma.signupOtp.create({
    data: { email, hashedPassword, name, otp, expiresAt },
  });

  // Send OTP email
  const html = `
    <h2>Verify Your Email</h2>
    <p>Your OTP to verify your account is:</p>
    <h1 style="color:#c7a332;">${otp}</h1>
    <p>It expires in 10 minutes.</p>
  `;
  try {
    await sendEmail(email, "Verify Your Email OTP", html);
    res.status(200).json({ message: "OTP sent to email" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to send OTP" });
  }
}