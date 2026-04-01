import { useMutation, useQuery, UseQueryResult } from '@tanstack/react-query';
import { getBackendSrv, isFetchError } from '@grafana/runtime';
import { firstValueFrom } from 'rxjs';

import { GrafanaFolder } from 'types';
import { queryClient } from 'data/queryClient';

import { FOLDERS_STALE_TIME, MAX_FOLDER_DEPTH } from './folders.constants';

export interface CreateFolderPayload {
  title: string;
  parentUid?: string;
}

export const folderQueryKeys = {
  all: ['folders'] as const,
  list: () => [...folderQueryKeys.all, 'list'] as const,
  children: (parentUid: string) => [...folderQueryKeys.all, 'children', parentUid] as const,
  detail: (uid: string) => [...folderQueryKeys.all, 'detail', uid] as const,
};

const FOLDERS_API = '/api/folders';

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
 * Fetch root-level folders the current user can access.
 */
export function useFolders(): UseQueryResult<GrafanaFolder[], Error> {
  return useQuery({
    queryKey: folderQueryKeys.list(),
    queryFn: () => fetchFolders(),
    staleTime: FOLDERS_STALE_TIME,
  });
}

/**
 * Fetch the full subtree under a given parent folder.
 * Walks children recursively up to MAX_FOLDER_DEPTH to guard against
 * circular references and very deep trees.
 * Disabled until parentUid is available.
 */
export function useFolderChildren(parentUid: string | undefined): UseQueryResult<GrafanaFolder[], Error> {
  return useQuery({
    queryKey: folderQueryKeys.children(parentUid!),
    queryFn: async () => {
      const allDescendants: GrafanaFolder[] = [];

      async function fetchDescendants(uid: string, depth: number): Promise<void> {
        if (depth >= MAX_FOLDER_DEPTH) {
          return;
        }

        const children = await fetchFolders({ parentUid: uid });
        if (children.length === 0) {
          return;
        }

        allDescendants.push(...children);
        await Promise.all(children.map((child) => fetchDescendants(child.uid, depth + 1)));
      }

      await fetchDescendants(parentUid!, 0);
      return allDescendants;
    },
    staleTime: FOLDERS_STALE_TIME,
    enabled: Boolean(parentUid),
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
    staleTime: FOLDERS_STALE_TIME,
    retry: false,
  });

  const status = isError && isFetchError(error) ? error.status : folder ? 200 : 0;

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
