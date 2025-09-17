// pages/admin/users.tsx
"use client";

import { useEffect, useState } from "react";
import type { GetServerSideProps, GetServerSidePropsContext } from "next";
import { getSession } from "next-auth/react";

// ✅ Server-side admin check
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

// ✅ User type matches Prisma schema
type User = {
  id: string;
  email: string;
  name: string;
  role: "user" | "admin";
  createdAt: string;
};

export default function UserManagementPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);

  // Fetch users on mount
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const res = await fetch("/api/admin/users");
        if (!res.ok) throw new Error("Failed to fetch users");
        const data = await res.json();
        // Expecting data.users array
        setUsers(data.users || []);
      } catch (err) {
        console.error("Error fetching users:", err);
        alert("Failed to load users");
      } finally {
        setLoading(false);
      }
    };
    fetchUsers();
  }, []);

  // ✅ Change user role
  const changeRole = async (id: string, role: "user" | "admin") => {
    setUpdating(id);
    try {
      const res = await fetch("/api/admin/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, role }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || "Failed to update role");
      setUsers(prev => prev.map(u => (u.id === id ? data.user! : u)));
    } catch (err) {
      console.error("Role change error:", err);
      alert("Role change failed");
    } finally {
      setUpdating(null);
    }
  };

  // ✅ Delete user
  const deleteUser = async (id: string) => {
    if (!confirm("Are you sure you want to delete this user?")) return;
    setUpdating(id);
    try {
      const res = await fetch("/api/admin/users", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || "Delete failed");
      setUsers(prev => prev.filter(u => u.id !== id));
    } catch (err) {
      console.error("Delete error:", err);
      alert("Delete failed");
    } finally {
      setUpdating(null);
    }
  };

  if (loading) return <p>Loading users...</p>;

  return (
    <div style={{ padding: "20px" }}>
      <h1>User Management</h1>
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr>
            <th>Email</th>
            <th>Name</th>
            <th>Role</th>
            <th>Joined</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {users.length === 0 && (
            <tr>
              <td colSpan={5} style={{ textAlign: "center", padding: "20px" }}>
                No users found.
              </td>
            </tr>
          )}
          {users.map(user => (
            <tr key={user.id} style={{ borderBottom: "1px solid #ddd" }}>
              <td>{user.email}</td>
              <td>{user.name || "—"}</td>
              <td>
                <select
                  value={user.role}
                  disabled={updating === user.id}
                  onChange={e =>
                    changeRole(user.id, e.target.value as "user" | "admin")
                  }
                >
                  <option value="user">User</option>
                  <option value="admin">Admin</option>
                </select>
              </td>
              <td>{new Date(user.createdAt).toLocaleDateString()}</td>
              <td>
                <button
                  onClick={() => deleteUser(user.id)}
                  disabled={updating === user.id}
                  style={{
                    color: "red",
                    cursor: updating === user.id ? "not-allowed" : "pointer",
                  }}
                >
                  ❌ Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}