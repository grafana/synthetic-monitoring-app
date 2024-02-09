import React, { useState } from 'react';
import { GrafanaTheme2, OrgRole } from '@grafana/data';
import { Button, ButtonCascader, ConfirmModal, useStyles2 } from '@grafana/ui';
import { css } from '@emotion/css';

import { Check } from 'types';
import { hasRole } from 'utils';
import { useBulkDeleteChecks, useBulkUpdateChecks } from 'data/useChecks';
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
  const styles = useStyles2(getStyles);
  const [bulkEditAction, setBulkEditAction] = useState<BulkAction | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const { mutate: bulkUpdateChecks } = useBulkUpdateChecks({ onSuccess: onResolved });
  const { mutate: bulkDeleteChecks } = useBulkDeleteChecks({ onSuccess: onResolved });

  const handleDisableSelectedChecks = () => {
    bulkUpdateChecks(checks.filter((check) => check.enabled).map((check) => ({ ...check, enabled: false })));
  };

  const handleEnableSelectedChecks = () => {
    bulkUpdateChecks(checks.filter((check) => !check.enabled).map((check) => ({ ...check, enabled: true })));
  };

  const handleDeleteSelectedChecks = async () => {
    bulkDeleteChecks(checks.map((check) => check.id!));
  };

  return (
    <>
      <div>{checks.length} checks are selected.</div>
      <div className={styles.buttonGroup}>
        {checks.length && (
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
            disabled={!hasRole(OrgRole.Editor)}
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
          disabled={!hasRole(OrgRole.Editor)}
        >
          Enable
        </Button>
        <Button
          type="button"
          variant="secondary"
          fill="text"
          onClick={handleDisableSelectedChecks}
          disabled={!hasRole(OrgRole.Editor)}
        >
          Disable
        </Button>

        <Button
          type="button"
          variant="destructive"
          fill="text"
          onClick={() => setShowDeleteModal(true)}
          disabled={!hasRole(OrgRole.Editor)}
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
