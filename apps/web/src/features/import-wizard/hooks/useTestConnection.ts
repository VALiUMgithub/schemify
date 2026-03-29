import { useMutation } from '@tanstack/react-query';
import { api } from '@/services/api';

export interface TestConnectionRequest {
  databaseType: string;
  config: {
    host?: string;
    port?: number;
    user?: string;
    password?: string;
    database?: string;
  };
}

export interface TestConnectionResponse {
  success: boolean;
  message: string;
  connectionTimeMs: number;
}

export const useTestConnection = () => {
  return useMutation({
    mutationFn: async (payload: TestConnectionRequest): Promise<TestConnectionResponse> => {
      const { data } = await api.post('/database/test-connection', payload);
      return data.data;
    },
  });
};
