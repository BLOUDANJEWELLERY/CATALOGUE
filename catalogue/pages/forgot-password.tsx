// pages/forgot-password.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleReset = async () => {
    if (!email) return alert("Please enter your email");

    setLoading(true);
    try {
      const res = await fetch("/api/auth/forgot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();
      setMessage(
        res.ok
          ? "A reset link has been sent to your email. It will expire in 1 hour."
          : data.error || "Failed to send reset link"
      );
    } catch (err) {
      console.error(err);
      setMessage("Error sending reset email");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#fdf8f3] relative overflow-hidden">
      {/* Decorative sparkles */}
      {[...Array(15)].map((_, i) => (
        <motion.div
          key={i}
          initial={{ y: Math.random() * 600 + 600, x: Math.random() * 1200 }}
          animate={{ y: -50, x: "+=20" }}
          transition={{
            duration: 12 + Math.random() * 5,
            repeat: Infinity,
            ease: "linear",
            delay: i * 0.5,
          }}
          className="absolute w-1 h-16 bg-gradient-to-b from-yellow-400 via-yellow-300 to-white opacity-70 rounded-full pointer-events-none"
        />
      ))}

      <div className="relative flex flex-col justify-center items-center py-20 px-4">
        <motion.div
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1 }}
          className="w-full max-w-lg bg-[#fffdfb] p-10 rounded-3xl shadow-2xl border-2 border-[#c7a332] text-center"
        >
          <h1 className="text-4xl font-bold text-[#0b1a3d] mb-6">
            Reset Your Password
          </h1>
          <p className="text-[#0b1a3d] text-lg mb-8">
            Enter your email below and we'll send you a secure link to reset your password.
          </p>

          {!message ? (
            <div className="flex flex-col gap-5">
              <input
                type="email"
                placeholder="Your Email"
                value={email}
                onChange={(e) => setEmail(e.target.value.toLowerCase())}
                className="input"
              />
              <motion.button
                onClick={handleReset}
                disabled={loading}
                whileHover={{ scale: 1.05, boxShadow: "0 0 20px rgba(199,163,50,0.6)" }}
                whileTap={{ scale: 0.95 }}
                className="w-full px-6 py-3 bg-[#c7a332] text-[#fffdfb] font-semibold rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? "Sending..." : "Send Reset Link"}
              </motion.button>
            </div>
          ) : (
            <div className="flex flex-col items-center mt-6">
              <p className="text-[#0b1a3d] text-lg mb-4">{message}</p>
              <motion.button
                onClick={() => router.push("/login")}
                whileHover={{ scale: 1.05, boxShadow: "0 0 20px rgba(11,26,61,0.5)" }}
                whileTap={{ scale: 0.95 }}
                className="px-6 py-3 bg-[#0b1a3d] text-[#c7a332] rounded-xl hover:bg-[#0a162d] transition-colors"
              >
                Return to Login
              </motion.button>
            </div>
          )}
        </motion.div>
      </div>

      <style jsx>{`
        .input {
          padding: 0.85rem 1rem;
          border-radius: 12px;
          border: 1px solid #d4b996;
          width: 100%;
          font-size: 16px;
          background-color: #fdf8f3;
          color: #0b1a3d;
          transition: all 0.3s;
        }
        .input:focus {
          border-color: #c7a332;
          outline: none;
          box-shadow: 0 0 0 3px rgba(199, 163, 50, 0.2);
        }
      `}</style>
    </div>
  );
}