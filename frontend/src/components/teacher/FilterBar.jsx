import { useEffect, useState } from "react";

const MODES = [
  ["online", "Online"],
  ["offline", "Offline"],
  ["home", "Home tuition"],
  ["visit", "Student can visit"],
  ["group", "Group"],
  ["individual", "1-on-1"],
  ["demo", "Free demo class"],
];

const EXPERIENCE = [
  ["1", "1+ years"],
  ["2", "2+ years"],
  ["5", "5+ years"],
  ["10", "10+ years"],
];

const controlClass =
  "w-full border border-slate-300 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent";

function Field({ label, children }) {
  return (
    <label className="block">
      <span className="block text-xs font-medium text-slate-500 mb-1">{label}</span>
      {children}
    </label>
  );
}

function Select({ value, onChange, options, anyLabel }) {
  return (
    <select value={value} onChange={(e) => onChange(e.target.value)} className={controlClass}>
      <option value="">{anyLabel}</option>
      {options.map(([optionValue, label]) => (
        <option key={optionValue} value={optionValue}>
          {label}
        </option>
      ))}
    </select>
  );
}

// Free-text inputs keep their own state and push to the URL after a pause, so we don't
// re-query on every keystroke.
function DebouncedInput({ value, onCommit, ...props }) {
  const [text, setText] = useState(value);
  const [seenValue, setSeenValue] = useState(value);

  // The URL value can change from outside (e.g. "Clear all"); adopt it without remounting,
  // which would steal focus mid-typing.
  if (value !== seenValue) {
    setSeenValue(value);
    setText(value);
  }

  useEffect(() => {
    if (text === value) return undefined;
    const timer = setTimeout(() => onCommit(text), 400);
    return () => clearTimeout(timer);
  }, [text, value, onCommit]);

  return (
    <input {...props} value={text} onChange={(e) => setText(e.target.value)} className={controlClass} />
  );
}

function FilterBar({ filters, lookups, onChange, onClear, activeCount }) {
  const names = (list) => list.map((item) => [item.name, item.name]);

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-4">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Field label="Subject">
          <Select
            value={filters.subject}
            onChange={(v) => onChange("subject", v)}
            options={names(lookups.subjects)}
            anyLabel="Any subject"
          />
        </Field>
        <Field label="Class">
          <Select
            value={filters.grade}
            onChange={(v) => onChange("grade", v)}
            options={names(lookups.grades)}
            anyLabel="Any class"
          />
        </Field>
        <Field label="Board">
          <Select
            value={filters.board}
            onChange={(v) => onChange("board", v)}
            options={names(lookups.boards)}
            anyLabel="Any board"
          />
        </Field>
        <Field label="City / area">
          <DebouncedInput
            type="text"
            placeholder="e.g. Bokaro"
            maxLength={100}
            value={filters.city}
            onCommit={(v) => onChange("city", v.trim())}
          />
        </Field>

        <Field label="Teaching mode">
          <Select
            value={filters.mode}
            onChange={(v) => onChange("mode", v)}
            options={MODES}
            anyLabel="Any mode"
          />
        </Field>
        <Field label="Language">
          <Select
            value={filters.language}
            onChange={(v) => onChange("language", v)}
            options={names(lookups.languages)}
            anyLabel="Any language"
          />
        </Field>
        <Field label="Experience">
          <Select
            value={filters.experienceMin}
            onChange={(v) => onChange("experienceMin", v)}
            options={EXPERIENCE}
            anyLabel="Any experience"
          />
        </Field>
        <Field label="Max fee (₹ / month)">
          <DebouncedInput
            type="number"
            min={0}
            placeholder="e.g. 2000"
            value={filters.feeMax}
            onCommit={(v) => onChange("feeMax", v.trim())}
          />
        </Field>
      </div>

      {activeCount > 0 && (
        <div className="mt-3 text-right">
          <button type="button" onClick={onClear} className="text-sm text-indigo-600 hover:underline">
            Clear all filters ({activeCount})
          </button>
        </div>
      )}
    </div>
  );
}

export default FilterBar;
