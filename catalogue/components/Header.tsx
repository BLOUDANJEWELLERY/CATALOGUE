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

  const handleToggleMenu = (e: React.MouseEvent) => {
    e.stopPropagation(); // prevent outside click from immediately closing
    setMenuOpen((prev) => !prev);
  };

  const handleLogout = () => signOut({ callbackUrl: "/" });

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <header className="relative bg-gradient-to-r from-[#0b1a3d] to-[#c7a332] text-white flex justify-between items-center px-5 py-4 shadow-md z-50">
      <div className="font-bold text-lg">Hi, {userName || "Loading..."}</div>

      {/* Hamburger */}
      <button
        onClick={handleToggleMenu}
        className="relative w-8 h-8 flex flex-col justify-between items-center focus:outline-none z-50"
      >
        <span
          className={`block h-1 w-full bg-white rounded transition-transform duration-300 ${
            menuOpen ? "rotate-45 translate-y-3" : ""
          }`}
        />
        <span
          className={`block h-1 w-full bg-white rounded transition-opacity duration-300 ${
            menuOpen ? "opacity-0" : "opacity-100"
          }`}
        />
        <span
          className={`block h-1 w-full bg-white rounded transition-transform duration-300 ${
            menuOpen ? "-rotate-45 -translate-y-3" : ""
          }`}
        />
      </button>

      {/* Dropdown */}
      {menuOpen && (
        <div
          ref={menuRef}
          className="absolute left-0 top-full w-full bg-[#fdf8f3]/95 backdrop-blur-md rounded-b-xl py-4 text-center shadow-lg z-40"
        >
          {role === "admin" && (
            <>
              <Link href="/catalogue">
                <button className="block w-4/5 mx-auto my-2 py-2 rounded-lg bg-[#0b1a3d] text-[#fdf8f3] font-medium hover:bg-[#1a2b4c] transition">
                  📖 Catalogue
                </button>
              </Link>
              <Link href="/admin/users">
                <button className="block w-4/5 mx-auto my-2 py-2 rounded-lg bg-[#0b1a3d] text-[#fdf8f3] font-medium hover:bg-[#1a2b4c] transition">
                  👥 User Management
                </button>
              </Link>
            </>
          )}
          <button
            onClick={handleLogout}
            className="block w-4/5 mx-auto my-2 py-2 rounded-lg bg-gradient-to-r from-red-500 to-red-700 text-white font-medium hover:brightness-110 transition"
          >
            🚪 Logout
          </button>
        </div>
      )}
    </header>
  );
}