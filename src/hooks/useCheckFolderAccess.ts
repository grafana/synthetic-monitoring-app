import { useCallback, useMemo } from 'react';

import { Check, GrafanaFolder } from 'types';
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
  const {
    folders: allFolders,
    defaultFolderUid,
    isFoldersAvailable,
    folderStatus,
    isLoading: isFoldersLoading,
    isError: isFoldersError,
  } = useAllFolders();

  const accessibleFolderUids = useMemo(() => new Set(allFolders.map((f) => f.uid)), [allFolders]);

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
      // Folders outside the default subtree: `accessible` means the folder
      // exists and the user can read it (e.g. a check assigned to an external
      // folder via the API, or a folder stranded by a default-folder UID
      // mismatch), so its checks must stay visible. `orphaned` (404) checks
      // are shown too. Only `forbidden` (403) hides a check.
      const folderState = folderDetailsByUid.get(effectiveUid);
      return folderState?.type === 'orphaned' || folderState?.type === 'accessible';
    });
  }, [checks, isFoldersAvailable, accessibleFolderUids, folderDetailsByUid, defaultFolderUid]);

  // Readable folders referenced by checks but living outside the default
  // folder's subtree, so the folder view can show them instead of hiding
  // their checks.
  //
  // We can only trust this once the subtree has loaded successfully: while
  // loading (or if the child-folder fetch failed) we don't know the full
  // subtree, so we'd wrongly flag in-subtree folders as external.
  const externalFolders = useMemo(() => {
    if (isFoldersLoading || isFoldersError) {
      return [];
    }
    const result: GrafanaFolder[] = [];
    folderDetailsByUid.forEach((state, uid) => {
      if (state.type === 'accessible' && state.folder && !accessibleFolderUids.has(uid)) {
        result.push(state.folder);
      }
    });
    return result;
  }, [folderDetailsByUid, accessibleFolderUids, isFoldersLoading, isFoldersError]);

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
    externalFolders,
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
