import FormField, { getInputClass } from "../FormField";
import PhotoUploadField from "../PhotoUploadField";

function StepBasicInfo({ values, onChange, errors = {} }) {
  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-slate-800">Basic Information</h2>
      <p className="text-sm text-slate-500">
        This is the first thing students and parents will see. Make it count! 👋
      </p>

      <FormField label="Headline" required error={errors.headline}>
        <input
          type="text"
          value={values.headline || ""}
          onChange={(e) => onChange("headline", e.target.value)}
          placeholder="e.g. Experienced Mathematics Tutor for Classes 9-12"
          maxLength={150}
          className={getInputClass(Boolean(errors.headline))}
        />
      </FormField>

      <FormField label="Bio">
        <textarea
          value={values.bio || ""}
          onChange={(e) => onChange("bio", e.target.value)}
          rows={5}
          maxLength={3000}
          placeholder="Tell students and parents about your teaching style and background."
          className={getInputClass(false)}
        />
      </FormField>

      <PhotoUploadField
        value={values.photoUrl}
        onUploaded={(url) => onChange("photoUrl", url)}
      />

      <FormField label="Gender (optional)">
        <select
          value={values.gender || ""}
          onChange={(e) => onChange("gender", e.target.value || null)}
          className={getInputClass(false)}
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
