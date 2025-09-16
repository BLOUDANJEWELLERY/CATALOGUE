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
          "A reset link has been sent to your email. It will expire in 10 minutes."
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
    <div
      style={{
        maxWidth: "400px",
        margin: "80px auto",
        padding: "30px",
        border: "1px solid #ddd",
        borderRadius: "12px",
        textAlign: "center",
        fontFamily: "sans-serif",
      }}
    >
      <h1 style={{ marginBottom: "20px" }}>Reset Password</h1>

      {!message && (
        <>
          <input
            type="email"
            placeholder="Enter your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={{
              width: "100%",
              padding: "10px",
              marginBottom: "15px",
              borderRadius: "6px",
              border: "1px solid #ccc",
            }}
          />
          <button
            onClick={handleReset}
            disabled={loading}
            style={{
              width: "100%",
              padding: "10px",
              backgroundColor: "#c7a332",
              color: "#fff",
              border: "none",
              borderRadius: "6px",
              cursor: "pointer",
            }}
          >
            {loading ? "Sending..." : "Send Reset Link"}
          </button>
        </>
      )}

      {message && (
        <div style={{ marginTop: "20px" }}>
          <p>{message}</p>
          <button
            onClick={() => router.push("/login")}
            style={{
              marginTop: "15px",
              padding: "8px 20px",
              backgroundColor: "#0b1a3d",
              color: "#fff",
              border: "none",
              borderRadius: "6px",
              cursor: "pointer",
            }}
          >
            Return to Login
          </button>
        </div>
      )}
    </div>
  );
}