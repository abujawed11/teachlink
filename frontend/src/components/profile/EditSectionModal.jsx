import { useEffect, useState } from "react";

import { saveStep } from "../onboarding/stepSave";
import StepAvailability from "../onboarding/steps/StepAvailability";
import StepBasicInfo from "../onboarding/steps/StepBasicInfo";
import StepLocation from "../onboarding/steps/StepLocation";
import StepProfessional from "../onboarding/steps/StepProfessional";
import StepSubjects from "../onboarding/steps/StepSubjects";
import StepTuition from "../onboarding/steps/StepTuition";
import { validateStep } from "../onboarding/validation";

// Maps a profile section to the onboarding step that owns its fields.
const SECTIONS = {
  basic: { step: 1, title: "Edit basic info" },
  professional: { step: 2, title: "Edit qualifications & experience" },
  subjects: { step: 3, title: "Edit subjects, classes & boards" },
  tuition: { step: 4, title: "Edit teaching options" },
  location: { step: 5, title: "Edit location" },
  availability: { step: 6, title: "Edit availability" },
};

const TEACHING_MODE_FIELDS = ["onlineAvailable", "offlineAvailable", "homeTuitionAvailable"];

function EditSectionModal({ section, profile, lookups, onSaved, onClose }) {
  const { step, title } = SECTIONS[section];
  const [draft, setDraft] = useState(profile);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKeyDown);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  const clearErrors = (keys) =>
    setErrors((prev) => {
      const next = { ...prev };
      keys.forEach((key) => delete next[key]);
      return next;
    });

  const handleChange = (field, value) => {
    setDraft((prev) => ({ ...prev, [field]: value }));
    const toClear = [field];
    if (TEACHING_MODE_FIELDS.includes(field) && value) toClear.push("teachingModes");
    clearErrors(toClear);
  };

  const handleToggleRelation = (field, item) => {
    setDraft((prev) => {
      const exists = prev[field].some((i) => i.id === item.id);
      const next = exists ? prev[field].filter((i) => i.id !== item.id) : [...prev[field], item];
      return { ...prev, [field]: next };
    });
    clearErrors([field]);
  };

  // Sub-resources (qualifications, experience, slots) are saved the moment they're added or
  // removed, so merge only those lists — replacing the whole draft would drop unsaved text edits.
  const handleSubResourcesUpdate = (updated) =>
    setDraft((prev) => ({
      ...prev,
      qualifications: updated.qualifications,
      experiences: updated.experiences,
      availabilities: updated.availabilities,
    }));

  const handleSave = async () => {
    setError("");
    const stepErrors = validateStep(step, draft);
    if (Object.keys(stepErrors).length > 0) {
      setErrors(stepErrors);
      return;
    }

    setSaving(true);
    try {
      const updated = await saveStep(step, draft);
      onSaved(updated);
    } catch (err) {
      setError(err.response?.data?.error?.message || "Could not save your changes");
      setSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 animate-[fadeIn_0.15s_ease-out]"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="w-full max-w-2xl max-h-[90vh] flex flex-col bg-white rounded-2xl shadow-2xl overflow-hidden animate-[scaleIn_0.15s_ease-out]"
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h2 className="text-lg font-semibold text-slate-800">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="text-slate-400 hover:text-slate-600 text-xl leading-none"
          >
            ×
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5">
          {error && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2 mb-4">
              {error}
            </p>
          )}

          {step === 1 && <StepBasicInfo values={draft} onChange={handleChange} errors={errors} />}
          {step === 2 && (
            <StepProfessional
              values={draft}
              onChange={handleChange}
              onProfileUpdate={handleSubResourcesUpdate}
            />
          )}
          {step === 3 && (
            <StepSubjects
              values={draft}
              onToggle={handleToggleRelation}
              lookups={lookups}
              errors={errors}
            />
          )}
          {step === 4 && <StepTuition values={draft} onChange={handleChange} errors={errors} />}
          {step === 5 && <StepLocation values={draft} onChange={handleChange} errors={errors} />}
          {step === 6 && (
            <StepAvailability values={draft} onProfileUpdate={handleSubResourcesUpdate} />
          )}
        </div>

        <div className="flex justify-end gap-2 px-6 py-4 border-t border-slate-100 bg-slate-50">
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="text-slate-600 hover:text-slate-800 px-4 py-2"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-medium px-5 py-2 rounded-lg transition-colors"
          >
            {saving ? "Saving..." : "Save changes"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default EditSectionModal;
