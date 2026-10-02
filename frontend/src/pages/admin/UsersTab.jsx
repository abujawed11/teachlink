import { useEffect, useState } from "react";

import { getAdminUsers, setUserStatus } from "../../api/adminApi";
import Pagination from "../../components/common/Pagination";
import { useAuth } from "../../hooks/useAuth";
import { useDebouncedValue } from "../../hooks/useDebouncedValue";
import {
  ActionButton,
  Badge,
  ErrorNote,
  TableShell,
  controlClass,
  formatDate,
  td,
  th,
} from "./adminUi";

const ROLE_TONES = { ADMIN: "indigo", TEACHER: "green", USER: "slate" };

function UsersTab() {
  const { user: me } = useAuth();
  const [search, setSearch] = useState("");
  const [role, setRole] = useState("");
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState(null);

  const q = useDebouncedValue(search.trim());

  useEffect(() => {
    let stale = false;
    getAdminUsers({ q, role, status, page })
      .then((result) => {
        if (stale) return;
        setData(result);
        setError("");
      })
      .catch((err) => {
        if (!stale) setError(err.response?.data?.error?.message || "Could not load users");
      })
      .finally(() => {
        if (!stale) setLoading(false);
      });
    return () => {
      stale = true;
    };
  }, [q, role, status, page]);

  // Any filter change goes back to the first page and shows the loading state.
  const changeFilter = (setter) => (value) => {
    setLoading(true);
    setPage(1);
    setter(value);
  };

  const handleToggleStatus = async (user) => {
    const suspending = user.status === "ACTIVE";
    const message = suspending
      ? `Suspend ${user.name} (@${user.username})? They will be logged out and any published profile will be hidden.`
      : `Reactivate ${user.name} (@${user.username})?`;
    if (!window.confirm(message)) return;

    setBusyId(user.id);
    setError("");
    try {
      const updated = await setUserStatus(user.id, suspending ? "SUSPENDED" : "ACTIVE");
      setData((prev) => ({
        ...prev,
        users: prev.users.map((u) => (u.id === updated.id ? updated : u)),
      }));
    } catch (err) {
      setError(err.response?.data?.error?.message || "Could not update this user");
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-3">
        <input
          type="search"
          value={search}
          onChange={(e) => changeFilter(setSearch)(e.target.value)}
          placeholder="Search name, username or email"
          className={`${controlClass} flex-1 min-w-56`}
        />
        <select value={role} onChange={(e) => changeFilter(setRole)(e.target.value)} className={controlClass}>
          <option value="">All roles</option>
          <option value="USER">Users</option>
          <option value="TEACHER">Teachers</option>
          <option value="ADMIN">Admins</option>
        </select>
        <select value={status} onChange={(e) => changeFilter(setStatus)(e.target.value)} className={controlClass}>
          <option value="">Any status</option>
          <option value="ACTIVE">Active</option>
          <option value="SUSPENDED">Suspended</option>
        </select>
      </div>

      <ErrorNote>{error}</ErrorNote>

      {data && (
        <p className="text-sm text-slate-500">
          {data.pagination.total} user{data.pagination.total === 1 ? "" : "s"}
        </p>
      )}

      <div className={loading ? "opacity-50 transition-opacity" : "transition-opacity"}>
        <TableShell>
          <thead>
            <tr>
              <th className={th}>User</th>
              <th className={th}>Email</th>
              <th className={th}>Role</th>
              <th className={th}>Status</th>
              <th className={th}>Joined</th>
              <th className={th} />
            </tr>
          </thead>
          <tbody>
            {data?.users.map((user) => (
              <tr key={user.id}>
                <td className={td}>
                  <p className="font-medium text-slate-900">{user.name}</p>
                  <p className="text-xs text-slate-400">@{user.username}</p>
                </td>
                <td className={`${td} text-slate-600`}>{user.email}</td>
                <td className={td}>
                  <Badge tone={ROLE_TONES[user.role]}>{user.role}</Badge>
                </td>
                <td className={td}>
                  <Badge tone={user.status === "ACTIVE" ? "green" : "red"}>{user.status}</Badge>
                </td>
                <td className={`${td} text-slate-500`}>{formatDate(user.createdAt)}</td>
                <td className={`${td} text-right`}>
                  {user.role !== "ADMIN" && user.id !== me?.id && (
                    <ActionButton
                      tone={user.status === "ACTIVE" ? "danger" : "default"}
                      disabled={busyId === user.id}
                      onClick={() => handleToggleStatus(user)}
                    >
                      {user.status === "ACTIVE" ? "Suspend" : "Reactivate"}
                    </ActionButton>
                  )}
                </td>
              </tr>
            ))}
            {data?.users.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-slate-400">
                  No users match these filters
                </td>
              </tr>
            )}
          </tbody>
        </TableShell>
      </div>

      <Pagination
        pagination={data?.pagination}
        disabled={loading}
        onPageChange={(next) => {
          setLoading(true);
          setPage(next);
        }}
      />
    </div>
  );
}

export default UsersTab;
