import { useCallback, useMemo } from 'react';

import { Check, FeatureName } from 'types';
import { isFeatureEnabled } from 'contexts/FeatureFlagContext';
import {
  CheckFolderStatus,
  CheckPermissions,
  computeCheckPermissions,
  resolveCheckFolderStatus,
} from 'data/folderPermissions';
import { getUserPermissions } from 'data/permissions';
import { useFolderPermissions } from 'data/useFolderPermissions';
import { useAllFolders } from 'data/useFolders';

/**
 * Single entry point for folder-based check access control.
 *
 * Handles the full flow:
 *   1. Gets the accessible folder set (from useAllFolders list endpoint)
 *   2. Fetches permission details for all unique folders (async, progressive)
 *   3. Filters visible checks: accessible folders immediately, unknown folders
 *      shown only after confirming 404 (orphaned). Forbidden folders stay hidden.
 *   4. Computes effective permissions per check (combined model)
 *
 * Returns visibleChecks (filtered) and getPermissions (lookup function).
 */
export function useCheckFolderAccess<T extends Pick<Check, 'folderUid'>>(checks: T[]) {
  const isFoldersEnabled = isFeatureEnabled(FeatureName.Folders);
  const { folders: allFolders } = useAllFolders();

  const accessibleFolderUids = useMemo(
    () => new Set(allFolders.map((f) => f.uid)),
    [allFolders]
  );

  const folderUids = useMemo(() => {
    if (!isFoldersEnabled) {
      return [];
    }
    const uids = new Set<string>();
    checks.forEach((check) => {
      if (check.folderUid) {
        uids.add(check.folderUid);
      }
    });
    return [...uids];
  }, [checks, isFoldersEnabled]);

  const { folderDetailsByUid } = useFolderPermissions(folderUids);
  const smPerms = getUserPermissions();

  const visibleChecks = useMemo(() => {
    if (!isFoldersEnabled) {
      return checks;
    }

    return checks.filter((check) => {
      if (!check.folderUid) {
        return true;
      }
      if (accessibleFolderUids.has(check.folderUid)) {
        return true;
      }
      return folderDetailsByUid.get(check.folderUid)?.type === 'orphaned';
    });
  }, [checks, isFoldersEnabled, accessibleFolderUids, folderDetailsByUid]);

  const getFolderStatus = useCallback(
    (check: Pick<Check, 'folderUid'>): CheckFolderStatus => {
      return resolveCheckFolderStatus(check, folderDetailsByUid, isFoldersEnabled);
    },
    [folderDetailsByUid, isFoldersEnabled]
  );

  const getPermissions = useCallback(
    (check: Pick<Check, 'folderUid'>): CheckPermissions => {
      return computeCheckPermissions(smPerms, getFolderStatus(check));
    },
    [smPerms, getFolderStatus]
  );

  return {
    visibleChecks,
    getPermissions,
    getFolderStatus,
  };
}
