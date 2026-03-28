import { useQuery } from '@tanstack/react-query';
import { api } from '@/services/api';

export interface DetectSchemaResponse {
  data: {
    columns: Array<{
      id: string;
      name: string;
      type: string;
      nullable: boolean;
    }>;
  };
}

export const useDetectSchema = (importId: string | null) => {
  return useQuery({
    queryKey: ['detectSchema', importId],
    queryFn: async () => {
      if (!importId) throw new Error('No import ID provided');
      // POST to /imports/:id/detect-schema
      const { data } = await api.post<DetectSchemaResponse>(`/imports/${importId}/detect-schema`);
      return data.data; // assuming ResponseUtil format 
    },
    enabled: !!importId,
  });
};