import { useState } from "react";
import { useRouter } from "next/router";
import Link from "next/link";

type SignupResponse = {
  message?: string;
  userId?: string;
  error?: string;
};

export default function SignupPage() {
  const router = useRouter();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const validateEmail = (email: string) =>
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.toLowerCase());

  const handleSubmit = async () => {
    setError("");

    if (!firstName.trim()) return setError("First name is required");
    if (!email.trim()) return setError("Email is required");
    if (!validateEmail(email)) return setError("Enter a valid email address");
    if (!password || !confirmPassword) return setError("Both password fields are required");
    if (password !== confirmPassword) return setError("Passwords do not match");

    setLoading(true);
    try {
      const res = await fetch("/api/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ firstName, lastName, email, password }),
      });

      const data: SignupResponse = await res.json();

      if (!res.ok) {
        setError(data.error || "Signup failed, try again");
        return;
      }

      router.push("/login");
    } catch (err) {
      console.error("Signup error:", err);
      setError("Signup failed, try again");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex justify-center items-center bg-[#fdf8f3] p-4">
      <div className="w-full max-w-md bg-[#fffdfb] p-8 rounded-2xl shadow-lg">
        <h1 className="text-2xl md:text-3xl font-bold mb-6 text-center">Sign Up</h1>

        {error && (
          <p className="bg-[#ffe5e5] text-red-700 p-3 rounded mb-4 text-center">{error}</p>
        )}

        <div className="flex flex-col gap-4">
          <input
            type="text"
            placeholder="First Name *"
            value={firstName}
            onChange={e => setFirstName(e.target.value)}
            className="input"
          />
          <input
            type="text"
            placeholder="Last Name"
            value={lastName}
            onChange={e => setLastName(e.target.value)}
            className="input"
          />
          <input
            type="email"
            placeholder="Email Address *"
            value={email}
            onChange={e => setEmail(e.target.value)}
            className="input"
          />
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Password *"
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="input pr-12"
            />
            <button
              type="button"
              className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-[#3e2f25] hover:text-[#5a4436] transition"
              onClick={() => setShowPassword(prev => !prev)}
            >
              {showPassword ? "Hide" : "Show"}
            </button>
          </div>
          <div className="relative">
            <input
              type={showConfirmPassword ? "text" : "password"}
              placeholder="Confirm Password *"
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
              className="input pr-12"
            />
            <button
              type="button"
              className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-[#3e2f25] hover:text-[#5a4436] transition"
              onClick={() => setShowConfirmPassword(prev => !prev)}
            >
              {showConfirmPassword ? "Hide" : "Show"}
            </button>
          </div>
        </div>

        <button
          onClick={handleSubmit}
          disabled={loading}
          className="mt-6 w-full px-4 py-2 bg-[#3e2f25] text-[#fdf8f3] rounded-lg hover:bg-[#5a4436] transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? "Signing Up..." : "Sign Up"}
        </button>

        <p className="text-center text-sm mt-4">
          Already have an account?{" "}
          <Link href="/login" className="text-[#3e2f25] font-semibold underline">
            Login
          </Link>
        </p>
      </div>

      <style jsx>{`
        .input {
          padding: 0.75rem;
          border-radius: 0.75rem;
          border: 1px solid #ccc;
          width: 100%;
          background-color: #fff;
          color: #000;
        }
      `}</style>
    </div>
  );
}
