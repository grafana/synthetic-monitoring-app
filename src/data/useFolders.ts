import { useMutation, useQuery, UseQueryResult } from '@tanstack/react-query';
import { getBackendSrv } from '@grafana/runtime';
import { firstValueFrom } from 'rxjs';

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

const STALE_TIME = 5 * 60 * 1000; // 5 minutes

export function useFolders(): UseQueryResult<GrafanaFolder[], Error> {
  return useQuery({
    queryKey: folderQueryKeys.list(),
    queryFn: () => getBackendSrv().get<GrafanaFolder[]>('/api/folders'),
    staleTime: STALE_TIME,
  });
}

/**
 * Get folder data with permissions and access status (200, 404, 403)
 */
export function useFolder(uid: string | undefined, enabled = true) {
  const { data: folder, isLoading, isError, error } = useQuery({
    queryKey: folderQueryKeys.detail(uid!),
    queryFn: () =>
      firstValueFrom(
        getBackendSrv().fetch<GrafanaFolder>({
          url: `/api/folders/${uid}`,
          method: 'GET',
          showErrorAlert: false,
        })
      ).then((response) => response.data),
    enabled: enabled && Boolean(uid),
    staleTime: STALE_TIME,
    retry: false, // Don't retry on 403/404 - we need to detect these states
  });

  const status = isError ? (error as any)?.status || 500 : folder ? 200 : 0;

  return {
    folder,
    isLoading,
    ...parseStatus(status),
    canEdit: folder?.canEdit ?? false,
    canDelete: folder?.canDelete ?? false,
    canAdmin: folder?.canAdmin ?? false,
  };
}

const invalidateAllFolders = () => queryClient.invalidateQueries({ queryKey: folderQueryKeys.all });

export function useCreateFolder() {
  return useMutation({
    mutationFn: (payload: CreateFolderPayload) => getBackendSrv().post<GrafanaFolder>('/api/folders', payload),
    onSuccess: invalidateAllFolders,
  });
}

export function useUpdateFolder() {
  return useMutation({
    mutationFn: ({ uid, payload }: { uid: string; payload: UpdateFolderPayload }) =>
      getBackendSrv().put<GrafanaFolder>(`/api/folders/${uid}`, payload),
    onSuccess: invalidateAllFolders,
  });
}

export function useDeleteFolder() {
  return useMutation({
    mutationFn: (uid: string) => getBackendSrv().delete<{ message: string; id: number }>(`/api/folders/${uid}`),
    onSuccess: invalidateAllFolders,
  });
}

// Helper to parse HTTP status into access flags
const parseStatus = (status: number) => ({
  exists: status === 200,
  hasAccess: status === 200,
  isOrphaned: status === 404,
  isForbidden: status === 403,
});

/**
 * Batch check multiple folder UIDs - returns map of { uid: isForbidden }
 * Used to distinguish 404 (show) vs 403 (hide) for folders not in accessible list
 */
export function useCheckForbiddenFolders(folderUids: string[], enabled = true) {
  return useQuery({
    queryKey: [...folderQueryKeys.all, 'forbidden', folderUids.sort().join(',')],
    queryFn: async () => {
      const results = await Promise.all(
        folderUids.map(async (uid) => {
          try {
            await firstValueFrom(
              getBackendSrv().fetch({
                url: `/api/folders/${uid}`,
                method: 'GET',
                showErrorAlert: false,
              })
            );
            return { uid, forbidden: false };
          } catch (error: any) {
            return { uid, forbidden: error?.status === 403 };
          }
        })
      );
      return results.reduce((acc, { uid, forbidden }) => {
        acc[uid] = forbidden;
        return acc;
      }, {} as Record<string, boolean>);
    },
    enabled: enabled && folderUids.length > 0,
    staleTime: STALE_TIME,
  });
}

