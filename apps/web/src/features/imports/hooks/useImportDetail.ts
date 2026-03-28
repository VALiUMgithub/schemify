import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import {
  executeImport,
  getExecutionsByImportId,
  getImportById,
} from "../services/imports.service";
import type { DatabaseConnectionConfig, DatabaseEngine } from "../types";

export const importsKeys = {
  all: () => ["imports"] as const,
  list: (projectId?: string) => ["imports", "list", projectId ?? "all"] as const,
  detail: (importId: string) => ["imports", "detail", importId] as const,
  executions: (importId: string) => ["imports", "executions", importId] as const,
};

export function useImportDetail(importId?: string) {
  return useQuery({
    queryKey: importsKeys.detail(importId ?? ""),
    queryFn: () => getImportById(importId as string),
    enabled: Boolean(importId),
  });
}

export function useImportExecutions(importId?: string) {
  return useQuery({
    queryKey: importsKeys.executions(importId ?? ""),
    queryFn: () => getExecutionsByImportId(importId as string),
    enabled: Boolean(importId),
  });
}

export function useExecuteImport(importId: string) {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (payload: {
      databaseType: DatabaseEngine;
      config: DatabaseConnectionConfig;
    }) => executeImport(importId, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: importsKeys.all() });
      qc.invalidateQueries({ queryKey: importsKeys.detail(importId) });
      qc.invalidateQueries({ queryKey: importsKeys.executions(importId) });
    },
  });
}
