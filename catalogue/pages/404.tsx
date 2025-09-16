// pages/404.tsx
"use client";

import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";

export default function Luxurious404Page() {
  const router = useRouter();
  const [sparkles, setSparkles] = useState<number[]>([]);

  // Generate sparkles continuously
  useEffect(() => {
    const interval = setInterval(() => {
      setSparkles((prev) => [...prev, Math.random()]);
      if (sparkles.length > 50) setSparkles((prev) => prev.slice(10));
    }, 200);
    return () => clearInterval(interval);
  }, [sparkles]);

  return (
    <div className="min-h-screen relative flex flex-col justify-center items-center bg-[#fdf8f3] overflow-hidden">
      {/* Sparkles */}
      {sparkles.map((s, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 1, scale: 1, y: [0, -50], x: [0, 30] }}
          exit={{ opacity: 0 }}
          transition={{ duration: 2, repeat: Infinity, repeatType: "loop" }}
          className="absolute w-2 h-2 bg-gradient-to-r from-yellow-400 via-yellow-300 to-white rounded-full shadow-xl"
          style={{
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
          }}
        />
      ))}

      {/* Main Content */}
      <motion.div
        initial={{ opacity: 0, y: -50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1 }}
        className="text-center z-10"
      >
        <motion.h1
          animate={{ rotate: [0, 5, -5, 0] }}
          transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
          className="text-[8rem] font-extrabold text-[#0b1a3d] mb-4 select-none"
        >
          404
        </motion.h1>
        <motion.h2
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="text-3xl font-semibold text-[#0b1a3d] mb-6"
        >
          Page Not Found
        </motion.h2>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7 }}
          className="text-[#0b1a3d] mb-8 text-lg max-w-md mx-auto"
        >
          Oops! The page you are looking for doesn’t exist or has been moved.
        </motion.p>

        <motion.button
          whileHover={{ scale: 1.05, boxShadow: "0px 0px 20px rgba(199,163,50,0.7)" }}
          whileTap={{ scale: 0.95 }}
          onClick={() => router.push("/")}
          className="px-6 py-3 bg-[#c7a332] text-[#fffdfb] font-semibold rounded-lg hover:bg-[#b8972a] transition-shadow duration-300"
        >
          Go to Home
        </motion.button>
      </motion.div>

      {/* Decorative Golden Trails */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1 }}
        className="absolute w-full h-full top-0 left-0 pointer-events-none"
      >
        {[...Array(15)].map((_, i) => (
          <motion.div
            key={i}
            initial={{ x: Math.random() * window.innerWidth, y: window.innerHeight + 50 }}
            animate={{ y: -50, x: "+=20" }}
            transition={{
              duration: 10 + Math.random() * 5,
              repeat: Infinity,
              ease: "linear",
              delay: i * 0.5,
            }}
            className="absolute w-1 h-20 bg-gradient-to-b from-yellow-400 via-yellow-300 to-white opacity-70 rounded-full"
          />
        ))}
      </motion.div>
    </div>
  );
}