// pages/admin/users.tsx
"use client";
import Head from "next/head";
import { useEffect, useState } from "react";
import type { GetServerSideProps, GetServerSidePropsContext } from "next";
import { getSession } from "next-auth/react";

// Server-side admin check
export const getServerSideProps: GetServerSideProps = async (
  context: GetServerSidePropsContext
) => {
  const session = await getSession({ req: context.req });

  if (!session || session.user.role !== "admin") {
    return {
      redirect: { destination: "/", permanent: false },
    };
  }

  return { props: {} };
};

// User type matching API
type User = {
  id: string;
  email: string;
  name: string;
  role: "user" | "admin";
  createdAt: string;
};

export default function UserManagementPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Fetch users on mount
 useEffect(() => {
  fetch("/api/admin/users", { credentials: "include" })
    .then(res => {
      if (!res.ok) throw new Error("Failed to fetch users");
      return res.json();
    })
    .then((data: { success: boolean; users: User[] }) => {
      if (data.success) setUsers(data.users);
    })
    .catch(err => console.error("Error fetching users:", err))
    .finally(() => setLoading(false));
}, []);


  // Change user role
  const changeRole = async (id: string, role: "user" | "admin") => {
    try {
      const res = await fetch("/api/admin/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, role }),
        credentials: "include",
      });
      const data = await res.json();
      if (!data.success) return alert("Role change failed");

      setUsers(prev => prev.map(u => (u.id === id ? data.user : u)));
    } catch (err) {
      console.error(err);
      alert("Role change failed");
    }
  };

  // Delete user
  const deleteUser = async (id: string) => {
    if (!confirm("Are you sure you want to delete this user?")) return;

    try {
      const res = await fetch("/api/admin/users", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
        credentials: "include",
      });
      const data = await res.json();
      if (!data.success) return alert("Delete failed");

      setUsers(prev => prev.filter(u => u.id !== id));
    } catch (err) {
      console.error(err);
      alert("Delete failed");
    }
  };

  if (loading) return <p>Loading users...</p>;

  return (
   <>
      <Head>
        <title>User Management | Admin</title>
        <meta name="description" content="Manage users, roles, and access." />
      </Head>

      <div style={{ padding: "30px", background: "#fdfaf5", minHeight: "100vh" }}>
        <h1
          style={{
            textAlign: "center",
            marginBottom: "30px",
            fontSize: "2rem",
            color: "#3b3b58", // deep blue
            fontWeight: "bold",
          }}
        >
          User Management
        </h1>

        {users.length === 0 && (
          <p style={{ textAlign: "center", color: "#7a5c3d" }}>No users found.</p>
        )}

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
            gap: "20px",
          }}
        >
          {users.map((u) => (
            <div
              key={u.id}
              style={{
                background: "#fff",
                borderRadius: "12px",
                padding: "20px",
                boxShadow: "0 4px 8px rgba(0,0,0,0.08)",
                border: "1px solid #d4af37", // golden
              }}
            >
              <h2 style={{ margin: "0 0 10px 0", fontSize: "1.2rem", color: "#3b3b58" }}>
                {u.name || "—"}
              </h2>
              <p style={{ margin: "4px 0", color: "#7a5c3d" }}>
                <strong>Email:</strong> {u.email}
              </p>
              <p style={{ margin: "4px 0", color: "#7a5c3d" }}>
                <strong>Joined:</strong> {new Date(u.createdAt).toLocaleDateString()}
              </p>
              <p style={{ margin: "4px 0", color: "#7a5c3d" }}>
                <strong>Role:</strong>{" "}
                <select
                  value={u.role}
                  onChange={(e) => changeRole(u.id, e.target.value)}
                  style={{
                    padding: "4px 6px",
                    borderRadius: "6px",
                    border: "1px solid #d4af37",
                    background: "#fff9f2",
                    color: "#3b3b58",
                  }}
                >
                  <option value="user">User</option>
                  <option value="admin">Admin</option>
                  <option value="blocked">Blocked</option>
                </select>
              </p>

              <div
                style={{
                  marginTop: "12px",
                  display: "flex",
                  justifyContent: "space-between",
                }}
              >
                <button
                  onClick={() => changeRole(u.id, "blocked")}
                  style={{
                    background: "#3b3b58",
                    color: "#fff",
                    padding: "6px 12px",
                    border: "none",
                    borderRadius: "6px",
                    cursor: "pointer",
                  }}
                >
                  🚫 Block
                </button>
                <button
                  onClick={() => deleteUser(u.id)}
                  style={{
                    background: "#d9534f",
                    color: "#fff",
                    padding: "6px 12px",
                    border: "none",
                    borderRadius: "6px",
                    cursor: "pointer",
                  }}
                >
                  ❌ Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}