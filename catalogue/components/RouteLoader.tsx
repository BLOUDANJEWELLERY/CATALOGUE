// components/RouteLoader.tsx
"use client";

import { useRouter } from "next/router";
import { useState, useEffect } from "react";

export default function RouteLoader() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const handleStart = () => setLoading(true);
    const handleComplete = () => setLoading(false);

    router.events.on("routeChangeStart", handleStart);
    router.events.on("routeChangeComplete", handleComplete);
    router.events.on("routeChangeError", handleComplete);

    return () => {
      router.events.off("routeChangeStart", handleStart);
      router.events.off("routeChangeComplete", handleComplete);
      router.events.off("routeChangeError", handleComplete);
    };
  }, [router]);

  if (!loading) return null;

  return (
    <div className="fixed inset-0 backdrop-blur-sm bg-[#fdf8f3]/40 z-[9999] flex items-center justify-center">
      <div className="w-12 h-12 border-4 border-[#c7a332] border-t-[#0b1a3d] rounded-full animate-spin"></div>
    </div>
  );
}