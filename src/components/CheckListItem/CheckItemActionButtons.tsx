import React, { useContext, useState } from 'react';
import { AppEvents, GrafanaTheme2, OrgRole } from '@grafana/data';
import { Button, ConfirmModal, IconButton, useStyles2 } from '@grafana/ui';
import appEvents from 'grafana/app/core/app_events';
import { css } from '@emotion/css';

import { Check, FeatureName, ROUTES } from 'types';
import { checkType as getCheckType, dashboardUID, hasRole } from 'utils';
import { InstanceContext } from 'contexts/InstanceContext';
import { useFeatureFlag } from 'hooks/useFeatureFlag';
import { useNavigation } from 'hooks/useNavigation';
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
  const { isEnabled: perCheckDashboardsEnabled } = useFeatureFlag(FeatureName.PerCheckDashboards);

  const showDashboard = () => {
    if (perCheckDashboardsEnabled) {
      const url = `${PLUGIN_URL_PATH}${ROUTES.Checks}/${check.id}/dashboard`;
      navigate(url, {}, true);
      return;
    }
    if (scenesEnabled) {
      const url = `${PLUGIN_URL_PATH}${ROUTES.Scene}/${checkType}`;
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
        <IconButton name="apps" onClick={showDashboard} tooltip="Go to dashboard" />
      ) : (
        <Button onClick={showDashboard} size="sm" fill="text">
          View dashboard
        </Button>
      )}
      <IconButton
        tooltip="Edit check"
        name="pen"
        data-testid="edit-check-button"
        onClick={() => {
          navigate(`${ROUTES.EditCheck}/${checkType}/${check.id}`);
        }}
        disabled={!hasRole(OrgRole.Editor)}
      />
      <IconButton
        tooltip="Delete check"
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
