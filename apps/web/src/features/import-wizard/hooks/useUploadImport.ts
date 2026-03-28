import { useMutation } from '@tanstack/react-query';
import { api } from '@/services/api';

export interface UploadImportRequest {
  file: File;
  projectId: string;
}

export interface UploadImportResponse {
  data: {
    id: string;
    projectId: string;
    status: string;
  };
}

export const useUploadImport = () => {
  return useMutation({
    mutationFn: async ({ file, projectId }: UploadImportRequest) => {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('projectId', projectId);

      const { data } = await api.post<UploadImportResponse>('/imports/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      return data.data; // this unwraps the ResponseUtil structure
    },
  });
};