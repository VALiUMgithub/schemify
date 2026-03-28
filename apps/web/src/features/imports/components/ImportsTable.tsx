import { Link } from "react-router-dom";
import { ImportStatusBadge } from "./ImportStatusBadge";
import type { ImportJob } from "../types";

function formatDate(value: string): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

interface ImportsTableProps {
  imports: ImportJob[];
  projectNameById: (projectId: string) => string;
}

export function ImportsTable({ imports, projectNameById }: ImportsTableProps) {
  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-surface">
      <table className="min-w-full divide-y divide-border text-sm">
        <thead className="bg-surface-subtle">
          <tr>
            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-content-muted">
              File Name
            </th>
            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-content-muted">
              Project
            </th>
            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-content-muted">
              Status
            </th>
            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-content-muted">
              Created
            </th>
            <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-content-muted">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border/70 bg-surface">
          {imports.map((item) => (
            <tr
              key={item.id}
              className="hover:bg-surface-subtle/50 transition-colors"
            >
              <td className="px-4 py-3 font-medium text-content-primary">
                {item.fileName}
              </td>
              <td className="px-4 py-3 text-content-secondary">
                {projectNameById(item.projectId)}
              </td>
              <td className="px-4 py-3">
                <ImportStatusBadge status={item.status} />
              </td>
              <td className="px-4 py-3 text-content-secondary">
                {formatDate(item.createdAt)}
              </td>
              <td className="px-4 py-3 text-right">
                <Link
                  to={`/imports/${item.id}`}
                  className="inline-flex items-center rounded-lg border border-brand-500/25 bg-brand-500/10 px-3 py-1.5 text-xs font-semibold text-brand-400 hover:bg-brand-500/20 transition-colors"
                >
                  View
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
