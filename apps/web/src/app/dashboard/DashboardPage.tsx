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
          Welcome back. Here's what's happening in your workspace.
        </p>
      </div>

      {/* Placeholder badge */}
      <div className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-status-info-bg border border-brand-200 text-status-info-text text-sm font-medium">
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="8" x2="12" y2="12" />
          <line x1="12" y1="16" x2="12.01" y2="16" />
        </svg>
        Dashboard metrics coming soon
      </div>
    </div>
  );
}
