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
        <title>User Management | Admin Dashboard</title>
        <meta name="description" content="Manage users, roles, and access in the admin dashboard." />
      </Head>

      <div
        style={{
          padding: "30px",
          background: "#f9f6f1", // soft warm background
          minHeight: "100vh",
        }}
      >
        <h1
          style={{
            fontSize: "2rem",
            fontWeight: "bold",
            marginBottom: "20px",
            color: "#2a4365", // deep blue
          }}
        >
          User Management
        </h1>

        {users.length === 0 ? (
          <p
            style={{
              textAlign: "center",
              color: "#6b4f2d", // brown
              fontSize: "1.1rem",
              padding: "40px",
              background: "#fff8e7",
              borderRadius: "12px",
              boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
            }}
          >
            No users found.
          </p>
        ) : (
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
                  background: "#ffffff",
                  border: "1px solid #d4af37", // golden border
                  borderRadius: "16px",
                  padding: "20px",
                  boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
                  display: "flex",
                  flexDirection: "column",
                  gap: "12px",
                }}
              >
                <div>
                  <h2 style={{ fontSize: "1.1rem", fontWeight: "600", color: "#2a4365" }}>
                    {u.name || "—"}
                  </h2>
                  <p style={{ color: "#6b4f2d", fontSize: "0.9rem" }}>{u.email}</p>
                </div>

                <div>
                  <label style={{ fontSize: "0.85rem", color: "#444" }}>Role</label>
                  <select
                    value={u.role}
                    onChange={(e) => changeRole(u.id, e.target.value as "user" | "admin")}
                    style={{
                      marginTop: "4px",
                      padding: "6px 10px",
                      borderRadius: "8px",
                      border: "1px solid #d4af37",
                      background: "#fdfaf5",
                      color: "#2a4365",
                      fontWeight: "500",
                      cursor: "pointer",
                    }}
                  >
                    <option value="user">User</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>

                <p style={{ fontSize: "0.85rem", color: "#666" }}>
                  Joined:{" "}
                  <span style={{ color: "#6b4f2d", fontWeight: "500" }}>
                    {new Date(u.createdAt).toLocaleDateString()}
                  </span>
                </p>

                <button
                  onClick={() => deleteUser(u.id)}
                  style={{
                    marginTop: "10px",
                    padding: "8px 12px",
                    borderRadius: "8px",
                    border: "none",
                    background: "#e53e3e",
                    color: "white",
                    fontWeight: "600",
                    cursor: "pointer",
                    alignSelf: "flex-start",
                  }}
                >
                  ❌ Delete
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}