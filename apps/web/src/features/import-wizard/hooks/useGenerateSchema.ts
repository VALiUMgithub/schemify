import { useMutation } from '@tanstack/react-query';
import { api } from '@/services/api';

export interface GenerateSchemaRequest {
  databaseType: string;
  tableName: string;
}

export interface GenerateSchemaResponse {
  data: {
    id: string;
    databaseType: string;
    tableName: string;
    sqlScript: string;
    createdAt: string;
  }
}

export const useGenerateSchema = (importId: string | null) => {
  return useMutation({
    mutationFn: async (payload: GenerateSchemaRequest) => {
      if (!importId) throw new Error('No import ID provided');
      const { data } = await api.post<GenerateSchemaResponse>(`/schema/generate/${importId}`, payload);
      return data.data;
    },
  });
};