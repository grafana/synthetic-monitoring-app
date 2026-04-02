import { useQuery } from '@tanstack/react-query';
import { getBackendSrv } from '@grafana/runtime';
import { firstValueFrom } from 'rxjs';

import { GrafanaFolder } from 'types';
import { folderQueryKeys } from 'data/useFolders';

import { DEFAULT_FOLDER_TITLE, DEFAULT_FOLDER_UID, FOLDERS_STALE_TIME } from './folders.constants';

/**
 * Resolves the default SM folder. Tries by known UID first, then by title.
 * If neither is found, creates the folder automatically.
 */
export function useDefaultFolder() {
  const { data: defaultFolder, isLoading, isError } = useQuery({
    queryKey: [...folderQueryKeys.all, 'default'] as const,
    queryFn: async (): Promise<GrafanaFolder> => {
      const folders = await firstValueFrom(
        getBackendSrv().fetch<GrafanaFolder[]>({ method: 'GET', url: '/api/folders', showErrorAlert: false })
      ).then((res) => res.data);

      const byUid = folders.find((f) => f.uid === DEFAULT_FOLDER_UID);
      if (byUid) {
        return byUid;
      }

      const byTitle = folders.find((f) => f.title === DEFAULT_FOLDER_TITLE);
      if (byTitle) {
        return byTitle;
      }

      return firstValueFrom(
        getBackendSrv().fetch<GrafanaFolder>({
          method: 'POST',
          url: '/api/folders',
          data: { title: DEFAULT_FOLDER_TITLE },
        })
      ).then((res) => res.data);
    },
    staleTime: FOLDERS_STALE_TIME,
    retry: false,
  });

  return {
    defaultFolder,
    defaultFolderUid: defaultFolder?.uid,
    isLoading,
    isError,
  };
}
