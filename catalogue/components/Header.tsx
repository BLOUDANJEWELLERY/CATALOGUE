// components/Header.tsx
"use client";
import { useState, useEffect, useRef } from "react";
import { getSession, signOut } from "next-auth/react";
import Link from "next/link";

export default function Header() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [userName, setUserName] = useState<string | null>(null);
  const [role, setRole] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

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

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };

    if (menuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    } else {
      document.removeEventListener("mousedown", handleClickOutside);
    }

    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [menuOpen]);

  return (
    <header
      style={{
        background: "linear-gradient(90deg, #0b1a3d, #c7a332)",
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

      {/* Dropdown + overlay */}
      {menuOpen && (
        <>
          {/* Overlay */}
          <div
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              width: "100vw",
              height: "100vh",
              background: "rgba(0,0,0,0.3)",
              zIndex: 900,
            }}
          />

          {/* Dropdown */}
          <div
            ref={menuRef}
            style={{
              position: "absolute",
              top: "100%",
              left: 0,
              width: "100%",
              background: "#fdf8f3",
              padding: "20px 0",
              textAlign: "center",
              boxShadow: "0px 6px 12px rgba(0,0,0,0.25)",
              borderBottomLeftRadius: "12px",
              borderBottomRightRadius: "12px",
              animation: "slideDown 0.3s ease forwards",
              zIndex: 950,
            }}
          >
            {role === "admin" && (
              <>
                <Link href="/">
                  <button style={{ ...menuButtonStyle, border: "1px solid #c7a332" }}>
                    📖 Catalogue
                  </button>
                </Link>
                <Link href="/admin/users">
                  <button style={{ ...menuButtonStyle, border: "1px solid #c7a332" }}>
                    👥 User Management
                  </button>
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
                border: "none",
              }}
            >
              🚪 Logout
            </button>
          </div>
        </>
      )}
    </header>
  );
}

// Reusable menu button style
const menuButtonStyle: React.CSSProperties = {
  display: "block",
  width: "85%",
  margin: "10px auto",
  padding: "12px 0",
  background: "#fff",
  border: "1px solid #ddd",
  borderRadius: "8px",
  color: "#0b1a3d",
  fontSize: "16px",
  cursor: "pointer",
  boxShadow: "0 3px 6px rgba(0,0,0,0.1)",
  transition: "all 0.2s ease",
  fontWeight: "500",
};