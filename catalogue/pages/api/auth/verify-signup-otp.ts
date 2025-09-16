// pages/api/auth/verify-signup-otp.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "../../../lib/prisma";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).end();

  const { email, otp } = req.body;
  if (!email || !otp) return res.status(400).json({ error: "Email and OTP required" });

  const tempSignup = await prisma.signupOtp.findFirst({
    where: { email, otp, expiresAt: { gte: new Date() } },
  });

  if (!tempSignup) return res.status(400).json({ error: "Invalid or expired OTP" });

  // Create actual user
  await prisma.user.create({
    data: {
      email: tempSignup.email,
      password: tempSignup.hashedPassword,
      name: tempSignup.name,
      isVerified: true,
    },
  });

  // Delete temp OTP
  await prisma.PendingUser.delete({ where: { id: tempSignup.id } });

  res.status(200).json({ message: "Account created successfully!" });
}