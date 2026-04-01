import { useMemo } from 'react';

import { useFolders } from 'data/useFolders';

import { DEFAULT_FOLDER_TITLE, DEFAULT_FOLDER_UID } from './folders.constants';

/**
 * Resolves the default SM folder from the user's accessible folders.
 * Tries matching by known UID first, falls back to title match.
 */
export function useDefaultFolder() {
  const { data: folders = [], isLoading } = useFolders();

  const defaultFolder = useMemo(() => {
    return folders.find((f) => f.uid === DEFAULT_FOLDER_UID) ?? folders.find((f) => f.title === DEFAULT_FOLDER_TITLE);
  }, [folders]);

  return {
    defaultFolder,
    defaultFolderUid: defaultFolder?.uid,
    isLoading,
  };
}
