// pages/profile.tsx
"use client";
import { useEffect, useState } from "react";
import { getSession, signOut } from "next-auth/react";
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
  const [deleting, setDeleting] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

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

      if (res.ok) setMessage("✅ Profile updated successfully!");
      else setMessage("❌ Failed to update profile.");
    } catch (err) {
      console.error("Error updating profile:", err);
      setMessage("❌ An error occurred while saving.");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      const res = await fetch("/api/user/profile", { method: "DELETE" });
      if (res.ok) {
        alert("Account deleted successfully!");
        await signOut({ callbackUrl: "/" });
      } else {
        setMessage("❌ Failed to delete account.");
      }
    } catch (err) {
      console.error("Error deleting account:", err);
      setMessage("❌ An error occurred while deleting your account.");
    } finally {
      setDeleting(false);
      setShowDeleteModal(false);
    }
  };

  if (!user) {
    return (
      <>
        <Header />
        <div className="flex flex-col items-center justify-center h-screen bg-[#fdfaf5] text-[#3b3b58] font-bold text-xl">
          <p>Loading profile...</p>
          <div className="mt-5 w-16 h-16 border-6 border-[#d4af37] border-t-[#3b3b58] rounded-full animate-spin" />
        </div>
      </>
    );
  }

  return (
    <>
      <Header />
      <div className="max-w-md mx-auto bg-[#fdfaf5] shadow-lg rounded-lg p-6">
        <h1 className="text-2xl mt-6 font-bold mb-10 text-center">My Profile</h1>

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

          {/* Email */}
          <div>
            <label className="block text-sm font-medium mb-1">Email</label>
            <input
              type="email"
              value={user.email}
              disabled
              className="w-full px-3 py-2 border rounded-lg bg-gray-100 text-gray-500 cursor-not-allowed"
            />
          </div>

          {/* Role */}
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
            className="w-full py-2 rounded-lg bg-gradient-to-r from-[#0b1a3d] to-[#c7a332] text-white font-semibold hover:brightness-110 transition"
          >
            {loading ? "Saving..." : "Save Changes"}
          </button>
        </form>

        {/* Delete Account */}
        <button
          onClick={() => setShowDeleteModal(true)}
          disabled={deleting}
          className="w-full mt-4 py-2 rounded-lg bg-gradient-to-r from-red-600 to-red-800 text-white font-semibold hover:brightness-110 transition"
        >
          {deleting ? "Deleting..." : "Delete Account"}
        </button>

        {message && <p className="mt-4 text-center">{message}</p>}
      </div>

      {/* Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-[9999]">
          <div className="bg-[#fdfaf5] rounded-lg shadow-lg p-6 max-w-sm w-full text-center space-y-4">
            <p className="text-[#0b1a3d] font-bold text-lg">
              Are you sure you want to delete your account?
            </p>
            <p className="text-red-600 font-medium">This action is irreversible!</p>
            <div className="flex gap-4 justify-center">
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="px-4 py-2 rounded-lg bg-red-600 text-white font-semibold hover:brightness-110 transition"
              >
                {deleting ? "Deleting..." : "Yes, Delete"}
              </button>
              <button
                onClick={() => setShowDeleteModal(false)}
                className="px-4 py-2 rounded-lg bg-gray-300 text-gray-700 font-semibold hover:brightness-95 transition"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}