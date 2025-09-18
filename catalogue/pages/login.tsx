// pages/login.tsx
"use client";
import Image from "next/image";
import Head from "next/head";
import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/router";
import Link from "next/link";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async () => {
    setLoading(true);
    setError("");

    // normalize email to lowercase before sending
    const normalizedEmail = email.trim().toLowerCase();

    const res = await signIn("credentials", { 
      email: normalizedEmail, 
      password, 
      redirect: false 
    });

    if (res?.error) setError("Invalid email or password");
    else if (res?.ok) router.push("/");

    setLoading(false);
  };

  return (
    <>
      <Head>
        <title>Login | Bloudan Jewellery</title>
        <meta
          name="description"
          content="Login to access Bloudan Jewellery catalogue"
        />
      </Head>

      <div className="min-h-screen flex flex-col justify-center items-center bg-[#fdf8f3] p-4">
        {/* Logo */}
       <div className="flex justify-center mb-6">
  <Image
    src="/favicon.PNG"
    alt="Bloudan Logo"
    width={80}
    height={80}
    className="h-20 w-auto"
    priority
  />
</div>

        <div className="w-full max-w-md bg-[#fffdfb] p-8 rounded-2xl shadow-lg border-2 border-[#c7a332]">
          <h1 className="text-3xl font-bold mb-6 text-center text-[#0b1a3d]">
            Login
          </h1>

          {error && (
            <p className="bg-[#ffe5e5] text-red-700 p-3 rounded mb-4 text-center">
              {error}
            </p>
          )}

          <div className="flex flex-col gap-4">
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value.toLowerCase())} // force lowercase as user types
              className="input"
            />

            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Password"
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

{/* Forgot Password Link */}
  <div className="text-right">
    <Link
      href="/forgot-password"
      className="text-sm font-semibold text-[#c7a332] hover:underline"
    >
      Forgot Password?
    </Link>
  </div>

          </div>

          <button
            onClick={handleLogin}
            disabled={loading}
            className="w-full mt-6 px-4 py-2 bg-gradient-to-r from-[#0b1a3d] to-[#c7a332] text-white font-semibold rounded-lg hover:brightness-110 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Logging In..." : "Login"}
          </button>

          <p className="text-center text-sm mt-4 text-[#0b1a3d]">
            Don&apos;t have an account?{" "}
            <Link
              href="/signup"
              className="font-semibold underline text-[#c7a332]"
            >
              Sign Up
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