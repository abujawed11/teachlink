import { useState } from "react";

import {
  addExperience,
  addQualification,
  deleteExperience,
  deleteQualification,
} from "../../../api/teacherApi";
import FormField, { getInputClass } from "../FormField";

function StepProfessional({ values, onChange, onProfileUpdate }) {
  const [qualForm, setQualForm] = useState({ title: "", institution: "", yearCompleted: "" });
  const [qualSaving, setQualSaving] = useState(false);
  const [qualError, setQualError] = useState("");

  const [expForm, setExpForm] = useState({ institutionName: "", role: "", startDate: "", endDate: "" });
  const [expSaving, setExpSaving] = useState(false);
  const [expError, setExpError] = useState("");

  const handleAddQualification = async () => {
    if (!qualForm.title.trim()) {
      setQualError("Title is required");
      return;
    }
    setQualError("");
    setQualSaving(true);
    try {
      const updated = await addQualification({
        title: qualForm.title,
        institution: qualForm.institution || null,
        yearCompleted: qualForm.yearCompleted ? Number(qualForm.yearCompleted) : null,
      });
      onProfileUpdate(updated);
      setQualForm({ title: "", institution: "", yearCompleted: "" });
    } catch (err) {
      setQualError(err.response?.data?.error?.message || "Could not add qualification");
    } finally {
      setQualSaving(false);
    }
  };

  const handleRemoveQualification = async (id) => {
    const updated = await deleteQualification(id);
    onProfileUpdate(updated);
  };

  const handleAddExperience = async () => {
    if (!expForm.institutionName.trim()) {
      setExpError("Institution name is required");
      return;
    }
    setExpError("");
    setExpSaving(true);
    try {
      const updated = await addExperience({
        institutionName: expForm.institutionName,
        role: expForm.role || null,
        startDate: expForm.startDate || null,
        endDate: expForm.endDate || null,
      });
      onProfileUpdate(updated);
      setExpForm({ institutionName: "", role: "", startDate: "", endDate: "" });
    } catch (err) {
      setExpError(err.response?.data?.error?.message || "Could not add experience");
    } finally {
      setExpSaving(false);
    }
  };

  const handleRemoveExperience = async (id) => {
    const updated = await deleteExperience(id);
    onProfileUpdate(updated);
  };

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-slate-800">Professional Details</h2>
        <p className="text-sm text-slate-500">
          Your qualifications build trust with parents and students.
        </p>

        <FormField label="Qualification Summary">
          <input
            type="text"
            value={values.qualificationSummary || ""}
            onChange={(e) => onChange("qualificationSummary", e.target.value)}
            placeholder="e.g. M.Sc. Mathematics, B.Ed."
            maxLength={255}
            className={getInputClass(false)}
          />
        </FormField>

        <FormField label="Years of Experience">
          <input
            type="number"
            min={0}
            max={80}
            value={values.experienceYears ?? ""}
            onChange={(e) =>
              onChange(
                "experienceYears",
                e.target.value === "" ? null : Number(e.target.value)
              )
            }
            className={getInputClass(false)}
          />
        </FormField>
      </div>

      <div className="border-t border-slate-100 pt-4 space-y-3">
        <h3 className="text-sm font-semibold text-slate-700">Degrees &amp; Certifications</h3>

        {values.qualifications?.length > 0 && (
          <ul className="space-y-1">
            {values.qualifications.map((q) => (
              <li
                key={q.id}
                className="flex items-center justify-between text-sm bg-slate-50 rounded-lg px-3 py-2"
              >
                <span>
                  {q.title}
                  {q.institution && ` — ${q.institution}`}
                  {q.yearCompleted && ` (${q.yearCompleted})`}
                </span>
                <button
                  type="button"
                  onClick={() => handleRemoveQualification(q.id)}
                  className="text-red-500 hover:text-red-700 text-xs"
                >
                  Remove
                </button>
              </li>
            ))}
          </ul>
        )}

        {qualError && <p className="text-xs text-red-600">{qualError}</p>}

        <div className="grid grid-cols-3 gap-2">
          <input
            type="text"
            placeholder="Title (e.g. B.Ed.)"
            value={qualForm.title}
            onChange={(e) => setQualForm({ ...qualForm, title: e.target.value })}
            className={getInputClass(false)}
          />
          <input
            type="text"
            placeholder="Institution"
            value={qualForm.institution}
            onChange={(e) => setQualForm({ ...qualForm, institution: e.target.value })}
            className={getInputClass(false)}
          />
          <input
            type="number"
            placeholder="Year"
            value={qualForm.yearCompleted}
            onChange={(e) => setQualForm({ ...qualForm, yearCompleted: e.target.value })}
            className={getInputClass(false)}
          />
        </div>
        <button
          type="button"
          onClick={handleAddQualification}
          disabled={qualSaving}
          className="text-sm text-indigo-600 font-medium hover:underline disabled:opacity-50"
        >
          {qualSaving ? "Adding..." : "+ Add qualification"}
        </button>
      </div>

      <div className="border-t border-slate-100 pt-4 space-y-3">
        <h3 className="text-sm font-semibold text-slate-700">Teaching Experience</h3>

        {values.experiences?.length > 0 && (
          <ul className="space-y-1">
            {values.experiences.map((e) => (
              <li
                key={e.id}
                className="flex items-center justify-between text-sm bg-slate-50 rounded-lg px-3 py-2"
              >
                <span>
                  {e.institutionName}
                  {e.role && ` — ${e.role}`}
                </span>
                <button
                  type="button"
                  onClick={() => handleRemoveExperience(e.id)}
                  className="text-red-500 hover:text-red-700 text-xs"
                >
                  Remove
                </button>
              </li>
            ))}
          </ul>
        )}

        {expError && <p className="text-xs text-red-600">{expError}</p>}

        <div className="grid grid-cols-2 gap-2">
          <input
            type="text"
            placeholder="School / Institution name"
            value={expForm.institutionName}
            onChange={(e) => setExpForm({ ...expForm, institutionName: e.target.value })}
            className={getInputClass(false)}
          />
          <input
            type="text"
            placeholder="Role (e.g. Math Teacher)"
            value={expForm.role}
            onChange={(e) => setExpForm({ ...expForm, role: e.target.value })}
            className={getInputClass(false)}
          />
        </div>
        <button
          type="button"
          onClick={handleAddExperience}
          disabled={expSaving}
          className="text-sm text-indigo-600 font-medium hover:underline disabled:opacity-50"
        >
          {expSaving ? "Adding..." : "+ Add experience"}
        </button>
      </div>
    </div>
  );
}

export default StepProfessional;
