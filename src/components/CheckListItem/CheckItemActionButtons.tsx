import { GrafanaTheme, AppEvents } from '@grafana/data';
import { Button, ConfirmModal, IconButton, useStyles } from '@grafana/ui';
import React, { useContext, useState } from 'react';
import { css } from '@emotion/css';
import { Check, OrgRole } from 'types';
import { dashboardUID, checkType as getCheckType, hasRole } from 'utils';
import { InstanceContext } from 'contexts/InstanceContext';
import appEvents from 'grafana/app/core/app_events';
import { getLocationSrv } from '@grafana/runtime';

const getStyles = (theme: GrafanaTheme) => ({
  actionButtonGroup: css`
    display: flex;
    align-items: center;
  `,
  marginRightSmall: css`
    margin-right: ${theme.spacing.sm};
  `,
  marginRightExtraSmall: css`
    margin-right: ${theme.spacing.xs};
  `,
});

interface Props {
  check: Check;
  viewDashboardAsIcon?: boolean;
  onRemoveCheck: (check: Check) => void;
}

export const CheckItemActionButtons = ({ check, viewDashboardAsIcon, onRemoveCheck }: Props) => {
  const styles = useStyles(getStyles);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const checkType = getCheckType(check.settings);
  const { instance } = useContext(InstanceContext);

  const showDashboard = () => {
    const target = dashboardUID(checkType, instance.api);

    if (!target) {
      appEvents.emit(AppEvents.alertError, ['Dashboard not found']);
      return;
    }

    getLocationSrv().update({
      partial: false,
      path: `/d/${target.uid}`,
      query: {
        'var-instance': check.target,
        'var-job': check.job,
      },
    });
  };

  return (
    <div className={styles.actionButtonGroup}>
      {viewDashboardAsIcon ? (
        <IconButton name="apps" onClick={showDashboard} className={styles.marginRightSmall} />
      ) : (
        <Button onClick={showDashboard} size="sm" variant="link" className={styles.marginRightExtraSmall}>
          View dashboard
        </Button>
      )}
      <IconButton
        name="pen"
        onClick={() => {
          getLocationSrv().update({
            partial: true,
            query: {
              id: check.id,
            },
          });
        }}
        disabled={!hasRole(OrgRole.EDITOR)}
        className={styles.marginRightSmall}
      />
      <IconButton name="trash-alt" onClick={() => setShowDeleteModal(true)} disabled={!hasRole(OrgRole.EDITOR)} />
      <ConfirmModal
        isOpen={showDeleteModal}
        title="Delete check"
        body="Are you sure you want to delete this check?"
        confirmText="Delete check"
        onConfirm={() => {
          onRemoveCheck(check);
          setShowDeleteModal(false);
        }}
        onDismiss={() => setShowDeleteModal(false)}
      />
    </div>
  );
};
