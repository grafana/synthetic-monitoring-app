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

  // One rule, two readers: whether a check is visible, and whether we know yet. Keeping them
  // apart meant a folder that could never change visibility still counted as "still deciding".
  const resolveVisibility = useCallback(
    (check: Pick<Check, 'folderUid'>): 'visible' | 'hidden' | 'unknown' => {
      if (!isFoldersAvailable) {
        return 'visible';
      }

      const effectiveUid = check.folderUid || defaultFolderUid;
      if (!effectiveUid || accessibleFolderUids.has(effectiveUid)) {
        return 'visible';
      }

      // Folders outside the default subtree: `accessible` means the folder
      // exists and the user can read it (a first-class location under open
      // folder assignment), so its checks must stay visible. `orphaned` (404)
      // checks are shown too. Only `forbidden` (403) hides a check.
      const folderState = folderDetailsByUid.get(effectiveUid);
      if (folderState?.type === 'orphaned' || folderState?.type === 'accessible') {
        return 'visible';
      }

      // No answer yet, so this check may still appear.
      return folderState === undefined || folderState.type === 'loading' ? 'unknown' : 'hidden';
    },
    [isFoldersAvailable, accessibleFolderUids, folderDetailsByUid, defaultFolderUid]
  );

  const visibleChecks = useMemo(
    () => checks.filter((check) => resolveVisibility(check) === 'visible'),
    [checks, resolveVisibility]
  );

  // Readable folders referenced by checks but living outside the default
  // folder's subtree (at the Grafana root level, inside a team folder, etc.).
  // Under open folder assignment these are first-class locations: the folder
  // view shows them, their checks can be filtered, and the folders can be
  // moved. They only surface when a check references them, so the view is not
  // flooded with the org's unrelated dashboard folders.
  //
  // We can only trust this once the subtree has loaded successfully: while
  // loading (or if the child-folder fetch failed) we don't know the full
  // subtree, so we'd wrongly flag in-subtree folders as outside.
  const outsideFolders = useMemo(() => {
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

  // Only checks that could still appear count. The permission map also covers folders no check
  // references, and those resolving must not send a consumer back to a loading state.
  const isVisibilitySettling = useMemo(
    () => folderStatus === 'loading' || checks.some((check) => resolveVisibility(check) === 'unknown'),
    [folderStatus, checks, resolveVisibility]
  );

  return {
    visibleChecks,
    isVisibilitySettling,
    outsideFolders,
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
