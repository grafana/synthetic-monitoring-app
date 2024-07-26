import React, { useState } from 'react';
import { GrafanaTheme2 } from '@grafana/data';
import { ConfirmModal, IconButton, LinkButton, useStyles2 } from '@grafana/ui';
import { css } from '@emotion/css';

import { Check, ROUTES } from 'types';
import { getCheckType, getCheckTypeGroup } from 'utils';
import { useDeleteCheck } from 'data/useChecks';
import { useCanReadMetrics, useCanWriteSM } from 'hooks/useDSPermission';
import { getRoute } from 'components/Routing.utils';

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
  const canEdit = useCanWriteSM();
  const canReadMetrics = useCanReadMetrics();
  const styles = useStyles2(getStyles);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const checkType = getCheckType(check.settings);
  const checkTypeGroup = getCheckTypeGroup(checkType);
  const { mutate: deleteCheck } = useDeleteCheck();

  return (
    <div className={styles.actionButtonGroup}>
      {canReadMetrics && (
        <>
          {viewDashboardAsIcon ? (
            <LinkButton
              href={`${getRoute(ROUTES.Checks)}/${check.id}/dashboard`}
              size="sm"
              fill="text"
              name="apps"
              tooltip="Go to dashboard"
            />
          ) : (
            <LinkButton href={`${getRoute(ROUTES.Checks)}/${check.id}/dashboard`} size="sm" fill="text">
              View dashboard
            </LinkButton>
          )}
        </>
      )}
      <LinkButton
        data-testid="edit-check-button"
        href={`${getRoute(ROUTES.EditCheck)}/${checkTypeGroup}/${check.id}`}
        icon={`pen`}
        tooltip="Edit check"
        disabled={!canEdit}
        variant="secondary"
        fill={`text`}
      />
      <IconButton
        tooltip="Delete check"
        name="trash-alt"
        onClick={() => setShowDeleteModal(true)}
        disabled={!canEdit}
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
