// pages/api/auth/verify-signup-otp.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "../../../lib/prisma";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).end();

  const { email, otp } = req.body;
  if (!email || !otp) {
    return res.status(400).json({ error: "Email and OTP are required" });
  }

  // Find pending user with valid OTP
  const pendingUser = await prisma.pendingUser.findFirst({
    where: {
      email,
      otp,
      otpExpiresAt: { gte: new Date() }, // OTP not expired
    },
  });

  if (!pendingUser) {
    return res.status(400).json({ error: "Invalid or expired OTP" });
  }

  // Create actual user
  await prisma.user.create({
    data: {
      firstName: pendingUser.firstName,
      lastName: pendingUser.lastName,
      email: pendingUser.email,
      password: pendingUser.password, // already hashed
      isVerified: true,
    },
  });

  // Delete pending user entry
  await prisma.pendingUser.delete({
    where: { id: pendingUser.id },
  });

  return res.status(200).json({ message: "Account created successfully!" });
}