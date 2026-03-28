import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { cn } from "../../utils/cn";
import {
  useProjects,
  useCreateProject,
  useDeleteProject,
} from "../../hooks/useProjects";
import type { Project } from "../../types/project";

// ─── Validation schema ────────────────────────────────────────────────────────

const createProjectSchema = z.object({
  name: z
    .string()
    .min(1, "Project name is required.")
    .max(80, "Name must be 80 characters or fewer."),
  description: z
    .string()
    .max(300, "Description must be 300 characters or fewer.")
    .optional(),
});

type CreateProjectForm = z.infer<typeof createProjectSchema>;

// ─── Skeleton card (loading state) ───────────────────────────────────────────

function SkeletonCard() {
  return (
    <div className="bg-surface rounded-xl border border-border shadow-card p-5 animate-pulse">
      <div className="h-4 w-2/3 bg-surface-subtle rounded mb-2.5" />
      <div className="h-3 w-full bg-surface-subtle rounded mb-1.5" />
      <div className="h-3 w-4/5 bg-surface-subtle rounded mb-5" />
      <div className="flex items-center justify-between pt-4 border-t border-border">
        <div className="h-3 w-1/4 bg-surface-subtle rounded" />
        <div className="h-7 w-16 bg-surface-subtle rounded-md" />
      </div>
    </div>
  );
}

// ─── Empty state ──────────────────────────────────────────────────────────────

function EmptyState({ onCreateClick }: { onCreateClick: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <div className="w-14 h-14 rounded-2xl bg-brand-50 flex items-center justify-center mb-5">
        <svg
          className="w-7 h-7 text-brand-500"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={1.5}
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M3 7a2 2 0 0 1 2-2h3.17a2 2 0 0 1 1.42.59l.82.82A2 2 0 0 0 11.83 7H19a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7Z" />
        </svg>
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
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
          <line x1="12" y1="5" x2="12" y2="19" />
          <line x1="5" y1="12" x2="19" y2="12" />
        </svg>
        New Project
      </button>
    </div>
  );
}

// ─── Project card ─────────────────────────────────────────────────────────────

function ProjectCard({
  project,
  onDelete,
}: {
  project: Project;
  onDelete: (id: string) => void;
}) {
  const [confirming, setConfirming] = useState(false);
  const formattedDate = new Date(project.createdAt).toLocaleDateString(
    "en-US",
    { month: "short", day: "numeric", year: "numeric" },
  );

  return (
    <div className="group bg-surface rounded-xl border border-border shadow-card hover:shadow-card-hover transition-shadow duration-200 p-5 flex flex-col">
      {/* Header */}
      <div className="flex items-start justify-between gap-3 mb-2">
        <div className="w-8 h-8 rounded-lg bg-brand-50 flex items-center justify-center shrink-0 mt-0.5">
          <svg
            className="w-4 h-4 text-brand-600"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={1.75}
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M3 7a2 2 0 0 1 2-2h3.17a2 2 0 0 1 1.42.59l.82.82A2 2 0 0 0 11.83 7H19a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7Z" />
          </svg>
        </div>
        <h3 className="flex-1 font-semibold text-content-primary text-sm leading-snug">
          {project.name}
        </h3>
      </div>

      {/* Description */}
      {project.description ? (
        <p className="text-sm text-content-secondary leading-relaxed line-clamp-2 mb-4">
          {project.description}
        </p>
      ) : (
        <p className="text-sm text-content-muted italic mb-4">No description</p>
      )}

      {/* Footer */}
      <div className="mt-auto pt-4 border-t border-border flex items-center justify-between">
        <span className="text-xs text-content-muted">{formattedDate}</span>

        {/* Delete — two-step confirmation */}
        {confirming ? (
          <div className="flex items-center gap-2">
            <span className="text-xs text-status-error-text font-medium">
              Delete?
            </span>
            <button
              onClick={() => onDelete(project.id)}
              className="px-2 py-1 text-xs font-medium rounded bg-status-error-bg text-status-error-text hover:bg-red-100 transition-colors"
            >
              Yes
            </button>
            <button
              onClick={() => setConfirming(false)}
              className="px-2 py-1 text-xs font-medium rounded bg-surface-subtle text-content-secondary hover:bg-border transition-colors"
            >
              No
            </button>
          </div>
        ) : (
          <button
            onClick={() => setConfirming(true)}
            className="p-1.5 rounded-md text-content-muted opacity-0 group-hover:opacity-100 hover:bg-status-error-bg hover:text-status-error-text transition-all duration-150"
            aria-label="Delete project"
          >
            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <polyline points="3 6 5 6 21 6" />
              <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
              <path d="M10 11v6M14 11v6" />
              <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
}

// ─── Create project modal ─────────────────────────────────────────────────────

function CreateProjectModal({ onClose }: { onClose: () => void }) {
  const { mutate: createProject, isPending, error } = useCreateProject();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CreateProjectForm>();

  function onSubmit(values: CreateProjectForm) {
    // Manual zod parse so we get type-safe, validated output.
    const parsed = createProjectSchema.safeParse(values);
    if (!parsed.success) return;

    createProject(
      { name: parsed.data.name, description: parsed.data.description },
      { onSuccess: onClose },
    );
  }

  return (
    /* Backdrop */
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      {/* Panel */}
      <div className="relative w-full max-w-md bg-surface rounded-2xl shadow-modal p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-base font-semibold text-content-primary">
            New Project
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-md text-content-muted hover:bg-surface-subtle hover:text-content-primary transition-colors"
            aria-label="Close"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
          {/* Name field */}
          <div>
            <label
              htmlFor="project-name"
              className="block text-sm font-medium text-content-primary mb-1.5"
            >
              Project name <span className="text-status-error-text">*</span>
            </label>
            <input
              id="project-name"
              type="text"
              placeholder="e.g. Customer Database"
              autoFocus
              {...register("name", {
                required: "Project name is required.",
                maxLength: { value: 80, message: "Name must be 80 characters or fewer." },
              })}
              className={cn(
                "w-full px-3 py-2.5 rounded-lg border text-sm text-content-primary placeholder:text-content-muted",
                "bg-surface focus:outline-none focus:ring-2 focus:ring-brand-600/30 focus:border-brand-600",
                "transition-colors duration-150",
                errors.name
                  ? "border-status-error-text"
                  : "border-border hover:border-border-strong",
              )}
            />
            {errors.name && (
              <p className="mt-1.5 text-xs text-status-error-text">
                {errors.name.message}
              </p>
            )}
          </div>

          {/* Description field */}
          <div>
            <label
              htmlFor="project-description"
              className="block text-sm font-medium text-content-primary mb-1.5"
            >
              Description{" "}
              <span className="font-normal text-content-muted">(optional)</span>
            </label>
            <textarea
              id="project-description"
              rows={3}
              placeholder="What is this project for?"
              {...register("description", {
                maxLength: { value: 300, message: "Description must be 300 characters or fewer." },
              })}
              className={cn(
                "w-full px-3 py-2.5 rounded-lg border text-sm text-content-primary placeholder:text-content-muted resize-none",
                "bg-surface focus:outline-none focus:ring-2 focus:ring-brand-600/30 focus:border-brand-600",
                "transition-colors duration-150",
                errors.description
                  ? "border-status-error-text"
                  : "border-border hover:border-border-strong",
              )}
            />
            {errors.description && (
              <p className="mt-1.5 text-xs text-status-error-text">
                {errors.description.message}
              </p>
            )}
          </div>

          {/* API error */}
          {error && (
            <div className="px-3 py-2.5 rounded-lg bg-status-error-bg border border-red-200 text-xs text-status-error-text">
              {error.message}
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-content-secondary hover:text-content-primary rounded-lg hover:bg-surface-subtle transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isPending}
              className={cn(
                "inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white transition-colors duration-150",
                isPending
                  ? "bg-brand-400 cursor-not-allowed"
                  : "bg-brand-600 hover:bg-brand-700",
              )}
            >
              {isPending && (
                <svg className="w-3.5 h-3.5 animate-spin" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth={4} />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                </svg>
              )}
              {isPending ? "Creating…" : "Create Project"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Error state ──────────────────────────────────────────────────────────────

function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <div className="w-12 h-12 rounded-full bg-status-error-bg flex items-center justify-center mb-4">
        <svg className="w-5 h-5 text-status-error-text" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="8" x2="12" y2="12" />
          <line x1="12" y1="16" x2="12.01" y2="16" />
        </svg>
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

  return (
    <div className="p-6">
      {/* Page header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-content-primary">Projects</h2>
          <p className="mt-0.5 text-sm text-content-secondary">
            {isLoading
              ? "Loading your projects…"
              : `${projects?.length ?? 0} project${(projects?.length ?? 0) !== 1 ? "s" : ""}`}
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white text-sm font-medium rounded-lg transition-colors duration-150 shadow-sm"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          New Project
        </button>
      </div>

      {/* Content */}
      {isLoading ? (
        /* Loading — skeleton grid */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>
      ) : isError ? (
        /* Error state */
        <ErrorState
          message={error?.message ?? "Failed to load projects."}
          onRetry={() => refetch()}
        />
      ) : projects && projects.length > 0 ? (
        /* Project grid */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {projects.map((project) => (
            <ProjectCard
              key={project.id}
              project={project}
              onDelete={deleteProject}
            />
          ))}
        </div>
      ) : (
        /* Empty state */
        <EmptyState onCreateClick={() => setIsModalOpen(true)} />
      )}

      {/* Create project modal */}
      {isModalOpen && (
        <CreateProjectModal onClose={() => setIsModalOpen(false)} />
      )}
    </div>
  );
}
