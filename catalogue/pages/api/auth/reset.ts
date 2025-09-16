// pages/api/auth/reset.ts
import type { NextApiRequest, NextApiResponse } from "next";
import bcrypt from "bcryptjs";
import { prisma } from "../../../lib/prisma";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).end();

  const { token, password } = req.body;
  if (!token || !password) return res.status(400).json({ error: "Token and password required" });

  const record = await prisma.passwordResetToken.findUnique({ where: { token } });
  if (!record || record.expiresAt < new Date()) {
    return res.status(400).json({ error: "Invalid or expired token" });
  }

  const hashed = await bcrypt.hash(password, 10);

  await prisma.user.update({
    where: { id: record.userId },
    data: { password: hashed },
  });

  // Delete token after use
  await prisma.passwordResetToken.delete({ where: { token } });

  res.status(200).json({ message: "Password has been reset successfully." });
}