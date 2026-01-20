import { useMemo } from 'react';

import { Check, FeatureName } from 'types';
import { isFeatureEnabled } from 'contexts/FeatureFlagContext';
import { useCheckForbiddenFolders, useFolders } from 'data/useFolders';

/**
 * Filter checks based on folder permissions
 * 
 * Shows checks if:
 * - No folder (root level)
 * - Folder in accessible list (200)
 * - Folder deleted (404) - shows with "Folder deleted" badge
 * 
 * Hides checks if:
 * - Folder exists but user has no access (403)
 *
 * See https://grafana.com/docs/grafana/latest/developer-resources/api-reference/http-api/folder/
 */
export function useAccessibleChecks(checks: Check[]): Check[] {
  const isFoldersEnabled = isFeatureEnabled(FeatureName.Folders);
  const { data: folders = [], isError: foldersQueryError } = useFolders();

  const accessibleFolderUids = useMemo(() => new Set(folders.map((f) => f.uid)), [folders]);

  // Get list of folder UIDs that aren't in accessible list
  const missingFolderUids = useMemo(() => {
    const uids = new Set<string>();
    checks.forEach((check) => {
      if (check.folderUid && !accessibleFolderUids.has(check.folderUid)) {
        uids.add(check.folderUid);
      }
    });
    return Array.from(uids);
  }, [checks, accessibleFolderUids]);

  // Check which missing folders are forbidden (403) vs orphaned (404)
  const { data: forbiddenFolders = {}, isLoading: isForbiddenFoldersLoading } = useCheckForbiddenFolders(
    missingFolderUids,
    !foldersQueryError
  );

  return useMemo(() => {
    if (!isFoldersEnabled) {
      return checks;
    }

    // If user doesn't have folders:read permission, only show root level checks
    if (foldersQueryError) {
      return checks.filter((check) => !check.folderUid);
    }

    return checks.filter((check) => {
      if (!check.folderUid) {
        return true; // Root level
      }

      if (accessibleFolderUids.has(check.folderUid)) {
        return true; // In accessible list
      }

      // While loading forbidden folders data, hide checks with unknown status to prevent flicker
      // Once loaded, hide if explicitly forbidden (403), show if orphaned (404)
      if (isForbiddenFoldersLoading) {
        return false;
      }

      return !forbiddenFolders[check.folderUid];
    });
  }, [checks, accessibleFolderUids, forbiddenFolders, isFoldersEnabled, foldersQueryError, isForbiddenFoldersLoading]);
}
