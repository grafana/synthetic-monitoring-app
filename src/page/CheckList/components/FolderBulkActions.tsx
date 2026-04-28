import React from 'react';
import { GrafanaTheme2 } from '@grafana/data';
import { ConfirmModal, IconButton, useStyles2 } from '@grafana/ui';
import { css } from '@emotion/css';

import { Check } from 'types';
import { BulkMoveToFolderModal } from 'page/CheckList/components/BulkMoveToFolderModal';

import { useBulkActions } from './BulkActions.hooks';

interface FolderBulkActionsProps {
  checks: Check[];
  onResolved: () => void;
}

export function FolderBulkActions({ checks, onResolved }: FolderBulkActionsProps) {
  const styles = useStyles2(getStyles);
  const {
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
  } = useBulkActions({ checks, onResolved });

  return (
    <div className={styles.container}>
      {isFoldersEnabled && (
        <IconButton
          name="folder"
          aria-label="Move to folder"
          tooltip="Move to folder"
          size="sm"
          onClick={(e) => { e.stopPropagation(); setShowMoveToFolderModal(true); }}
          disabled={!canWriteAll}
        />
      )}
      <IconButton
        name="check-circle"
        aria-label="Enable"
        tooltip="Enable"
        size="sm"
        onClick={(e) => { e.stopPropagation(); enableChecks(); }}
        disabled={!canWriteAll}
      />
      <IconButton
        name="pause-circle"
        aria-label="Disable"
        tooltip="Disable"
        size="sm"
        onClick={(e) => { e.stopPropagation(); disableChecks(); }}
        disabled={!canWriteAll}
      />
      <IconButton
        name="trash-alt"
        aria-label="Delete"
        tooltip="Delete"
        size="sm"
        variant="destructive"
        onClick={(e) => { e.stopPropagation(); setShowDeleteModal(true); }}
        disabled={!canDeleteAll}
      />
      {showDeleteModal && (
        <ConfirmModal
          isOpen={showDeleteModal}
          {...deleteModalProps}
          onConfirm={deleteChecks}
          onDismiss={() => setShowDeleteModal(false)}
        />
      )}
      <BulkMoveToFolderModal
        checks={checks}
        isOpen={showMoveToFolderModal}
        onDismiss={() => setShowMoveToFolderModal(false)}
        onMoved={handleMoveResolved}
      />
    </div>
  );
}

const getStyles = (theme: GrafanaTheme2) => ({
  container: css({
    display: 'flex',
    alignItems: 'center',
    gap: theme.spacing(0.5),
  }),
});
