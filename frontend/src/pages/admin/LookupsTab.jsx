import { useEffect, useState } from "react";

import { createLookupItem, getAdminLookup, updateLookupItem } from "../../api/adminApi";
import { ActionButton, Badge, ErrorNote, TableShell, controlClass, td, th } from "./adminUi";

const TYPES = [
  ["subjects", "Subjects", "subject"],
  ["grades", "Classes", "class"],
  ["boards", "Boards", "board"],
  ["languages", "Languages", "language"],
];

function LookupList({ type, singular }) {
  const [items, setItems] = useState(null);
  const [error, setError] = useState("");
  const [newName, setNewName] = useState("");
  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName] = useState("");
  const [busyId, setBusyId] = useState(null);

  useEffect(() => {
    let stale = false;
    getAdminLookup(type)
      .then((result) => {
        if (!stale) setItems(result);
      })
      .catch(() => {
        if (!stale) setError("Could not load this list");
      });
    return () => {
      stale = true;
    };
  }, [type]);

  const replaceItem = (updated) =>
    setItems((prev) =>
      prev.map((item) => (item.id === updated.id ? { ...item, ...updated } : item))
    );

  const handleAdd = async (e) => {
    e.preventDefault();
    const name = newName.trim();
    if (!name) return;

    setError("");
    setAdding(true);
    try {
      const created = await createLookupItem(type, { name });
      setItems((prev) => [...prev, { ...created, teacherCount: 0 }]);
      setNewName("");
    } catch (err) {
      setError(err.response?.data?.error?.message || `Could not add ${singular}`);
    } finally {
      setAdding(false);
    }
  };

  const handleUpdate = async (item, changes) => {
    setError("");
    setBusyId(item.id);
    try {
      replaceItem(await updateLookupItem(type, item.id, changes));
      setEditingId(null);
    } catch (err) {
      setError(err.response?.data?.error?.message || "Could not save this change");
    } finally {
      setBusyId(null);
    }
  };

  const handleToggleActive = (item) => {
    if (item.isActive) {
      const used = item.teacherCount > 0 ? ` ${item.teacherCount} teacher(s) already list it; they keep it, but it stops appearing in filters and forms.` : "";
      if (!window.confirm(`Deactivate "${item.name}"?${used}`)) return;
    }
    handleUpdate(item, { isActive: !item.isActive });
  };

  return (
    <div className="space-y-4">
      <form onSubmit={handleAdd} className="flex gap-2">
        <input
          type="text"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          maxLength={100}
          placeholder={`Add a new ${singular}`}
          className={`${controlClass} flex-1`}
        />
        <button
          type="submit"
          disabled={adding || !newName.trim()}
          className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-sm font-medium px-5 py-2 rounded-lg transition-colors"
        >
          {adding ? "Adding..." : "Add"}
        </button>
      </form>

      <ErrorNote>{error}</ErrorNote>

      {items === null && !error && <p className="text-slate-500">Loading...</p>}

      {items && (
        <TableShell>
          <thead>
            <tr>
              <th className={th}>Name</th>
              <th className={th}>Teachers</th>
              <th className={th}>Status</th>
              <th className={th} />
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.id} className={item.isActive ? "" : "bg-slate-50"}>
                <td className={td}>
                  {editingId === item.id ? (
                    <form
                      onSubmit={(e) => {
                        e.preventDefault();
                        if (editName.trim() && editName.trim() !== item.name) {
                          handleUpdate(item, { name: editName.trim() });
                        } else {
                          setEditingId(null);
                        }
                      }}
                      className="flex gap-2"
                    >
                      <input
                        autoFocus
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        maxLength={100}
                        className={`${controlClass} py-1`}
                      />
                      <ActionButton type="submit" disabled={busyId === item.id}>
                        Save
                      </ActionButton>
                      <ActionButton type="button" onClick={() => setEditingId(null)}>
                        Cancel
                      </ActionButton>
                    </form>
                  ) : (
                    <span className={item.isActive ? "text-slate-900" : "text-slate-400 line-through"}>
                      {item.name}
                    </span>
                  )}
                </td>
                <td className={`${td} text-slate-500`}>{item.teacherCount}</td>
                <td className={td}>
                  <Badge tone={item.isActive ? "green" : "slate"}>
                    {item.isActive ? "Active" : "Inactive"}
                  </Badge>
                </td>
                <td className={`${td} text-right whitespace-nowrap`}>
                  <ActionButton
                    disabled={busyId === item.id || editingId === item.id}
                    onClick={() => {
                      setEditingId(item.id);
                      setEditName(item.name);
                    }}
                  >
                    Rename
                  </ActionButton>
                  <ActionButton
                    tone={item.isActive ? "danger" : "default"}
                    disabled={busyId === item.id}
                    onClick={() => handleToggleActive(item)}
                  >
                    {item.isActive ? "Deactivate" : "Activate"}
                  </ActionButton>
                </td>
              </tr>
            ))}
            {items.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-10 text-center text-slate-400">
                  Nothing here yet
                </td>
              </tr>
            )}
          </tbody>
        </TableShell>
      )}

      <p className="text-xs text-slate-400">
        Items are deactivated, never deleted, because teachers&apos; profiles may still use them.
      </p>
    </div>
  );
}

function LookupsTab() {
  const [type, setType] = useState("subjects");
  const [, , singular] = TYPES.find(([id]) => id === type);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {TYPES.map(([id, label]) => (
          <button
            key={id}
            type="button"
            onClick={() => setType(id)}
            className={`text-sm px-4 py-1.5 rounded-full border transition-colors ${
              type === id
                ? "bg-indigo-600 border-indigo-600 text-white"
                : "bg-white border-slate-300 text-slate-600 hover:border-indigo-300"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Remounted per type so each list loads its own data with a clean state. */}
      <LookupList key={type} type={type} singular={singular} />
    </div>
  );
}

export default LookupsTab;
