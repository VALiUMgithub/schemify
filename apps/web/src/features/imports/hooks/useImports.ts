import { useQuery } from '@tanstack/react-query';
import { getImports } from '../services/imports.service';
import { importsKeys } from './useImportDetail';

export const useImports = (projectId?: string) => {
  return useQuery({
    queryKey: importsKeys.list(projectId),
    queryFn: () => getImports(projectId),
  });
};