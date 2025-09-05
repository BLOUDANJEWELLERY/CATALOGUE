import type { NextApiRequest, NextApiResponse } from "next";
import { PrismaClient, User } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

interface ResponseData {
  message?: string;
  userId?: string;
  error?: string;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ResponseData>
) {
  // CORS headers
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  res.setHeader("Access-Control-Allow-Methods", "POST, GET, OPTIONS");

  if (req.method === "OPTIONS") {
    return res.status(200).end(); // Preflight response
  }

  console.log("=== Signup API Hit ===");
  console.log("Request method:", req.method);
  console.log("DATABASE_URL:", process.env.DATABASE_URL);

  if (req.method === "GET") {
    return res
      .status(200)
      .json({ message: "Signup API is alive. Use POST to create a user." });
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed. Use POST." });
  }

  const { email, password } = req.body as { email?: string; password?: string };

  if (!email || !password) {
    return res.status(400).json({ error: "Email and password are required." });
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({ error: "Invalid email format." });
  }

  try {
    const existingUser: User | null = await prisma.user.findUnique({
      where: { email: email },
    });

    if (existingUser) {
      return res.status(400).json({ error: "User with this email already exists." });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user: User = await prisma.user.create({
      data: {
        email: email,
        password: hashedPassword,
      },
    });

    console.log("User created:", user.id);

    return res.status(201).json({ message: "User created successfully.", userId: user.id });
  } catch (err: unknown) {
    console.error("Signup error:", err);

    if (err instanceof Error) {
      return res.status(500).json({ error: err.message || "Internal server error." });
    }

    return res.status(500).json({ error: "Internal server error." });
  }
}
