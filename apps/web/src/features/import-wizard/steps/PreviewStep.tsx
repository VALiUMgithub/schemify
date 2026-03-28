import { useWizardStore } from "../store/wizard.store";
import { useParseImport } from "../hooks/useParseImport";

export const PreviewStep = () => {
  const { importId, setStep } = useWizardStore();
  const { data: parseData, isLoading, error } = useParseImport(importId);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-full space-y-4">
        <div className="w-12 h-12 border-4 border-brand-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-content-secondary font-medium">
          Parsing file and generating preview...
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 bg-surface rounded-2xl border border-status-error-text/30">
        <h3 className="text-lg font-medium text-status-error-text mb-2">
          Error parsing file
        </h3>
        <p className="text-status-error-text/90">
          {error instanceof Error ? error.message : "Unknown error"}
        </p>
        <button
          onClick={() => setStep(0)}
          className="mt-4 px-4 py-2 border border-border rounded-lg hover:bg-surface-subtle text-sm font-medium text-content-primary"
        >
          Go Back
        </button>
      </div>
    );
  }

  const columns = parseData?.columns || [];
  const rows = parseData?.rowsPreview || [];
  const totalRowCount = parseData?.totalRowCount || 0;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between text-sm text-content-secondary bg-surface-subtle border border-border rounded-lg px-4 py-3">
        <p>
          Showing{" "}
          <span className="font-semibold text-content-primary">50 rows</span>{" "}
          for preview
        </p>
        <span className="font-medium text-content-primary">
          {totalRowCount} rows • {columns.length} columns
        </span>
      </div>

      <div className="rounded-2xl border border-border bg-surface overflow-hidden flex flex-col">
        <div className="max-h-[500px] overflow-y-auto overflow-x-auto">
          <table className="min-w-full divide-y divide-border">
            <thead className="bg-surface-subtle sticky top-0 z-10">
              <tr>
                {columns.map((col, idx) => (
                  <th
                    key={idx}
                    className="px-6 py-3 text-left text-xs font-semibold text-content-muted uppercase tracking-wider whitespace-nowrap bg-surface-subtle border-b border-border"
                  >
                    {col.name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-surface divide-y divide-border/60">
              {rows.map((row, rowIdx) => (
                <tr
                  key={rowIdx}
                  className="hover:bg-surface-subtle/70 transition-colors"
                >
                  {columns.map((col, colIdx) => (
                    <td
                      key={colIdx}
                      className="px-6 py-3 whitespace-nowrap text-sm text-content-secondary"
                    >
                      {row[col.name] !== null && row[col.name] !== undefined ? (
                        String(row[col.name])
                      ) : (
                        <span className="text-content-muted italic">null</span>
                      )}
                    </td>
                  ))}
                </tr>
              ))}
              {rows.length === 0 && (
                <tr>
                  <td
                    colSpan={columns.length || 1}
                    className="px-6 py-8 text-center text-content-muted text-sm"
                  >
                    No data found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="flex items-center justify-between text-content-muted text-sm">
        <span>
          Showing rows 1-{rows.length} of {rows.length} preview rows
        </span>
        <span>Page 1 / 1</span>
      </div>

      <div className="flex justify-between border-t border-border pt-4">
        <button
          onClick={() => setStep(0)}
          className="px-2 py-2.5 text-content-secondary font-medium rounded-xl hover:text-content-primary transition-colors"
        >
          ← Back
        </button>
        <button
          onClick={() => setStep(2)}
          className="px-6 py-2.5 bg-brand-500 text-content-inverse font-semibold rounded-xl hover:bg-brand-600 transition-colors"
        >
          Continue to Schema →
        </button>
      </div>
    </div>
  );
};
