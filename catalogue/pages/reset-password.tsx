// pages/reset-password.tsx
"use client";
import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";

export default function ResetPasswordPage() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token") || "";

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");

  const handleReset = async () => {
    if (password !== confirm) return alert("Passwords do not match!");
    try {
      const res = await fetch("/api/auth/reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });
      const data = await res.json();
      alert(data.message || "Password reset complete!");
    } catch (err) {
      console.error(err);
      alert("Failed to reset password");
    }
  };

  return (
    <div style={{ padding: 20 }}>
      <h2>Reset Password</h2>
      <input
        type="password"
        placeholder="New password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        style={{ display: "block", marginBottom: 10 }}
      />
      <input
        type="password"
        placeholder="Confirm new password"
        value={confirm}
        onChange={(e) => setConfirm(e.target.value)}
        style={{ display: "block", marginBottom: 10 }}
      />
      <button
        onClick={handleReset}
        style={{
          padding: "10px 20px",
          backgroundColor: "#c7a332",
          color: "#fff",
          border: "none",
          borderRadius: "6px",
          cursor: "pointer",
        }}
      >
        Reset Password
      </button>
    </div>
  );
}