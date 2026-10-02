const DAY_ORDER = ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"];
const DAY_LABELS = {
  MON: "Monday",
  TUE: "Tuesday",
  WED: "Wednesday",
  THU: "Thursday",
  FRI: "Friday",
  SAT: "Saturday",
  SUN: "Sunday",
};

// The owner's profile carries lookup objects ({ id, name }); the public one carries plain names.
const labelOf = (item) => (typeof item === "string" ? item : item.name);

const formatMonth = (date) =>
  date ? new Date(date).toLocaleDateString("en-IN", { month: "short", year: "numeric" }) : "";

function EditButton({ onClick, label }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="text-sm font-medium text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 px-3 py-1 rounded-lg transition-colors"
    >
      {label}
    </button>
  );
}

// In public mode (no onEdit) an empty section is hidden; for the owner it becomes a prompt.
function Section({ title, editKey, onEdit, isEmpty, emptyHint, children }) {
  if (isEmpty && !onEdit) return null;

  return (
    <section className="bg-white border border-slate-200 rounded-xl p-5 sm:p-6">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-lg font-semibold text-slate-800">{title}</h2>
        {onEdit && (
          <EditButton onClick={() => onEdit(editKey)} label={isEmpty ? "+ Add" : "Edit"} />
        )}
      </div>
      {isEmpty ? <p className="text-sm text-slate-400 italic">{emptyHint}</p> : children}
    </section>
  );
}

function Chips({ items, className }) {
  return (
    <div className="flex flex-wrap gap-2">
      {items.map((item) => (
        <span key={labelOf(item)} className={`text-sm px-3 py-1 rounded-full ${className}`}>
          {labelOf(item)}
        </span>
      ))}
    </div>
  );
}

function ChipGroup({ label, items, className }) {
  if (!items?.length) return null;
  return (
    <div>
      <p className="text-xs font-medium text-slate-400 uppercase tracking-wide mb-1.5">{label}</p>
      <Chips items={items} className={className} />
    </div>
  );
}

function ProfileView({ profile, name, onEdit }) {
  const modes = [
    profile.onlineAvailable && "Online",
    profile.offlineAvailable && "Offline",
    profile.homeTuitionAvailable && "Home Tuition",
    profile.studentCanVisit && "Student can visit",
    profile.groupTuitionAvailable && "Group",
    profile.individualTuitionAvailable && "Individual",
    profile.demoClassAvailable && "Demo class",
  ].filter(Boolean);

  const hasFee = profile.feeMin != null || profile.feeMax != null;
  const location = [profile.area, profile.city, profile.state, profile.country].filter(Boolean);
  const initial = (name || "T")[0].toUpperCase();

  const slotsByDay = DAY_ORDER.map((day) => ({
    day,
    slots: (profile.availabilities || []).filter((slot) => slot.dayOfWeek === day),
  })).filter((entry) => entry.slots.length > 0);

  return (
    <div className="space-y-4">
      <section className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <div className="h-24 bg-gradient-to-r from-indigo-600 to-violet-600" />
        <div className="px-5 sm:px-6 pb-5">
          <div className="flex items-end justify-between -mt-12">
            {profile.photoUrl ? (
              <img
                src={profile.photoUrl}
                alt={name}
                className="h-24 w-24 rounded-full object-cover border-4 border-white bg-slate-100"
              />
            ) : (
              <div className="h-24 w-24 rounded-full border-4 border-white bg-indigo-100 text-indigo-600 text-3xl font-semibold flex items-center justify-center">
                {initial}
              </div>
            )}
            {onEdit && <EditButton onClick={() => onEdit("basic")} label="Edit" />}
          </div>

          <div className="mt-3 flex items-center gap-2 flex-wrap">
            <h1 className="text-2xl font-bold text-slate-900">{name}</h1>
            {profile.isVerified && (
              <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full font-medium">
                ✓ Verified
              </span>
            )}
          </div>
          <p className="text-slate-600 mt-0.5">
            {profile.headline || (onEdit ? "Add a headline" : "")}
          </p>

          <div className="flex flex-wrap gap-x-5 gap-y-1 mt-3 text-sm text-slate-500">
            {location.length > 0 && <span>📍 {location.join(", ")}</span>}
            {profile.experienceYears != null && (
              <span>🧑‍🏫 {profile.experienceYears} years experience</span>
            )}
            {hasFee && (
              <span>
                💰 ₹{profile.feeMin ?? "?"} – ₹{profile.feeMax ?? "?"} / month
              </span>
            )}
          </div>
        </div>
      </section>

      <Section
        title="About"
        editKey="basic"
        onEdit={onEdit}
        isEmpty={!profile.bio}
        emptyHint="Tell visitors about your teaching style and experience."
      >
        <p className="text-slate-700 whitespace-pre-line">{profile.bio}</p>
      </Section>

      <Section
        title="Subjects, classes & boards"
        editKey="subjects"
        onEdit={onEdit}
        isEmpty={!profile.subjects?.length && !profile.grades?.length}
        emptyHint="Add the subjects and classes you teach."
      >
        <div className="space-y-4">
          <ChipGroup label="Subjects" items={profile.subjects} className="bg-emerald-100 text-emerald-700" />
          <ChipGroup label="Classes" items={profile.grades} className="bg-amber-100 text-amber-700" />
          <ChipGroup label="Boards" items={profile.boards} className="bg-sky-100 text-sky-700" />
          <ChipGroup label="Languages" items={profile.languages} className="bg-slate-100 text-slate-700" />
        </div>
      </Section>

      <Section
        title="Qualifications & experience"
        editKey="professional"
        onEdit={onEdit}
        isEmpty={
          !profile.qualificationSummary &&
          !profile.qualifications?.length &&
          !profile.experiences?.length
        }
        emptyHint="Your qualifications build trust with parents and students."
      >
        <div className="space-y-4">
          {profile.qualificationSummary && (
            <p className="text-slate-700">🎓 {profile.qualificationSummary}</p>
          )}

          {profile.qualifications?.length > 0 && (
            <ul className="space-y-2">
              {profile.qualifications.map((q, i) => (
                <li key={q.id ?? i} className="text-sm">
                  <span className="font-medium text-slate-800">{q.title}</span>
                  <span className="text-slate-500">
                    {[q.institution, q.yearCompleted].filter(Boolean).map((v) => ` · ${v}`).join("")}
                  </span>
                </li>
              ))}
            </ul>
          )}

          {profile.experiences?.length > 0 && (
            <ul className="space-y-3 border-l-2 border-slate-100 pl-4">
              {profile.experiences.map((e, i) => (
                <li key={e.id ?? i} className="text-sm">
                  <p className="font-medium text-slate-800">
                    {e.role ? `${e.role} at ` : ""}
                    {e.institutionName}
                  </p>
                  {(e.startDate || e.endDate) && (
                    <p className="text-slate-500">
                      {formatMonth(e.startDate)} – {e.endDate ? formatMonth(e.endDate) : "Present"}
                    </p>
                  )}
                  {e.description && <p className="text-slate-600 mt-1">{e.description}</p>}
                </li>
              ))}
            </ul>
          )}
        </div>
      </Section>

      <Section
        title="Teaching options"
        editKey="tuition"
        onEdit={onEdit}
        isEmpty={modes.length === 0 && !hasFee}
        emptyHint="Choose how you teach and what you charge."
      >
        <div className="space-y-3">
          {modes.length > 0 && <Chips items={modes} className="bg-indigo-100 text-indigo-700" />}
          {profile.teachingRadiusKm != null && profile.homeTuitionAvailable && (
            <p className="text-sm text-slate-600">
              Travels up to {profile.teachingRadiusKm} km for home tuition
            </p>
          )}
        </div>
      </Section>

      <Section
        title="Location"
        editKey="location"
        onEdit={onEdit}
        isEmpty={location.length === 0}
        emptyHint="Add your city so nearby students can find you."
      >
        <p className="text-slate-700">{location.join(", ")}</p>
      </Section>

      <Section
        title="Availability"
        editKey="availability"
        onEdit={onEdit}
        isEmpty={slotsByDay.length === 0}
        emptyHint="Let students know when you're free to teach."
      >
        <ul className="space-y-1.5">
          {slotsByDay.map(({ day, slots }) => (
            <li key={day} className="flex gap-4 text-sm">
              <span className="w-24 font-medium text-slate-700">{DAY_LABELS[day]}</span>
              <span className="text-slate-600">
                {slots.map((slot) => `${slot.startTime} – ${slot.endTime}`).join(", ")}
              </span>
            </li>
          ))}
        </ul>
      </Section>
    </div>
  );
}

export default ProfileView;
