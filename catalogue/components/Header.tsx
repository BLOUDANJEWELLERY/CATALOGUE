// components/Header.tsx
"use client";

import { useState, useEffect } from "react";
import { getSession, signOut } from "next-auth/react";
import Link from "next/link";

export default function Header() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [userName, setUserName] = useState<string>("Loading...");
  const [role, setRole] = useState<"user" | "admin" | "blocked">("user");

  useEffect(() => {
    getSession().then((session) => {
      if (session?.user) {
        const fullName = `${session.user.firstName || ""} ${session.user.lastName || ""}`.trim();
        setUserName(fullName || session.user.email || "Unknown");
        setRole((session.user.role as "user" | "admin" | "blocked") || "user");
      }
    });
  }, []);

  const toggleMenu = () => setMenuOpen((prev) => !prev);

  const handleLogout = () => {
    signOut({ callbackUrl: "/" });
  };

  return (
    <header
      style={{
        background: "linear-gradient(90deg, #3b2f2f, #c9a34e)",
        color: "#fff",
        padding: "15px 20px",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        position: "relative",
        boxShadow: "0 2px 6px rgba(0,0,0,0.3)",
      }}
    >
      {/* Left: Greeting */}
      <div style={{ fontWeight: "600", fontSize: "18px", letterSpacing: "0.5px" }}>
        Hi, {userName}
      </div>

      {/* Right: Hamburger */}
      <button
        onClick={toggleMenu}
        style={{
          background: "transparent",
          border: "none",
          cursor: "pointer",
          fontSize: "28px",
          color: "#fff",
          transition: "transform 0.2s ease, color 0.2s ease",
        }}
        onMouseEnter={(e) => (e.currentTarget.style.color = "#ffd700")}
        onMouseLeave={(e) => (e.currentTarget.style.color = "#fff")}
      >
        ☰
      </button>

      {/* Top-down menu */}
      {menuOpen && (
        <div
          style={{
            position: "absolute",
            top: "100%",
            left: 0,
            width: "100%",
            background: "linear-gradient(180deg, #1a2b4c, #243b5c)",
            padding: "15px 0",
            textAlign: "center",
            boxShadow: "0px 6px 12px rgba(0,0,0,0.25)",
            zIndex: 999,
            animation: "slideDown 0.3s ease forwards",
          }}
        >
          {role === "admin" && (
            <>
              <Link href="/catalogue">
                <button style={menuButtonStyle}>📖 Catalogue</button>
              </Link>
              <Link href="/admin/users">
                <button style={menuButtonStyle}>👥 User Management</button>
              </Link>
            </>
          )}
          <button onClick={handleLogout} style={menuButtonStyle}>
            🚪 Logout
          </button>
        </div>
      )}

      {/* Dropdown Animation */}
      <style jsx>{`
        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </header>
  );
}

// Reusable menu button style
const menuButtonStyle: React.CSSProperties = {
  display: "block",
  width: "100%",
  padding: "14px 0",
  background: "transparent",
  border: "none",
  color: "#fff",
  fontSize: "16px",
  fontWeight: 500,
  letterSpacing: "0.5px",
  cursor: "pointer",
  transition: "all 0.2s ease",
  textTransform: "uppercase",
};

// Add hover effects dynamically
Object.assign(menuButtonStyle, {
  ":hover": {
    background: "rgba(255, 255, 255, 0.1)",
    color: "#ffd700",
  },
});