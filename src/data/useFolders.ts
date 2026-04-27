import { useMemo } from 'react';
import { useMutation, useQuery, UseQueryResult } from '@tanstack/react-query';
import { getBackendSrv } from '@grafana/runtime';
import { firstValueFrom } from 'rxjs';

import { FeatureName, GrafanaFolder } from 'types';
import { isFeatureEnabled } from 'contexts/FeatureFlagContext';
import { queryClient } from 'data/queryClient';
import { useDefaultFolder } from 'data/useDefaultFolder';

import { FOLDERS_STALE_TIME } from './folders.constants';

export interface CreateFolderPayload {
  title: string;
  parentUid?: string;
}

export const folderQueryKeys = {
  all: ['folders'] as const,
  children: (parentUid: string) => [...folderQueryKeys.all, 'children', parentUid] as const,
};

const FOLDERS_API = '/api/folders';

export function fetchFolders(params?: Record<string, string>) {
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
 * Fetch the full subtree under a given parent folder.
 * Walks children recursively, tracking visited UIDs to guard against
 * circular references. Disabled until parentUid is available.
 */
export function useFolderChildren(parentUid: string | undefined): UseQueryResult<GrafanaFolder[], Error> {
  return useQuery({
    queryKey: folderQueryKeys.children(parentUid!),
    queryFn: async () => {
      const allDescendants: GrafanaFolder[] = [];
      const visited = new Set<string>();

      async function fetchDescendants(uid: string): Promise<void> {
        if (visited.has(uid)) {
          return;
        }
        visited.add(uid);

        const children = await fetchFolders({ parentUid: uid });
        if (children.length === 0) {
          return;
        }

        allDescendants.push(...children);
        await Promise.all(children.map((child) => fetchDescendants(child.uid)));
      }

      await fetchDescendants(parentUid!);
      return allDescendants;
    },
    staleTime: FOLDERS_STALE_TIME,
    refetchOnWindowFocus: false,
    enabled: Boolean(parentUid),
  });
}

/**
 * Return the ordered array of folder titles from root to the given folder
 * by walking up the parentUid chain.
 */
export function getFolderPathParts(folder: GrafanaFolder, allFoldersMap: Map<string, GrafanaFolder>): string[] {
  if (!folder.parentUid) {
    return [folder.title];
  }

  const path: string[] = [folder.title];
  let current = folder;
  const visited = new Set<string>([folder.uid]);

  while (current.parentUid && !visited.has(current.parentUid)) {
    visited.add(current.parentUid);
    const parent = allFoldersMap.get(current.parentUid);
    if (!parent) {
      break;
    }
    path.unshift(parent.title);
    current = parent;
  }

  return path;
}

/**
 * Build the folder path (e.g. "Platform Team > Staging > EU")
 * by walking up the parentUid chain.
 */
export function getFolderPath(folder: GrafanaFolder, allFoldersMap: Map<string, GrafanaFolder>): string {
  return getFolderPathParts(folder, allFoldersMap).join(' > ');
}

/**
 * Fetch the default SM folder and all its descendants.
 * Single entry point for folder data -- checks isFoldersEnabled once
 * and gates all downstream queries via enabled params.
 */
export function useAllFolders() {
  const isFoldersEnabled = isFeatureEnabled(FeatureName.Folders);
  const { defaultFolder, defaultFolderUid, isLoading: isDefaultLoading, isError: isDefaultError } = useDefaultFolder(isFoldersEnabled);
  const {
    data: childFolders = [],
    isLoading: isChildrenLoading,
    isError: isChildrenError,
  } = useFolderChildren(defaultFolderUid);

  const folders = useMemo(() => {
    if (!defaultFolder) {
      return [];
    }
    return [defaultFolder, ...childFolders];
  }, [defaultFolder, childFolders]);

  const foldersMap = useMemo(() => new Map(folders.map((f) => [f.uid, f])), [folders]);

  const isError = isDefaultError || isChildrenError;
  const refetch = () => queryClient.invalidateQueries({ queryKey: folderQueryKeys.all });

  return {
    folders,
    foldersMap,
    defaultFolderUid,
    isLoading: isDefaultLoading || isChildrenLoading,
    isError,
    refetch,
  };
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
