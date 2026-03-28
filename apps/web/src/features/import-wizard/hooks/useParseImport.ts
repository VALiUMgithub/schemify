import { useQuery } from '@tanstack/react-query';
import { api } from '@/services/api';

export interface ParseImportResponse {
  data: {
    columns: Array<{ name: string; order: number; sampleValue: string }>;
    rowsPreview: Record<string, any>[];
    totalRowCount: number;
  };
}

export const useParseImport = (importId: string | null) => {
  return useQuery({
    queryKey: ['parseImport', importId],
    queryFn: async () => {
      if (!importId) throw new Error('No import ID provided');
      // POST to /imports/:id/parse
      const { data } = await api.post<ParseImportResponse>(`/imports/${importId}/parse`);
      return data.data; // assuming ResponseUtil.success format returns { data: ... }
    },
    enabled: !!importId,
  });
};