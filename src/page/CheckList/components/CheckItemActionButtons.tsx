import React, { useCallback, useState } from 'react';
import { GrafanaTheme2 } from '@grafana/data';
import { ConfirmModal, IconButton, LinkButton, useStyles2 } from '@grafana/ui';
import { css, cx } from '@emotion/css';
import { trackDuplicateCheckButtonClicked } from 'features/tracking/checkListEvents';
import { DataTestIds } from 'test/dataTestIds';

import { Check } from 'types';
import { getCheckType } from 'utils';
import { AppRoutes } from 'routing/types';
import { generateRoutePath, getRoute } from 'routing/utils';
import { getUserPermissions } from 'data/permissions';
import { useDeleteCheck, useUpdateCheck } from 'data/useChecks';
import { useDuplicateCheckUrl } from 'hooks/useDuplicateCheck';

interface CheckItemActionButtonsProps {
  check: Check;
  viewDashboardAsIcon?: boolean;
  responsiveDashboardLink?: boolean;
  className?: string;
}

export const CheckItemActionButtons = ({
  check,
  viewDashboardAsIcon,
  responsiveDashboardLink,
  className,
}: CheckItemActionButtonsProps) => {
  const { canReadChecks, canWriteChecks, canDeleteChecks } = getUserPermissions();
  const styles = useStyles2(getStyles);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isPending, setIsPending] = useState(false);

  const { mutate: deleteCheck } = useDeleteCheck();
  const { mutate: updateCheck } = useUpdateCheck();
  const { duplicateCheckUrl } = useDuplicateCheckUrl();

  const handleToggleEnabled = useCallback(async () => {
    setIsPending(true);
    await updateCheck(
      { ...check, enabled: !check.enabled },
      {
        onSuccess: () => {
          setIsPending(false);
        },
      }
    );
  }, [check, updateCheck]);

  return (
    <div className={cx(styles.actionButtonGroup, className)}>
      {canReadChecks && (
        <>
          {responsiveDashboardLink ? (
            <>
              <LinkButton
                href={generateRoutePath(AppRoutes.CheckDashboard, { id: check.id! })}
                size="sm"
                fill="text"
                className={styles.dashboardTextLink}
              >
                View dashboard
              </LinkButton>
              <LinkButton
                href={generateRoutePath(AppRoutes.CheckDashboard, { id: check.id! })}
                size="sm"
                fill="text"
                name="apps"
                tooltip="Go to dashboard"
                className={styles.dashboardIconLink}
              />
            </>
          ) : viewDashboardAsIcon ? (
            <LinkButton
              href={generateRoutePath(AppRoutes.CheckDashboard, { id: check.id! })}
              size="sm"
              fill="text"
              name="apps"
              tooltip="Go to dashboard"
            />
          ) : (
            <LinkButton href={`${getRoute(AppRoutes.Checks)}/${check.id}/dashboard`} size="sm" fill="text">
              View dashboard
            </LinkButton>
          )}
        </>
      )}
      <IconButton
        tooltip={check.enabled ? 'Disable check' : 'Enable check'}
        name={isPending ? `fa fa-spinner` : check.enabled ? 'pause' : 'play'}
        onClick={handleToggleEnabled}
        disabled={!canWriteChecks || isPending}
      />
      <LinkButton
        data-testid={DataTestIds.EditCheckButton}
        href={`${generateRoutePath(AppRoutes.EditCheck, { id: check.id! })}`}
        icon={`pen`}
        tooltip="Edit check"
        disabled={!canWriteChecks}
        variant="secondary"
        fill={`text`}
      />
      <LinkButton
        href={duplicateCheckUrl(check)}
        icon="copy"
        tooltip="Duplicate check"
        disabled={!canWriteChecks}
        onClick={() => {
          trackDuplicateCheckButtonClicked({ checkType: getCheckType(check.settings) });
        }}
        variant="secondary"
        fill="text"
      />
      <IconButton
        tooltip="Delete check"
        name="trash-alt"
        onClick={() => setShowDeleteModal(true)}
        disabled={!canDeleteChecks}
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

const getStyles = (theme: GrafanaTheme2) => {
  const containerName = 'check-list-card';
  const breakpoint = theme.breakpoints.values.md;
  const containerQuery = `@container ${containerName} (max-width: ${breakpoint}px)`;
  const mediaQuery = `@supports not (container-type: inline-size) @media (max-width: ${breakpoint}px)`;

  return {
    actionButtonGroup: css({
      display: 'flex',
      alignItems: 'center',
      flexWrap: 'wrap',
      gap: theme.spacing(1),
      justifyContent: 'flex-end',
      minWidth: 0,
    }),
    dashboardTextLink: css({
      [containerQuery]: {
        display: 'none',
      },
      [mediaQuery]: {
        display: 'none',
      },
    }),
    dashboardIconLink: css({
      display: 'none',
      [containerQuery]: {
        display: 'inline-flex',
      },
      [mediaQuery]: {
        display: 'inline-flex',
      },
    }),
  };
};
