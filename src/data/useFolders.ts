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

const FOLDERS_API = '/api/folders';
const STALE_TIME = 5 * 60 * 1000;

function fetchFolders(params?: Record<string, string>) {
  return firstValueFrom(
    getBackendSrv().fetch<GrafanaFolder[]>({
      method: 'GET',
      url: FOLDERS_API,
      params,
      showErrorAlert: false,
    })
  ).then((res) => res.data);
}

/**
 * Fetch all folders the current user can access, including nested.
 * Walks the folder tree by fetching children recursively via parentUid.
 */
export function useFolders(): UseQueryResult<GrafanaFolder[], Error> {
  return useQuery({
    queryKey: folderQueryKeys.list(),
    queryFn: async () => {
      const rootFolders = await fetchFolders();
      const allFolders: GrafanaFolder[] = [...rootFolders];

      async function fetchChildren(parentUid: string): Promise<void> {
        const children = await fetchFolders({ parentUid });
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
 */
export function useFolder(uid: string | undefined, enabled = true) {
  const { data: folder, isLoading, isError, error } = useQuery({
    queryKey: folderQueryKeys.detail(uid!),
    queryFn: () =>
      firstValueFrom(
        getBackendSrv().fetch<GrafanaFolder>({
          method: 'GET',
          url: `${FOLDERS_API}/${uid}`,
          showErrorAlert: false,
        })
      ).then((res) => res.data),
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

/**
 * Build the full folder path (e.g. "Platform Team > Staging > EU")
 * by walking up the parentUid chain.
 */
export function getFolderPath(folder: GrafanaFolder, allFoldersMap: Map<string, GrafanaFolder>): string {
  if (!folder.parentUid) {
    return folder.title;
  }

  const path: string[] = [folder.title];
  let current = folder;

  while (current.parentUid) {
    const parent = allFoldersMap.get(current.parentUid);
    if (!parent) {
      break;
    }
    path.unshift(parent.title);
    current = parent;
  }

  return path.join(' > ');
}

const invalidateAllFolders = () => queryClient.invalidateQueries({ queryKey: folderQueryKeys.all });

export function useCreateFolder() {
  return useMutation({
    mutationFn: (payload: CreateFolderPayload) =>
      firstValueFrom(
        getBackendSrv().fetch<GrafanaFolder>({
          method: 'POST',
          url: FOLDERS_API,
          data: payload,
        })
      ).then((res) => res.data),
    onSuccess: invalidateAllFolders,
  });
}
