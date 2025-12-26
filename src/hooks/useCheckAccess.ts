import { useMemo } from 'react';

import { Check, FeatureName } from 'types';
import { isFeatureEnabled } from 'contexts/FeatureFlagContext';
import { useFolders } from 'data/useFolders';

/**
 * Check if user has access to a specific check based on folder permissions
 *
 * Returns:
 * - true: User has access (check has no folder OR user has access to the folder)
 * - false: User doesn't have access (check is in a folder user can't access)
 * - null: Loading folder data
 */
export function useCheckAccess(check: Check | undefined): boolean | null {
  const isFoldersEnabled = isFeatureEnabled(FeatureName.Folders);
  const { data: folders, isLoading } = useFolders();

  return useMemo(() => {
    if (!isFoldersEnabled) {
      return true;
    }

    if (!check) {
      return false;
    }

    if (isLoading) {
      return null;
    }

    //root level: allow access
    if (!check.folderUid) {
      return true;
    }

    const hasAccess = folders?.some((folder) => folder.uid === check.folderUid);
    return hasAccess ?? false;
  }, [check, folders, isLoading, isFoldersEnabled]);
}
