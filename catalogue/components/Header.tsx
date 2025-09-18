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
      }}
    >
      {/* Left: Greeting */}
      <div style={{ fontWeight: "bold", fontSize: "18px" }}>
        Hi, {userName || "Loading..."}
      </div>

      {/* Right: Hamburger */}
      <button
        onClick={toggleMenu}
        style={{
          background: "transparent",
          border: "none",
          cursor: "pointer",
          fontSize: "24px",
          color: "#fff",
        }}
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
            background: "#1a2b4c",
            padding: "15px 0",
            textAlign: "center",
            boxShadow: "0px 4px 8px rgba(0,0,0,0.2)",
            zIndex: 999,
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
    </header>
  );
}

// Reusable menu button style
const menuButtonStyle: React.CSSProperties = {
  display: "block",
  width: "100%",
  padding: "12px 0",
  background: "transparent",
  border: "none",
  color: "#fff",
  fontSize: "16px",
  cursor: "pointer",
};