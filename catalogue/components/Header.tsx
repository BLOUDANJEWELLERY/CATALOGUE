// components/Header.tsx
"use client";
import { useState, useEffect } from "react";
import { getSession, signOut } from "next-auth/react";
import Link from "next/link";

export default function Header() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [userName, setUserName] = useState<string | null>(null);
  const [role, setRole] = useState<string | null>(null);

  useEffect(() => {
    getSession().then((session) => {
      if (session?.user) {
        setUserName(`${session.user.firstName} ${session.user.lastName}`.trim());
        setRole(session.user.role || "user");
      }
    });
  }, []);

  const toggleMenu = () => setMenuOpen((prev) => !prev);
  const handleLogout = () => signOut({ callbackUrl: "/" });

  return (
    <header
      style={{
        background: "linear-gradient(90deg, #2d2d2d, #c9a34e)",
        color: "#fff",
        padding: "15px 20px",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        position: "relative",
        boxShadow: "0 2px 8px rgba(0,0,0,0.25)",
        zIndex: 1000,
      }}
    >
      {/* Left: Greeting */}
      <div style={{ fontWeight: "600", fontSize: "18px", letterSpacing: "0.5px" }}>
        Hi, {userName || "Loading..."}
      </div>

      {/* Right: Hamburger */}
      <button
        onClick={toggleMenu}
        style={{
          background: "transparent",
          border: "none",
          cursor: "pointer",
          fontSize: "26px",
          color: "#fff",
          transition: "transform 0.2s ease",
        }}
        onMouseEnter={(e) => (e.currentTarget.style.transform = "scale(1.1)")}
        onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1.0)")}
      >
        ☰
      </button>

      {/* Top-down menu */}
      <div
        style={{
          position: "absolute",
          top: menuOpen ? "100%" : "-400px",
          left: 0,
          width: "100%",
          background: "#1a1a1a",
          padding: "20px 0",
          textAlign: "center",
          boxShadow: "0px 6px 12px rgba(0,0,0,0.4)",
          borderBottomLeftRadius: "12px",
          borderBottomRightRadius: "12px",
          transition: "top 0.3s ease-in-out",
        }}
      >
        {role === "admin" && (
          <>
            <Link href="/catalogue">
              <button style={{ ...menuButtonStyle }}>📖 Catalogue</button>
            </Link>
            <Link href="/admin/users">
              <button style={{ ...menuButtonStyle }}>👥 User Management</button>
            </Link>
          </>
        )}
        <button
          onClick={handleLogout}
          style={{
            ...menuButtonStyle,
            background: "linear-gradient(90deg, #d9534f, #c9302c)",
            color: "#fff",
            fontWeight: "600",
          }}
        >
          🚪 Logout
        </button>
      </div>
    </header>
  );
}

// Reusable menu button style
const menuButtonStyle: React.CSSProperties = {
  display: "block",
  width: "85%",
  margin: "10px auto",
  padding: "12px 0",
  background: "linear-gradient(90deg, #444, #666)",
  border: "none",
  borderRadius: "8px",
  color: "#f5f5f5",
  fontSize: "16px",
  cursor: "pointer",
  boxShadow: "0 3px 6px rgba(0,0,0,0.3)",
  transition: "all 0.2s ease",
  fontWeight: "500",
};