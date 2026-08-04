import { useQuery } from '@tanstack/react-query';
import { getBackendSrv, isFetchError } from '@grafana/runtime';
import { firstValueFrom } from 'rxjs';

import { GrafanaFolder } from 'types';
import { getUserPermissions } from 'data/permissions';
import { fetchFolderByUid, fetchFolders, folderQueryKeys } from 'data/useFolders';

import { DEFAULT_FOLDER_TITLE, DEFAULT_FOLDER_UID, FOLDERS_STALE_TIME } from './folders.constants';

export class FolderNotProvisionedError extends Error {
  constructor() {
    super('Default Synthetic Monitoring folder not found and user lacks folders:create permission');
    this.name = 'FolderNotProvisionedError';
  }
}

/**
 * Single source of truth for the default folder's availability.
 *
 * - `loading`: the query is still resolving.
 * - `available`: the default folder loaded successfully.
 * - `not-provisioned`: the folder does not exist and the user cannot create it.
 * - `permission-denied`: the user lacks folders:read.
 * - `error`: any other failure (server error, create denied, etc.).
 */
export type FolderStatus = 'loading' | 'available' | 'not-provisioned' | 'permission-denied' | 'error';

/**
 * Resolves the default SM folder with permission fields (canSave, canEdit, etc.).
 *
 * Uses the detail endpoint (GET /api/folders/:uid) rather than the list endpoint
 * because only the detail endpoint returns permission fields. Falls back to
 * searching by title if the known UID is not found. If the folder doesn't exist
 * at all and the user has folders:create permission, auto-creates it.
 *
 * A 403 is re-thrown immediately so callers can detect a permissions gap
 * rather than wastefully trying to list/create the folder.
 */
export function useDefaultFolder(enabled = true) {
  const {
    data: defaultFolder,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: [...folderQueryKeys.all, 'default'] as const,
    queryFn: async (): Promise<GrafanaFolder> => {
      try {
        return await fetchFolderByUid(DEFAULT_FOLDER_UID);
      } catch (err) {
        if (isFetchError(err) && err.status === 403) {
          throw err;
        }
      }

      const folders = await fetchFolders();
      const byTitle = folders.find((f) => f.title === DEFAULT_FOLDER_TITLE);
      if (byTitle) {
        return fetchFolderByUid(byTitle.uid);
      }

      if (!getUserPermissions().canCreateFolders) {
        throw new FolderNotProvisionedError();
      }

      try {
        return await firstValueFrom(
          getBackendSrv().fetch<GrafanaFolder>({
            method: 'POST',
            url: '/api/folders',
            data: { title: DEFAULT_FOLDER_TITLE, uid: DEFAULT_FOLDER_UID },
            showErrorAlert: false,
          })
        ).then((res) => res.data);
      } catch (err) {
        // A 403 on create means this user effectively cannot provision the
        // folder (the RBAC flag passed but the server denied it). The end
        // state is the same as "not provisioned" -- someone with working
        // folders:create must initialize it -- so surface that banner rather
        // than a Retry that cannot succeed. Other failures (e.g. 500) are
        // transient and fall through to the generic error banner.
        if (isFetchError(err) && err.status === 403) {
          throw new FolderNotProvisionedError();
        }
        throw new Error('Failed to create default Synthetic Monitoring folder');
      }
    },
    staleTime: FOLDERS_STALE_TIME,
    refetchOnWindowFocus: false,
    // Once this query has settled (success or error) we must not re-fetch it
    // every time a new observer mounts. With no data and a 403 error, React
    // Query's `shouldLoadOnMount` is gated by `retryOnMount` (not
    // `refetchOnMount`); leaving it at the default `true` makes each newly
    // mounted consumer (e.g. the check form mounting once access falls back to
    // SM RBAC) re-issue the 403. That re-fetch flips `folderStatus`
    // loading->error, which remounts consumers, which re-fetch again: an
    // infinite request loop. Errors here are surfaced with an explicit Retry.
    retryOnMount: false,
    retry: false,
    enabled,
  });

  const status = getFolderStatus({ isLoading, isError, error });

  return {
    defaultFolder,
    defaultFolderUid: defaultFolder?.uid,
    isLoading,
    isError,
    status,
    refetch,
  };
}

function getFolderStatus({
  isLoading,
  isError,
  error,
}: {
  isLoading: boolean;
  isError: boolean;
  error: unknown;
}): FolderStatus {
  if (isLoading) {
    return 'loading';
  }
  if (!isError) {
    return 'available';
  }
  if (error instanceof FolderNotProvisionedError) {
    return 'not-provisioned';
  }
  if (isFetchError(error) && error.status === 403) {
    return 'permission-denied';
  }
  return 'error';
}
