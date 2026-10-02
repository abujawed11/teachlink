import FormField, { getInputClass } from "../FormField";

function StepProfessional({ values, onChange }) {
  return (
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

      <p className="text-sm text-slate-400">
        Detailed qualifications, certifications, and past teaching experience entries
        will be added here in a later update.
      </p>
    </div>
  );
}

export default StepProfessional;
