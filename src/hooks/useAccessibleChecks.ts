import { useMemo } from 'react';

import { Check, FeatureName } from 'types';
import { isFeatureEnabled } from 'contexts/FeatureFlagContext';
import { useFolders } from 'data/useFolders';

/**
 * Filter checks based on folder permissions
 * Only returns checks that are either:
 * 1. In folders the user has access to (if folder is in /api/folders response, user has at least View permission)
 * 2. Not in any folder (root level)
 *
 * See https://grafana.com/docs/grafana/latest/developer-resources/api-reference/http-api/folder_permissions/
 */
export function useAccessibleChecks(checks: Check[]): Check[] {
  const isFoldersEnabled = isFeatureEnabled(FeatureName.Folders);
  const { data: folders = [] } = useFolders();

  return useMemo(() => {
    if (!isFoldersEnabled) {
      return checks;
    }

    // If a folder is in the list, user has read access
    const accessibleFolderUids = new Set(folders.map((folder) => folder.uid));

    return checks.filter((check) => {
      if (!check.folderUid) {
        return true;
      }
      return accessibleFolderUids.has(check.folderUid);
    });
  }, [checks, folders, isFoldersEnabled]);
}
