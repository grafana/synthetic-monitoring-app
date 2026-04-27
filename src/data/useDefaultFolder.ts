import { useQuery } from '@tanstack/react-query';
import { getBackendSrv } from '@grafana/runtime';
import { firstValueFrom } from 'rxjs';

import { GrafanaFolder } from 'types';
import { getUserPermissions } from 'data/permissions';
import { fetchFolderByUid, fetchFolders, folderQueryKeys } from 'data/useFolders';

import { DEFAULT_FOLDER_TITLE, DEFAULT_FOLDER_UID, FOLDERS_STALE_TIME } from './folders.constants';

/**
 * Resolves the default SM folder with permission fields (canSave, canEdit, etc.).
 *
 * Uses the detail endpoint (GET /api/folders/:uid) rather than the list endpoint
 * because only the detail endpoint returns permission fields. Falls back to
 * searching by title if the known UID is not found. If the folder doesn't exist
 * at all and the user has folders:create permission, auto-creates it.
 */
export function useDefaultFolder(enabled = true) {
  const { data: defaultFolder, isLoading, isError, refetch } = useQuery({
    queryKey: [...folderQueryKeys.all, 'default'] as const,
    queryFn: async (): Promise<GrafanaFolder> => {
      try {
        return await fetchFolderByUid(DEFAULT_FOLDER_UID);
      } catch {
        // UID not found — fall back to searching by title
      }

      const folders = await fetchFolders();
      const byTitle = folders.find((f) => f.title === DEFAULT_FOLDER_TITLE);
      if (byTitle) {
        return fetchFolderByUid(byTitle.uid);
      }

      if (!getUserPermissions().canCreateFolders) {
        throw new Error('Default Synthetic Monitoring folder not found and user lacks folders:create permission');
      }

      return firstValueFrom(
        getBackendSrv().fetch<GrafanaFolder>({
          method: 'POST',
          url: '/api/folders',
          data: { title: DEFAULT_FOLDER_TITLE },
          showErrorAlert: false,
        })
      ).then((res) => res.data);
    },
    staleTime: FOLDERS_STALE_TIME,
    refetchOnWindowFocus: false,
    retry: false,
    enabled,
  });

  return {
    defaultFolder,
    defaultFolderUid: defaultFolder?.uid,
    isLoading,
    isError,
    refetch,
  };
}
