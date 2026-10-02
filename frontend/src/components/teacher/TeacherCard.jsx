import { Link } from "react-router-dom";

const MAX_CHIPS = 3;

function ChipRow({ items, className }) {
  if (items.length === 0) return null;
  const shown = items.slice(0, MAX_CHIPS);
  const extra = items.length - shown.length;

  return (
    <div className="flex flex-wrap gap-1.5">
      {shown.map((item) => (
        <span key={item} className={`text-xs px-2 py-0.5 rounded-full ${className}`}>
          {item}
        </span>
      ))}
      {extra > 0 && <span className="text-xs text-slate-400 py-0.5">+{extra} more</span>}
    </div>
  );
}

function TeacherCard({ teacher }) {
  const location = [teacher.area, teacher.city].filter(Boolean).join(", ");
  const hasFee = teacher.feeMin != null || teacher.feeMax != null;

  return (
    <Link
      to={`/teachers/${teacher.slug}`}
      className="group flex flex-col bg-white border border-slate-200 rounded-xl p-5 hover:border-indigo-300 hover:shadow-md transition-all"
    >
      <div className="flex items-center gap-3">
        {teacher.photoUrl ? (
          <img
            src={teacher.photoUrl}
            alt=""
            className="h-14 w-14 rounded-full object-cover bg-slate-100 shrink-0"
          />
        ) : (
          <div className="h-14 w-14 rounded-full bg-indigo-100 text-indigo-600 text-xl font-semibold flex items-center justify-center shrink-0">
            {teacher.name[0].toUpperCase()}
          </div>
        )}
        <div className="min-w-0">
          <div className="flex items-center gap-1.5">
            <h3 className="font-semibold text-slate-900 truncate group-hover:text-indigo-600">
              {teacher.name}
            </h3>
            {teacher.isVerified && (
              <span title="Verified" className="text-emerald-600 text-sm">
                ✓
              </span>
            )}
          </div>
          <p className="text-sm text-slate-500 truncate">{teacher.headline || "Teacher"}</p>
        </div>
      </div>

      <ul className="mt-4 space-y-1 text-sm text-slate-600">
        {location && <li>📍 {location}</li>}
        {teacher.experienceYears != null && <li>🧑‍🏫 {teacher.experienceYears} years experience</li>}
        {hasFee && (
          <li>
            💰 ₹{teacher.feeMin ?? "?"} – ₹{teacher.feeMax ?? "?"} / month
          </li>
        )}
      </ul>

      <div className="mt-4 space-y-2">
        <ChipRow items={teacher.subjects} className="bg-emerald-100 text-emerald-700" />
        <ChipRow items={teacher.grades} className="bg-amber-100 text-amber-700" />
      </div>

      {teacher.modes.length > 0 && (
        <p className="mt-auto pt-4 text-xs text-slate-400">{teacher.modes.join(" · ")}</p>
      )}
    </Link>
  );
}

export default TeacherCard;
