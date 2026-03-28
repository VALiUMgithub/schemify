import type { ExecutionStatus, ImportStatus } from "../types";

type Status = ImportStatus | ExecutionStatus | string;

const STATUS_STYLES: Record<string, string> = {
  UPLOADED: "bg-surface-subtle text-content-secondary border-border",
  PROCESSING: "bg-status-info-bg text-status-info-text border-border",
  READY: "bg-status-warning-bg text-status-warning-text border-border",
  SUCCESS: "bg-status-success-bg text-status-success-text border-border",
  FAILED: "bg-status-error-bg text-status-error-text border-border",
  RUNNING: "bg-status-info-bg text-status-info-text border-border",
  SCHEMA_GENERATED: "bg-status-info-bg text-status-info-text border-border",
  PENDING: "bg-surface-subtle text-content-secondary border-border",
};

export function ImportStatusBadge({ status }: { status: Status }) {
  const normalized = status.toUpperCase();
  const classes =
    STATUS_STYLES[normalized] ??
    "bg-surface-subtle text-content-secondary border-border";

  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold ${classes}`}
    >
      {normalized.replace(/_/g, " ")}
    </span>
  );
}
