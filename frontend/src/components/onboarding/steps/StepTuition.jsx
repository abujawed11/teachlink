import FormField, { getInputClass } from "../FormField";

const MODE_FIELDS = [
  ["onlineAvailable", "Online teaching"],
  ["offlineAvailable", "Offline / in-person teaching"],
  ["homeTuitionAvailable", "Home tuition (teacher visits student)"],
  ["studentCanVisit", "Student can visit teacher"],
  ["groupTuitionAvailable", "Group tuition"],
  ["individualTuitionAvailable", "Individual (1-on-1) tuition"],
  ["demoClassAvailable", "Free demo class available"],
];

function StepTuition({ values, onChange, errors = {} }) {
  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-slate-800">Tuition Preferences</h2>
      <p className="text-sm text-slate-500">How and where do you like to teach?</p>

      <div>
        <p className="text-sm font-medium text-slate-700 mb-1">
          Teaching Modes<span className="text-red-500 ml-0.5">*</span>
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {MODE_FIELDS.map(([field, label]) => (
            <label
              key={field}
              className="flex items-center gap-2 text-sm text-slate-700 bg-slate-50 rounded-lg px-3 py-2"
            >
              <input
                type="checkbox"
                checked={Boolean(values[field])}
                onChange={(e) => onChange(field, e.target.checked)}
                className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
              />
              {label}
            </label>
          ))}
        </div>
        {errors.teachingModes && (
          <p className="text-xs text-red-600 mt-1">{errors.teachingModes}</p>
        )}
      </div>

      {values.homeTuitionAvailable && (
        <FormField label="Teaching Radius (km)">
          <input
            type="number"
            min={0}
            max={500}
            value={values.teachingRadiusKm ?? ""}
            onChange={(e) =>
              onChange(
                "teachingRadiusKm",
                e.target.value === "" ? null : Number(e.target.value)
              )
            }
            className={getInputClass(false)}
          />
        </FormField>
      )}

      <div className="grid grid-cols-2 gap-4">
        <FormField label="Fee Min (per month)" error={errors.feeMin}>
          <input
            type="number"
            min={0}
            value={values.feeMin ?? ""}
            onChange={(e) =>
              onChange("feeMin", e.target.value === "" ? null : Number(e.target.value))
            }
            className={getInputClass(Boolean(errors.feeMin))}
          />
        </FormField>

        <FormField label="Fee Max (per month)">
          <input
            type="number"
            min={0}
            value={values.feeMax ?? ""}
            onChange={(e) =>
              onChange("feeMax", e.target.value === "" ? null : Number(e.target.value))
            }
            className={getInputClass(false)}
          />
        </FormField>
      </div>

      <FormField label="Preferred Contact Method">
        <select
          value={values.contactPreference || "PLATFORM_ONLY"}
          onChange={(e) => onChange("contactPreference", e.target.value)}
          className={getInputClass(false)}
        >
          <option value="PLATFORM_ONLY">Platform contact form only (recommended)</option>
          <option value="PHONE">Show my phone number</option>
          <option value="WHATSAPP">Show my WhatsApp number</option>
        </select>
      </FormField>

      {values.contactPreference && values.contactPreference !== "PLATFORM_ONLY" && (
        <FormField
          label={values.contactPreference === "WHATSAPP" ? "WhatsApp Number" : "Phone Number"}
          required
          error={errors.contactNumber}
        >
          <input
            type="tel"
            placeholder="+91 98765 43210"
            maxLength={20}
            value={values.contactNumber ?? ""}
            onChange={(e) => onChange("contactNumber", e.target.value.trim() === "" ? null : e.target.value)}
            className={getInputClass(Boolean(errors.contactNumber))}
          />
          <p className="text-xs text-slate-400 mt-1">
            This will be shown publicly on your profile. Include your country code
            {values.contactPreference === "WHATSAPP" ? " so WhatsApp links work" : ""}.
          </p>
        </FormField>
      )}
    </div>
  );
}

export default StepTuition;
