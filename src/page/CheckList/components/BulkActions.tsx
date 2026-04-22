import React, { useState } from 'react';
import { GrafanaTheme2 } from '@grafana/data';
import { Button, ButtonCascader, ConfirmModal, useStyles2 } from '@grafana/ui';
import { css } from '@emotion/css';

import { Check, FeatureName } from 'types';
import { useBulkCheckPermissions } from 'contexts/CheckFolderAccessContext';
import { isFeatureEnabled } from 'contexts/FeatureFlagContext';
import { useBulkDeleteChecks, useBulkUpdateChecks } from 'data/useChecks';
import { BulkActionsModal } from 'page/CheckList/components/BulkActionsModal';
import { BulkMoveToFolderModal } from 'page/CheckList/components/BulkMoveToFolderModal';

interface BulkActionsProps {
  checks: Check[];
  onResolved: () => void;
}

enum BulkAction {
  Add = `add`,
  Remove = `remove`,
}

export const BulkActions = ({ checks, onResolved }: BulkActionsProps) => {
  const isFoldersEnabled = isFeatureEnabled(FeatureName.Folders);
  const { canWriteAll, canDeleteAll } = useBulkCheckPermissions(checks);
  const styles = useStyles2(getStyles);
  const [bulkEditAction, setBulkEditAction] = useState<BulkAction | null>(null);
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

  const handleDisableSelectedChecks = () => {
    bulkUpdateChecks(checks.filter((check) => check.enabled).map((check) => ({ ...check, enabled: false })));
  };

  const handleEnableSelectedChecks = () => {
    bulkUpdateChecks(checks.filter((check) => !check.enabled).map((check) => ({ ...check, enabled: true })));
  };

  const handleDeleteSelectedChecks = () => {
    bulkDeleteChecks(checks.map((check) => check.id!));
  };

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
          onClick={handleEnableSelectedChecks}
          disabled={!canWriteAll}
        >
          Enable
        </Button>
        <Button
          type="button"
          variant="secondary"
          fill="text"
          onClick={handleDisableSelectedChecks}
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
          title={`Delete ${checks.length} checks`}
          body="Are you sure you want to delete these checks?"
          confirmText="Delete checks"
          onConfirm={handleDeleteSelectedChecks}
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
