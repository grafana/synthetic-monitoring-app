import { useState } from 'react';

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

  const handleDeleteResolved = () => {
    setShowDeleteModal(false);
    onResolved();
  };

  const handleMoveResolved = () => {
    setShowMoveToFolderModal(false);
    onResolved();
  };

  const { mutate: bulkDeleteChecks } = useBulkDeleteChecks({ onSuccess: handleDeleteResolved });

  const enableChecks = () => {
    bulkUpdateChecks(checks.filter((check) => !check.enabled).map((check) => ({ ...check, enabled: true })));
  };

  const disableChecks = () => {
    bulkUpdateChecks(checks.filter((check) => check.enabled).map((check) => ({ ...check, enabled: false })));
  };

  const deleteChecks = () => {
    bulkDeleteChecks(checks.map((check) => check.id!));
  };

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
