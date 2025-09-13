import type { NextApiRequest, NextApiResponse } from "next";
import { PrismaClient, User, Prisma } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const {
    firstName,
    lastName,
    email,
    password,
  } = req.body;

  // ---------------- Validation ----------------

  if (!firstName?.trim() || !email?.trim() || !password) {
    return res.status(400).json({ error: "First name, email, and password are required" });
  }

  try {
    // Check if email already exists
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ error: "Email already exists" });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const user: User = await prisma.user.create({
      data: {
        firstName: firstName.trim(),
        lastName: lastName?.trim() || null,
        email: email.trim(),
        password: hashedPassword,
        },
    });

    return res.status(201).json({ message: "Signup successful", userId: user.id });
  } catch (err: unknown) {
    console.error("Signup error:", err);
    let errorMessage = "Internal server error";
    if ((err as Prisma.PrismaClientKnownRequestError).code === "P2002") {
      errorMessage = "Email already exists";
    }
    return res.status(500).json({ error: errorMessage });
  }
}