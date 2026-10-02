// Small presentational helpers shared by the admin tabs.

export const controlClass =
  "border border-slate-300 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent";

const BADGE_TONES = {
  green: "bg-emerald-100 text-emerald-700",
  amber: "bg-amber-100 text-amber-700",
  red: "bg-red-100 text-red-700",
  slate: "bg-slate-100 text-slate-600",
  indigo: "bg-indigo-100 text-indigo-700",
};

export function Badge({ tone = "slate", children }) {
  return (
    <span className={`inline-block text-xs font-medium px-2 py-0.5 rounded-full ${BADGE_TONES[tone]}`}>
      {children}
    </span>
  );
}

export function ActionButton({ tone = "default", children, ...props }) {
  const tones = {
    default: "text-indigo-600 hover:bg-indigo-50",
    danger: "text-red-600 hover:bg-red-50",
  };
  return (
    <button
      type="button"
      {...props}
      className={`text-sm font-medium px-2.5 py-1 rounded-lg transition-colors disabled:opacity-40 ${tones[tone]}`}
    >
      {children}
    </button>
  );
}

export function ErrorNote({ children }) {
  if (!children) return null;
  return (
    <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
      {children}
    </p>
  );
}

export function TableShell({ children }) {
  return (
    <div className="bg-white border border-slate-200 rounded-xl overflow-x-auto">
      <table className="w-full text-sm text-left">{children}</table>
    </div>
  );
}

export const th = "px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide bg-slate-50";
export const td = "px-4 py-3 border-t border-slate-100 align-middle";

export const formatDate = (value) =>
  new Date(value).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
