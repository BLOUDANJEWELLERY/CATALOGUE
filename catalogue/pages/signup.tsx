"use client";

import { useState } from "react";
import { useRouter } from "next/router";

export default function SignupPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  const handleSignup = async () => {
    if (!email || !password) {
      setError("Email and password are required");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      });

      let data;
      try {
        data = await res.json();
      } catch {
        data = { error: "Invalid response from server" };
      }

      if (!res.ok) {
        setError(data.error || "Something went wrong");
        return;
      }

      // Successful signup → navigate to login
      router.push("/login");
    } catch (err) {
      console.error("Network error:", err);
      setError("Network error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: 400, margin: "50px auto", display: "flex", flexDirection: "column", gap: 10 }}>
      <h1>Sign Up</h1>
      {error && <p style={{ color: "red" }}>{error}</p>}
      <input
        placeholder="Name"
        value={name}
        onChange={(e) => setName(e.target.value)}
      />
      <input
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />
      <input
        placeholder="Password"
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />
      <button onClick={handleSignup} disabled={loading}>
        {loading ? "Creating Account..." : "Sign Up"}
      </button>
    </div>
  );
}
