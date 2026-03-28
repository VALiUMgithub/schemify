import { AlertCircle, Plus } from "lucide-react";
import { Link, useSearchParams } from "react-router-dom";
import { useProjects } from "@/features/projects/hooks/useProjects";
import { useImports } from "../hooks/useImports";
import { ImportsTable } from "../components/ImportsTable";

export function ImportsPage() {
  const [searchParams] = useSearchParams();
  const projectId = searchParams.get("projectId") ?? undefined;

  const {
    data: imports = [],
    isLoading,
    isError,
    error,
    refetch,
  } = useImports(projectId);
  const { data: projects = [] } = useProjects();

  const projectNameById = (id: string) =>
    projects.find((project) => project.id === id)?.name ?? "Unknown Project";

  return (
    <div className="p-6">
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h2 className="text-2xl font-bold text-content-primary">Imports</h2>
          <p className="mt-1 text-sm text-content-secondary">
            Track import jobs and inspect their status.
          </p>
        </div>

        <Link
          to="/imports/new"
          className="inline-flex items-center gap-2 rounded-xl bg-brand-500 px-4 py-2 text-sm font-semibold text-content-inverse hover:bg-brand-600 transition-colors"
        >
          <Plus className="h-4 w-4" />
          New Import
        </Link>
      </div>

      {isLoading ? (
        <div className="rounded-2xl border border-border bg-surface p-8 text-sm text-content-secondary">
          Loading imports...
        </div>
      ) : isError ? (
        <div className="rounded-2xl border border-status-error-text/30 bg-status-error-bg p-6">
          <div className="flex items-start gap-3">
            <AlertCircle className="mt-0.5 h-5 w-5 text-status-error-text" />
            <div>
              <p className="font-semibold text-status-error-text">
                Failed to load imports
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
        </div>
      ) : imports.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border-strong bg-surface p-10 text-center">
          <p className="text-lg font-semibold text-content-primary">
            No imports found
          </p>
          <p className="mt-2 text-sm text-content-secondary">
            Create a new import to start parsing and executing your data
            pipeline.
          </p>
        </div>
      ) : (
        <ImportsTable imports={imports} projectNameById={projectNameById} />
      )}
    </div>
  );
}
