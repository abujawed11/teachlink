import { GraduationCap, IndianRupee, UserRound } from "lucide-react";
import { formatGrades } from "../../utils/formatGrades";

function ProfilePreviewCard({ values, compact }) {
  const modes = [
    values.onlineAvailable && "Online",
    values.offlineAvailable && "Offline",
    values.homeTuitionAvailable && "Home Tuition",
    values.groupTuitionAvailable && "Group",
    values.individualTuitionAvailable && "Individual",
    values.demoClassAvailable && "Demo Class",
  ].filter(Boolean);

  const initial = (values.headline || "T")[0].toUpperCase();

  return (
    <div
      className={`border border-slate-200 rounded-xl bg-white space-y-3 ${compact ? "p-4" : "p-5 bg-slate-50"}`}
    >
      <div className="flex items-center gap-3">
        {values.photoUrl ? (
          <img
            src={values.photoUrl}
            alt=""
            className="h-12 w-12 rounded-full object-cover bg-slate-100"
            onError={(e) => {
              e.currentTarget.style.display = "none";
            }}
          />
        ) : (
          <div className="h-12 w-12 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center font-semibold">
            {initial}
          </div>
        )}
        <div>
          <p className="font-semibold text-slate-800">
            {values.headline || "No headline set"}
          </p>
          <p className="text-sm text-slate-500">
            {[values.city, values.area].filter(Boolean).join(", ") || "Location not set"}
          </p>
        </div>
      </div>

      {values.bio && (
        <p className={`text-sm text-slate-700 ${compact ? "line-clamp-3" : ""}`}>
          {values.bio}
        </p>
      )}

      <div className="text-sm text-slate-600 space-y-1">
        {values.qualificationSummary && (
          <p className="flex items-center gap-1.5">
            <GraduationCap className="h-3.5 w-3.5 text-slate-400 shrink-0" />
            {values.qualificationSummary}
          </p>
        )}
        {values.experienceYears != null && (
          <p className="flex items-center gap-1.5">
            <UserRound className="h-3.5 w-3.5 text-slate-400 shrink-0" />
            {values.experienceYears} years experience
          </p>
        )}
        {(values.feeMin != null || values.feeMax != null) && (
          <p className="flex items-center gap-1.5">
            <IndianRupee className="h-3.5 w-3.5 text-slate-400 shrink-0" />
            {values.feeMin ?? "?"} - {values.feeMax ?? "?"} / month
          </p>
        )}
      </div>

      {values.subjects?.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {values.subjects.map((s) => (
            <span
              key={s.id}
              className="text-xs bg-emerald-100 text-emerald-700 px-2 py-1 rounded-full"
            >
              {s.name}
            </span>
          ))}
        </div>
      )}

      {values.grades?.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {formatGrades(values.grades.map((g) => g.name)).map((label) => (
            <span
              key={label}
              className="text-xs bg-amber-100 text-amber-700 px-2 py-1 rounded-full"
            >
              {label}
            </span>
          ))}
        </div>
      )}

      {modes.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {modes.map((mode) => (
            <span
              key={mode}
              className="text-xs bg-indigo-100 text-indigo-700 px-2 py-1 rounded-full"
            >
              {mode}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

export default ProfilePreviewCard;
