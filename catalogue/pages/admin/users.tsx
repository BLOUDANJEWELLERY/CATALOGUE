// pages/admin/users.tsx
"use client";
import { useEffect, useState } from "react";
import type { GetServerSideProps, GetServerSidePropsContext } from "next";
import { getSession } from "next-auth/react";

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

type User = {
  id: string;
  email: string;
  name: string;
  role: "user" | "admin";
  createdAt: string;
};

export default function UserManagementPage() {
  const [users, setUsers] = useState<User[]>([]);

  useEffect(() => {
    fetch("/api/admin/users")
      .then(res => res.json())
      .then((data: User[]) => setUsers(data))
      .catch(err => console.error("Failed to load users:", err));
  }, []);

  const changeRole = async (id: string, role: "user" | "admin") => {
    try {
      const res = await fetch("/api/admin/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, role }),
      });

      if (!res.ok) throw new Error("Failed to update role");

      const updatedUser: User = await res.json();
      setUsers(prev => prev.map(u => (u.id === id ? updatedUser : u)));
    } catch (err) {
      console.error(err);
      alert("Role change failed");
    }
  };

  const deleteUser = async (id: string) => {
    if (!confirm("Are you sure?")) return;

    try {
      const res = await fetch("/api/admin/users", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });

      const result = await res.json();
      if (result.success) {
        setUsers(prev => prev.filter(u => u.id !== id));
      } else {
        throw new Error("Delete failed");
      }
    } catch (err) {
      console.error(err);
      alert("Delete failed");
    }
  };

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
          {users.map((u) => (
            <tr key={u.id}>
              <td>{u.email}</td>
              <td>{u.name || "—"}</td>
              <td>
                <select
                  value={u.role}
                  onChange={(e) => changeRole(u.id, e.target.value as "user" | "admin")}
                >
                  <option value="user">User</option>
                  <option value="admin">Admin</option>
                </select>
              </td>
              <td>{new Date(u.createdAt).toLocaleDateString()}</td>
              <td>
                <button onClick={() => deleteUser(u.id)}>❌ Delete</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}