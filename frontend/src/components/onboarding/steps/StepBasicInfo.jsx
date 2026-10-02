import FormField, { inputClass } from "../FormField";

function StepBasicInfo({ values, onChange }) {
  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-slate-800">Basic Information</h2>

      <FormField label="Headline">
        <input
          type="text"
          value={values.headline || ""}
          onChange={(e) => onChange("headline", e.target.value)}
          placeholder="e.g. Experienced Mathematics Tutor for Classes 9-12"
          maxLength={150}
          className={inputClass}
        />
      </FormField>

      <FormField label="Bio">
        <textarea
          value={values.bio || ""}
          onChange={(e) => onChange("bio", e.target.value)}
          rows={5}
          maxLength={3000}
          placeholder="Tell students and parents about your teaching style and background."
          className={inputClass}
        />
      </FormField>

      <FormField label="Profile Photo URL">
        <input
          type="url"
          value={values.photoUrl || ""}
          onChange={(e) => onChange("photoUrl", e.target.value)}
          placeholder="https://..."
          className={inputClass}
        />
      </FormField>

      <FormField label="Gender (optional)">
        <select
          value={values.gender || ""}
          onChange={(e) => onChange("gender", e.target.value || null)}
          className={inputClass}
        >
          <option value="">Prefer not to say</option>
          <option value="MALE">Male</option>
          <option value="FEMALE">Female</option>
          <option value="OTHER">Other</option>
        </select>
      </FormField>
    </div>
  );
}

export default StepBasicInfo;
