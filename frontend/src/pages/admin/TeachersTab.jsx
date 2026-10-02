import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { BadgeCheck } from "lucide-react";

import { getAdminTeachers, moderateTeacher } from "../../api/adminApi";
import Pagination from "../../components/common/Pagination";
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

function StatusBadge({ teacher }) {
  if (teacher.accountStatus === "SUSPENDED") return <Badge tone="red">Account suspended</Badge>;
  if (teacher.isHiddenByAdmin) return <Badge tone="red">Hidden by admin</Badge>;
  if (teacher.isPublished) return <Badge tone="green">Visible</Badge>;
  return <Badge tone="amber">Draft</Badge>;
}

function TeachersTab() {
  const [search, setSearch] = useState("");
  const [visibility, setVisibility] = useState("");
  const [page, setPage] = useState(1);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState(null);

  const q = useDebouncedValue(search.trim());

  useEffect(() => {
    let stale = false;
    getAdminTeachers({ q, visibility, page })
      .then((result) => {
        if (stale) return;
        setData(result);
        setError("");
      })
      .catch((err) => {
        if (!stale) setError(err.response?.data?.error?.message || "Could not load teachers");
      })
      .finally(() => {
        if (!stale) setLoading(false);
      });
    return () => {
      stale = true;
    };
  }, [q, visibility, page]);

  const changeFilter = (setter) => (value) => {
    setLoading(true);
    setPage(1);
    setter(value);
  };

  const handleChange = async (teacher, changes, confirmMessage) => {
    if (confirmMessage && !window.confirm(confirmMessage)) return;

    setBusyId(teacher.id);
    setError("");
    try {
      const updated = await moderateTeacher(teacher.id, changes);
      setData((prev) => ({
        ...prev,
        teachers: prev.teachers.map((t) => (t.id === updated.id ? updated : t)),
      }));
    } catch (err) {
      setError(err.response?.data?.error?.message || "Could not update this profile");
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
          placeholder="Search name, username or city"
          className={`${controlClass} flex-1 min-w-56`}
        />
        <select
          value={visibility}
          onChange={(e) => changeFilter(setVisibility)(e.target.value)}
          className={controlClass}
        >
          <option value="">All profiles</option>
          <option value="published">Published</option>
          <option value="draft">Drafts</option>
          <option value="hidden">Hidden by admin</option>
        </select>
      </div>

      <ErrorNote>{error}</ErrorNote>

      {data && (
        <p className="text-sm text-slate-500">
          {data.pagination.total} profile{data.pagination.total === 1 ? "" : "s"}
        </p>
      )}

      <div className={loading ? "opacity-50 transition-opacity" : "transition-opacity"}>
        <TableShell>
          <thead>
            <tr>
              <th className={th}>Teacher</th>
              <th className={th}>City</th>
              <th className={th}>Status</th>
              <th className={th}>Verified</th>
              <th className={th}>Created</th>
              <th className={th} />
            </tr>
          </thead>
          <tbody>
            {data?.teachers.map((teacher) => (
              <tr key={teacher.id}>
                <td className={td}>
                  {teacher.isVisible ? (
                    <Link
                      to={`/teachers/${teacher.slug}`}
                      className="font-medium text-slate-900 hover:text-indigo-600"
                    >
                      {teacher.name}
                    </Link>
                  ) : (
                    <span className="font-medium text-slate-900">{teacher.name}</span>
                  )}
                  <p className="text-xs text-slate-400">@{teacher.username}</p>
                </td>
                <td className={`${td} text-slate-600`}>{teacher.city || "—"}</td>
                <td className={td}>
                  <StatusBadge teacher={teacher} />
                </td>
                <td className={td}>
                  {teacher.isVerified ? (
                    <Badge tone="green">
                      <span className="inline-flex items-center gap-1">
                        <BadgeCheck className="h-3.5 w-3.5" />
                        Verified
                      </span>
                    </Badge>
                  ) : (
                    <span className="text-slate-300">—</span>
                  )}
                </td>
                <td className={`${td} text-slate-500`}>{formatDate(teacher.createdAt)}</td>
                <td className={`${td} text-right whitespace-nowrap`}>
                  <ActionButton
                    disabled={busyId === teacher.id}
                    onClick={() => handleChange(teacher, { isVerified: !teacher.isVerified })}
                  >
                    {teacher.isVerified ? "Unverify" : "Verify"}
                  </ActionButton>
                  {teacher.isHiddenByAdmin ? (
                    <ActionButton
                      disabled={busyId === teacher.id}
                      onClick={() => handleChange(teacher, { isHiddenByAdmin: false })}
                    >
                      Unhide
                    </ActionButton>
                  ) : (
                    <ActionButton
                      tone="danger"
                      disabled={busyId === teacher.id}
                      onClick={() =>
                        handleChange(
                          teacher,
                          { isHiddenByAdmin: true },
                          `Hide ${teacher.name}'s profile? It will disappear from search and the public page, and they won't be able to re-publish it until you unhide it.`
                        )
                      }
                    >
                      Hide
                    </ActionButton>
                  )}
                </td>
              </tr>
            ))}
            {data?.teachers.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-slate-400">
                  No profiles match these filters
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

export default TeachersTab;
