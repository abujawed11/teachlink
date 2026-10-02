import { Check } from "lucide-react";

function Stepper({ steps, currentStep }) {
  return (
    <div className="flex items-center justify-between mb-8">
      {steps.map((label, index) => {
        const stepNumber = index + 1;
        const isActive = stepNumber === currentStep;
        const isComplete = stepNumber < currentStep;

        return (
          <div key={label} className="flex-1 flex items-center">
            <div className="flex flex-col items-center gap-1">
              <div
                className={`h-8 w-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${
                  isComplete
                    ? "bg-indigo-600 text-white"
                    : isActive
                      ? "bg-indigo-100 text-indigo-700 ring-2 ring-indigo-600"
                      : "bg-slate-200 text-slate-500"
                }`}
              >
                {isComplete ? <Check className="h-4 w-4" /> : stepNumber}
              </div>
              <span
                className={`text-xs ${isActive ? "text-indigo-700 font-medium" : "text-slate-500"}`}
              >
                {label}
              </span>
            </div>
            {stepNumber < steps.length && (
              <div
                className={`flex-1 h-0.5 mx-2 ${isComplete ? "bg-indigo-600" : "bg-slate-200"}`}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

export default Stepper;
