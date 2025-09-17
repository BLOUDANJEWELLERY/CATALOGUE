// pages/admin/users.tsx
"use client";
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
    fetch("/api/admin/users")
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
          {users.map(u => (
            <tr key={u.id} style={{ borderBottom: "1px solid #ddd" }}>
              <td>{u.email}</td>
              <td>{u.name || "—"}</td>
              <td>
                <select
                  value={u.role}
                  onChange={e => changeRole(u.id, e.target.value as "user" | "admin")}
                >
                  <option value="user">User</option>
                  <option value="admin">Admin</option>
                </select>
              </td>
              <td>{new Date(u.createdAt).toLocaleDateString()}</td>
              <td>
                <button
                  onClick={() => deleteUser(u.id)}
                  style={{ color: "red", cursor: "pointer" }}
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