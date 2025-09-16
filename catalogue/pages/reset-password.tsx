// pages/reset-password.tsx
"use client";

import { useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";

export default function ResetPasswordPage() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token") || "";
  const router = useRouter();

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

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
      if (res.ok) {
        setSuccess(data.message || "Password reset successfully!");
      } else {
        setError(data.error || "Failed to reset password");
      }
    } catch (err) {
      console.error(err);
      setError("Failed to reset password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-center items-center bg-[#fdf8f3] p-4">
      <div className="w-full max-w-md bg-[#fffdfb] p-8 rounded-2xl shadow-lg border-2 border-[#c7a332]">
        <h1 className="text-3xl font-bold mb-6 text-center text-[#0b1a3d]">
          Reset Password
        </h1>

        {error && (
          <p className="bg-[#ffe5e5] text-red-700 p-3 rounded mb-4 text-center">
            {error}
          </p>
        )}

        {success ? (
          <div className="text-center">
            <p className="mb-4">{success}</p>
            <button
              onClick={() => router.push("/login")}
              className="px-4 py-2 bg-[#0b1a3d] text-[#c7a332] rounded-lg hover:bg-[#0a162d]"
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
              className="w-full px-4 py-2 bg-[#c7a332] text-[#fffdfb] font-semibold rounded-lg hover:bg-[#b8972a] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Resetting..." : "Reset Password"}
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