import { Check } from "lucide-react";

export const WIZARD_STEPS = [
  { id: "upload", label: "Upload" },
  { id: "preview", label: "Preview" },
  { id: "schema", label: "Schema" },
  { id: "sql", label: "SQL" },
  { id: "execute", label: "Execute" },
];

interface StepperProps {
  currentStep: number;
}

export const Stepper = ({ currentStep }: StepperProps) => {
  return (
    <div className="flex items-center gap-2 md:gap-4 overflow-x-auto">
      {WIZARD_STEPS.map((step, index) => {
        const isActive = index === currentStep;
        const isCompleted = index < currentStep;

        return (
          <div key={step.id} className="flex items-center min-w-fit">
            <div className="flex flex-col items-center gap-2">
              <div
                className={`w-9 h-9 rounded-full border flex items-center justify-center font-semibold text-sm transition-colors ${
                  isActive
                    ? "bg-brand-600/15 border-brand-500 text-brand-400"
                    : isCompleted
                      ? "bg-brand-500 border-brand-500 text-content-inverse"
                      : "bg-surface-subtle border-border text-content-muted"
                }`}
              >
                {isCompleted ? <Check className="w-4 h-4" strokeWidth={2.5} /> : index + 1}
              </div>
              <span
                className={`text-sm font-medium ${
                  isActive
                    ? "text-brand-400"
                    : isCompleted
                      ? "text-content-primary"
                      : "text-content-muted"
                }`}
              >
                {step.label}
              </span>
            </div>
            {index < WIZARD_STEPS.length - 1 && (
              <div className="w-10 md:w-20 px-2 md:px-4 -mt-5">
                <div
                  className={`h-0.5 w-full rounded ${
                    isCompleted ? "bg-brand-600" : "bg-border"
                  }`}
                />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};
