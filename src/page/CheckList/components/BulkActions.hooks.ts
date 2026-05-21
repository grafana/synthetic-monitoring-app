import { useCallback, useMemo, useState } from 'react';

import { Check, FeatureName } from 'types';
import { useBulkCheckPermissions } from 'contexts/CheckFolderAccessContext';
import { isFeatureEnabled } from 'contexts/FeatureFlagContext';
import { useBulkDeleteChecks, useBulkUpdateChecks } from 'data/useChecks';
import { deleteFolder as deleteFolderApi } from 'data/useFolders';
import { showAlert } from 'data/utils';

export interface DeleteFolderTarget {
  uid: string;
  title: string;
}

interface UseBulkActionsOptions {
  checks: Check[];
  onResolved: () => void;
  deleteFolder?: DeleteFolderTarget;
}

export function useBulkActions({ checks, onResolved, deleteFolder }: UseBulkActionsOptions) {
  const isFoldersEnabled = isFeatureEnabled(FeatureName.Folders);
  const { canWriteAll, canDeleteAll } = useBulkCheckPermissions(checks);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showMoveToFolderModal, setShowMoveToFolderModal] = useState(false);
  const { mutate: bulkUpdateChecks } = useBulkUpdateChecks({ onSuccess: onResolved });

  const handleDeleteResolved = useCallback(() => {
    setShowDeleteModal(false);
    onResolved();
  }, [onResolved]);

  const handleMoveResolved = useCallback(() => {
    setShowMoveToFolderModal(false);
    onResolved();
  }, [onResolved]);

  const { mutateAsync: bulkDeleteChecksAsync } = useBulkDeleteChecks({});

  const enableChecks = useCallback(() => {
    bulkUpdateChecks(checks.filter((check) => !check.enabled).map((check) => ({ ...check, enabled: true })));
  }, [bulkUpdateChecks, checks]);

  const disableChecks = useCallback(() => {
    bulkUpdateChecks(checks.filter((check) => check.enabled).map((check) => ({ ...check, enabled: false })));
  }, [bulkUpdateChecks, checks]);

  const deleteChecks = useCallback(async () => {
    try {
      await bulkDeleteChecksAsync(checks.map((check) => check.id!));
    } catch {
      handleDeleteResolved();
      return;
    }

    if (deleteFolder) {
      try {
        await deleteFolderApi(deleteFolder.uid);
      } catch {
        showAlert('warning', `Checks deleted but folder "${deleteFolder.title}" could not be removed`);
      }
    }

    handleDeleteResolved();
  }, [bulkDeleteChecksAsync, checks, deleteFolder, handleDeleteResolved]);

  const checkCount = checks.length;
  const checksLabel = `${checkCount} check${checkCount !== 1 ? 's' : ''}`;

  const deleteModalProps = useMemo(() => {
    if (deleteFolder) {
      return {
        title: `Delete folder "${deleteFolder.title}" + ${checksLabel}`,
        body: `This will permanently delete the folder with all ${checksLabel} inside it.`,
        confirmText: 'Delete folder and checks',
      };
    }

    return {
      title: `Delete ${checksLabel}`,
      body: 'Are you sure you want to delete these checks?',
      confirmText: 'Delete checks',
    };
  }, [deleteFolder, checksLabel]);

  return {
    isFoldersEnabled,
    canWriteAll,
    canDeleteAll,
    showDeleteModal,
    setShowDeleteModal,
    showMoveToFolderModal,
    setShowMoveToFolderModal,
    handleMoveResolved,
    enableChecks,
    disableChecks,
    deleteChecks,
    deleteModalProps,
  };
}
