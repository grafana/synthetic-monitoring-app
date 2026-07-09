import { useCallback, useMemo, useState } from 'react';

import { Check } from 'types';
import { useBulkCheckPermissions } from 'contexts/CheckFolderAccessContext';
import { useBulkDeleteChecks, useBulkUpdateChecks } from 'data/useChecks';
import { useDeleteFolder } from 'data/useFolders';
import { showAlert } from 'data/utils';

export interface DeleteFolderTarget {
  uid: string;
  title: string;
}

interface UseBulkActionsOptions {
  checks: Check[];
  onResolved: () => void;
  deleteFolder?: DeleteFolderTarget;
  isFoldersAvailable: boolean;
}

export function useBulkActions({ checks, onResolved, deleteFolder, isFoldersAvailable }: UseBulkActionsOptions) {
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
  const { mutateAsync: deleteFolderAsync } = useDeleteFolder();

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
        await deleteFolderAsync(deleteFolder.uid);
      } catch {
        showAlert('warning', `Checks deleted but folder "${deleteFolder.title}" could not be removed`);
      }
    }

    handleDeleteResolved();
  }, [bulkDeleteChecksAsync, deleteFolderAsync, checks, deleteFolder, handleDeleteResolved]);

  const checkCount = checks.length;
  const checksLabel = `${checkCount} check${checkCount !== 1 ? 's' : ''}`;

  const deleteModalProps = useMemo(() => {
    if (deleteFolder) {
      return {
        title: `Delete folder "${deleteFolder.title}" + ${checksLabel}`,
        body: `This will delete the folder, including ${checksLabel}. This action cannot be undone.`,
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
    isFoldersAvailable,
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
