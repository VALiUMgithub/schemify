import { useMutation } from '@tanstack/react-query';
import { api } from '@/services/api';

export interface ExecuteJobRequest {
  databaseType: string;
  config: {
    host?: string;
    port?: number;
    user?: string;
    password?: string;
    database?: string;
  };
  /** Optional custom SQL script to execute (if user edited the generated SQL) */
  sqlScript?: string;
}

export const useExecuteJob = (importId: string | null) => {
  return useMutation({
    mutationFn: async (payload: ExecuteJobRequest) => {
      if (!importId) throw new Error('No import ID provided');
      const { data } = await api.post(`/database/${importId}/execute`, payload);
      return data;
    },
  });
};