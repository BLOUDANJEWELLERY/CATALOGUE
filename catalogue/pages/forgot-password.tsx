// pages/forgot-password.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

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

      if (res.ok) {
        setMessage(
          "A reset link has been sent to your email. It will expire in 1 hour."
        );
      } else {
        setMessage(data.error || "Failed to send reset link");
      }
    } catch (err) {
      console.error(err);
      setMessage("Error sending reset email");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-center items-center bg-[#fdf8f3] p-4">
      <div className="w-full max-w-md bg-[#fffdfb] p-8 rounded-2xl shadow-lg border-2 border-[#c7a332] text-center">
        <h1 className="text-3xl font-bold mb-6 text-[#0b1a3d]">Reset Password</h1>

        {!message ? (
          <div className="flex flex-col gap-4">
            <input
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value.toLowerCase())}
              className="input"
            />
            <button
              onClick={handleReset}
              disabled={loading}
              className="w-full px-4 py-2 bg-[#c7a332] text-[#fffdfb] font-semibold rounded-lg hover:bg-[#b8972a] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Sending..." : "Send Reset Link"}
            </button>
          </div>
        ) : (
          <div className="mt-4">
            <p className="text-[#0b1a3d]">{message}</p>
            <button
              onClick={() => router.push("/login")}
              className="mt-4 px-4 py-2 bg-[#0b1a3d] text-[#c7a332] rounded-lg hover:bg-[#0a162d]"
            >
              Return to Login
            </button>
          </div>
        )}
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
  );
}