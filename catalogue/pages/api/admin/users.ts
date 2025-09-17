// pages/api/admin/users.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "../../../lib/prisma";
import { getSession } from "next-auth/react";

type UserType = {
  id: string;
  email: string;
  name: string;
  role: "user" | "admin";
  createdAt: string;
};

type GetUsersResponse = { success: true; users: UserType[] } | { success: false; error: string };
type PatchUserResponse = { success: true; user: UserType } | { success: false; error: string };
type DeleteUserResponse = { success: true } | { success: false; error: string };

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<GetUsersResponse | PatchUserResponse | DeleteUserResponse>
) {
  const session = await getSession({ req });

  if (!session || session.user.role !== "admin") {
    return res.status(403).json({ success: false, error: "Unauthorized" });
  }

  try {
    // GET users
// GET users
if (req.method === "GET") {
  const dbUsers = await prisma.user.findMany({
    select: { id: true, firstName: true, lastName: true, email: true, role: true, createdAt: true },
  });

  // Map to frontend-compatible UserType
  const users = dbUsers.map(u => ({
    id: u.id,
    email: u.email,
    name: u.lastName ? `${u.firstName} ${u.lastName}` : u.firstName,
    role: u.role as "user" | "admin",
    createdAt: u.createdAt.toISOString(),
  }));

  return res.status(200).json({ success: true, users });
}

    // PATCH role
    if (req.method === "PATCH") {
      const { id, role } = req.body as { id: string; role: "user" | "admin" };
      const updatedUser = await prisma.user.update({
        where: { id },
        data: { role },
        select: { id: true, email: true, role: true, createdAt: true, firstName: true, lastName: true },
      });

      const mappedUser: UserType = {
        id: updatedUser.id,
        email: updatedUser.email,
        role: updatedUser.role as "user" | "admin",
        createdAt: updatedUser.createdAt.toISOString(),
        name: `${updatedUser.firstName} ${updatedUser.lastName || ""}`.trim(),
      };

      return res.status(200).json({ success: true, user: mappedUser });
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