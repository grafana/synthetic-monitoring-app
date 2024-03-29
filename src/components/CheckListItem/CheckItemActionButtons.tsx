import React, { useState } from 'react';
import { GrafanaTheme2, OrgRole } from '@grafana/data';
import { Button, ConfirmModal, IconButton, useStyles2 } from '@grafana/ui';
import { css } from '@emotion/css';

import { Check, ROUTES } from 'types';
import { checkType as getCheckType, hasRole } from 'utils';
import { useDeleteCheck } from 'data/useChecks';
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
}

export const CheckItemActionButtons = ({ check, viewDashboardAsIcon }: Props) => {
  const styles = useStyles2(getStyles);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const checkType = getCheckType(check.settings);
  const navigate = useNavigation();
  const { mutate: deleteCheck } = useDeleteCheck();

  const showDashboard = () => {
    const url = `${PLUGIN_URL_PATH}${ROUTES.Checks}/${check.id}/dashboard`;
    navigate(url, {}, true);
    return;
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
          deleteCheck(check);
          setShowDeleteModal(false);
        }}
        onDismiss={() => setShowDeleteModal(false)}
      />
    </div>
  );
};
