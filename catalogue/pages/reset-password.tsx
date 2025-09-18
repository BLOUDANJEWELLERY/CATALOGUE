// pages/reset-password.tsx
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
  const [validToken, setValidToken] = useState<boolean | null>(null); // null = checking

  // Check token validity on page load
  useEffect(() => {
    if (!token) return setValidToken(false);

    const checkToken = async () => {
      try {
        const res = await fetch("/api/auth/check-token", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token }),
        });
        if (res.ok) setValidToken(true);
        else setValidToken(false);
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
    } catch (err) {
      console.error(err);
      setError("Failed to reset password");
    } finally {
      setLoading(false);
    }
  };

  // Token checking screen
  if (validToken === null)
    return (
      <div className="min-h-screen flex justify-center items-center bg-[#fdf8f3]">
        <motion.div
          className="text-[#0b1a3d] text-lg"
          animate={{ opacity: [0, 1, 0] }}
          transition={{ duration: 1.5, repeat: Infinity }}
        >
          Verifying link...
        </motion.div>
      </div>
    );

  // Invalid or expired token screen
  if (!validToken)
    return (
      <div className="min-h-screen flex flex-col justify-center items-center bg-[#fdf8f3] p-6">
        <motion.div
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md bg-[#fffdfb] p-8 rounded-3xl shadow-xl border-2 border-[#c7a332] text-center"
        >
          <h1 className="text-4xl font-extrabold mb-4 text-[#0b1a3d]">Invalid Link</h1>
          <p className="mb-6 text-red-700 text-lg">
            This link has either been used or expired. Please request a new password reset.
          </p>
          <button
            onClick={() => router.push("/forgot-password")}
            className="px-6 py-3 bg-[#c7a332] text-[#fffdfb] font-semibold rounded-xl hover:bg-[#b8972a] transition"
          >
            Request New Link
          </button>
        </motion.div>
      </div>
    );

  // Valid token screen
  return (
    <div className="min-h-screen flex flex-col justify-center items-center bg-[#fdf8f3] p-6 relative overflow-hidden">
      {/* Decorative sparkles */}
      {[...Array(15)].map((_, i) => (
        <motion.div
          key={i}
          initial={{ x: Math.random() * 100 + "%", y: "100%" }}
          animate={{ y: "-10%", x: `+=20` }}
          transition={{ duration: 8 + Math.random() * 4, repeat: Infinity, ease: "linear" }}
          className="absolute w-1 h-16 bg-gradient-to-b from-yellow-400 via-yellow-300 to-white opacity-70 rounded-full"
        />
      ))}

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.8 }}
        className="w-full max-w-md bg-[#fffdfb] p-8 rounded-3xl shadow-xl border-2 border-[#c7a332] text-center z-10"
      >
        <h1 className="text-3xl font-bold mb-4 text-[#0b1a3d]">Reset Your Password</h1>
        <p className="mb-6 text-[#0b1a3d] text-lg">
          Enter a new password to regain access to your account.
        </p>

        {error && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-[#ffe5e5] text-red-700 p-3 rounded mb-4"
          >
            {error}
          </motion.p>
        )}

        {success ? (
          <div className="flex flex-col items-center gap-4">
            <p className="text-[#0b1a3d] text-lg">{success}</p>
            <button
              onClick={() => router.push("/login")}
              className="px-6 py-3 bg-[#0b1a3d] text-[#c7a332] rounded-xl hover:bg-[#0a162d] transition"
            >
              Return to Login
            </button>
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
            <button
              onClick={handleReset}
              disabled={loading}
              className="w-full px-4 py-2 bg-[#0b1a3d] text-[#c7a332] font-semibold rounded-lg hover:bg-[#b8972a] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Resetting..." : "Reset Password"}
            </button>
          </div>
        )}
      </motion.div>

      <style jsx>{`
        .input {
          padding: 0.75rem;
          border-radius: 1rem;
          border: 1px solid #d4b996;
          width: 100%;
          background-color: #fdf8f3;
          color: #0b1a3d;
          transition: all 0.3s;
        }
        .input:focus {
          border-color: #c7a332;
          outline: none;
          box-shadow: 0 0 0 4px rgba(199, 163, 50, 0.2);
        }
      `}</style>
    </div>
  );
}