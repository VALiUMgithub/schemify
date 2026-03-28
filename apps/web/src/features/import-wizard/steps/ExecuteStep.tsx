import { useState } from "react";
import { useWizardStore } from "../store/wizard.store";
import { useExecuteJob } from "../hooks/useExecuteJob";
import { useNavigate } from "react-router-dom";
import { Check } from "lucide-react";
import { CopyButton } from "../../../components/ui/CopyButton";

interface ApiErrorPayload {
  message?: string;
  error?: string;
  code?: string;
  details?: unknown;
}

interface ParsedExecutionError {
  message: string;
  code?: string;
  detailItems: string[];
}

function parseExecutionError(error: unknown): ParsedExecutionError {
  const fallback: ParsedExecutionError = {
    message: "Execution failed. Please review your schema and source data.",
    detailItems: [],
  };

  if (!error || typeof error !== "object") return fallback;

  const withMessage = error as {
    message?: string;
    apiError?: ApiErrorPayload;
    response?: { data?: ApiErrorPayload };
  };
  const payload = withMessage.apiError ?? withMessage.response?.data;
  const message =
    payload?.message ??
    payload?.error ??
    withMessage.message ??
    fallback.message;

  const detailItems: string[] = [];
  const details = payload?.details;

  if (Array.isArray(details)) {
    details.forEach((item) => {
      if (typeof item === "string") detailItems.push(item);
    });
  } else if (details && typeof details === "object") {
    const data = details as {
      sample?: Array<{ column: string; rowNumber: number }>;
      totalViolations?: number;
      column?: string;
    };

    if (typeof data.totalViolations === "number") {
      detailItems.push(`Total violations: ${data.totalViolations}`);
    }
    if (Array.isArray(data.sample) && data.sample.length > 0) {
      data.sample.forEach((entry) => {
        detailItems.push(
          `Row ${entry.rowNumber}: '${entry.column}' has empty/null value but is configured as NOT NULL`,
        );
      });
    }
    if (data.column && !detailItems.length) {
      detailItems.push(`Column: ${data.column}`);
    }
  }

  return {
    message,
    code: payload?.code,
    detailItems,
  };
}

export const ExecuteStep = () => {
  const { importId, setStep, databaseType, tableName, editedSql, generatedSql } = useWizardStore();
  const navigate = useNavigate();

  // Use edited SQL if available, otherwise fall back to generated SQL
  const currentSql = editedSql ?? generatedSql ?? "";

  const [config, setConfig] = useState(() => {
    // Dynamic defaults based on selected database engine
    let defaultPort = 5432;
    let defaultUser = "postgres";

    if (databaseType === "mysql") {
      defaultPort = 3306;
      defaultUser = "root";
    } else if (databaseType === "mssql") {
      defaultPort = 1433;
      defaultUser = "sa";
    }

    return {
      host: "localhost",
      port: defaultPort,
      user: defaultUser,
      password: "",
      database: "mydatabase",
    };
  });

  const {
    mutate: execute,
    isPending,
    data: resultData,
    error,
  } = useExecuteJob(importId);

  const parsedError = error ? parseExecutionError(error) : null;
  const [executionDurationMs, setExecutionDurationMs] = useState<number | null>(
    null,
  );

  const handleExecute = () => {
    const startedAt = Date.now();
    execute(
      {
        databaseType,
        config: {
          ...config,
          port: Number(config.port),
        },
        // Pass the edited SQL to be executed
        sqlScript: currentSql || undefined,
      },
      {
        onSuccess: () => {
          setExecutionDurationMs(Date.now() - startedAt);
        },
      },
    );
  };

  const executionResult = (
    resultData as
      | {
          data?: {
            result?: {
              rowsInserted?: number;
              executionId?: string;
              status?: string;
            };
          };
        }
      | undefined
  )?.data?.result;

  // Use the actual SQL that was executed
  const renderedSql = currentSql || `CREATE TABLE IF NOT EXISTS "${tableName || "import_table"}" (\n  "id" SERIAL PRIMARY KEY\n  -- Generated columns are applied during execution\n);`;

  if (executionResult) {
    return (
      <div className="flex flex-col h-full rounded-2xl">
        <div className="rounded-2xl border border-status-success-text/35 bg-status-success-bg/30 px-6 py-5 flex items-start gap-4">
          <div className="w-12 h-12 rounded-full bg-brand-500/20 text-brand-400 flex items-center justify-center shrink-0">
            <Check className="w-6 h-6" strokeWidth={2.5} />
          </div>
          <div>
            <p className="text-3xl font-semibold text-status-success-text">
              Table Created Successfully
            </p>
            <p className="text-content-secondary mt-1">
              Table '{tableName || "import_table"}' created successfully with{" "}
              {executionResult.rowsInserted ?? 0} inserted rows.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mt-4">
          <div className="rounded-xl border border-border bg-surface p-4">
            <p className="text-content-muted text-sm">Table</p>
            <p className="text-content-primary text-2xl font-semibold mt-1">
              {tableName || "import_table"}
            </p>
          </div>
          <div className="rounded-xl border border-border bg-surface p-4">
            <p className="text-content-muted text-sm">Rows Inserted</p>
            <p className="text-content-primary text-2xl font-semibold mt-1">
              {executionResult.rowsInserted ?? 0}
            </p>
          </div>
          <div className="rounded-xl border border-border bg-surface p-4">
            <p className="text-content-muted text-sm">Duration</p>
            <p className="text-content-primary text-2xl font-semibold mt-1">
              {executionDurationMs ? `${executionDurationMs}ms` : "--"}
            </p>
          </div>
          <div className="rounded-xl border border-border bg-surface p-4">
            <p className="text-content-muted text-sm">Database</p>
            <p className="text-content-primary text-2xl font-semibold mt-1">
              {config.database}
            </p>
          </div>
        </div>

        <div className="mt-4 rounded-xl border border-border bg-surface px-4 py-3 flex items-center justify-between text-content-secondary">
          <span>
            ● {config.user}@{config.host}:{config.port}/{config.database}
          </span>
          <span className="text-content-muted">
            {new Date().toLocaleTimeString()}
          </span>
        </div>

        <div className="mt-4 rounded-2xl border border-border bg-surface-muted overflow-hidden">
          <div className="px-4 py-3 border-b border-border/70 flex items-center justify-between">
            <span className="text-content-secondary">Executed SQL</span>
            <CopyButton text={renderedSql} />
          </div>
          <pre className="p-6 text-content-primary text-sm font-mono whitespace-pre-wrap leading-8">
            {renderedSql}
          </pre>
        </div>

        <div className="mt-5 grid grid-cols-1 md:grid-cols-2 gap-3">
          <button
            onClick={handleExecute}
            disabled={isPending}
            className="px-6 py-3 bg-surface-subtle text-content-primary font-semibold rounded-xl hover:bg-surface-muted transition-colors disabled:opacity-50"
          >
            {isPending ? "Executing..." : "Execute Again"}
          </button>
          <button
            onClick={() => navigate("/imports/new")}
            className="px-6 py-3 bg-brand-500 text-content-inverse font-semibold rounded-xl hover:bg-brand-600 transition-colors"
          >
            New Import
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full rounded-2xl border border-border bg-surface p-6">
      <div className="mb-6 flex items-start justify-between">
        <div>
          <p className="text-lg text-content-secondary">
            Connect to your destination {databaseType} database to build the
            table and insert rows.
          </p>
        </div>
      </div>

      <div className="max-w-2xl space-y-4 rounded-2xl border border-border bg-surface p-6">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-content-secondary mb-1">
              Host
            </label>
            <input
              type="text"
              value={config.host}
              onChange={(e) => setConfig({ ...config, host: e.target.value })}
              className="w-full px-3 py-2 border border-border rounded-xl bg-surface-subtle text-content-primary focus:ring-brand-500/30 focus:border-brand-500 sm:text-sm"
              placeholder="localhost"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-content-secondary mb-1">
              Port
            </label>
            <input
              type="number"
              value={config.port}
              onChange={(e) =>
                setConfig({ ...config, port: parseInt(e.target.value) })
              }
              className="w-full px-3 py-2 border border-border rounded-xl bg-surface-subtle text-content-primary focus:ring-brand-500/30 focus:border-brand-500 sm:text-sm"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-content-secondary mb-1">
            Database Name
          </label>
          <input
            type="text"
            value={config.database}
            onChange={(e) => setConfig({ ...config, database: e.target.value })}
            className="w-full px-3 py-2 border border-border rounded-xl bg-surface-subtle text-content-primary focus:ring-brand-500/30 focus:border-brand-500 sm:text-sm"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-content-secondary mb-1">
              Username
            </label>
            <input
              type="text"
              value={config.user}
              onChange={(e) => setConfig({ ...config, user: e.target.value })}
              className="w-full px-3 py-2 border border-border rounded-xl bg-surface-subtle text-content-primary focus:ring-brand-500/30 focus:border-brand-500 sm:text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-content-secondary mb-1">
              Password
            </label>
            <input
              type="password"
              value={config.password}
              onChange={(e) =>
                setConfig({ ...config, password: e.target.value })
              }
              className="w-full px-3 py-2 border border-border rounded-xl bg-surface-subtle text-content-primary focus:ring-brand-500/30 focus:border-brand-500 sm:text-sm"
            />
          </div>
        </div>
      </div>

      <div className="mt-8">
        {parsedError && (
          <div className="p-4 mb-4 text-sm text-status-error-text bg-status-error-bg rounded-xl border border-status-error-text/25">
            <p className="font-semibold">{parsedError.message}</p>
            {parsedError.code && (
              <p className="mt-1 text-xs text-status-error-text/90">
                Error Code: {parsedError.code}
              </p>
            )}
            {parsedError.detailItems.length > 0 && (
              <ul className="mt-2 list-disc pl-5 space-y-1">
                {parsedError.detailItems.map((item, index) => (
                  <li key={`${item}-${index}`}>{item}</li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>

      <div className="flex-1" />

      <div className="mt-8 flex justify-between pt-4 border-t border-border">
        <button
          onClick={() => setStep(3)}
          className="px-2 py-2.5 text-content-secondary font-medium rounded-xl hover:text-content-primary transition-colors disabled:opacity-50"
          disabled={isPending}
        >
          ← Back to SQL Preview
        </button>
        <button
          onClick={handleExecute}
          disabled={
            isPending || !config.host || !config.database || !config.user
          }
          className="px-6 py-3 bg-brand-500 text-content-inverse font-semibold rounded-xl hover:bg-brand-600 transition-colors disabled:opacity-50 flex items-center gap-2"
        >
          {isPending ? "Executing..." : "Execute SQL"}
        </button>
      </div>
    </div>
  );
};
