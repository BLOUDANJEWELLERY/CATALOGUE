// pages/api/admin/users.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { getSession } from "next-auth/react";
import { prisma } from "../../../lib/prisma";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getSession({ req });

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

      // Return a `name` field for frontend convenience
      const usersWithName = users.map(u => ({
        ...u,
        name: `${u.firstName}${u.lastName ? " " + u.lastName : ""}`,
      }));

      return res.status(200).json(usersWithName);
    }

    if (req.method === "PATCH") {
      const { id, role } = req.body;
      if (!id || !role) return res.status(400).json({ error: "Missing parameters" });

      const updated = await prisma.user.update({
        where: { id },
        data: { role },
      });

      // Return updated user
      return res.status(200).json({
        id: updated.id,
        email: updated.email,
        name: `${updated.firstName}${updated.lastName ? " " + updated.lastName : ""}`,
        role: updated.role,
        createdAt: updated.createdAt,
      });
    }

    if (req.method === "DELETE") {
      const { id } = req.body;
      if (!id) return res.status(400).json({ error: "Missing id" });

      await prisma.user.delete({ where: { id } });
      return res.status(200).json({ success: true, id });
    }

    res.setHeader("Allow", ["GET", "PATCH", "DELETE"]);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal Server Error" });
  }
}