import React, { useState } from 'react';
import { GrafanaTheme2, OrgRole } from '@grafana/data';
import { Button, ConfirmModal, IconButton, LinkButton, useStyles2 } from '@grafana/ui';
import { css } from '@emotion/css';

import { Check, ROUTES } from 'types';
import { getCheckType, getCheckTypeGroup, hasRole } from 'utils';
import { useDeleteCheck } from 'data/useChecks';
import { useNavigation } from 'hooks/useNavigation';
import { PLUGIN_URL_PATH } from 'components/constants';
import { getRoute } from 'components/Routing';

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
  const checkTypeGroup = getCheckTypeGroup(checkType);
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
      <LinkButton
        data-testid="edit-check-button"
        href={`${getRoute(ROUTES.EditCheck)}/${checkTypeGroup}/${check.id}`}
        icon={`pen`}
        tooltip="Edit check"
        disabled={!hasRole(OrgRole.Editor)}
        variant="secondary"
        fill={`text`}
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
