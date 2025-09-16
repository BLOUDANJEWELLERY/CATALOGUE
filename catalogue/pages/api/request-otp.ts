// pages/api/request-otp.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "../../lib/prisma"; // adjust path if needed
import bcrypt from "bcryptjs";
import nodemailer from "nodemailer";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { firstName, lastName, email, password } = req.body;

  if (!firstName || !email || !password) {
    return res.status(400).json({ error: "First name, email and password are required" });
  }

  const normalizedEmail = email.trim().toLowerCase();

  // Check if already registered
  const existingUser = await prisma.user.findUnique({ where: { email: normalizedEmail } });
  if (existingUser) {
    return res.status(400).json({ error: "Email already registered" });
  }

  // Generate OTP
  const otp = Math.floor(100000 + Math.random() * 900000).toString();

  // Hash password
  const hashedPassword = await bcrypt.hash(password, 10);

  // Store in pending_users (create this table in Prisma schema)
  await prisma.pendingUser.upsert({
    where: { email: normalizedEmail },
    update: {
      firstName,
      lastName,
      password: hashedPassword,
      otp,
      otpExpiresAt: new Date(Date.now() + 10 * 60 * 1000), // 10 min
    },
    create: {
      firstName,
      lastName,
      email: normalizedEmail,
      password: hashedPassword,
      otp,
      otpExpiresAt: new Date(Date.now() + 10 * 60 * 1000),
    },
  });

  // Send OTP via email
  try {
    const transporter = nodemailer.createTransport({
      service: "Gmail", // or SMTP config
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    await transporter.sendMail({
      from: `"Bloudan Jewellery" <${process.env.EMAIL_USER}>`,
      to: normalizedEmail,
      subject: "Your Bloudan Jewellery Verification Code",
      text: `Your verification code is: ${otp}. It will expire in 10 minutes.`,
      html: `<p>Your verification code is: <b>${otp}</b></p><p>This code will expire in 10 minutes.</p>`,
    });
  } catch (err) {
    console.error("Email send error:", err);
    return res.status(500).json({ error: "Failed to send OTP email" });
  }

  return res.status(200).json({ message: "OTP sent successfully" });
}