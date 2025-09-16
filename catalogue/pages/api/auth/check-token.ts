// pages/api/auth/check-token.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "../../../lib/prisma";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).end();

  const { token } = req.body;
  if (!token) return res.status(400).json({ error: "Token is required" });

  const record = await prisma.passwordResetToken.findUnique({ where: { token } });

  if (!record) return res.status(404).json({ error: "Token is invalid or already used" });
  if (record.expiresAt < new Date()) return res.status(400).json({ error: "Token has expired" });

  return res.status(200).json({ success: true });
}