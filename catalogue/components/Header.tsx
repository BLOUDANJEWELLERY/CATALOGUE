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

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    if (menuOpen) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [menuOpen]);

  return (
    <header className="relative bg-gradient-to-r from-[#0b1a3d] to-[#c7a332] text-white flex justify-between items-center px-5 py-4 shadow-md z-50">
      {/* Greeting */}
      <div className="font-bold text-lg">Hi, {userName || "Loading..."}</div>

      {/* Hamburger */}
      <button
        onClick={toggleMenu}
        className="relative w-8 h-8 flex flex-col justify-between items-center focus:outline-none z-50"
      >
        {/* Top bar */}
        <span
          className={`block h-1 w-full bg-white rounded transition-transform duration-300 ease-in-out ${
            menuOpen ? "rotate-45 translate-y-3" : ""
          }`}
        />
        {/* Middle bar */}
        <span
          className={`block h-1 w-full bg-white rounded transition-opacity duration-300 ease-in-out ${
            menuOpen ? "opacity-0" : "opacity-100"
          }`}
        />
        {/* Bottom bar */}
        <span
          className={`block h-1 w-full bg-white rounded transition-transform duration-300 ease-in-out ${
            menuOpen ? "-rotate-45 -translate-y-3" : ""
          }`}
        />
      </button>

      {/* Dropdown */}
      <div
        ref={menuRef}
        className={`absolute left-0 w-full bg-[#fdf8f3]/95 backdrop-blur-md rounded-b-xl py-4 text-center shadow-lg transition-transform duration-300 ease-in-out z-40 ${
          menuOpen ? "translate-y-0 opacity-100" : "-translate-y-10 opacity-0 pointer-events-none"
        }`}
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
    </header>
  );
}