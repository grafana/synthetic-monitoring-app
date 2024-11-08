import React, { useState } from 'react';
import { GrafanaTheme2 } from '@grafana/data';
import { Button, ButtonCascader, ConfirmModal, useStyles2 } from '@grafana/ui';
import { css } from '@emotion/css';

import { Check } from 'types';
import { useBulkDeleteChecks, useBulkUpdateChecks } from 'data/useChecks';
import { getUserPermissions } from 'hooks/useUserPermissions';
import { BulkEditModal } from 'components/BulkEditModal';

type BulkActionsProps = {
  checks: Check[];
  onResolved: () => void;
};

export enum BulkAction {
  Add = `add`,
  Remove = `remove`,
}

export const BulkActions = ({ checks, onResolved }: BulkActionsProps) => {
  const { canWriteChecks, canDeleteChecks } = getUserPermissions();
  const styles = useStyles2(getStyles);
  const [bulkEditAction, setBulkEditAction] = useState<BulkAction | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const { mutate: bulkUpdateChecks } = useBulkUpdateChecks({ onSuccess: onResolved });

  const handleDeleteResolved = () => {
    setShowDeleteModal(false);
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
            disabled={!canWriteChecks}
            onChange={(value: string[]) => {
              const action = value[0] as BulkAction;
              setBulkEditAction(action);
            }}
          >
            Bulk Edit Probes
          </ButtonCascader>
        )}
        <Button
          type="button"
          variant="primary"
          fill="text"
          onClick={handleEnableSelectedChecks}
          disabled={!canWriteChecks}
        >
          Enable
        </Button>
        <Button
          type="button"
          variant="secondary"
          fill="text"
          onClick={handleDisableSelectedChecks}
          disabled={!canWriteChecks}
        >
          Disable
        </Button>

        <Button
          type="button"
          variant="destructive"
          fill="text"
          onClick={() => setShowDeleteModal(true)}
          disabled={!canDeleteChecks}
        >
          Delete
        </Button>
      </div>
      {bulkEditAction && (
        <BulkEditModal
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
