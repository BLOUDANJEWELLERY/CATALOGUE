// pages/api/signup.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { PrismaClient, Prisma } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  let { firstName, lastName, email, password } = req.body;

  // Normalize email
  email = email?.trim().toLowerCase();

  if (!firstName?.trim() || !email || !password) {
    return res
      .status(400)
      .json({ error: "First name, email, and password are required" });
  }

  try {
    // Check if email already exists (case-insensitive now)
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });
    if (existingUser) {
      return res.status(400).json({ error: "Email already exists" });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user with normalized email
    const user = await prisma.user.create({
      data: {
        firstName: firstName.trim(),
        lastName: lastName?.trim() || null,
        email,
        password: hashedPassword,
      },
    });

    return res.status(201).json({ message: "Signup successful", userId: user.id });
  } catch (err: unknown) {
    let details: string = "Unknown error";
    if (err instanceof Error) {
      details = err.message;
    } else if (typeof err === "object") {
      details = JSON.stringify(err);
    }

    if (err instanceof Prisma.PrismaClientKnownRequestError) {
      if (err.code === "P2002") {
        return res.status(400).json({ error: "Email already exists" });
      }
    }

    return res.status(500).json({
      error: "Internal server error",
      debug: details,
    });
  }
}