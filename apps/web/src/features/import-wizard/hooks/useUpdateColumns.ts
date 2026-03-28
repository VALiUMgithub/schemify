import { useMutation } from '@tanstack/react-query';
import { api } from '@/services/api';

export interface UpdateColumnsRequest {
  updates: Array<{
    columnId: string;
    detectedType: string;
    nullable: boolean;
    name: string;
  }>;
}

export const useUpdateColumns = (importId: string | null) => {
  return useMutation({
    mutationFn: async (payload: UpdateColumnsRequest) => {
      if (!importId) throw new Error('No import ID provided');
      const { data } = await api.patch(`/imports/${importId}/columns`, payload);
      return data;
    },
  });
};