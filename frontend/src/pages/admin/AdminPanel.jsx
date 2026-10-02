import { useState } from "react";

import LookupsTab from "./LookupsTab";
import TeachersTab from "./TeachersTab";
import UsersTab from "./UsersTab";

const TABS = [
  ["users", "Users", UsersTab],
  ["teachers", "Teachers", TeachersTab],
  ["lookups", "Subjects & lists", LookupsTab],
];

function AdminPanel() {
  const [active, setActive] = useState("users");
  const [, , ActiveTab] = TABS.find(([id]) => id === active);

  return (
    <div className="max-w-6xl mx-auto p-4 sm:p-8 space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Admin</h1>
        <p className="text-slate-500">Moderate accounts and profiles, and manage the lists teachers pick from.</p>
      </div>

      <div role="tablist" className="flex gap-1 border-b border-slate-200 overflow-x-auto">
        {TABS.map(([id, label]) => (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={active === id}
            onClick={() => setActive(id)}
            className={`px-4 py-2.5 text-sm font-medium whitespace-nowrap border-b-2 -mb-px transition-colors ${
              active === id
                ? "border-indigo-600 text-indigo-600"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <ActiveTab />
    </div>
  );
}

export default AdminPanel;
