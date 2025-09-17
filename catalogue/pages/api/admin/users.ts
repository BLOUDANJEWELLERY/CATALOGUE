import type { NextApiRequest, NextApiResponse } from "next";
import { getSession } from "next-auth/react";
import { prisma } from "../../../lib/prisma";

type UserResponse = {
  id: string;
  email: string;
  name: string;
  role: "user" | "admin";
  createdAt: string;
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getSession({ req });

  // Only allow admins
  if (!session || session.user.role !== "admin") {
    return res.status(403).json({ error: "Forbidden" });
  }

  try {
    switch (req.method) {
      case "GET":
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

        const formatted = users.map(u => ({
          id: u.id,
          email: u.email,
          name: `${u.firstName}${u.lastName ? " " + u.lastName : ""}`,
          role: u.role as "user" | "admin",
          createdAt: u.createdAt.toISOString(),
        }));

        return res.status(200).json(formatted);

      case "PATCH":
        const { id, role } = req.body;
        if (!id || !role) return res.status(400).json({ error: "Missing id or role" });

        const updated = await prisma.user.update({
          where: { id },
          data: { role },
          select: { id: true, email: true, firstName: true, lastName: true, role: true, createdAt: true },
        });

        return res.status(200).json({
          id: updated.id,
          email: updated.email,
          name: `${updated.firstName}${updated.lastName ? " " + updated.lastName : ""}`,
          role: updated.role as "user" | "admin",
          createdAt: updated.createdAt.toISOString(),
        });

      case "DELETE":
        const { id: deleteId } = req.body;
        if (!deleteId) return res.status(400).json({ error: "Missing id" });

        await prisma.user.delete({ where: { id: deleteId } });
        return res.status(200).json({ success: true });

      default:
        res.setHeader("Allow", ["GET", "PATCH", "DELETE"]);
        return res.status(405).end(`Method ${req.method} Not Allowed`);
    }
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Internal Server Error" });
  }
}