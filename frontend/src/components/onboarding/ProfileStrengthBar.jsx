import { getStrengthMessage } from "./validation";

function ProfileStrengthBar({ percent }) {
  const barColor =
    percent >= 75 ? "bg-emerald-500" : percent >= 40 ? "bg-amber-500" : "bg-red-400";

  return (
    <div className="mb-6">
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-sm font-medium text-slate-600">
          Profile strength: {percent}%
        </span>
        <span className="text-sm text-slate-500">{getStrengthMessage(percent)}</span>
      </div>
      <div className="h-2 w-full bg-slate-200 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ease-out ${barColor}`}
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
}

export default ProfileStrengthBar;
