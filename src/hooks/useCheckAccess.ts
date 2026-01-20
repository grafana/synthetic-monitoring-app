import { useMemo } from 'react';

import { Check, FeatureName } from 'types';
import { isFeatureEnabled } from 'contexts/FeatureFlagContext';
import { useFolder, useFolders } from 'data/useFolders';

/**
 * Check if user has access to a specific check based on folder permissions
 *
 * Queries the individual folder to distinguish between:
 * - 200: Folder exists and user has access → Allow access
 * - 404: Folder doesn't exist (orphaned) → Allow access (show with warning)
 * - 403: Folder exists but no access → Deny access
 * - Other errors: Deny access (safe default)
 *
 * Returns:
 * - true: User has access (accessible folder, orphaned folder, or root level)
 * - false: No access (forbidden, unknown error, or no folders:read permission)
 * - null: Loading folder data
 */
export function useCheckAccess(check: Check | undefined): boolean | null {
  const isFoldersEnabled = isFeatureEnabled(FeatureName.Folders);
  const { data: folders, isLoading: isFoldersLoading, isError: foldersQueryError } = useFolders();
  
  const accessibleFolderUids = useMemo(() => new Set(folders?.map((f) => f.uid) || []), [folders]);
  const needsFolderCheck = Boolean(check?.folderUid && !accessibleFolderUids.has(check.folderUid));
  
  // Query folder info only if needed
  const folderInfo = useFolder(check?.folderUid, isFoldersEnabled && needsFolderCheck && !foldersQueryError);

  return useMemo(() => {
    if (!isFoldersEnabled) {
      return true;
    }

    if (!check) {
      return false;
    }

    if (isFoldersLoading) {
      return null;
    }

    // If user doesn't have folders:read permission, only allow root level checks
    if (foldersQueryError) {
      return !check.folderUid;
    }

    // Root level checks are always accessible
    if (!check.folderUid) {
      return true;
    }

    // Check is in accessible folders list
    if (accessibleFolderUids.has(check.folderUid)) {
      return true;
    }

    // Still loading folder info
    if (folderInfo.isLoading) {
      return null;
    }

    // Explicitly deny access if forbidden (403)
    if (folderInfo.isForbidden) {
      return false;
    }

    // Explicitly allow access if orphaned (404)
    if (folderInfo.isOrphaned) {
      return true;
    }

    // For other errors or unknown states, deny access to be safe
    return false;
  }, [check, accessibleFolderUids, isFoldersLoading, folderInfo, isFoldersEnabled, foldersQueryError]);
}
