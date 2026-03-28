import { api } from "@/services/api";
import type { ApiResponse } from "@/types/api";
import type {
  Project,
  CreateProjectPayload,
  UpdateProjectPayload,
} from "../types";

/** Fetch all projects for a given user. */
export async function getProjects(userId: string): Promise<Project[]> {
  const { data } = await api.get<ApiResponse<Project[]>>("/projects", {
    params: { userId },
  });
  return data.data;
}

/** Fetch a single project by ID. */
export async function getProject(id: string): Promise<Project> {
  const { data } = await api.get<ApiResponse<Project>>(`/projects/${id}`);
  return data.data;
}

/** Create a new project. */
export async function createProject(
  payload: CreateProjectPayload,
): Promise<Project> {
  const { data } = await api.post<ApiResponse<Project>>("/projects", payload);
  return data.data;
}

/** Partially update a project (name / description). */
export async function updateProject(
  id: string,
  payload: UpdateProjectPayload,
): Promise<Project> {
  const { data } = await api.patch<ApiResponse<Project>>(
    `/projects/${id}`,
    payload,
  );
  return data.data;
}

/** Permanently delete a project. */
export async function deleteProject(id: string): Promise<void> {
  await api.delete(`/projects/${id}`);
}
