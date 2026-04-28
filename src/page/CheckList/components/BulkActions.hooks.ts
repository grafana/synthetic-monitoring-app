import { useCallback, useState } from 'react';

import { Check, FeatureName } from 'types';
import { useBulkCheckPermissions } from 'contexts/CheckFolderAccessContext';
import { isFeatureEnabled } from 'contexts/FeatureFlagContext';
import { useBulkDeleteChecks, useBulkUpdateChecks } from 'data/useChecks';

interface UseBulkActionsOptions {
  checks: Check[];
  onResolved: () => void;
}

export function useBulkActions({ checks, onResolved }: UseBulkActionsOptions) {
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

  const { mutate: bulkDeleteChecks } = useBulkDeleteChecks({ onSuccess: handleDeleteResolved });

  const enableChecks = useCallback(() => {
    bulkUpdateChecks(checks.filter((check) => !check.enabled).map((check) => ({ ...check, enabled: true })));
  }, [bulkUpdateChecks, checks]);

  const disableChecks = useCallback(() => {
    bulkUpdateChecks(checks.filter((check) => check.enabled).map((check) => ({ ...check, enabled: false })));
  }, [bulkUpdateChecks, checks]);

  const deleteChecks = useCallback(() => {
    bulkDeleteChecks(checks.map((check) => check.id!));
  }, [bulkDeleteChecks, checks]);

  const deleteModalProps = {
    title: `Delete ${checks.length} check${checks.length !== 1 ? 's' : ''}`,
    body: 'Are you sure you want to delete these checks?',
    confirmText: 'Delete checks',
  };

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
