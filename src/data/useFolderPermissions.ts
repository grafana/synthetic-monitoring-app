import { useMemo } from 'react';
import { useQueries } from '@tanstack/react-query';
import { isFetchError } from '@grafana/runtime';

import { GrafanaFolder } from 'types';
import { fetchFolderByUid } from 'data/useFolders';

import { FolderAccessState } from './folderPermissions';
import { FOLDERS_STALE_TIME } from './folders.constants';

function toAccessState(folder: GrafanaFolder): FolderAccessState {
  return {
    type: 'accessible',
    permissions: {
      canEdit: folder.canEdit ?? false,
      canAdmin: folder.canAdmin ?? false,
      canDelete: folder.canDelete ?? false,
    },
    folder,
  };
}

function toErrorState(error: unknown): FolderAccessState {
  if (isFetchError(error) && error.status === 404) {
    return { type: 'orphaned' };
  }

  // 403 or any other error → safe default
  return { type: 'forbidden' };
}

/**
 * Batch-fetch folder permissions for a set of folder UIDs.
 *
 * Calls GET /api/folders/:uid for each unique UID (the only endpoint that
 * returns permission fields like canEdit and canAdmin). Results are cached
 * per UID by React Query.
 *
 * Returns a Map<uid, FolderDetail> where each entry contains:
 *   - loading:    request in flight, folder status unknown yet
 *   - accessible: folder exists, user has access, includes permission flags
 *   - forbidden:  403 or unknown error (safe default)
 *   - orphaned:   404, folder was deleted
 *
 * The map updates progressively as individual queries resolve.
 */
export function useFolderPermissions(folderUids: string[]) {
  const uniqueUids = useMemo(() => [...new Set(folderUids)], [folderUids]);

  const queries = useQueries({
    queries: uniqueUids.map((uid) => ({
      queryKey: ['folders', 'detail', uid] as const,
      queryFn: () => fetchFolderByUid(uid),
      staleTime: FOLDERS_STALE_TIME,
      // Don't re-issue a settled-error request every time a new observer
      // mounts. A 403/404 folder has no data, so React Query's
      // `shouldLoadOnMount` is governed by `retryOnMount`; leaving it `true`
      // makes each remount re-fetch, which can drive an infinite request loop
      // when the folder set churns. See useDefaultFolder for the full rationale.
      retryOnMount: false,
      retry: (failureCount: number, error: unknown) => {
        if (isFetchError(error) && (error.status === 403 || error.status === 404)) {
          return false;
        }
        return failureCount < 2;
      },
    })),
  });

  const queryData = queries.map((q) => q.data);
  const queryErrors = queries.map((q) => q.error);
  const queryLoading = queries.map((q) => q.isLoading);

  const folderDetailsByUid = useMemo(() => {
    const map = new Map<string, FolderAccessState>();

    uniqueUids.forEach((uid, index) => {
      const data = queryData[index];
      const error = queryErrors[index];
      const isLoading = queryLoading[index];

      if (data) {
        map.set(uid, toAccessState(data));
      } else if (error) {
        map.set(uid, toErrorState(error));
      } else if (isLoading) {
        map.set(uid, { type: 'loading' });
      }
    });

    return map;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [uniqueUids, ...queryData, ...queryErrors, ...queryLoading]);

  return { folderDetailsByUid };
}
