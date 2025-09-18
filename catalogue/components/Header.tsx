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

  const handleToggleMenu = () => setMenuOpen((prev) => !prev);
  const handleLogout = () => signOut({ callbackUrl: "/" });
  const closeMenu = () => setMenuOpen(false);

  return (
    <header className="relative bg-gradient-to-r from-[#0b1a3d] to-[#c7a332] text-white flex justify-between items-center px-5 py-4 shadow-md z-50">
      {/* Greeting */}
      <div className="font-bold text-lg z-50">Hi, {userName || "Loading..."}</div>

      {/* Hamburger */}
<button
  onClick={handleToggleMenu}
  className="relative w-7 h-7 flex flex-col justify-center items-center focus:outline-none z-50"
>
  {/* Top bar */}
  <span
    className={`absolute h-0.5 w-6 bg-white rounded transition-all duration-300 ease-in-out ${
      menuOpen ? "rotate-45" : "-translate-y-2"
    }`}
  />
  {/* Middle bar */}
  <span
    className={`absolute h-0.5 w-6 bg-white rounded transition-all duration-300 ease-in-out ${
      menuOpen ? "opacity-0" : ""
    }`}
  />
  {/* Bottom bar */}
  <span
    className={`absolute h-0.5 w-6 bg-white rounded transition-all duration-300 ease-in-out ${
      menuOpen ? "-rotate-45" : "translate-y-2"
    }`}
  />
</button>

      {/* Overlay */}
      {menuOpen && (
        <div
          className="fixed inset-0 bg-black/20 backdrop-blur-sm z-30"
          onClick={closeMenu}
        />
      )}

      {/* Dropdown */}
      {menuOpen && (
        <div className="absolute left-0 top-full w-full bg-[#fdf8f3]/95 backdrop-blur-md rounded-b-xl py-4 text-center shadow-lg z-40">
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