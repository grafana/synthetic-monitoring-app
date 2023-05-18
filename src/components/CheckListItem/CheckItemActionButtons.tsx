import { GrafanaTheme2, AppEvents, OrgRole } from '@grafana/data';
import { Button, ConfirmModal, IconButton, useStyles2 } from '@grafana/ui';
import React, { useContext, useState } from 'react';
import { css } from '@emotion/css';
import { Check, FeatureName, ROUTES } from 'types';
import { dashboardUID, checkType as getCheckType, hasRole } from 'utils';
import { InstanceContext } from 'contexts/InstanceContext';
import appEvents from 'grafana/app/core/app_events';
import { useNavigation } from 'hooks/useNavigation';
import { useFeatureFlag } from 'hooks/useFeatureFlag';
import { PLUGIN_URL_PATH } from 'components/constants';

const getStyles = (theme: GrafanaTheme2) => ({
  actionButtonGroup: css`
    display: flex;
    align-items: center;
    gap: ${theme.spacing(1)};
  `,
});

interface Props {
  check: Check;
  viewDashboardAsIcon?: boolean;
  onRemoveCheck: (check: Check) => void;
}

export const CheckItemActionButtons = ({ check, viewDashboardAsIcon, onRemoveCheck }: Props) => {
  const styles = useStyles2(getStyles);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const checkType = getCheckType(check.settings);
  const { instance } = useContext(InstanceContext);
  const navigate = useNavigation();
  const { isEnabled: scenesEnabled } = useFeatureFlag(FeatureName.Scenes);

  const showDashboard = () => {
    if (scenesEnabled) {
      const url = `${PLUGIN_URL_PATH}scene/${checkType}`;
      navigate(
        url,
        {
          'var-instance': check.target,
          'var-job': check.job,
        },
        true
      );
      return;
    }
    const target = dashboardUID(checkType, instance.api);

    if (!target) {
      appEvents.emit(AppEvents.alertError, ['Dashboard not found']);
      return;
    }

    navigate(
      `/d/${target.uid}`,
      {
        'var-instance': check.target,
        'var-job': check.job,
      },
      true
    );
  };

  return (
    <div className={styles.actionButtonGroup}>
      {viewDashboardAsIcon ? (
        <IconButton name="apps" onClick={showDashboard} />
      ) : (
        <Button onClick={showDashboard} size="sm" fill="text">
          View dashboard
        </Button>
      )}
      <IconButton
        aria-label="Edit check"
        name="pen"
        data-testid="edit-check-button"
        onClick={() => {
          navigate(`${ROUTES.EditCheck}/${checkType}/${check.id}`);
        }}
        disabled={!hasRole(OrgRole.Editor)}
      />
      <IconButton
        aria-label="Delete check"
        name="trash-alt"
        onClick={() => setShowDeleteModal(true)}
        disabled={!hasRole(OrgRole.Editor)}
      />
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
