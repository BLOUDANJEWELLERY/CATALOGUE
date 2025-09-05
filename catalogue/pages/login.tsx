import { signIn } from "next-auth/react";
import { GetServerSideProps } from "next";
import { useState } from "react";
import { useRouter } from "next/router";
import Link from "next/link";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage(null);

    const res = await signIn("credentials", {
      redirect: false,
      email,
      password,
    });

    setLoading(false);

    if (res?.error) {
      setErrorMessage(res.error);
    } else {
      router.push("/dashboard"); // redirect after successful login
    }
  };

  return (
    <div className="min-h-screen flex justify-center items-center bg-[#fdf8f3] p-4">
      <div className="w-full max-w-md bg-[#fffdfb] p-8 rounded-2xl shadow-lg">
        <h1 className="text-2xl md:text-3xl font-bold mb-6 text-center">Login</h1>

        {errorMessage && (
          <p className="bg-[#ffe5e5] text-red-700 p-3 rounded mb-4 text-center">{errorMessage}</p>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <input
            type="email"
            placeholder="Email Address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="input"
          />

          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="input pr-12"
            />
            <button
              type="button"
              onClick={() => setShowPassword((prev) => !prev)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-[#3e2f25] hover:text-[#5a4436] transition"
            >
              {showPassword ? "Hide" : "Show"}
            </button>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 bg-[#3e2f25] text-[#fdf8f3] rounded-lg hover:bg-[#5a4436] transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Logging In..." : "Login"}
          </button>
        </form>

        <p className="text-center text-sm mt-4">
          Don’t have an account?{" "}
          <Link href="/signup" className="text-[#3e2f25] font-semibold underline">
            Signup
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
