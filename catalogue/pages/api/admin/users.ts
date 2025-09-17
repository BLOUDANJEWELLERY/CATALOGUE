// pages/api/admin/users.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { getSession } from "next-auth/react";
import { prisma } from "../../../lib/prisma";

type Data =
  | { success: boolean; message?: string }
  | {
      id: string;
      email: string;
      name: string;
      role: "user" | "admin";
      createdAt: string;
    }[]
  | {
      id: string;
      email: string;
      name: string;
      role: "user" | "admin";
      createdAt: string;
    };

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Data>
) {
  // Authenticate admin
  const session = await getSession({ req });
  if (!session || session.user.role !== "admin") {
    return res.status(403).json({ success: false, message: "Forbidden" });
  }

  try {
    // GET all users
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

      const formattedUsers = users.map(u => ({
        id: u.id,
        email: u.email,
        name: `${u.firstName}${u.lastName ? " " + u.lastName : ""}`,
        role: u.role as "user" | "admin",
        createdAt: u.createdAt.toISOString(),
      }));

      return res.status(200).json(formattedUsers);
    }

    // PATCH: update role
    if (req.method === "PATCH") {
      const { id, role } = req.body as { id: string; role: "user" | "admin" };
      if (!id || !role) {
        return res.status(400).json({ success: false, message: "Missing id or role" });
      }

      const updated = await prisma.user.update({
        where: { id },
        data: { role },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          role: true,
          createdAt: true,
        },
      });

      return res.status(200).json({
        id: updated.id,
        email: updated.email,
        name: `${updated.firstName}${updated.lastName ? " " + updated.lastName : ""}`,
        role: updated.role as "user" | "admin",
        createdAt: updated.createdAt.toISOString(),
      });
    }

    // DELETE: remove user
    if (req.method === "DELETE") {
      const { id } = req.body as { id: string };
      if (!id) {
        return res.status(400).json({ success: false, message: "Missing id" });
      }

      await prisma.user.delete({ where: { id } });
      return res.status(200).json({ success: true });
    }

    res.setHeader("Allow", ["GET", "PATCH", "DELETE"]);
    return res.status(405).json({ success: false, message: "Method not allowed" });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
}