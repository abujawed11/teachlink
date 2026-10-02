import FormField, { inputClass } from "../FormField";

function StepProfessional({ values, onChange }) {
  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-slate-800">Professional Details</h2>

      <FormField label="Qualification Summary">
        <input
          type="text"
          value={values.qualificationSummary || ""}
          onChange={(e) => onChange("qualificationSummary", e.target.value)}
          placeholder="e.g. M.Sc. Mathematics, B.Ed."
          maxLength={255}
          className={inputClass}
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
          className={inputClass}
        />
      </FormField>

      <p className="text-sm text-slate-400">
        Detailed qualifications, certifications, and past teaching experience entries
        will be added here in a later update.
      </p>
    </div>
  );
}

export default StepProfessional;
