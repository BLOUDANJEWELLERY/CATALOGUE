// pages/api/user/profile.ts
import { getServerSession } from "next-auth";
import type { NextApiRequest, NextApiResponse } from "next";
import { authOptions } from "../auth/[...nextauth]";
import { prisma } from "../../../lib/prisma"; // adjust path

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions);
  if (!session?.user?.email) return res.status(401).json({ error: "Unauthorized" });

  const email = session.user.email;

  if (req.method === "GET") {
    // Fetch user profile
    const user = await prisma.user.findUnique({ where: { email } });
    return res.json(user);
  }

  if (req.method === "PUT") {
    // Update first and last name
    const { firstName, lastName } = req.body;
    const updated = await prisma.user.update({
      where: { email },
      data: { firstName, lastName },
    });
    return res.json(updated);
  }

  if (req.method === "DELETE") {
    // Delete user account
    try {
      await prisma.user.delete({ where: { email } });
      return res.status(200).json({ message: "Account deleted successfully" });
    } catch (err) {
      console.error("Error deleting account:", err);
      return res.status(500).json({ error: "Failed to delete account" });
    }
  }

  res.setHeader("Allow", ["GET", "PUT", "DELETE"]);
  return res.status(405).end(`Method ${req.method} Not Allowed`);
}