import { useCallback, useMemo } from 'react';

import { Check } from 'types';
import {
  CheckFolderStatus,
  CheckPermissions,
  computeCheckPermissions,
  resolveCheckFolderStatus,
} from 'data/folderPermissions';
import { useUserPermissions } from 'data/permissions';
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
 * When the feature flag is on but folder data failed to load (e.g. missing
 * folders:read permission), falls back to pre-folders behaviour: all checks
 * visible, SM RBAC only.
 *
 * Returns visibleChecks (filtered) and getPermissions (lookup function).
 */
export function useCheckFolderAccess<T extends Pick<Check, 'folderUid'>>(checks: T[]) {
  const { folders: allFolders, defaultFolderUid, isFoldersAvailable, folderStatus } = useAllFolders();

  const accessibleFolderUids = useMemo(
    () => new Set(allFolders.map((f) => f.uid)),
    [allFolders]
  );

  const folderUids = useMemo(() => {
    if (!isFoldersAvailable) {
      return [];
    }
    const uids = new Set<string>();
    if (defaultFolderUid) {
      uids.add(defaultFolderUid);
    }
    checks.forEach((check) => {
      if (check.folderUid) {
        uids.add(check.folderUid);
      }
    });
    allFolders.forEach((folder) => uids.add(folder.uid));
    return [...uids];
  }, [checks, allFolders, isFoldersAvailable, defaultFolderUid]);

  const { folderDetailsByUid } = useFolderPermissions(folderUids);
  const smPerms = useUserPermissions();

  const visibleChecks = useMemo(() => {
    if (!isFoldersAvailable) {
      return checks;
    }

    return checks.filter((check) => {
      const effectiveUid = check.folderUid || defaultFolderUid;
      if (!effectiveUid) {
        return true;
      }
      if (accessibleFolderUids.has(effectiveUid)) {
        return true;
      }
      return folderDetailsByUid.get(effectiveUid)?.type === 'orphaned';
    });
  }, [checks, isFoldersAvailable, accessibleFolderUids, folderDetailsByUid, defaultFolderUid]);

  const getFolderStatus = useCallback(
    (check: Pick<Check, 'folderUid'>): CheckFolderStatus => {
      return resolveCheckFolderStatus(check, folderDetailsByUid, isFoldersAvailable, defaultFolderUid);
    },
    [folderDetailsByUid, isFoldersAvailable, defaultFolderUid]
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
    isFoldersAvailable,
    // True while the default folder request is still in flight. During this
    // window isFoldersAvailable is optimistically `true`, so a check whose
    // folder has already resolved to `forbidden` would compute canRead=false
    // even when the eventual state is the fallback (default folder 403 ->
    // no-folder-context). Consumers that gate navigation on canRead must wait
    // for this to settle to avoid a premature, irreversible redirect.
    isResolving: folderStatus === 'loading',
  };
}
