import { useMemo } from 'react';

import { Check, FeatureName, GrafanaFolder } from 'types';
import { isFeatureEnabled } from 'contexts/FeatureFlagContext';
import { getFolderPath, useFolders } from 'data/useFolders';

export interface FolderGroup {
  folderUid: string;
  folder?: GrafanaFolder;
  folderPath: string;
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

    const foldersById = new Map(folders.map((f) => [f.uid, f]));

    checks.forEach((check) => {
      if (!check.folderUid) {
        rootChecks.push(check);
        return;
      }

      if (!folderMap.has(check.folderUid)) {
        const folder = foldersById.get(check.folderUid);
        folderMap.set(check.folderUid, {
          folderUid: check.folderUid,
          folder,
          folderPath: folder ? getFolderPath(folder, foldersById) : check.folderUid,
          checks: [],
          isAccessible: !!folder,
          isOrphaned: !folder,
        });
      }

      folderMap.get(check.folderUid)!.checks.push(check);
    });

    const folderGroups = Array.from(folderMap.values()).sort((a, b) => {
      return a.folderPath.localeCompare(b.folderPath);
    });

    return {
      folderGroups,
      rootChecks,
    };
  }, [checks, folders, isFoldersEnabled]);
}

