import {
  useQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import {
  getProjects,
  getProject,
  createProject,
  updateProject,
  deleteProject,
} from "../services/projects.service";
import type {
  CreateProjectPayload,
  UpdateProjectPayload,
} from "../types";

/**
 * Placeholder user ID until authentication is implemented.
 * Replace with the real user ID from the auth store once auth lands.
 */
const DEMO_USER_ID = "demo-user";

// ─── Query Keys ───────────────────────────────────────────────────────────────

export const projectKeys = {
  all: () => ["projects"] as const,
  list: (userId: string) => ["projects", "list", userId] as const,
  detail: (id: string) => ["projects", "detail", id] as const,
};

// ─── Hooks ────────────────────────────────────────────────────────────────────

/** Fetch the full project list for the current user. */
export function useProjects() {
  return useQuery({
    queryKey: projectKeys.list(DEMO_USER_ID),
    queryFn: () => getProjects(DEMO_USER_ID),
  });
}

/** Fetch a single project by ID. */
export function useProject(id: string) {
  return useQuery({
    queryKey: projectKeys.detail(id),
    queryFn: () => getProject(id),
    enabled: !!id,
  });
}

/** Create a new project and invalidate the project list cache. */
export function useCreateProject() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (payload: Omit<CreateProjectPayload, "userId">) =>
      createProject({ ...payload, userId: DEMO_USER_ID }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: projectKeys.all() });
    },
  });
}

/** Update a project and keep the cache consistent. */
export function useUpdateProject(id: string) {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (payload: UpdateProjectPayload) => updateProject(id, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: projectKeys.all() });
    },
  });
}

/** Delete a project and remove it from the cache. */
export function useDeleteProject() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteProject(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: projectKeys.all() });
    },
  });
}
