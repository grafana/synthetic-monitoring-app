import { Check } from 'types';

import { SMPermissions } from './permissions';

// -- Types --

/**
 * Permission flags from the Grafana folder detail endpoint (GET /api/folders/:uid).
 * The list endpoint (GET /api/folders) does NOT return these fields.
 */
export interface FolderPermissionFlags {
  canEdit: boolean;
  canAdmin: boolean;
}

/**
 * The resolved state of a folder from GET /api/folders/:uid.
 *   - loading:     request in flight, folder status unknown yet
 *   - accessible:  200, user has at least View permission
 *   - forbidden:   403 (or any non-404 error — safe default)
 *   - orphaned:    404, folder was deleted
 */
export type FolderAccessState =
  | { type: 'loading' }
  | { type: 'accessible'; permissions: FolderPermissionFlags }
  | { type: 'forbidden' }
  | { type: 'orphaned' };

/**
 * The resolved folder state for a specific check.
 * Determines both visibility and effective permissions.
 *
 *   no-folder-context: folders disabled or check has no folderUid.
 *                      SM RBAC applies directly.
 *   loading:           folder status is not yet resolved. Check is visible
 *                      but write/delete actions are disabled until resolved.
 *   accessible:        folder exists and user has access. Combined model applies.
 *   forbidden:         folder exists but user cannot access it. Check is hidden.
 *   orphaned:          folder was deleted. SM RBAC applies directly.
 */
export type CheckFolderStatus =
  | { type: 'no-folder-context' }
  | FolderAccessState;

/**
 * The effective permissions for a check, combining SM RBAC and folder permissions.
 * This is the single source of truth for what the user can do with a check.
 */
export interface CheckPermissions {
  canRead: boolean;
  canWrite: boolean;
  canDelete: boolean;
}

/**
 * Determine a check's folder status.
 *
 * Uses a folder detail map built from individual GET /api/folders/:uid calls,
 * which provides both status (accessible/forbidden/orphaned) and permission
 * flags (canEdit, canAdmin) for each folder.
 */
export function resolveCheckFolderStatus(
  check: Pick<Check, 'folderUid'>,
  folderDetailsByUid: Map<string, FolderAccessState>,
  isFoldersEnabled: boolean,
  defaultFolderUid?: string,
): CheckFolderStatus {
  if (!isFoldersEnabled) {
    return { type: 'no-folder-context' };
  }

  const effectiveUid = check.folderUid || defaultFolderUid;
  if (!effectiveUid) {
    return { type: 'no-folder-context' };
  }

  return folderDetailsByUid.get(effectiveUid) ?? { type: 'forbidden' };
}

/**
 * Is the check visible to the user?
 *
 * This decision is the same regardless of how the user reaches the check
 * (list, direct URL, dashboard link). What "hidden" looks like varies by
 * context: filtered out in the list, AccessDeniedModal on a direct URL.
 */
export function isCheckVisible(folderStatus: CheckFolderStatus): boolean {
  switch (folderStatus.type) {
    case 'no-folder-context':
    case 'loading':
    case 'accessible':
    case 'orphaned':
      return true;
    case 'forbidden':
      return false;
  }
}

/**
 * What can the user do with this check?
 *
 * Implements the combined permission model:
 *   effective = min(SM RBAC, folder permission)
 *
 * Folder permission mapping (SLO model):
 *   - Folder View  (canEdit=false) → check READ
 *   - Folder Edit  (canEdit=true)  → check READ + WRITE
 *   - Folder Admin (canAdmin=true) → check READ + WRITE + DELETE
 *
 * Special cases:
 *   - no-folder-context / orphaned → SM RBAC only (no folder restriction)
 *   - loading → visible, read only (actions disabled until resolved)
 *   - forbidden → all false (check shouldn't be visible, but safe fallback)
 */
export function computeCheckPermissions(
  smPerms: SMPermissions,
  folderStatus: CheckFolderStatus,
): CheckPermissions {
  switch (folderStatus.type) {
    case 'no-folder-context':
    case 'orphaned':
      return {
        canRead: smPerms.canReadChecks,
        canWrite: smPerms.canWriteChecks,
        canDelete: smPerms.canDeleteChecks,
      };

    case 'loading':
      return {
        canRead: smPerms.canReadChecks,
        canWrite: false,
        canDelete: false,
      };

    case 'accessible':
      return {
        canRead: smPerms.canReadChecks,
        canWrite: smPerms.canWriteChecks && folderStatus.permissions.canEdit,
        canDelete: smPerms.canDeleteChecks && folderStatus.permissions.canAdmin,
      };

    case 'forbidden':
      return {
        canRead: false,
        canWrite: false,
        canDelete: false,
      };
  }
}
