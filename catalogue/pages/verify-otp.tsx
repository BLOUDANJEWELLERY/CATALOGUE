// pages/verify-otp.tsx
"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/router";

export default function VerifyOtpPage() {
  const router = useRouter();
  const email = (router.query.email as string) || "";

  const [otp, setOtp] = useState<string[]>(["", "", "", "", "", ""]);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const [timeLeft, setTimeLeft] = useState(600); // 10 minutes
  const [resendCooldown, setResendCooldown] = useState(0);

  const inputsRef = useRef<(HTMLInputElement | null)[]>([]);

  // Countdown timer
  useEffect(() => {
    if (timeLeft <= 0) return;
    const timer = setInterval(() => setTimeLeft((t) => t - 1), 1000);
    return () => clearInterval(timer);
  }, [timeLeft]);

  // Resend cooldown
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const cd = setInterval(() => setResendCooldown((c) => c - 1), 1000);
    return () => clearInterval(cd);
  }, [resendCooldown]);

  const handleChange = (val: string, idx: number) => {
    if (/^\d?$/.test(val)) {
      const newOtp = [...otp];
      newOtp[idx] = val;
      setOtp(newOtp);
      if (val && idx < 5) inputsRef.current[idx + 1]?.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, idx: number) => {
    if (e.key === "Backspace" && !otp[idx] && idx > 0) {
      inputsRef.current[idx - 1]?.focus();
    }
  };

  const handleVerify = async () => {
    const code = otp.join("");
    if (code.length !== 6) {
      setError("Please enter the full 6-digit OTP");
      return;
    }

    setLoading(true);
    setError("");
    setMessage("");

    try {
      const res = await fetch("/api/auth/verify-signup-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp: code }),
      });

      const data = await res.json();

      if (res.ok) {
        setMessage("Account created successfully! Redirecting to login...");
        setTimeout(() => router.push("/login"), 2000);
      } else {
        setError(data.error || "Invalid OTP");
      }
    } catch (err) {
      console.error(err);
      setError("Verification failed, try again");
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (!email) return;
    setResendCooldown(60);
    setError("");
    setMessage("Sending new OTP...");

    try {
      const res = await fetch("/api/auth/resend-signup-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      if (res.ok) setMessage("A new OTP has been sent to your email.");
      else {
        const data = await res.json();
        setError(data.error || "Failed to resend OTP");
      }
    } catch {
      setError("Failed to resend OTP");
    }
  };

  const handleCancel = async () => {
    if (!email) return;
    setLoading(true);
    setError("");
    setMessage("");

    try {
      const res = await fetch("/api/auth/cancel-signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      if (res.ok) router.push("/signup");
      else {
        const data = await res.json();
        setError(data.error || "Failed to cancel signup");
      }
    } catch {
      setError("Failed to cancel signup");
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  return (
    <div className="min-h-screen flex flex-col justify-center items-center bg-[#fdf8f3] p-4">
      <div className="w-full max-w-md bg-[#fffdfb] p-8 rounded-2xl shadow-lg border-2 border-[#c7a332] text-center">
        <h1 className="text-3xl font-bold mb-4 text-[#0b1a3d]">Verify Email</h1>
        <p className="mb-6 text-[#0b1a3d]">
          Enter the 6-digit OTP sent to <span className="font-semibold">{email}</span>
        </p>

        {error && <p className="bg-[#ffe5e5] text-red-700 p-3 rounded mb-4">{error}</p>}
        {message && <p className="bg-[#e6ffe5] text-green-700 p-3 rounded mb-4">{message}</p>}

        {/* OTP Inputs */}
        <div className="flex justify-between mb-6">
{otp.map((digit, idx) => (
            <input
              key={idx}
              ref={(el: HTMLInputElement | null) => { inputsRef.current[idx] = el }}
              type="text"
              inputMode="numeric"
              pattern="\d*"
              maxLength={1}
              value={digit}
              onChange={(e) => handleChange(e.target.value, idx)}
              onKeyDown={(e) => handleKeyDown(e, idx)}
              className="w-14 h-14 text-center text-xl border-2 border-[#d4b996] rounded-lg focus:border-[#c7a332] focus:outline-none box-border"
            />
          ))}
        </div>

        <p className="text-sm text-[#0b1a3d] mb-4">
          Time left: <span className="font-semibold">{formatTime(timeLeft)}</span>
        </p>

        <button
          onClick={handleVerify}
          disabled={loading || timeLeft <= 0}
          className="w-full px-4 py-2 bg-[#0b1a3d] text-[#c7a332] font-semibold rounded-lg hover:bg-[#0a162d] disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? "Verifying..." : "Verify & Create Account"}
        </button>

        {/* Resend & Cancel */}
        <div className="flex justify-between mt-4">
          <button
            onClick={handleResend}
            disabled={resendCooldown > 0}
            className="text-sm text-[#c7a332] hover:underline disabled:opacity-50"
          >
            {resendCooldown > 0 ? `Resend OTP in ${resendCooldown}s` : "Resend OTP"}
          </button>

          <button
            onClick={handleCancel}
            disabled={loading}
            className="text-sm bg-red-100 text-red-600 px-3 py-1 rounded-full hover:bg-red-200 transition"
          >
            Cancel Signup
          </button>
        </div>
      </div>
    </div>
  );
}