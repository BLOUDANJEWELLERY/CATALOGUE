// pages/admin/users.tsx
"use client";
import Header from "../../components/Header";
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
  role: string;
  createdAt: string;
};

export default function UserManagementPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
const [currentUserId, setCurrentUserId] = useState<string | null>(null);

useEffect(() => {
  getSession().then(session => {
    if (session?.user?.id) setCurrentUserId(session.user.id);
  });
}, []);

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
  const changeRole = async (id: string, role: string) => {
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

   if (loading) {
    return (
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
        <p>Loading users...</p>
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
    );
  }

  return (
 <>
<Header />
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
                background: u.role === "blocked" ? "#f2f2f2" : "#fff",
                borderRadius: "12px",
                padding: "20px",
                boxShadow: "0 4px 8px rgba(0,0,0,0.08)",
                border: "1px solid #d4af37", // golden
                opacity: u.role === "blocked" ? 0.6 : 1,
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
                <span
                  style={{
                    fontWeight: "bold",
                    color:
                      u.role === "admin"
                        ? "#3b3b58" // blue
                        : u.role === "blocked"
                        ? "#d9534f" // red
                        : "#7a5c3d", // brown
                  }}
                >
                  {u.role.charAt(0).toUpperCase() + u.role.slice(1)}
                </span>
              </p>
{u.id !== currentUserId && (
      
              <div
                style={{
                  marginTop: "12px",
                  display: "flex",
                  justifyContent: "space-between",
                  flexWrap: "wrap",
                  gap: "8px",
                }}
              >
                {u.role === "user" && (
                  <>
                    <button
                      onClick={() => changeRole(u.id, "admin")}
                      style={{
                        background: "#3b3b58",
                        color: "#fff",
                        padding: "6px 12px",
                        border: "none",
                        borderRadius: "6px",
                        cursor: "pointer",
                      }}
                    >
                      ⬆️ Promote
                    </button>
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
                  </>
                )}

                {u.role === "admin" && (
                  <>
                    <button
                      onClick={() => changeRole(u.id, "user")}
                      style={{
                        background: "#7a5c3d",
                        color: "#fff",
                        padding: "6px 12px",
                        border: "none",
                        borderRadius: "6px",
                        cursor: "pointer",
                      }}
                    >
                      ⬇️ Demote
                    </button>
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
                  </>
                )}

                {u.role === "blocked" && (
                  <button
                    onClick={() => changeRole(u.id, "user")}
                    style={{
                      background: "#5cb85c",
                      color: "#fff",
                      padding: "6px 12px",
                      border: "none",
                      borderRadius: "6px",
                      cursor: "pointer",
                    }}
                  >
                    🔓 Unblock
                  </button>
                )}

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
)}
            </div>
          ))}
        </div>
      </div>
    </>
  );
}