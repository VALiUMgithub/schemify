import { useState, useEffect } from "react";
import { useWizardStore } from "../store/wizard.store";
import { useExecuteJob } from "../hooks/useExecuteJob";
import { useTestConnection } from "../hooks/useTestConnection";
import { useNavigate } from "react-router-dom";
import { Check, Plug, Loader2, X, AlertTriangle } from "lucide-react";
import { CopyButton } from "../../../components/ui/CopyButton";
import { ErrorPanel } from "../../../components/ui/ErrorPanel";
import { ExecutionOptions, ExecutionOptionsState } from "../components/ExecutionOptions";

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
  const code = payload?.code;

  if (Array.isArray(details)) {
    details.forEach((item) => {
      if (typeof item === "string") detailItems.push(item);
    });
  } else if (details && typeof details === "object") {
    const data = details as {
      sample?: Array<{ column: string; rowNumber: number }>;
      totalViolations?: number;
      column?: string;
      value?: string;
      targetType?: string;
      dataType?: string;
      dateType?: string;
      timezone?: string;
      table?: string;
      maxLength?: string;
      originalMessage?: string;
    };

    // Handle NOT NULL violations with samples
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

    // Handle type conversion errors
    if (data.value !== undefined) {
      detailItems.push(`Problematic value: "${data.value}"`);
    }
    if (data.targetType) {
      detailItems.push(`Expected type: ${data.targetType}`);
    }
    if (data.dataType) {
      detailItems.push(`Expected type: ${data.dataType}`);
    }
    if (data.dateType) {
      detailItems.push(`Date type: ${data.dateType}`);
    }
    if (data.timezone) {
      detailItems.push(`Invalid timezone: ${data.timezone}`);
    }
    if (data.table) {
      detailItems.push(`Table: ${data.table}`);
    }
    if (data.maxLength) {
      detailItems.push(`Maximum allowed length: ${data.maxLength}`);
    }
    if (data.column && !detailItems.some(item => item.includes(data.column!))) {
      detailItems.push(`Column: ${data.column}`);
    }
    if (data.originalMessage) {
      detailItems.push(`Technical details: ${data.originalMessage}`);
    }
  }

  // Add helpful suggestions based on error code
  if (code) {
    const suggestion = getErrorSuggestion(code);
    if (suggestion) {
      detailItems.push(`💡 Suggestion: ${suggestion}`);
    }
  }

  return {
    message,
    code,
    detailItems,
  };
}

function getErrorSuggestion(code: string): string | null {
  switch (code) {
    case 'EXECUTION_INVALID_BOOLEAN':
      return 'Change the column type to VARCHAR, or ensure all values are valid booleans (true/false, yes/no, 1/0, y/n).';
    case 'EXECUTION_TYPE_CONVERSION_ERROR':
      return 'Check that the data in this column matches the expected type, or change the column type in the schema step.';
    case 'EXECUTION_INVALID_DATE':
    case 'EXECUTION_INVALID_TIMEZONE':
      return 'Use ISO 8601 date format (YYYY-MM-DD) or change the column type to VARCHAR.';
    case 'EXECUTION_NOT_NULL_VIOLATION':
      return 'Either mark the column as nullable in the schema step, or fill in the empty values in your source data.';
    case 'EXECUTION_SIZE_VIOLATION':
      return 'Increase the column size in the schema step, or use MAX/TEXT type for large text fields.';
    case 'EXECUTION_TABLE_EXISTS':
      return 'Use the "Drop existing table" option to replace the table, or "Use IF NOT EXISTS" to skip creation.';
    case 'SCHEMA_SIZE_VALIDATION_FAILED':
      return 'Increase the VARCHAR/NVARCHAR size for the affected columns, or enable auto-size detection.';
    case 'SCHEMA_NOT_NULL_VALIDATION_FAILED':
      return 'Mark the column as nullable, or clean empty values from your source data before import.';
    default:
      return null;
  }
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
      database: "",
    };
  });

  // Execution options state
  const [executionOptions, setExecutionOptions] = useState<ExecutionOptionsState>({
    ifNotExists: false,
    dropIfExists: false,
  });

  // Confirmation dialog for DROP TABLE
  const [showDropConfirm, setShowDropConfirm] = useState(false);

  // Reset confirmation dialog when dropIfExists option is disabled
  useEffect(() => {
    if (!executionOptions.dropIfExists) {
      setShowDropConfirm(false);
    }
  }, [executionOptions.dropIfExists]);

  // Test connection hook
  const {
    mutate: testConnection,
    isPending: isTestingConnection,
    data: testResult,
    error: testError,
    reset: resetTestConnection,
  } = useTestConnection();

  // Execute job hook
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

  const handleTestConnection = () => {
    resetTestConnection();
    testConnection({
      databaseType,
      config: {
        ...config,
        port: Number(config.port),
      },
    });
  };

  const handleExecute = () => {
    // Show confirmation if DROP TABLE is selected
    if (executionOptions.dropIfExists && !showDropConfirm) {
      setShowDropConfirm(true);
      return;
    }

    setShowDropConfirm(false);
    const startedAt = Date.now();
    execute(
      {
        databaseType,
        config: {
          ...config,
          port: Number(config.port),
        },
        sqlScript: currentSql || undefined,
        options: {
          ifNotExists: executionOptions.ifNotExists,
          dropIfExists: executionOptions.dropIfExists,
        },
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

  // Test connection status component
  const renderTestConnectionStatus = () => {
    if (isTestingConnection) {
      return (
        <div className="flex items-center gap-2 text-content-muted">
          <Loader2 className="w-4 h-4 animate-spin" />
          <span className="text-sm">Testing connection...</span>
        </div>
      );
    }

    if (testResult) {
      return (
        <div className="flex items-center gap-2 text-status-success-text">
          <Check className="w-4 h-4" />
          <span className="text-sm">
            Connected ({testResult.connectionTimeMs}ms)
          </span>
        </div>
      );
    }

    if (testError) {
      const errorMessage = (testError as Error).message || "Connection failed";
      return (
        <div className="flex items-center gap-2 text-status-error-text">
          <X className="w-4 h-4" />
          <span className="text-sm truncate max-w-xs" title={errorMessage}>
            {errorMessage}
          </span>
        </div>
      );
    }

    return null;
  };

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
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="mb-6">
        <p className="text-lg text-content-secondary">
          Connect to your destination {databaseType} database to build the
          table and insert rows.
        </p>
      </div>

      {/* Two-Column Layout */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 flex-1 overflow-hidden">
        {/* Left Column - Connection Form & Options */}
        <div className="space-y-4 overflow-y-auto max-h-[calc(100vh-300px)]">
          {/* Connection Details Section */}
          <div className="rounded-2xl border border-border bg-surface p-6">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-semibold text-content-primary">
            Connection Details
          </h3>
          <div className="flex items-center gap-3">
            {renderTestConnectionStatus()}
            <button
              onClick={handleTestConnection}
              disabled={isTestingConnection || !config.host || !config.database || !config.user}
              className="inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-lg
                bg-surface-subtle text-content-secondary hover:text-content-primary hover:bg-surface-muted
                border border-border transition-all duration-200
                disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Plug className="w-4 h-4" />
              Test Connection
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="db-host" className="block text-sm font-medium text-content-secondary mb-1">
              Host
            </label>
            <input
              id="db-host"
              type="text"
              value={config.host}
              onChange={(e) => {
                setConfig({ ...config, host: e.target.value });
                resetTestConnection();
              }}
              className="w-full px-3 py-2 border border-border rounded-xl bg-surface-subtle text-content-primary focus:ring-brand-500/30 focus:border-brand-500 sm:text-sm"
              placeholder="localhost"
            />
          </div>
          <div>
            <label htmlFor="db-port" className="block text-sm font-medium text-content-secondary mb-1">
              Port
            </label>
            <input
              id="db-port"
              type="number"
              value={config.port}
              onChange={(e) => {
                setConfig({ ...config, port: parseInt(e.target.value) });
                resetTestConnection();
              }}
              className="w-full px-3 py-2 border border-border rounded-xl bg-surface-subtle text-content-primary focus:ring-brand-500/30 focus:border-brand-500 sm:text-sm"
            />
          </div>
        </div>

        <div>
          <label htmlFor="db-database" className="block text-sm font-medium text-content-secondary mb-1">
            Database Name
          </label>
          <input
            id="db-database"
            type="text"
            value={config.database}
            onChange={(e) => {
              setConfig({ ...config, database: e.target.value });
              resetTestConnection();
            }}
            placeholder="e.g. company_database"
            className="w-full px-3 py-2 border border-border rounded-xl bg-surface-subtle text-content-primary focus:ring-brand-500/30 focus:border-brand-500 sm:text-sm"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="db-user" className="block text-sm font-medium text-content-secondary mb-1">
              Username
            </label>
            <input
              id="db-user"
              type="text"
              value={config.user}
              placeholder="e.g. sa"
              onChange={(e) => {
                setConfig({ ...config, user: e.target.value });
                resetTestConnection();
              }}
              className="w-full px-3 py-2 border border-border rounded-xl bg-surface-subtle text-content-primary focus:ring-brand-500/30 focus:border-brand-500 sm:text-sm"
            />
          </div>
          <div>
            <label htmlFor="db-password" className="block text-sm font-medium text-content-secondary mb-1">
              Password
            </label>
            <input
              id="db-password"
              type="password"
              value={config.password}
              placeholder="password"
              onChange={(e) => {
                setConfig({ ...config, password: e.target.value });
                resetTestConnection();
              }}
              className="w-full px-3 py-2 border border-border rounded-xl bg-surface-subtle text-content-primary focus:ring-brand-500/30 focus:border-brand-500 sm:text-sm"
            />
          </div>
        </div>
          </div>

          {/* Execution Options Section */}
          <ExecutionOptions
            options={executionOptions}
            onChange={setExecutionOptions}
          />

          {/* Error Display */}
          {parsedError && <ErrorPanel error={parsedError} />}
        </div>

        {/* Right Column - Connection Summary */}
        <div className="space-y-4 overflow-y-auto max-h-[calc(100vh-300px)]">
          {/* Connection Summary */}
          <div className="rounded-2xl border border-border bg-surface p-6">
            <h3 className="text-sm font-semibold text-content-primary mb-4">
              Execution Summary
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center py-2 border-b border-border">
                <span className="text-sm text-content-secondary">Database</span>
                <span className="text-sm font-medium text-content-primary">{databaseType.toUpperCase()}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-border">
                <span className="text-sm text-content-secondary">Target Table</span>
                <span className="text-sm font-medium text-content-primary font-mono">{tableName || "import_table"}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-border">
                <span className="text-sm text-content-secondary">Host</span>
                <span className="text-sm font-medium text-content-primary">{config.host}:{config.port}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-border">
                <span className="text-sm text-content-secondary">Database Name</span>
                <span className="text-sm font-medium text-content-primary">{config.database}</span>
              </div>
              {executionOptions.ifNotExists && (
                <div className="mt-3 p-3 rounded-lg bg-surface-subtle border border-border flex items-start gap-2">
                  <Check className="w-4 h-4 text-brand-500 shrink-0 mt-0.5" />
                  <p className="text-xs text-content-secondary">
                    Using <span className="font-mono text-content-primary">IF NOT EXISTS</span> - will skip if table exists
                  </p>
                </div>
              )}
              {executionOptions.dropIfExists && (
                <div className="mt-3 p-3 rounded-lg bg-status-error-bg border border-status-error-text/30 flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-status-error-text shrink-0 mt-0.5" />
                  <p className="text-xs text-status-error-text">
                    Will drop existing table - <strong>all data will be deleted</strong>
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Footer Actions */}
      <div className="mt-6 flex justify-between pt-4 border-t border-border">
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
            isPending || !config.host || !config.database || !config.user || showDropConfirm
          }
          aria-busy={isPending}
          aria-label={
            showDropConfirm 
              ? "Please confirm or cancel the destructive action above" 
              : isPending 
              ? "Executing SQL, please wait" 
              : "Execute SQL and create table"
          }
          className="px-6 py-3 bg-brand-500 text-content-inverse font-semibold rounded-xl hover:bg-brand-600 transition-colors disabled:opacity-50 flex items-center gap-2"
        >
          {isPending ? "Executing..." : "Execute SQL"}
        </button>
      </div>

      {/* Modal Dialog for DROP Confirmation */}
      {showDropConfirm && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200"
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowDropConfirm(false);
          }}
          role="dialog"
          aria-modal="true"
          aria-labelledby="drop-confirm-title"
          aria-describedby="drop-confirm-description"
        >
          <div className="relative w-full max-w-lg bg-surface rounded-2xl shadow-2xl border border-border animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="flex items-start gap-4 p-6 pb-4">
              <div className="w-12 h-12 rounded-full bg-status-error-bg flex items-center justify-center shrink-0">
                <AlertTriangle className="w-6 h-6 text-status-error-text" />
              </div>
              <div className="flex-1">
                <h3 id="drop-confirm-title" className="text-lg font-semibold text-content-primary">
                  Confirm Destructive Action
                </h3>
                <p id="drop-confirm-description" className="mt-2 text-sm text-content-secondary">
                  You are about to drop the existing table <span className="font-mono font-semibold text-content-primary">'{tableName || "import_table"}'</span>.
                </p>
              </div>
            </div>

            {/* Modal Body */}
            <div className="px-6 pb-4">
              <div className="rounded-lg bg-status-error-bg/30 border border-status-error-text/20 p-4">
                <p className="text-sm text-status-error-text font-medium">
                  ⚠️ All existing data in this table will be permanently deleted.
                </p>
                <p className="mt-2 text-xs text-content-secondary">
                  This action cannot be undone. Make sure you have a backup if needed.
                </p>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-end gap-3 px-6 py-4 bg-surface-subtle border-t border-border rounded-b-2xl">
              <button
                onClick={() => setShowDropConfirm(false)}
                className="px-4 py-2 text-sm font-medium rounded-lg border border-border bg-surface text-content-primary hover:bg-surface-muted transition-colors"
                disabled={isPending}
              >
                Cancel
              </button>
              <button
                onClick={handleExecute}
                disabled={isPending}
                className="px-4 py-2 text-sm font-semibold rounded-lg bg-status-error-text text-white hover:bg-status-error-text/90 transition-colors disabled:opacity-50 flex items-center gap-2"
                aria-busy={isPending}
              >
                {isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Dropping & Recreating...
                  </>
                ) : (
                  "Yes, Drop & Recreate"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
