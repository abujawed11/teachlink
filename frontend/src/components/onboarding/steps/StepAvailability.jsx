import { useState } from "react";

import { addAvailability, deleteAvailability } from "../../../api/teacherApi";
import { getInputClass } from "../FormField";

const DAYS = ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"];

function StepAvailability({ values, onProfileUpdate }) {
  const [form, setForm] = useState({ dayOfWeek: "MON", startTime: "16:00", endTime: "18:00" });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const handleAdd = async () => {
    setError("");
    setSaving(true);
    try {
      const updated = await addAvailability(form);
      onProfileUpdate(updated);
    } catch (err) {
      setError(err.response?.data?.error?.message || "Could not add slot");
    } finally {
      setSaving(false);
    }
  };

  const handleRemove = async (id) => {
    const updated = await deleteAvailability(id);
    onProfileUpdate(updated);
  };

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-slate-800">Availability</h2>
      <p className="text-sm text-slate-500">
        Let students know when you're free to teach. (Optional — you can add this later too.)
      </p>

      {values.availabilities?.length > 0 && (
        <ul className="space-y-1">
          {values.availabilities.map((slot) => (
            <li
              key={slot.id}
              className="flex items-center justify-between text-sm bg-slate-50 rounded-lg px-3 py-2"
            >
              <span>
                {slot.dayOfWeek}: {slot.startTime} - {slot.endTime}
              </span>
              <button
                type="button"
                onClick={() => handleRemove(slot.id)}
                className="text-red-500 hover:text-red-700 text-xs"
              >
                Remove
              </button>
            </li>
          ))}
        </ul>
      )}

      {error && <p className="text-xs text-red-600">{error}</p>}

      <div className="grid grid-cols-3 gap-2">
        <select
          value={form.dayOfWeek}
          onChange={(e) => setForm({ ...form, dayOfWeek: e.target.value })}
          className={getInputClass(false)}
        >
          {DAYS.map((day) => (
            <option key={day} value={day}>
              {day}
            </option>
          ))}
        </select>
        <input
          type="time"
          value={form.startTime}
          onChange={(e) => setForm({ ...form, startTime: e.target.value })}
          className={getInputClass(false)}
        />
        <input
          type="time"
          value={form.endTime}
          onChange={(e) => setForm({ ...form, endTime: e.target.value })}
          className={getInputClass(false)}
        />
      </div>

      <button
        type="button"
        onClick={handleAdd}
        disabled={saving}
        className="text-sm text-indigo-600 font-medium hover:underline disabled:opacity-50"
      >
        {saving ? "Adding..." : "+ Add time slot"}
      </button>
    </div>
  );
}

export default StepAvailability;
