import FormField, { getInputClass } from "../FormField";

function StepLocation({ values, onChange, errors = {} }) {
  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-slate-800">Location</h2>
      <p className="text-sm text-slate-500">
        Where can students find and reach you?
      </p>

      <div className="grid grid-cols-2 gap-4">
        <FormField label="Country">
          <input
            type="text"
            value={values.country || ""}
            onChange={(e) => onChange("country", e.target.value)}
            className={getInputClass(false)}
          />
        </FormField>

        <FormField label="State">
          <input
            type="text"
            value={values.state || ""}
            onChange={(e) => onChange("state", e.target.value)}
            className={getInputClass(false)}
          />
        </FormField>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <FormField label="City" required error={errors.city}>
          <input
            type="text"
            value={values.city || ""}
            onChange={(e) => onChange("city", e.target.value)}
            className={getInputClass(Boolean(errors.city))}
          />
        </FormField>

        <FormField label="Area / Locality">
          <input
            type="text"
            value={values.area || ""}
            onChange={(e) => onChange("area", e.target.value)}
            className={getInputClass(false)}
          />
        </FormField>
      </div>

      <FormField label="Pincode">
        <input
          type="text"
          value={values.pincode || ""}
          onChange={(e) => onChange("pincode", e.target.value)}
          maxLength={20}
          className={getInputClass(false)}
        />
      </FormField>

      <p className="text-sm text-slate-400">
        Your exact pincode is never shown on your public profile — only city and area.
      </p>
    </div>
  );
}

export default StepLocation;
