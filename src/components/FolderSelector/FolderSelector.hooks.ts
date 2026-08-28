import { useDefaultFolder } from 'data/useDefaultFolder';

/**
 * Decides which folder the check form pre-fills through its form defaults:
 * the default SM folder, and only when the user can edit it. Users granted
 * Edit on other folders only would otherwise save checks into a folder they
 * cannot manage afterwards; they pick a folder themselves in the picker,
 * which lists every folder they can edit org-wide.
 */
export function useFolderSelection({ enabled = true }: { enabled?: boolean } = {}) {
  const { defaultFolder, defaultFolderUid, isLoading, isError } = useDefaultFolder(enabled);

  const preselectUid = defaultFolder?.canEdit ? defaultFolderUid : undefined;
  // The form mounts only once the pre-fill decision is known, so the seeded
  // folder is part of the form's initial values.
  const isPreselectReady = !enabled || isError || !isLoading;

  return { preselectUid, isPreselectReady };
}
