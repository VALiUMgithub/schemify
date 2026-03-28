import { useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { AlertCircle, ArrowLeft, Play } from "lucide-react";
import { ImportStatusBadge } from "../components/ImportStatusBadge";
import {
  useExecuteImport,
  useImportDetail,
  useImportExecutions,
} from "../hooks/useImportDetail";
import type { DatabaseConnectionConfig, DatabaseEngine } from "../types";

function formatDate(value: string): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function makeDefaultConfig(
  databaseType: DatabaseEngine,
): DatabaseConnectionConfig {
  if (databaseType === "mysql") {
    return {
      host: "localhost",
      port: 3306,
      user: "root",
      password: "",
      database: "mydatabase",
    };
  }

  if (databaseType === "mssql") {
    return {
      host: "localhost",
      port: 1433,
      user: "sa",
      password: "",
      database: "mydatabase",
    };
  }

  return {
    host: "localhost",
    port: 5432,
    user: "postgres",
    password: "",
    database: "mydatabase",
  };
}

export function ImportDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const {
    data: importJob,
    isLoading,
    isError,
    error,
    refetch,
  } = useImportDetail(id);
  const { data: executions = [], isLoading: executionsLoading } =
    useImportExecutions(id);

  const latestExecution = executions[0];
  const latestSchema = importJob?.schemas?.[0] ?? null;

  const [databaseType, setDatabaseType] = useState<DatabaseEngine>("postgres");
  const [config, setConfig] = useState<DatabaseConnectionConfig>(
    makeDefaultConfig("postgres"),
  );

  const {
    mutate: rerunExecution,
    isPending: rerunning,
    error: rerunError,
  } = useExecuteImport(id ?? "");

  const rerunErrorMessage = useMemo(() => {
    if (!rerunError) return null;
    return rerunError instanceof Error
      ? rerunError.message
      : "Execution failed";
  }, [rerunError]);

  if (!id) {
    return (
      <div className="p-6">
        <p className="text-sm text-status-error-text">Invalid import id</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="p-6 text-sm text-content-secondary">
        Loading import details...
      </div>
    );
  }

  if (isError || !importJob) {
    return (
      <div className="p-6">
        <div className="rounded-2xl border border-status-error-text/30 bg-status-error-bg p-6">
          <p className="font-semibold text-status-error-text">
            Failed to load import detail
          </p>
          <p className="mt-1 text-sm text-status-error-text/90">
            {error instanceof Error ? error.message : "Unexpected error"}
          </p>
          <button
            onClick={() => refetch()}
            className="mt-3 rounded-lg border border-status-error-text/40 bg-transparent px-3 py-1.5 text-sm font-medium text-status-error-text hover:bg-status-error-bg/70 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const handleDatabaseTypeChange = (next: DatabaseEngine) => {
    setDatabaseType(next);
    setConfig(makeDefaultConfig(next));
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <button
            onClick={() => navigate("/imports")}
            className="mb-2 inline-flex items-center gap-2 text-sm font-medium text-content-secondary hover:text-content-primary transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Imports
          </button>
          <h2 className="text-2xl font-bold text-content-primary">
            {importJob.fileName}
          </h2>
          <p className="mt-1 text-sm text-content-secondary">
            Created {formatDate(importJob.createdAt)}
          </p>
        </div>
        <ImportStatusBadge status={importJob.status} />
      </div>

      <section className="rounded-2xl border border-border bg-surface p-5">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-content-muted">
          Columns
        </h3>
        <div className="mt-3 overflow-hidden rounded-xl border border-border">
          <table className="min-w-full divide-y divide-border text-sm">
            <thead className="bg-surface-subtle">
              <tr>
                <th className="px-3 py-2 text-left text-xs font-semibold uppercase text-content-muted">
                  Name
                </th>
                <th className="px-3 py-2 text-left text-xs font-semibold uppercase text-content-muted">
                  Type
                </th>
                <th className="px-3 py-2 text-left text-xs font-semibold uppercase text-content-muted">
                  Nullable
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {(importJob.columns ?? []).map((column) => (
                <tr key={column.id}>
                  <td className="px-3 py-2 text-content-primary">
                    {column.name}
                  </td>
                  <td className="px-3 py-2 text-content-secondary">
                    {column.detectedType}
                  </td>
                  <td className="px-3 py-2 text-content-secondary">
                    {column.nullable ? "Yes" : "No"}
                  </td>
                </tr>
              ))}
              {(importJob.columns ?? []).length === 0 && (
                <tr>
                  <td
                    className="px-3 py-4 text-sm text-content-secondary"
                    colSpan={3}
                  >
                    No columns available yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border border-border bg-surface p-5">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-content-muted">
            Schema Preview
          </h3>
          <p className="mt-3 text-sm text-content-secondary">
            {latestSchema
              ? `Table: ${latestSchema.tableName} (${latestSchema.databaseType})`
              : "No persisted schema preview available."}
          </p>
        </div>

        <div className="rounded-2xl border border-border bg-surface p-5">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-content-muted">
            Execution Result
          </h3>
          {executionsLoading ? (
            <p className="mt-3 text-sm text-content-secondary">
              Loading executions...
            </p>
          ) : latestExecution ? (
            <div className="mt-3 space-y-2 text-sm text-content-secondary">
              <p>
                Status: <ImportStatusBadge status={latestExecution.status} />
              </p>
              <p>Rows inserted: {latestExecution.rowsInserted}</p>
              <p>Executed at: {formatDate(latestExecution.executedAt)}</p>
              {latestExecution.errorMessage && (
                <p className="text-status-error-text">
                  Error: {latestExecution.errorMessage}
                </p>
              )}
            </div>
          ) : (
            <p className="mt-3 text-sm text-content-secondary">
              No execution history yet.
            </p>
          )}
        </div>
      </section>

      <section className="rounded-2xl border border-border bg-surface p-5">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-content-muted">
          SQL Preview
        </h3>
        <pre className="mt-3 max-h-72 overflow-auto rounded-xl border border-border bg-surface-muted p-3 text-xs text-content-primary">
          {latestSchema?.sqlScript ??
            "No SQL script available from persisted data yet."}
        </pre>
      </section>

      <section className="rounded-2xl border border-border bg-surface p-5">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-content-muted">
          Re-run Execution
        </h3>
        <p className="mt-2 text-sm text-content-secondary">
          Trigger execute for this import using target database connection
          settings.
        </p>

        <div className="mt-4 grid gap-3 md:grid-cols-2">
          <label className="text-sm text-content-secondary">
            Database Type
            <select
              value={databaseType}
              onChange={(e) =>
                handleDatabaseTypeChange(e.target.value as DatabaseEngine)
              }
              className="mt-1 block w-full rounded-xl border border-border bg-surface-subtle px-3 py-2 text-sm text-content-primary"
            >
              <option value="postgres">PostgreSQL</option>
              <option value="mysql">MySQL</option>
              <option value="mssql">SQL Server</option>
            </select>
          </label>

          <label className="text-sm text-content-secondary">
            Host
            <input
              value={config.host}
              onChange={(e) =>
                setConfig((prev) => ({ ...prev, host: e.target.value }))
              }
              className="mt-1 block w-full rounded-xl border border-border bg-surface-subtle px-3 py-2 text-sm text-content-primary"
            />
          </label>

          <label className="text-sm text-content-secondary">
            Port
            <input
              type="number"
              value={config.port}
              onChange={(e) =>
                setConfig((prev) => ({
                  ...prev,
                  port: Number.parseInt(e.target.value, 10) || prev.port,
                }))
              }
              className="mt-1 block w-full rounded-xl border border-border bg-surface-subtle px-3 py-2 text-sm text-content-primary"
            />
          </label>

          <label className="text-sm text-content-secondary">
            Database
            <input
              value={config.database}
              onChange={(e) =>
                setConfig((prev) => ({ ...prev, database: e.target.value }))
              }
              className="mt-1 block w-full rounded-xl border border-border bg-surface-subtle px-3 py-2 text-sm text-content-primary"
            />
          </label>

          <label className="text-sm text-content-secondary">
            User
            <input
              value={config.user}
              onChange={(e) =>
                setConfig((prev) => ({ ...prev, user: e.target.value }))
              }
              className="mt-1 block w-full rounded-xl border border-border bg-surface-subtle px-3 py-2 text-sm text-content-primary"
            />
          </label>

          <label className="text-sm text-content-secondary">
            Password
            <input
              type="password"
              value={config.password}
              onChange={(e) =>
                setConfig((prev) => ({ ...prev, password: e.target.value }))
              }
              className="mt-1 block w-full rounded-xl border border-border bg-surface-subtle px-3 py-2 text-sm text-content-primary"
            />
          </label>
        </div>

        {rerunErrorMessage && (
          <div className="mt-4 rounded-xl border border-status-error-text/30 bg-status-error-bg p-3 text-sm text-status-error-text">
            <div className="flex items-start gap-2">
              <AlertCircle className="mt-0.5 h-4 w-4" />
              <span>{rerunErrorMessage}</span>
            </div>
          </div>
        )}

        <button
          onClick={() => rerunExecution({ databaseType, config })}
          disabled={rerunning}
          className="mt-4 inline-flex items-center gap-2 rounded-xl bg-brand-500 px-4 py-2 text-sm font-semibold text-content-inverse hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-60 transition-colors"
        >
          <Play className="h-4 w-4" />
          {rerunning ? "Re-running..." : "Re-run"}
        </button>
      </section>
    </div>
  );
}
