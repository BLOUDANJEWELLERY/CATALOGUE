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
    const user = await prisma.user.findUnique({ where: { email } });
    return res.json(user);
  }

  if (req.method === "PUT") {
    const { firstName, lastName } = req.body;
    const updated = await prisma.user.update({
      where: { email },
      data: { firstName, lastName },
    });
    return res.json(updated);
  }

  res.setHeader("Allow", ["GET", "PUT"]);
  return res.status(405).end(`Method ${req.method} Not Allowed`);
}