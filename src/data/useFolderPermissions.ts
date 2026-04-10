import { useMemo } from 'react';
import { useQueries } from '@tanstack/react-query';
import { getBackendSrv, isFetchError } from '@grafana/runtime';
import { firstValueFrom } from 'rxjs';

import { GrafanaFolder } from 'types';

import { FolderAccessState } from './folderPermissions';
import { FOLDERS_STALE_TIME } from './folders.constants';

const FOLDERS_API = '/api/folders';

function fetchFolderByUid(uid: string) {
  return firstValueFrom(
    getBackendSrv().fetch<GrafanaFolder>({
      method: 'GET',
      url: `${FOLDERS_API}/${uid}`,
      showErrorAlert: false,
    })
  ).then((res) => res.data);
}

function toAccessState(folder: GrafanaFolder): FolderAccessState {
  return {
    type: 'accessible',
    permissions: {
      canEdit: folder.canEdit ?? false,
      canAdmin: folder.canAdmin ?? false,
    },
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
      retry: (failureCount: number, error: unknown) => {
        if (isFetchError(error) && (error.status === 403 || error.status === 404)) {
          return false;
        }
        return failureCount < 2;
      },
    })),
  });

  const folderDetailsByUid = useMemo(() => {
    const map = new Map<string, FolderAccessState>();

    queries.forEach((query, index) => {
      const uid = uniqueUids[index];
      if (!uid) {
        return;
      }

      if (query.data) {
        map.set(uid, toAccessState(query.data));
      } else if (query.error) {
        map.set(uid, toErrorState(query.error));
      } else if (query.isLoading) {
        map.set(uid, { type: 'loading' });
      }
    });

    return map;
  }, [queries, uniqueUids]);

  return { folderDetailsByUid };
}
