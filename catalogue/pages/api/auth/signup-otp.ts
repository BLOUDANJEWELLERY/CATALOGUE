import type { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "../../../lib/prisma";
import { sendEmail } from "../../../lib/mailer";
import bcrypt from "bcryptjs";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).end();

  const { firstName, lastName, email, password } = req.body;
  if (!firstName || !email || !password) {
    return res.status(400).json({ error: "First name, email, and password are required" });
  }

  // Check if email already exists
  const existingUser = await prisma.user.findUnique({ where: { email } });
  if (existingUser) return res.status(400).json({ error: "Email already in use" });

  // Hash password
  const hashedPassword = await bcrypt.hash(password, 10);

  // Generate OTP
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 min

  // Remove old pending user for same email
  await prisma.pendingUser.deleteMany({ where: { email } });

  // Save pending user
  await prisma.pendingUser.create({
    data: {
      firstName,
      lastName,
      email,
      password: hashedPassword,
      otp,
      otpExpiresAt,
    },
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
    console.error("Email send error:", err);
    res.status(500).json({ error: "Failed to send OTP" });
  }
}