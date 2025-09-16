// pages/404.tsx
"use client";

import { useRouter } from "next/navigation";

export default function NotFoundPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen flex flex-col justify-center items-center bg-[#fdf8f3] p-4">
      <div className="w-full max-w-md bg-[#fffdfb] p-8 rounded-2xl shadow-lg border-2 border-[#c7a332] text-center">
        <h1 className="text-5xl font-bold text-[#0b1a3d] mb-4">404</h1>
        <p className="text-[#0b1a3d] mb-6">
          Oops! The page you are looking for does not exist.
        </p>
        <button
          onClick={() => router.push("/")}
          className="px-6 py-2 bg-[#c7a332] text-[#fffdfb] rounded-lg hover:bg-[#b8972a]"
        >
          Go to Home
        </button>
      </div>
    </div>
  );
}