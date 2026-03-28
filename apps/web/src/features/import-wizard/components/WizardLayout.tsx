import { ReactNode, useRef, useState, useEffect } from "react";
import { ChevronDown, FileText } from "lucide-react";
import { Stepper } from "./Stepper";
import { useWizardStore } from "../store/wizard.store";

interface WizardLayoutProps {
  children: ReactNode;
}

export const WizardLayout = ({ children }: WizardLayoutProps) => {
  const { currentStep, selectedFile } = useWizardStore();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const stepHeading =
    ["Upload", "Preview", "Schema", "SQL", "Execute"][currentStep] ?? "Import";
  const stepSubheading =
    [
      "Choose your file",
      "Review raw data",
      "Edit schema",
      "Review SQL",
      "Run on database",
    ][currentStep] ?? "";

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsDropdownOpen(false);
      }
    };

    if (isDropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isDropdownOpen]);

  return (
    <div className="flex h-full min-h-[600px] flex-col bg-surface-muted">
      <div className="border-b border-border bg-surface px-6 py-5">
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] lg:items-center">
          <div className="min-w-0">
            <h2 className="text-3xl font-semibold tracking-tight text-content-primary">
              {stepHeading}
            </h2>
            <p className="mt-1 text-content-secondary">{stepSubheading}</p>
          </div>

          <div className="w-full lg:w-auto lg:justify-self-center">
            <div className="mx-auto w-fit">
              <Stepper currentStep={currentStep} />
            </div>
          </div>

          <div className="flex min-h-[2.5rem] items-center lg:justify-self-end">
            {selectedFile?.name ? (
              <div ref={dropdownRef} className="relative">
                <button
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  className="inline-flex items-center gap-2 rounded-xl border border-border bg-surface-subtle px-3 py-2 text-sm font-medium text-content-primary transition-colors hover:bg-surface-subtle/80 hover:border-border-strong"
                  aria-label="Toggle selected file dropdown"
                >
                  <span>Selected file</span>
                  <ChevronDown
                    className={`h-4 w-4 transition-transform duration-200 ${
                      isDropdownOpen ? "rotate-180" : ""
                    }`}
                    strokeWidth={2}
                  />
                </button>

                {isDropdownOpen && (
                  <div className="absolute right-0 top-full z-10 mt-1 w-max rounded-lg border border-border bg-surface shadow-lg">
                    <div className="flex items-center gap-2 px-3 py-2.5">
                      <FileText
                        className="h-4 w-4 shrink-0 text-brand-400"
                        strokeWidth={2}
                      />
                      <span
                        className="max-w-xs truncate text-sm font-medium text-content-primary"
                        title={selectedFile.name}
                      >
                        {selectedFile.name}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div aria-hidden />
            )}
          </div>
        </div>
      </div>

      <div className="flex-1 p-8">
        <div
          key={currentStep}
          className="mx-auto h-full max-w-full space-y-6 animate-in fade-in slide-in-from-right-1 duration-300"
        >
          {children}
        </div>
      </div>
    </div>
  );
};
