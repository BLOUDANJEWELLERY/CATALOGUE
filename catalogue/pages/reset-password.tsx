// pages/reset-password.tsx
"use client";

import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";

export default function ResetPasswordPage() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token") || "";
  const router = useRouter();

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [validToken, setValidToken] = useState<boolean | null>(null);

  useEffect(() => {
    if (!token) return setValidToken(false);

    const checkToken = async () => {
      try {
        const res = await fetch("/api/auth/check-token", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token }),
        });
        setValidToken(res.ok);
      } catch {
        setValidToken(false);
      }
    };
    checkToken();
  }, [token]);

  const handleReset = async () => {
    setError("");
    if (!password || !confirm) return setError("All fields are required!");
    if (password !== confirm) return setError("Passwords do not match!");

    setLoading(true);
    try {
      const res = await fetch("/api/auth/reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });
      const data = await res.json();
      if (res.ok) setSuccess(data.message || "Password reset successfully!");
      else setError(data.error || "Failed to reset password");
    } catch {
      setError("Failed to reset password");
    } finally {
      setLoading(false);
    }
  };

  if (validToken === null) {
    return (
      <div className="min-h-screen flex justify-center items-center bg-[#fdf8f3]">
        <p className="text-[#0b1a3d] text-lg font-semibold">Checking link validity...</p>
      </div>
    );
  }

  if (!validToken) {
    return (
      <div className="min-h-screen flex flex-col justify-center items-center bg-[#fdf8f3] p-4">
        <div className="w-full max-w-lg bg-[#fffdfb] p-10 rounded-3xl shadow-2xl border-2 border-[#c7a332] text-center">
          <motion.h1
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.6 }}
            className="text-4xl font-bold mb-6 text-[#0b1a3d]"
          >
            Invalid or Expired Link
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="mb-8 text-red-700 text-lg"
          >
            This link has either been used or has expired. Please request a new password reset link.
          </motion.p>
          <motion.button
            whileHover={{ scale: 1.05, boxShadow: "0 0 20px rgba(199,163,50,0.7)" }}
            whileTap={{ scale: 0.95 }}
            onClick={() => router.push("/forgot-password")}
            className="px-6 py-3 bg-[#c7a332] text-[#fffdfb] font-semibold rounded-lg hover:bg-[#b8972a] transition-shadow duration-300"
          >
            Request New Link
          </motion.button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col justify-center items-center bg-[#fdf8f3] p-6">
      <div className="w-full max-w-lg bg-[#fffdfb] p-10 rounded-3xl shadow-2xl border-2 border-[#c7a332]">
        <motion.h1
          initial={{ y: -30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.6 }}
          className="text-4xl font-bold mb-6 text-center text-[#0b1a3d]"
        >
          Reset Your Password
        </motion.h1>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="text-[#0b1a3d] mb-8 text-center"
        >
          Enter a new password below to secure your account.
        </motion.p>

        {error && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
            className="bg-[#ffe5e5] text-red-700 p-3 rounded mb-4 text-center"
          >
            {error}
          </motion.div>
        )}

        {success ? (
          <div className="text-center">
            <p className="mb-6 text-[#0b1a3d] text-lg">{success}</p>
            <motion.button
              whileHover={{ scale: 1.05, boxShadow: "0 0 20px rgba(199,163,50,0.7)" }}
              whileTap={{ scale: 0.95 }}
              onClick={() => router.push("/login")}
              className="px-6 py-3 bg-[#0b1a3d] text-[#c7a332] font-semibold rounded-lg hover:bg-[#0a162d] transition-shadow duration-300"
            >
              Return to Login
            </motion.button>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            <input
              type="password"
              placeholder="New Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="input"
            />
            <input
              type="password"
              placeholder="Confirm New Password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              className="input"
            />
            <motion.button
              whileHover={{ scale: 1.02, boxShadow: "0 0 15px rgba(199,163,50,0.5)" }}
              whileTap={{ scale: 0.95 }}
              onClick={handleReset}
              disabled={loading}
              className="w-full px-4 py-2 bg-[#c7a332] text-[#fffdfb] font-semibold rounded-lg hover:bg-[#b8972a] disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300"
            >
              {loading ? "Resetting..." : "Reset Password"}
            </motion.button