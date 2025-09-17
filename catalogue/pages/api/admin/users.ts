// pages/api/admin/users.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { getSession } from "next-auth/react";
import { prisma } from "../../../lib/prisma";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const session = await getSession({ req });

  // Only admin can access
  if (!session || session.user.role !== "admin") {
    return res.status(403).json({ error: "Forbidden" });
  }

  try {
    if (req.method === "GET") {
      const users = await prisma.user.findMany({
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          role: true,
          createdAt: true,
        },
      });
      return res.status(200).json(users);
    }

    if (req.method === "PATCH") {
      const { id, role } = req.body;
      const updated = await prisma.user.update({
        where: { id },
        data: { role },
      });
      return res.status(200).json(updated);
    }

    if (req.method === "DELETE") {
      const { id } = req.body;
      await prisma.user.delete({ where: { id } });
      return res.status(200).json({ success: true });
    }

    res.setHeader("Allow", ["GET", "PATCH", "DELETE"]);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal Server Error" });
  }
}