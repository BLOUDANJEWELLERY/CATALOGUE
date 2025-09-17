// pages/api/admin/users.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "../../../lib/prisma";
import { getSession } from "next-auth/react";

type UserResponse = {
  success: true;
  users: {
    id: string;
    email: string;
    name: string;
    role: "user" | "admin";
    createdAt: string;
  }[];
} | {
  success: false;
  error: string;
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<UserResponse>
) {
  const session = await getSession({ req });

  if (!session || session.user.role !== "admin") {
    return res.status(403).json({ success: false, error: "Unauthorized" });
  }

  try {
    if (req.method === "GET") {
      const users = await prisma.user.findMany({
        select: {
          id: true,
          email: true,
          role: true,
          createdAt: true,
          // Prisma has firstName + lastName
          firstName: true,
          lastName: true,
        },
      });

      // Combine firstName + lastName
      const mappedUsers = users.map(u => ({
        id: u.id,
        email: u.email,
        role: u.role as "user" | "admin",
        createdAt: u.createdAt.toISOString(),
        name: `${u.firstName} ${u.lastName || ""}`.trim(),
      }));

      return res.status(200).json({ success: true, users: mappedUsers });
    }

    // PATCH for role change
    if (req.method === "PATCH") {
      const { id, role } = req.body as { id: string; role: "user" | "admin" };
      const updatedUser = await prisma.user.update({
        where: { id },
        data: { role },
        select: {
          id: true,
          email: true,
          role: true,
          createdAt: true,
          firstName: true,
          lastName: true,
        },
      });
      return res.status(200).json({
        success: true,
        user: {
          id: updatedUser.id,
          email: updatedUser.email,
          role: updatedUser.role as "user" | "admin",
          createdAt: updatedUser.createdAt.toISOString(),
          name: `${updatedUser.firstName} ${updatedUser.lastName || ""}`.trim(),
        },
      });
    }

    // DELETE user
    if (req.method === "DELETE") {
      const { id } = req.body as { id: string };
      await prisma.user.delete({ where: { id } });
      return res.status(200).json({ success: true });
    }

    res.setHeader("Allow", ["GET", "PATCH", "DELETE"]);
    return res.status(405).json({ success: false, error: "Method not allowed" });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, error: (error as Error).message });
  }
}