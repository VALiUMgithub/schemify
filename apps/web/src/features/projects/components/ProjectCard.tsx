import { useState } from "react";
import { FolderOpen, Trash2, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { cn } from "@/utils/cn";
import type { Project } from "../types";

interface ProjectCardProps {
  project: Project;
  onDelete: (id: string) => void;
}

/** Displays a single project with name, description, date, and a delete action. */
export function ProjectCard({ project, onDelete }: ProjectCardProps) {
  const [confirming, setConfirming] = useState(false);

  const formattedDate = new Date(project.createdAt).toLocaleDateString(
    "en-US",
    { month: "short", day: "numeric", year: "numeric" },
  );

  return (
    <div className="group bg-surface rounded-xl border border-border shadow-card hover:shadow-card-hover transition-shadow duration-200 p-5 flex flex-col relative">
      {/* Header */}
      <div className="flex items-start gap-3 mb-2">
        <div className="w-8 h-8 rounded-lg bg-brand-600 flex items-center justify-center shrink-0 mt-0.5 shadow-sm">
          <FolderOpen className="w-4 h-4 text-white" strokeWidth={1.75} />
        </div>
        <h3 className="flex-1 font-semibold text-content-primary text-sm leading-snug pt-1">
          {project.name}
        </h3>

        <Link
          to={`/imports/new?projectId=${project.id}`}
          className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-brand-600 text-white hover:bg-brand-700 transition-colors shadow-sm"
          title="New Import"
        >
          <span className="text-xs font-semibold leading-none">Import</span>
          <ArrowRight className="w-3.5 h-3.5" strokeWidth={2.2} />
        </Link>
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
            className={cn(
              "p-1.5 rounded-md text-content-muted",
              "opacity-0 group-hover:opacity-100",
              "hover:bg-status-error-bg hover:text-status-error-text",
              "transition-all duration-150",
            )}
            aria-label="Delete project"
          >
            <Trash2 className="w-3.5 h-3.5" strokeWidth={2} />
          </button>
        )}
      </div>
    </div>
  );
}
