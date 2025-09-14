// pages/api/signup.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { PrismaClient, Prisma } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { firstName, lastName, email, password } = req.body;

  if (!firstName?.trim() || !email?.trim() || !password) {
    return res
      .status(400)
      .json({ error: "First name, email, and password are required" });
  }

  try {
    // Check if email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: email.trim() },
    });
    if (existingUser) {
      return res.status(400).json({ error: "Email already exists" });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const user = await prisma.user.create({
      data: {
        firstName: firstName.trim(),
        lastName: lastName?.trim() || null,
        email: email.trim(),
        password: hashedPassword,
      },
    });

    return res.status(201).json({ message: "Signup successful", userId: user.id });
  } catch (err: unknown) {
    console.error("Signup error full dump:", err);

    if (err instanceof Prisma.PrismaClientKnownRequestError) {
      if (err.code === "P2002") {
        return res.status(400).json({ error: "Email already exists" });
      }
    }

    return res.status(500).json({ error: "Internal server error" });
  }
}