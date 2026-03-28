import { useState } from "react";
import { Plus, AlertCircle } from "lucide-react";
import { useProjects, useDeleteProject } from "./hooks/useProjects";
import { ProjectCard } from "./components/ProjectCard";
import { SkeletonCard } from "./components/SkeletonCard";
import { EmptyState } from "./components/EmptyState";
import { CreateProjectModal } from "./components/CreateProjectModal";

// ─── Error state ──────────────────────────────────────────────────────────────

function ErrorState({
  message,
  onRetry,
}: {
  message: string;
  onRetry: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <div className="w-12 h-12 rounded-full bg-status-error-bg flex items-center justify-center mb-4">
        <AlertCircle
          className="w-5 h-5 text-status-error-text"
          strokeWidth={2}
        />
      </div>
      <p className="text-sm text-content-secondary mb-4">{message}</p>
      <button
        onClick={onRetry}
        className="px-4 py-2 text-sm font-medium text-brand-600 hover:text-brand-700 hover:bg-brand-50 rounded-lg transition-colors"
      >
        Try again
      </button>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export function ProjectsPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { data: projects, isLoading, isError, error, refetch } = useProjects();
  const { mutate: deleteProject } = useDeleteProject();

  const count = projects?.length ?? 0;

  return (
    <div className="p-6">
      {/* Page header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-content-primary">Projects</h2>
          <p className="mt-0.5 text-sm text-content-secondary">
            {isLoading
              ? "Loading your projects…"
              : `${count} project${count !== 1 ? "s" : ""}`}
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white text-sm font-medium rounded-lg transition-colors duration-150 shadow-sm"
        >
          <Plus className="w-4 h-4" strokeWidth={2.5} />
          New Project
        </button>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>
      ) : isError ? (
        <ErrorState
          message={error?.message ?? "Failed to load projects."}
          onRetry={() => refetch()}
        />
      ) : count > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {projects!.map((project) => (
            <ProjectCard
              key={project.id}
              project={project}
              onDelete={deleteProject}
            />
          ))}
        </div>
      ) : (
        <EmptyState onCreateClick={() => setIsModalOpen(true)} />
      )}

      {isModalOpen && (
        <CreateProjectModal onClose={() => setIsModalOpen(false)} />
      )}
    </div>
  );
}
