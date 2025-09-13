import type { NextApiRequest, NextApiResponse } from "next";
import { PrismaClient, User, Prisma } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const {
    role,
    firstName,
    lastName,
    email,
    dob,
    gender,
    phoneNumber,
    address1,
    address2,
    state,
    country,
    postalCode,
    password,
  } = req.body;

  // ---------------- Validation ----------------
  if (!role || (role !== "USER" && role !== "USER")) {
    return res.status(400).json({ error: "Role must be buyer or seller" });
  }

  if (!firstName?.trim() || !email?.trim() || !password) {
    return res.status(400).json({ error: "First name, email, and password are required" });
  }

  // Optional phone number validation
  let validPhone: string | null = null;
  if (phoneNumber?.trim()) {
    const phone = phoneNumber.trim();
    const phoneRegex = /^\+\d{1,4}\d{6,14}$/;
    if (!phoneRegex.test(phone)) {
      return res.status(400).json({ error: "Phone number must include country code, e.g., +96512345678" });
    }
    validPhone = phone;
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
        role,
        firstName: firstName.trim(),
        lastName: lastName?.trim() || null,
        email: email.trim(),
        dob: dob ? new Date(dob) : null,
        gender: gender || null,
        phoneNumber: validPhone, // optional
        password: hashedPassword,
        address1: address1?.trim() || null,
        address2: address2?.trim() || null,
        state: state?.trim() || null,
        country: country?.trim() || null,
        postalCode: postalCode?.trim() || null,
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