// pages/api/signup.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

type SignupRequest = {
  firstName: string;
  lastName?: string;
  email: string;
  password: string;
};

type SignupResponse = {
  message: string;
  userId?: string;
  error?: string;
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<SignupResponse>
) {
  if (req.method !== "POST") {
    return res
      .status(405)
      .json({ message: `Method ${req.method} not allowed` });
  }

  const { firstName, lastName, email, password }: SignupRequest = req.body;

  // ---------------- Validation ----------------
  if (!firstName?.trim() || !email?.trim() || !password) {
    return res
      .status(400)
      .json({ message: "First name, email, and password are required" });
  }

  try {
    // Check if email already exists
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ message: "Email already exists" });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user with only the fields in the schema
    const user = await prisma.user.create({
      data: {
        firstName: firstName.trim(),
        lastName: lastName?.trim() || null,
        email: email.trim(),
        password: hashedPassword,
      },
    });

    return res
      .status(201)
      .json({ message: "Signup successful", userId: user.id });
  } catch (err: unknown) {
    console.error("Signup error:", err);
    return res
      .status(500)
      .json({ message: "Internal server error", error: "Internal server error" });
  }
}
