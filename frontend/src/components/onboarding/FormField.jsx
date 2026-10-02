function FormField({ label, required, error, children }) {
  return (
    <div>
      <label className="block text-sm font-medium text-slate-700 mb-1">
        {label}
        {required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      {children}
      {error && <p className="text-xs text-red-600 mt-1">{error}</p>}
    </div>
  );
}

const baseInputClass =
  "w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:border-transparent transition-colors";

function getInputClass(hasError) {
  return hasError
    ? `${baseInputClass} border-red-300 focus:ring-red-500`
    : `${baseInputClass} border-slate-300 focus:ring-indigo-500`;
}

const inputClass = getInputClass(false);

export { inputClass, getInputClass };
export default FormField;
