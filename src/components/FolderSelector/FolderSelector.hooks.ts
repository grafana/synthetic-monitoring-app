import { useMemo } from 'react';

import { useDefaultFolder } from 'data/useDefaultFolder';
import { useFolderPermissions } from 'data/useFolderPermissions';
import { useFolderChildren } from 'data/useFolders';

interface UseFolderSelectionOptions {
  /**
   * The currently selected folder UID, if any. It is looked up alongside the
   * default subtree because it can reference a folder outside of it (assigned
   * via the API/Terraform) that still needs a proper label.
   */
  value?: string;
  enabled?: boolean;
}

/**
 * Folder data behind the check folder picker: the default SM folder and its
 * children, their permissions, and the selection decisions derived from them.
 * Shared by FolderSelector (rendering) and FormFolderField (form seeding and
 * validation display), which stay in sync through the query cache.
 */
export function useFolderSelection({ value, enabled = true }: UseFolderSelectionOptions = {}) {
  const {
    defaultFolder,
    defaultFolderUid,
    isLoading: isDefaultLoading,
    isError: isDefaultError,
    refetch: refetchDefault,
  } = useDefaultFolder(enabled);
  const {
    data: childFolders = [],
    isLoading: isChildrenLoading,
    isError: isChildrenError,
    refetch: refetchChildren,
  } = useFolderChildren(defaultFolderUid);

  const allFolders = useMemo(() => (defaultFolder ? [defaultFolder, ...childFolders] : []), [defaultFolder, childFolders]);
  const allFolderUids = useMemo(() => {
    const uids = allFolders.map((f) => f.uid);
    if (value && !uids.includes(value)) {
      uids.push(value);
    }
    return uids;
  }, [allFolders, value]);
  const { folderDetailsByUid } = useFolderPermissions(allFolderUids);

  // Only editable folders are offered: a check must be manageable by its creator.
  const editableFolders = useMemo(
    () =>
      allFolders.filter((folder) => {
        const state = folderDetailsByUid.get(folder.uid);
        return state?.type === 'accessible' && state.permissions.canEdit;
      }),
    [allFolders, folderDetailsByUid]
  );

  // Decisions that depend on the full editable set must wait for every
  // permission lookup to settle, so they don't fire on partial data.
  const permissionsSettled =
    allFolders.length > 0 &&
    allFolders.every((folder) => {
      const state = folderDetailsByUid.get(folder.uid);
      return state !== undefined && state.type !== 'loading';
    });

  // Preselect the default folder if editable, else the user's only editable
  // folder; with several candidates the choice is theirs.
  const preselectUid = useMemo(() => {
    if (defaultFolder?.canEdit) {
      return defaultFolder.uid;
    }
    if (permissionsSettled && editableFolders.length === 1) {
      return editableFolders[0].uid;
    }
    return undefined;
  }, [defaultFolder, permissionsSettled, editableFolders]);

  // No folder to store checks in and no rights to create one: the picker
  // renders an explanatory alert instead of an empty dropdown.
  const noStorableFolders = permissionsSettled && editableFolders.length === 0 && !defaultFolder?.canSave;

  return {
    defaultFolder,
    defaultFolderUid,
    allFolders,
    folderDetailsByUid,
    editableFolders,
    permissionsSettled,
    preselectUid,
    noStorableFolders,
    isLoading: isDefaultLoading || isChildrenLoading,
    isDefaultError,
    isChildrenError,
    refetchDefault,
    refetchChildren,
  };
}
