import { api } from "@/services/api";
import type { ApiResponse } from "@/types/api";
import type {
  DatabaseConnectionConfig,
  DatabaseEngine,
  ExecutionJob,
  ImportJob,
} from "../types";

interface ExecuteImportResponse {
  result: {
    executionId: string;
    status: "SUCCESS" | "FAILED";
    rowsInserted: number;
  };
}

interface ExecutionsResponse {
  executions: ExecutionJob[];
}

export async function getImports(projectId?: string): Promise<ImportJob[]> {
  const { data } = await api.get<ApiResponse<ImportJob[]>>("/imports", {
    params: projectId ? { projectId } : undefined,
  });

  return data.data;
}

export async function getImportById(importId: string): Promise<ImportJob> {
  const { data } = await api.get<ApiResponse<ImportJob>>(`/imports/${importId}`);
  return data.data;
}

export async function executeImport(
  importId: string,
  payload: {
    databaseType: DatabaseEngine;
    config: DatabaseConnectionConfig;
  },
): Promise<ExecuteImportResponse> {
  const { data } = await api.post<ApiResponse<ExecuteImportResponse>>(
    `/database/${importId}/execute`,
    payload,
  );

  return data.data;
}

export async function getExecutionsByImportId(
  importId: string,
): Promise<ExecutionJob[]> {
  const { data } = await api.get<ApiResponse<ExecutionsResponse>>(
    `/database/${importId}/executions`,
  );

  return data.data.executions;
}
