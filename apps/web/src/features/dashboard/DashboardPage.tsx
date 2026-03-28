import { Info } from "lucide-react";

/**
 * Dashboard overview.
 * Placeholder — will show key metrics and recent activity.
 */
export function DashboardPage() {
  return (
    <div className="p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-content-primary">Dashboard</h2>
        <p className="mt-1 text-sm text-content-secondary">
          Welcome back. Here&apos;s what&apos;s happening in your workspace.
        </p>
      </div>

      <div className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-status-info-bg border border-brand-200 text-status-info-text text-sm font-medium">
        <Info className="w-4 h-4 shrink-0" strokeWidth={2} />
        Dashboard metrics coming soon
      </div>
    </div>
  );
}
