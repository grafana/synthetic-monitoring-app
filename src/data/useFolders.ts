import { useMutation, useQuery, UseQueryResult } from '@tanstack/react-query';
import { getBackendSrv } from '@grafana/runtime';
import { firstValueFrom } from 'rxjs';

import { GrafanaFolder } from 'types';
import { queryClient } from 'data/queryClient';

export interface CreateFolderPayload {
  title: string;
  parentUid?: string;
}

export const folderQueryKeys = {
  all: ['folders'] as const,
  list: () => [...folderQueryKeys.all, 'list'] as const,
  detail: (uid: string) => [...folderQueryKeys.all, 'detail', uid] as const,
};

const STALE_TIME = 5 * 60 * 1000;

/**
 * Fetch all folders the current user can access, including nested.
 * Walks the folder tree by fetching children recursively via parentUid.
 */
export function useFolders(): UseQueryResult<GrafanaFolder[], Error> {
  return useQuery({
    queryKey: folderQueryKeys.list(),
    queryFn: async () => {
      const rootFolders = await getBackendSrv().get<GrafanaFolder[]>('/api/folders');
      const allFolders: GrafanaFolder[] = [...rootFolders];

      async function fetchChildren(parentUid: string): Promise<void> {
        const children = await getBackendSrv().get<GrafanaFolder[]>('/api/folders', { parentUid });
        if (children.length === 0) {
          return;
        }
        allFolders.push(...children);
        await Promise.all(children.map((child) => fetchChildren(child.uid)));
      }

      await Promise.all(rootFolders.map((folder) => fetchChildren(folder.uid)));
      return allFolders;
    },
    staleTime: STALE_TIME,
  });
}

/**
 * Fetch a single folder by UID, including permission flags.
 *
 * Handles three possible states:
 *  - 200: folder exists and user has access
 *  - 404: folder was deleted (orphaned reference)
 *  - 403: folder exists but user lacks access
 *
 * Set `enabled` to false to skip the query (e.g. when uid is undefined).
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
    retry: false,
  });

  const status = isError ? (error as any)?.status || 500 : folder ? 200 : 0;

  return {
    folder,
    isLoading,
    isOrphaned: status === 404,
    isForbidden: status === 403,
    hasAccess: status === 200,
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
