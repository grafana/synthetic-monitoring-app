import { useCallback, useMemo, useState } from 'react';

import { Check } from 'types';
import { useBulkCheckPermissions } from 'contexts/CheckFolderAccessContext';
import { useBulkDeleteChecks, useBulkUpdateChecks } from 'data/useChecks';

interface UseBulkActionsOptions {
  checks: Check[];
  onResolved: () => void;
}

export function useBulkActions({ checks, onResolved }: UseBulkActionsOptions) {
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
      // useBulkDeleteChecks surfaces the error itself; just close the modal.
    }
    handleDeleteResolved();
  }, [bulkDeleteChecksAsync, checks, handleDeleteResolved]);

  const checkCount = checks.length;
  const checksLabel = `${checkCount} check${checkCount !== 1 ? 's' : ''}`;

  const deleteModalProps = useMemo(
    () => ({
      title: `Delete ${checksLabel}`,
      body: 'Are you sure you want to delete these checks?',
      confirmText: 'Delete checks',
    }),
    [checksLabel]
  );

  return {
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
