When changes are saved i want the session to update and fetch latest first and last names as the name needs to be placed on my header:

// pages/profile.tsx
"use client";
import { useEffect, useState } from "react";
import { getSession } from "next-auth/react";
import Header from "../components/Header";

interface UserProfile {
  id: string;
  email: string;
  role: string;
  firstName?: string;
  lastName?: string;
}

export default function ProfilePage() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const fetchProfile = async () => {
      const session = await getSession();
      if (session?.user) {
        try {
          const res = await fetch("/api/user/profile");
          if (!res.ok) throw new Error("Failed to fetch profile");
          const data: UserProfile = await res.json();
          setUser(data);
          setFirstName(data.firstName ?? "");
          setLastName(data.lastName ?? "");
        } catch (err) {
          console.error("Error fetching profile:", err);
        }
      }
    };
    fetchProfile();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      const res = await fetch("/api/user/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ firstName, lastName }),
      });

      if (res.ok) {
        setMessage("✅ Profile updated successfully!");
      } else {
        setMessage("❌ Failed to update profile.");
      }
    } catch (err) {
      console.error("Error updating profile:", err);
      setMessage("❌ An error occurred while saving.");
    } finally {
      setLoading(false);
    }
  };

   if (!user) {
    return (
<>
<Header />
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100vh",
          background: "#fdfaf5", // page background
          flexDirection: "column",
          color: "#3b3b58", // deep blue
          fontSize: "1.5rem",
          fontWeight: "bold",
        }}
      >
        <p>Loading profile...</p>
        <div
          style={{
            marginTop: "20px",
            width: "60px",
            height: "60px",
            border: "6px solid #d4af37", // golden border
            borderTop: "6px solid #3b3b58", // blue spinner segment
            borderRadius: "50%",
            animation: "spin 1s linear infinite",
          }}
        />
        <style>
          {`
            @keyframes spin {
              0% { transform: rotate(0deg); }
              100% { transform: rotate(360deg); }
            }
          `}
        </style>
      </div>
</>
    );
  }
  return (
<>
<Header />
    <div className="max-w-md mx-auto bg-[#fdfaf5] shadow-lg rounded-lg p-6">
      <h1 className="text-2xl mt-10 font-bold mb-6 text-center">My Profile</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* First Name */}
        <div>
          <label className="block text-sm font-medium mb-1">First Name</label>
          <input
            type="text"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring focus:ring-blue-300"
          />
        </div>

        {/* Last Name */}
        <div>
          <label className="block text-sm font-medium mb-1">Last Name</label>
          <input
            type="text"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring focus:ring-blue-300"
          />
        </div>

        {/* Email (read-only) */}
        <div>
          <label className="block text-sm font-medium mb-1">Email</label>
          <input
            type="email"
            value={user.email}
            disabled
            className="w-full px-3 py-2 border rounded-lg bg-gray-100 text-gray-500 cursor-not-allowed"
          />
        </div>

    {/* Role (read-only) */}
<div>
  <label className="block text-sm font-medium mb-1">Role</label>
  <input
    type="text"
    value={user.role.toUpperCase()}
    disabled
    className="w-full px-3 py-2 border rounded-lg bg-gray-100 text-gray-500 cursor-not-allowed uppercase"
  />
</div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-2 rounded-lg bg-gradient-to-r from-[#0b1a3d] to-[#c7a332] text-white font-medium hover:brightness-110 transition"
        >
          {loading ? "Saving..." : "Save Changes"}
        </button>
      </form>

      {message && <p className="mt-4 text-center">{message}</p>}
    </div>
</>
  );
}