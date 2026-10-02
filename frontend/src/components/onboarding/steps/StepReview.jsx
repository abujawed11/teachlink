function StepReview({ values }) {
  const modes = [
    values.onlineAvailable && "Online",
    values.offlineAvailable && "Offline",
    values.homeTuitionAvailable && "Home Tuition",
    values.groupTuitionAvailable && "Group",
    values.individualTuitionAvailable && "Individual",
    values.demoClassAvailable && "Demo Class",
  ].filter(Boolean);

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-slate-800">Review Your Profile</h2>
      <p className="text-sm text-slate-500">
        This is how your profile will appear. Review before publishing.
      </p>

      <div className="border border-slate-200 rounded-xl p-5 space-y-3 bg-slate-50">
        <div>
          <p className="font-semibold text-slate-800">{values.headline || "No headline set"}</p>
          <p className="text-sm text-slate-500">
            {[values.city, values.area].filter(Boolean).join(", ") || "Location not set"}
          </p>
        </div>

        {values.bio && <p className="text-sm text-slate-700">{values.bio}</p>}

        <div className="text-sm text-slate-600 space-y-1">
          {values.qualificationSummary && <p>Qualification: {values.qualificationSummary}</p>}
          {values.experienceYears != null && <p>Experience: {values.experienceYears} years</p>}
          {(values.feeMin != null || values.feeMax != null) && (
            <p>
              Fee: {values.feeMin ?? "?"} - {values.feeMax ?? "?"} / month
            </p>
          )}
        </div>

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
    </div>
  );
}

export default StepReview;
