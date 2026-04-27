import React, { useState } from 'react';
import { GrafanaTheme2 } from '@grafana/data';
import { Button, ButtonCascader, ConfirmModal, useStyles2 } from '@grafana/ui';
import { css } from '@emotion/css';

import { Check } from 'types';
import { BulkActionsModal } from 'page/CheckList/components/BulkActionsModal';
import { BulkMoveToFolderModal } from 'page/CheckList/components/BulkMoveToFolderModal';

import { useBulkActions } from './BulkActions.hooks';

interface BulkActionsProps {
  checks: Check[];
  onResolved: () => void;
}

enum BulkAction {
  Add = `add`,
  Remove = `remove`,
}

export const BulkActions = ({ checks, onResolved }: BulkActionsProps) => {
  const styles = useStyles2(getStyles);
  const [bulkEditAction, setBulkEditAction] = useState<BulkAction | null>(null);
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
    <>
      <div>
        {checks.length} check{checks.length !== 1 ? `s are` : ` is`} selected.
      </div>
      <div className={styles.buttonGroup}>
        {checks.length > 0 && (
          <ButtonCascader
            options={[
              {
                label: 'Add probes',
                value: BulkAction.Add,
              },
              {
                label: 'Remove probes',
                value: BulkAction.Remove,
              },
            ]}
            disabled={!canWriteAll}
            onChange={(value: string[]) => {
              const action = value[0] as BulkAction;
              setBulkEditAction(action);
            }}
          >
            Bulk Edit Probes
          </ButtonCascader>
        )}
        {isFoldersEnabled && (
          <Button
            type="button"
            variant="secondary"
            fill="text"
            icon="folder"
            onClick={() => setShowMoveToFolderModal(true)}
            disabled={!canWriteAll}
          >
            Move to folder
          </Button>
        )}
        <Button
          type="button"
          variant="primary"
          fill="text"
          onClick={enableChecks}
          disabled={!canWriteAll}
        >
          Enable
        </Button>
        <Button
          type="button"
          variant="secondary"
          fill="text"
          onClick={disableChecks}
          disabled={!canWriteAll}
        >
          Disable
        </Button>

        <Button
          type="button"
          variant="destructive"
          fill="text"
          onClick={() => setShowDeleteModal(true)}
          disabled={!canDeleteAll}
        >
          Delete
        </Button>
      </div>
      {bulkEditAction && (
        <BulkActionsModal
          checks={checks}
          onDismiss={() => setBulkEditAction(null)}
          action={bulkEditAction}
          isOpen={bulkEditAction !== null}
        />
      )}
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
    </>
  );
};

const getStyles = (theme: GrafanaTheme2) => ({
  buttonGroup: css({
    display: `flex`,
    alignItems: `center`,
    gap: theme.spacing(2),
  }),
});
