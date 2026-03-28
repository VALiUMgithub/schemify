/** Animated placeholder shown while the project list is loading. */
export function SkeletonCard() {
  return (
    <div className="bg-surface rounded-xl border border-border shadow-card p-5 animate-pulse">
      <div className="flex items-start gap-3 mb-3">
        <div className="w-8 h-8 rounded-lg bg-surface-subtle shrink-0" />
        <div className="h-4 w-2/3 bg-surface-subtle rounded mt-1" />
      </div>
      <div className="h-3 w-full bg-surface-subtle rounded mb-1.5" />
      <div className="h-3 w-4/5 bg-surface-subtle rounded mb-5" />
      <div className="flex items-center justify-between pt-4 border-t border-border">
        <div className="h-3 w-1/4 bg-surface-subtle rounded" />
        <div className="h-7 w-16 bg-surface-subtle rounded-md" />
      </div>
    </div>
  );
}
