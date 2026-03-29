import { useState, useCallback, useRef, useEffect } from "react";
import { AlertCircle, ChevronDown, ChevronUp, Copy, Check } from "lucide-react";

interface ParsedExecutionError {
  message: string;
  code?: string;
  detailItems: string[];
  rawError?: unknown;
}

interface ErrorPanelProps {
  error: ParsedExecutionError;
  className?: string;
}

/**
 * Collapsible error panel with expandable details and copy functionality.
 * Supports light/dark mode via CSS variables.
 */
export const ErrorPanel = ({ error, className = "" }: ErrorPanelProps) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [copied, setCopied] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const hasDetails = error.detailItems.length > 0;

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const handleCopyError = useCallback(async () => {
    const errorText = [
      `Error: ${error.message}`,
      error.code ? `Code: ${error.code}` : null,
      hasDetails ? `\nDetails:\n${error.detailItems.map((item) => `  • ${item}`).join("\n")}` : null,
    ]
      .filter(Boolean)
      .join("\n");

    try {
      await navigator.clipboard.writeText(errorText);
      setCopied(true);

      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      timeoutRef.current = setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy error:", err);
    }
  }, [error, hasDetails]);

  return (
    <div
      className={`rounded-xl border border-status-error-text/25 bg-status-error-bg overflow-hidden ${className}`}
      role="alert"
      aria-live="polite"
    >
      {/* Header */}
      <div className="px-4 py-3 flex items-start gap-3">
        <AlertCircle className="w-5 h-5 text-status-error-text shrink-0 mt-0.5" />
        
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-status-error-text">
                Execution Failed
              </p>
              <p className="mt-1 text-sm text-status-error-text/90 break-words">
                {error.message}
              </p>
              {error.code && (
                <p className="mt-1 text-xs text-status-error-text/70 font-mono">
                  {error.code}
                </p>
              )}
            </div>
            
            <div className="flex items-center gap-2 shrink-0">
              {/* Copy Button */}
              <button
                onClick={handleCopyError}
                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs rounded-lg 
                  bg-status-error-text/10 text-status-error-text hover:bg-status-error-text/20 
                  transition-all duration-200"
                aria-label={copied ? "Copied to clipboard" : "Copy error details"}
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    <span>Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy</span>
                  </>
                )}
              </button>

              {/* Expand/Collapse Button */}
              {hasDetails && (
                <button
                  onClick={() => setIsExpanded(!isExpanded)}
                  className="inline-flex items-center justify-center w-8 h-8 rounded-lg 
                    bg-status-error-text/10 text-status-error-text hover:bg-status-error-text/20 
                    transition-all duration-200"
                  aria-expanded={isExpanded}
                  aria-controls="error-details"
                  aria-label={isExpanded ? "Collapse details" : "Expand details"}
                >
                  {isExpanded ? (
                    <ChevronUp className="w-4 h-4" />
                  ) : (
                    <ChevronDown className="w-4 h-4" />
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Expandable Details Section */}
      {hasDetails && (
        <div
          id="error-details"
          className={`overflow-hidden transition-all duration-300 ease-in-out ${
            isExpanded ? "max-h-[600px]" : "max-h-0"
          }`}
        >
          <div className="px-4 pb-4">
            <div className="border-t border-status-error-text/20 pt-3">
              <p className="text-xs font-medium text-status-error-text/80 mb-2">
                Details ({error.detailItems.length} {error.detailItems.length === 1 ? "item" : "items"}):
              </p>
              <div className="max-h-48 overflow-y-auto rounded-lg bg-status-error-text/5 p-3">
                <ul className="space-y-1.5 text-sm text-status-error-text/90">
                  {error.detailItems.map((item, index) => (
                    <li key={`detail-${index}`} className="flex items-start gap-2">
                      <span className="text-status-error-text/60 shrink-0">•</span>
                      <span className="break-words">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
