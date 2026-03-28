import { FolderOpen, Plus } from "lucide-react";

interface EmptyStateProps {
  onCreateClick: () => void;
}

/** Full-page empty state shown when the user has no projects yet. */
export function EmptyState({ onCreateClick }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <div className="w-14 h-14 rounded-2xl bg-brand-50 flex items-center justify-center mb-5">
        <FolderOpen className="w-7 h-7 text-brand-500" strokeWidth={1.5} />
      </div>

      <h3 className="text-base font-semibold text-content-primary mb-1.5">
        No projects yet
      </h3>
      <p className="text-sm text-content-secondary max-w-xs mb-6">
        Create a project to start converting your Excel and CSV files into
        database schemas.
      </p>

      <button
        onClick={onCreateClick}
        className="inline-flex items-center gap-2 px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white text-sm font-medium rounded-lg transition-colors duration-150"
      >
        <Plus className="w-4 h-4" strokeWidth={2.5} />
        New Project
      </button>
    </div>
  );
}
