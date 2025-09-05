// pages/api/signup.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  console.log("=== Signup API Hit ===");
  console.log("Request method:", req.method);
  console.log("DATABASE_URL:", process.env.DATABASE_URL);

  if (req.method === "GET") {
    return res.status(200).json({ message: "Signup API is alive. Use POST to create a user." });
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed. Use POST." });
  }

  const { email, password } = req.body as { email?: string; password?: string };

  // Basic validation
  if (!email || !password) {
    return res.status(400).json({ error: "Email and password are required." });
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({ error: "Invalid email format." });
  }

  try {
    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: email }, // Prisma field is 'emails' as per your schema
    });

    if (existingUser) {
      return res.status(400).json({ error: "User with this email already exists." });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create new user
    const user = await prisma.user.create({
      data: {
        email: email,
        password: hashedPassword,
      },
    });

    console.log("User created:", user.id);

    return res.status(201).json({ message: "User created successfully.", userId: user.id });
  } catch (err) {
    console.error("Signup error:", err);

    // Prisma/MongoDB connection error detection
    if ((err as any)?.code === "P1001") {
      return res.status(500).json({ error: "Database connection failed. Check DATABASE_URL." });
    }

    return res.status(500).json({ error: "Internal server error." });
  }
}
