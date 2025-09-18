// pages/profile.tsx
import { GetServerSideProps } from "next";
import { getServerSession } from "next-auth/next";
import { authOptions } from "./api/auth/[...nextauth]";
import { prisma } from "../lib/prisma";
import { useState } from "react";
import { useSession } from "next-auth/react";
import Header from "../components/Header";

interface UserProfile {
  id: string;
  email: string;
  role: string;
  firstName?: string;
  lastName?: string;
}

interface ProfilePageProps {
  user: UserProfile;
}

export default function ProfilePage({ user: initialUser }: ProfilePageProps) {
  const { update: updateSession } = useSession(); // reactive session updater
  const [user, setUser] = useState<UserProfile>(initialUser);
  const [firstName, setFirstName] = useState(user.firstName ?? "");
  const [lastName, setLastName] = useState(user.lastName ?? "");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

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
        const updatedUser: UserProfile = await res.json();

        // Update local state
        setUser(updatedUser);
        setFirstName(updatedUser.firstName ?? "");
        setLastName(updatedUser.lastName ?? "");

        // 🔄 Refresh NextAuth session to update Header
        await updateSession();

        setMessage("✅ Profile updated successfully!");
      } else {
        setMessage("❌ Failed to update profile.");
      }
    } catch (err) {
      console.error(err);
      setMessage("❌ An error occurred while saving.");
    } finally {
      setLoading(false);
    }
  };

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

// Fetch user server-side and enforce login
export const getServerSideProps: GetServerSideProps = async (ctx) => {
  const session = await getServerSession(ctx.req, ctx.res, authOptions);

  if (!session?.user?.email) {
    return {
      redirect: { destination: "/login", permanent: false },
    };
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { id: true, email: true, role: true, firstName: true, lastName: true },
  });

  if (!user) {
    return {
      redirect: { destination: "/login", permanent: false },
    };
  }

  return {
    props: {
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        firstName: user.firstName ?? undefined,
        lastName: user.lastName ?? undefined,
      },
    },
  };
};