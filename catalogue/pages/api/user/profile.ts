// pages/api/user/profile.ts
import { getServerSession } from "next-auth/next";
import type { NextApiRequest, NextApiResponse } from "next";
import { authOptions } from "../auth/[...nextauth]";
import { prisma } from "../../../lib/prisma"; // adjust path

interface ApiResponse {
  id?: string;
  email?: string;
  role?: string;
  firstName?: string;
  lastName?: string;
  error?: string;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse<ApiResponse>) {
  try {
    const session = await getServerSession(req, res, authOptions);

    if (!session?.user?.email) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const email = session.user.email;

    if (req.method === "GET") {
      const user = await prisma.user.findUnique({
        where: { email },
        select: { id: true, email: true, role: true, firstName: true, lastName: true },
      });

      if (!user) return res.status(404).json({ error: "User not found" });

      return res.status(200).json(user);
    }

    if (req.method === "PUT") {
      const { firstName, lastName } = req.body;

      if (typeof firstName !== "string" || typeof lastName !== "string") {
        return res.status(400).json({ error: "Invalid input" });
      }

      const updatedUser = await prisma.user.update({
        where: { email },
        data: { firstName, lastName },
        select: { id: true, email: true, role: true, firstName: true, lastName: true },
      });

      return res.status(200).json(updatedUser);
    }

    res.setHeader("Allow", ["GET", "PUT"]);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  } catch (error) {
    console.error("Profile API error:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
}