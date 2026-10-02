import { useState } from "react";

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

// A block inside a tab. In public mode (no onEdit) an empty block is hidden; for the owner it
// becomes an "+ Add" prompt.
function Block({ title, editKey, onEdit, isEmpty, emptyHint, children }) {
  if (isEmpty && !onEdit) return null;

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wide">{title}</h3>
        {onEdit && (
          <EditButton onClick={() => onEdit(editKey)} label={isEmpty ? "+ Add" : "Edit"} />
        )}
      </div>
      {isEmpty ? <p className="text-sm text-slate-400 italic">{emptyHint}</p> : children}
    </div>
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
      <p className="text-xs font-medium text-slate-400 mb-1.5">{label}</p>
      <Chips items={items} className={className} />
    </div>
  );
}

function ProfileView({ profile, name, onEdit }) {
  const [activeTab, setActiveTab] = useState("about");

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

  // Public responses already null the number unless the teacher opted in; the owner view
  // gets it regardless, so also respect the preference here.
  const showsNumber = profile.contactPreference !== "PLATFORM_ONLY" && profile.contactNumber;
  const contactHref = showsNumber
    ? profile.contactPreference === "WHATSAPP"
      ? `https://wa.me/${profile.contactNumber.replace(/\D/g, "")}`
      : `tel:${profile.contactNumber.replace(/[^\d+]/g, "")}`
    : null;

  const slotsByDay = DAY_ORDER.map((day) => ({
    day,
    slots: (profile.availabilities || []).filter((slot) => slot.dayOfWeek === day),
  })).filter((entry) => entry.slots.length > 0);

  const hasTeaching =
    profile.subjects?.length > 0 ||
    profile.grades?.length > 0 ||
    profile.boards?.length > 0 ||
    profile.languages?.length > 0;
  const hasExperience =
    Boolean(profile.qualificationSummary) ||
    profile.qualifications?.length > 0 ||
    profile.experiences?.length > 0;
  const hasAbout = Boolean(profile.bio) || location.length > 0;

  // Visitors only see tabs that have something in them; the owner sees all to fill in.
  const tabs = [
    { id: "about", label: "About", show: hasAbout },
    { id: "teaching", label: "Teaching", show: hasTeaching || modes.length > 0 || hasFee },
    { id: "experience", label: "Experience", show: hasExperience },
    { id: "availability", label: "Availability", show: slotsByDay.length > 0 },
  ].filter((tab) => onEdit || tab.show);

  const currentTab = tabs.some((t) => t.id === activeTab) ? activeTab : tabs[0]?.id;

  return (
    <div className="grid lg:grid-cols-[320px_1fr] gap-4 items-start">
      <aside className="bg-white border border-slate-200 rounded-xl overflow-hidden lg:sticky lg:top-4">
        <div className="h-20 bg-gradient-to-r from-indigo-600 to-violet-600" />
        <div className="px-5 pb-5">
          <div className="flex items-end justify-between -mt-10">
            {profile.photoUrl ? (
              <img
                src={profile.photoUrl}
                alt={name}
                className="h-20 w-20 rounded-full object-cover border-4 border-white bg-slate-100"
              />
            ) : (
              <div className="h-20 w-20 rounded-full border-4 border-white bg-indigo-100 text-indigo-600 text-2xl font-semibold flex items-center justify-center">
                {initial}
              </div>
            )}
            {onEdit && <EditButton onClick={() => onEdit("basic")} label="Edit" />}
          </div>

          <div className="mt-3 flex items-center gap-2 flex-wrap">
            <h1 className="text-xl font-bold text-slate-900">{name}</h1>
            {profile.isVerified && (
              <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full font-medium">
                ✓ Verified
              </span>
            )}
          </div>
          <p className="text-sm text-slate-600 mt-0.5">
            {profile.headline || (onEdit ? "Add a headline" : "")}
          </p>

          <ul className="mt-4 space-y-2 text-sm text-slate-600">
            {location.length > 0 && <li>📍 {location.join(", ")}</li>}
            {profile.experienceYears != null && (
              <li>🧑‍🏫 {profile.experienceYears} years experience</li>
            )}
            {hasFee && (
              <li>
                💰 ₹{profile.feeMin ?? "?"} – ₹{profile.feeMax ?? "?"} / month
              </li>
            )}
          </ul>

          {modes.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-4">
              {modes.map((mode) => (
                <span
                  key={mode}
                  className="text-xs bg-indigo-50 text-indigo-700 px-2 py-1 rounded-full"
                >
                  {mode}
                </span>
              ))}
            </div>
          )}

          {contactHref && (
            <a
              href={contactHref}
              target={profile.contactPreference === "WHATSAPP" ? "_blank" : undefined}
              rel="noreferrer"
              className="mt-4 flex items-center justify-center gap-2 text-sm font-medium bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-2 rounded-lg transition-colors"
            >
              {profile.contactPreference === "WHATSAPP" ? "💬 WhatsApp" : "📞 Call"}{" "}
              {profile.contactNumber}
            </a>
          )}
        </div>
      </aside>

      <div className="bg-white border border-slate-200 rounded-xl">
        <div role="tablist" className="flex gap-1 px-3 pt-2 border-b border-slate-200 overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={currentTab === tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2.5 text-sm font-medium whitespace-nowrap border-b-2 -mb-px transition-colors ${
                currentTab === tab.id
                  ? "border-indigo-600 text-indigo-600"
                  : "border-transparent text-slate-500 hover:text-slate-800"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="p-5 sm:p-6 space-y-6 min-h-64">
          {currentTab === "about" && (
            <>
              <Block
                title="About"
                editKey="basic"
                onEdit={onEdit}
                isEmpty={!profile.bio}
                emptyHint="Tell visitors about your teaching style and experience."
              >
                <p className="text-slate-700 whitespace-pre-line">{profile.bio}</p>
              </Block>
              <Block
                title="Location"
                editKey="location"
                onEdit={onEdit}
                isEmpty={location.length === 0}
                emptyHint="Add your city so nearby students can find you."
              >
                <p className="text-slate-700">{location.join(", ")}</p>
              </Block>
            </>
          )}

          {currentTab === "teaching" && (
            <>
              <Block
                title="Subjects, classes & boards"
                editKey="subjects"
                onEdit={onEdit}
                isEmpty={!hasTeaching}
                emptyHint="Add the subjects and classes you teach."
              >
                <div className="space-y-4">
                  <ChipGroup label="Subjects" items={profile.subjects} className="bg-emerald-100 text-emerald-700" />
                  <ChipGroup label="Classes" items={profile.grades} className="bg-amber-100 text-amber-700" />
                  <ChipGroup label="Boards" items={profile.boards} className="bg-sky-100 text-sky-700" />
                  <ChipGroup label="Languages" items={profile.languages} className="bg-slate-100 text-slate-700" />
                </div>
              </Block>
              <Block
                title="Teaching options"
                editKey="tuition"
                onEdit={onEdit}
                isEmpty={modes.length === 0 && !hasFee}
                emptyHint="Choose how you teach and what you charge."
              >
                <div className="space-y-2">
                  {modes.length > 0 && <Chips items={modes} className="bg-indigo-100 text-indigo-700" />}
                  {profile.teachingRadiusKm != null && profile.homeTuitionAvailable && (
                    <p className="text-sm text-slate-600">
                      Travels up to {profile.teachingRadiusKm} km for home tuition
                    </p>
                  )}
                </div>
              </Block>
            </>
          )}

          {currentTab === "experience" && (
            <Block
              title="Qualifications & experience"
              editKey="professional"
              onEdit={onEdit}
              isEmpty={!hasExperience}
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
                          {[q.institution, q.yearCompleted]
                            .filter(Boolean)
                            .map((v) => ` · ${v}`)
                            .join("")}
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
                            {formatMonth(e.startDate)} –{" "}
                            {e.endDate ? formatMonth(e.endDate) : "Present"}
                          </p>
                        )}
                        {e.description && <p className="text-slate-600 mt-1">{e.description}</p>}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </Block>
          )}

          {currentTab === "availability" && (
            <Block
              title="Weekly availability"
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
            </Block>
          )}
        </div>
      </div>
    </div>
  );
}

export default ProfileView;
