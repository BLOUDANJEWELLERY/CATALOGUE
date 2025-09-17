// pages/api/admin/users.ts
import { getSession } from "next-auth/react";
import { prisma } from "../../../lib/prisma";

export default async function handler(req, res) {
  const session = await getSession({ req });

  // Only admin can access
  if (!session || session.user.role !== "admin") {
    return res.status(403).json({ error: "Not authorized" });
  }

  if (req.method === "GET") {
    const users = await prisma.user.findMany({
      select: { id: true, name: true, email: true, role: true, createdAt: true }
    });
    return res.json(users);
  }

  if (req.method === "PATCH") {
    const { id, role } = req.body;
    const updatedUser = await prisma.user.update({
      where: { id },
      data: { role },
    });
    return res.json(updatedUser);
  }

  if (req.method === "DELETE") {
    const { id } = req.body;
    await prisma.user.delete({ where: { id } });
    return res.json({ message: "User deleted" });
  }

  return res.status(405).json({ error: "Method not allowed" });
}