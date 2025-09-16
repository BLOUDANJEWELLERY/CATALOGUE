// pages/signup.tsx
"use client";

import Head from "next/head";
import { useState } from "react";
import { useRouter } from "next/router";
import Link from "next/link";

export default function SignupPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const validateEmail = (email: string) =>
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.toLowerCase());

import type { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "../../../lib/prisma";
import { sendEmail } from "../../../lib/mailer";
import bcrypt from "bcryptjs";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).end();

  const { firstName, lastName, email, password } = req.body;
  if (!firstName || !email || !password) {
    return res.status(400).json({ error: "First name, email, and password are required" });
  }

  // Check if email already exists
  const existingUser = await prisma.user.findUnique({ where: { email } });
  if (existingUser) return res.status(400).json({ error: "Email already in use" });

  // Hash password
  const hashedPassword = await bcrypt.hash(password, 10);

  // Generate OTP
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 min

  // Remove old pending user for same email
  await prisma.pendingUser.deleteMany({ where: { email } });

  // Save pending user
  await prisma.pendingUser.create({
    data: {
      firstName,
      lastName,
      email,
      password: hashedPassword,
      otp,
      otpExpiresAt,
    },
  });

  // Send OTP email
  const html = `
    <h2>Verify Your Email</h2>
    <p>Your OTP to verify your account is:</p>
    <h1 style="color:#c7a332;">${otp}</h1>
    <p>It expires in 10 minutes.</p>
  `;

  try {
    await sendEmail(email, "Verify Your Email OTP", html);
    res.status(200).json({ message: "OTP sent to email" });
  } catch (err) {
    console.error("Email send error:", err);
    res.status(500).json({ error: "Failed to send OTP" });
  }
}

  return (
    <>
      <Head>
        <title>Sign Up | Bloudan Jewellery</title>
        <meta
          name="description"
          content="Create your account to explore Bloudan Jewellery catalogue."
        />
      </Head>

      <div className="min-h-screen flex flex-col justify-center items-center bg-[#fdf8f3] p-4">
        {/* Logo */}
        <div className="flex justify-center mb-6">
          <img src="/favicon.png" alt="Bloudan Logo" className="h-20 w-auto" />
        </div>

        <div className="w-full max-w-md bg-[#fffdfb] p-8 rounded-2xl shadow-lg border-2 border-[#c7a332]">
          <h1 className="text-3xl font-bold mb-6 text-center text-[#0b1a3d]">
            Sign Up
          </h1>

          {error && (
            <p className="bg-[#ffe5e5] text-red-700 p-3 rounded mb-4 text-center">
              {error}
            </p>
          )}

          <div className="flex flex-col gap-4">
            <input
              type="text"
              placeholder="First Name *"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              className="input"
            />
            <input
              type="text"
              placeholder="Last Name"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              className="input"
            />
            <input
              type="email"
              placeholder="Email *"
              value={email}
              onChange={(e) => setEmail(e.target.value.toLowerCase())}
              className="input"
            />
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Password *"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input pr-12"
              />
              <button
                type="button"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-[#0b1a3d] hover:text-[#c7a332] transition"
                onClick={() => setShowPassword((prev) => !prev)}
              >
                {showPassword ? "Hide" : "Show"}
              </button>
            </div>
          </div>

          <button
            onClick={handleSubmit}
            disabled={loading}
            className="w-full mt-6 px-4 py-2 bg-[#0b1a3d] text-[#c7a332] font-semibold rounded-lg hover:bg-[#0a162d] transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Sending OTP..." : "Sign Up"}
          </button>

          <p className="text-center text-sm mt-4 text-[#0b1a3d]">
            Already have an account?{" "}
            <Link
              href="/login"
              className="font-semibold underline text-[#c7a332]"
            >
              Login
            </Link>
          </p>
        </div>

        <style jsx>{`
          .input {
            padding: 0.75rem;
            border-radius: 0.75rem;
            border: 1px solid #d4b996;
            width: 100%;
            background-color: #fdf8f3;
            color: #0b1a3d;
          }
          .input:focus {
            border-color: #c7a332;
            outline: none;
            box-shadow: 0 0 0 2px rgba(199, 163, 50, 0.2);
          }
        `}</style>
      </div>
    </>
  );
}