import { AlertTriangle, Info } from "lucide-react";

export interface ExecutionOptionsState {
  ifNotExists: boolean;
  dropIfExists: boolean;
}

interface ExecutionOptionsProps {
  options: ExecutionOptionsState;
  onChange: (options: ExecutionOptionsState) => void;
  className?: string;
}

/**
 * Execution options section with checkboxes for IF NOT EXISTS and DROP TABLE.
 * Includes warning for destructive DROP TABLE operation.
 */
export const ExecutionOptions = ({
  options,
  onChange,
  className = "",
}: ExecutionOptionsProps) => {
  const handleIfNotExistsChange = (checked: boolean) => {
    onChange({
      ...options,
      ifNotExists: checked,
      // If enabling IF NOT EXISTS, disable DROP (they're mutually exclusive in behavior)
      dropIfExists: checked ? false : options.dropIfExists,
    });
  };

  const handleDropIfExistsChange = (checked: boolean) => {
    onChange({
      ...options,
      dropIfExists: checked,
      // If enabling DROP, disable IF NOT EXISTS (DROP will recreate anyway)
      ifNotExists: checked ? false : options.ifNotExists,
    });
  };

  return (
    <div className={`rounded-xl border border-border bg-surface p-4 ${className}`}>
      <div className="flex items-center gap-2 mb-4">
        <h3 className="text-sm font-semibold text-content-primary">
          Execution Options
        </h3>
      </div>

      <div className="space-y-4">
        {/* IF NOT EXISTS Option */}
        <label className="flex items-start gap-3 cursor-pointer group focus-within:ring-2 focus-within:ring-brand-500/30 focus-within:rounded-lg p-1 -m-1">
          <div className="relative flex items-center justify-center shrink-0 mt-0.5">
            <input
              type="checkbox"
              checked={options.ifNotExists}
              onChange={(e) => handleIfNotExistsChange(e.target.checked)}
              className="peer sr-only"
              aria-label="Use IF NOT EXISTS to skip creation if table already exists"
            />
            <div className="w-5 h-5 rounded border-2 border-border bg-surface-subtle 
              peer-checked:bg-brand-500 peer-checked:border-brand-500 
              peer-focus:ring-2 peer-focus:ring-brand-500/30 
              transition-all duration-200 flex items-center justify-center">
              {options.ifNotExists && (
                <svg className="w-3 h-3 text-white" viewBox="0 0 12 12" fill="none">
                  <path
                    d="M2 6L5 9L10 3"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              )}
            </div>
          </div>
          <div className="flex-1">
            <span className="text-sm font-medium text-content-primary group-hover:text-brand-500 transition-colors">
              Use IF NOT EXISTS
            </span>
            <p className="mt-0.5 text-xs text-content-muted flex items-start gap-1.5">
              <Info className="w-3.5 h-3.5 shrink-0 mt-0.5" />
              <span>
                Skip table creation silently if the table already exists. No error will be thrown.
              </span>
            </p>
          </div>
        </label>

        {/* DROP TABLE IF EXISTS Option */}
        <label className="flex items-start gap-3 cursor-pointer group focus-within:ring-2 focus-within:ring-status-error-text/30 focus-within:rounded-lg p-1 -m-1">
          <div className="relative flex items-center justify-center shrink-0 mt-0.5">
            <input
              type="checkbox"
              checked={options.dropIfExists}
              onChange={(e) => handleDropIfExistsChange(e.target.checked)}
              className="peer sr-only"
              aria-label="Drop existing table before creation (destructive - will delete all data)"
            />
            <div className="w-5 h-5 rounded border-2 border-border bg-surface-subtle 
              peer-checked:bg-status-error-text peer-checked:border-status-error-text 
              peer-focus:ring-2 peer-focus:ring-status-error-text/30 
              transition-all duration-200 flex items-center justify-center">
              {options.dropIfExists && (
                <svg className="w-3 h-3 text-white" viewBox="0 0 12 12" fill="none">
                  <path
                    d="M2 6L5 9L10 3"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              )}
            </div>
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-content-primary group-hover:text-status-error-text transition-colors">
                Drop existing table
              </span>
              <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold uppercase bg-status-error-bg text-status-error-text">
                Destructive
              </span>
            </div>
            <p className="mt-0.5 text-xs text-content-muted flex items-start gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5 text-status-error-text/70" />
              <span>
                Drop the table if it exists before creating. <strong className="text-status-error-text/90">All existing data will be deleted.</strong>
              </span>
            </p>
          </div>
        </label>
      </div>

      {/* Warning Banner when DROP is selected */}
      {options.dropIfExists && (
        <div className="mt-4 p-3 rounded-lg bg-status-error-bg/50 border border-status-error-text/20 flex items-start gap-2">
          <AlertTriangle className="w-4 h-4 text-status-error-text shrink-0 mt-0.5" />
          <div className="text-xs text-status-error-text">
            <p className="font-semibold">Warning: Destructive Operation</p>
            <p className="mt-0.5 text-status-error-text/80">
              The existing table and all its data will be permanently deleted before creating the new table. This action cannot be undone.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
