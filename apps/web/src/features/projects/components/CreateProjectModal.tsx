import { useForm } from "react-hook-form";
import { z } from "zod";
import { X, Loader2 } from "lucide-react";
import { cn } from "@/utils/cn";
import { useCreateProject } from "../hooks/useProjects";

// ─── Validation ───────────────────────────────────────────────────────────────

const schema = z.object({
  name: z
    .string()
    .min(1, "Project name is required.")
    .max(80, "Name must be 80 characters or fewer."),
  description: z
    .string()
    .max(300, "Description must be 300 characters or fewer.")
    .optional(),
});

type FormValues = z.infer<typeof schema>;

// ─── Component ────────────────────────────────────────────────────────────────

interface CreateProjectModalProps {
  onClose: () => void;
}

export function CreateProjectModal({ onClose }: CreateProjectModalProps) {
  const { mutate: createProject, isPending, error } = useCreateProject();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>();

  function onSubmit(values: FormValues) {
    const parsed = schema.safeParse(values);
    if (!parsed.success) return;

    createProject(
      { name: parsed.data.name, description: parsed.data.description },
      { onSuccess: onClose },
    );
  }

  return (
    /* Backdrop — clicking outside closes the modal */
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
            <X className="w-4 h-4" strokeWidth={2.5} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
          {/* Name */}
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
                maxLength: {
                  value: 80,
                  message: "Name must be 80 characters or fewer.",
                },
              })}
              className={cn(
                "w-full px-3 py-2.5 rounded-lg border text-sm text-content-primary",
                "placeholder:text-content-muted bg-surface",
                "focus:outline-none focus:ring-2 focus:ring-brand-600/30 focus:border-brand-600",
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

          {/* Description */}
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
                maxLength: {
                  value: 300,
                  message: "Description must be 300 characters or fewer.",
                },
              })}
              className={cn(
                "w-full px-3 py-2.5 rounded-lg border text-sm text-content-primary",
                "placeholder:text-content-muted bg-surface resize-none",
                "focus:outline-none focus:ring-2 focus:ring-brand-600/30 focus:border-brand-600",
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

          {/* API-level error */}
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
                <Loader2 className="w-3.5 h-3.5 animate-spin" strokeWidth={2.5} />
              )}
              {isPending ? "Creating…" : "Create Project"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
