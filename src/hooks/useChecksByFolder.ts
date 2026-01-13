import { useMemo } from 'react';

import { Check, FeatureName, GrafanaFolder } from 'types';
import { isFeatureEnabled } from 'contexts/FeatureFlagContext';
import { useFolders } from 'data/useFolders';

export interface FolderGroup {
  folderUid: string;
  folder?: GrafanaFolder;
  checks: Check[];
  isAccessible: boolean; // Has folder in accessible list
  isOrphaned: boolean; // Folder might be deleted (not in accessible list)
}

export interface ChecksByFolder {
  folderGroups: FolderGroup[];
  rootChecks: Check[]; // Checks with no folder
}

/**
 * Groups checks by their folder, separating root-level checks from folder checks
 * 
 * Returns:
 * - folderGroups: Array of folders with their checks
 * - rootChecks: Checks that don't belong to any folder
 */
export function useChecksByFolder(checks: Check[]): ChecksByFolder {
  const isFoldersEnabled = isFeatureEnabled(FeatureName.Folders);
  const { data: folders = [] } = useFolders();

  return useMemo(() => {
    // If folders feature is disabled, treat all checks as root
    if (!isFoldersEnabled) {
      return {
        folderGroups: [],
        rootChecks: checks,
      };
    }

    const folderMap = new Map<string, FolderGroup>();
    const rootChecks: Check[] = [];

    // Create folder lookup for quick access
    const foldersById = new Map(folders.map((f) => [f.uid, f]));

    checks.forEach((check) => {
      // Checks without folderUid go to root
      if (!check.folderUid) {
        rootChecks.push(check);
        return;
      }

      // Create folder group if it doesn't exist
      if (!folderMap.has(check.folderUid)) {
        const folder = foldersById.get(check.folderUid);
        folderMap.set(check.folderUid, {
          folderUid: check.folderUid,
          folder,
          checks: [],
          isAccessible: !!folder,
          isOrphaned: !folder, // If not in accessible list, might be deleted
        });
      }

      // Add check to its folder group
      folderMap.get(check.folderUid)!.checks.push(check);
    });

    // Convert map to array and sort by folder title
    const folderGroups = Array.from(folderMap.values()).sort((a, b) => {
      const titleA = a.folder?.title || a.folderUid;
      const titleB = b.folder?.title || b.folderUid;
      return titleA.localeCompare(titleB);
    });

    return {
      folderGroups,
      rootChecks,
    };
  }, [checks, folders, isFoldersEnabled]);
}

