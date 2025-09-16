import type { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "../../../lib/prisma";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).end();

  const { email } = req.body;
  if (!email) return res.status(400).json({ error: "Email is required" });

  const pending = await prisma.pendingUser.findUnique({ where: { email } });
  if (!pending) return res.status(400).json({ error: "No pending signup found for this email" });

  try {
    await prisma.pendingUser.delete({ where: { email } });
    res.status(200).json({ message: "Signup cancelled successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to cancel signup" });
  }
}