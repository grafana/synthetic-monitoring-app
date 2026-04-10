import { useCallback, useMemo } from 'react';

import { Check, FeatureName } from 'types';
import { isFeatureEnabled } from 'contexts/FeatureFlagContext';
import {
  CheckFolderStatus,
  computeEffectiveCheckPermissions,
  EffectiveCheckPermissions,
  isCheckVisible,
  resolveCheckFolderStatus,
} from 'data/folderPermissions';
import { getUserPermissions } from 'data/permissions';
import { useFolderPermissions } from 'data/useFolderPermissions';

/**
 * Single entry point for folder-based check access control.
 *
 * Accepts an array of checks, fetches folder permissions for their unique
 * folderUids, and exposes lookup functions for visibility and effective
 * permissions. Works the same way for one check or many.
 */
export function useCheckFolderAccess(checks: Array<Pick<Check, 'folderUid'>>) {
  const isFoldersEnabled = isFeatureEnabled(FeatureName.Folders);

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

  const getFolderStatus = useCallback(
    (check: Pick<Check, 'folderUid'>): CheckFolderStatus => {
      return resolveCheckFolderStatus(check, folderDetailsByUid, isFoldersEnabled);
    },
    [folderDetailsByUid, isFoldersEnabled]
  );

  const getPermissions = useCallback(
    (check: Pick<Check, 'folderUid'>): EffectiveCheckPermissions => {
      return computeEffectiveCheckPermissions(smPerms, getFolderStatus(check));
    },
    [smPerms, getFolderStatus]
  );

  const getIsVisible = useCallback(
    (check: Pick<Check, 'folderUid'>): boolean => {
      return isCheckVisible(getFolderStatus(check));
    },
    [getFolderStatus]
  );

  return {
    getPermissions,
    getFolderStatus,
    isCheckVisible: getIsVisible,
  };
}
