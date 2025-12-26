import { useMutation, useQuery, UseQueryResult } from '@tanstack/react-query';
import { getBackendSrv } from '@grafana/runtime';

import { GrafanaFolder } from 'types';
import { queryClient } from 'data/queryClient';

export interface CreateFolderPayload {
  title: string;
  parentUid?: string;
}

export interface UpdateFolderPayload {
  title: string;
  version: number;
}

export const folderQueryKeys = {
  all: ['folders'] as const,
  list: () => [...folderQueryKeys.all, 'list'] as const,
  detail: (uid: string) => [...folderQueryKeys.all, 'detail', uid] as const,
};

export function useFolders(): UseQueryResult<GrafanaFolder[], Error> {
  return useQuery({
    queryKey: folderQueryKeys.list(),
    queryFn: async () => {
      const response = await getBackendSrv().get<GrafanaFolder[]>('/api/folders');
      return response;
    },
    staleTime: 5 * 60 * 1000,
  });
}

export function useFolder(
  uid: string | undefined,
  enabled = true
): UseQueryResult<GrafanaFolder, Error> {
  return useQuery({
    queryKey: folderQueryKeys.detail(uid!),
    queryFn: async () => {
      const response = await getBackendSrv().get<GrafanaFolder>(`/api/folders/${uid}`);
      return response;
    },
    enabled: enabled && Boolean(uid),
    staleTime: 5 * 60 * 1000,
  });
}

export function useCreateFolder() {
  return useMutation({
    mutationFn: async (payload: CreateFolderPayload): Promise<GrafanaFolder> => {
      const response = await getBackendSrv().post<GrafanaFolder>('/api/folders', payload);
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: folderQueryKeys.all });
    },
  });
}

export function useUpdateFolder() {
  return useMutation({
    mutationFn: async ({
      uid,
      payload,
    }: {
      uid: string;
      payload: UpdateFolderPayload;
    }): Promise<GrafanaFolder> => {
      const response = await getBackendSrv().put<GrafanaFolder>(`/api/folders/${uid}`, payload);
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: folderQueryKeys.all });
    },
  });
}

export function useDeleteFolder() {
  return useMutation({
    mutationFn: async (uid: string): Promise<{ message: string; id: number }> => {
      const response = await getBackendSrv().delete<{ message: string; id: number }>(`/api/folders/${uid}`);
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: folderQueryKeys.all });
    },
  });
}


export function useWritableFolders(): UseQueryResult<GrafanaFolder[], Error> {
  const foldersQuery = useFolders();

  return {
    ...foldersQuery,
    // Only include folders with explicit canSave permission
    data: foldersQuery.data?.filter((folder) => folder.canSave === true),
  } as UseQueryResult<GrafanaFolder[], Error>;
}

/**
 * Helper hook to get folder permissions for a specific folder
 */
export function useFolderPermissions(folderUid: string | undefined) {
  const { data: folder, isLoading } = useFolder(folderUid);

  return {
    canRead: folder?.canSave ?? false,
    canWrite: folder?.canEdit ?? false,
    canDelete: folder?.canDelete ?? false,
    canAdmin: folder?.canAdmin ?? false,
    folder,
    isLoading,
  };
}

