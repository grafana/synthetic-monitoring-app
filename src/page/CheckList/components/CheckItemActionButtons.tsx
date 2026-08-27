import React, { useCallback, useState } from 'react';
import { GrafanaTheme2 } from '@grafana/data';
import { ConfirmModal, IconButton, LinkButton, useStyles2 } from '@grafana/ui';
import { css, cx } from '@emotion/css';
import { trackDuplicateCheckButtonClicked } from 'features/tracking/checkListEvents';
import { CHECKS_TEST_ID } from 'test/dataTestIds';

import { Check } from 'types';
import { getCheckType } from 'utils';
import { AppRoutes } from 'routing/types';
import { generateRoutePath, getRoute } from 'routing/utils';
import { useCheckPermissions } from 'contexts/CheckFolderAccessContext';
import { useDeleteCheck, useUpdateCheck } from 'data/useChecks';
import { useDuplicateCheckUrl } from 'hooks/useDuplicateCheck';
import { CHECK_LIST_CARD_CONTAINER_NAME } from 'page/CheckList/CheckList.constants';

import { FaroUserAction } from '../../../faro';
import { trackFaroUserAction } from '../../../features/tracking/userAction';

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
  const { canRead: canReadChecks, canWrite: canWriteChecks, canDelete: canDeleteChecks } = useCheckPermissions(check);
  const styles = useStyles2(getStyles);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isPending, setIsPending] = useState(false);

  const { mutate: deleteCheck } = useDeleteCheck();
  const { mutate: updateCheck } = useUpdateCheck();
  const { duplicateCheckUrl } = useDuplicateCheckUrl();

  const handleToggleEnabled = useCallback(async () => {
    trackFaroUserAction(check.enabled ? FaroUserAction.CheckDisableClicked : FaroUserAction.CheckEnableClicked);
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
                href={`${getRoute(AppRoutes.Checks)}/${check.id}/dashboard`}
                size="sm"
                fill="text"
                className={styles.dashboardTextLink}
              >
                View check dashboard
              </LinkButton>
              <LinkButton
                href={generateRoutePath(AppRoutes.CheckDashboard, { id: check.id! })}
                size="sm"
                fill="text"
                icon="apps"
                tooltip="Go to dashboard"
                className={styles.dashboardIconLink}
              />
            </>
          ) : viewDashboardAsIcon ? (
            <LinkButton
              href={generateRoutePath(AppRoutes.CheckDashboard, { id: check.id! })}
              size="sm"
              fill="text"
              icon="apps"
              tooltip="Go to dashboard"
            />
          ) : (
            <LinkButton href={`${getRoute(AppRoutes.Checks)}/${check.id}/dashboard`} size="sm" fill="text">
              View check dashboard
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
        data-testid={CHECKS_TEST_ID.listItem.editButton}
        href={`${generateRoutePath(AppRoutes.EditCheck, { id: check.id! })}`}
        icon={`pen`}
        tooltip="Edit check"
        disabled={!canWriteChecks}
        variant="secondary"
        fill={`text`}
        className={cx({ [styles.disabledLinkButton]: !canWriteChecks })}
        onClick={() => trackFaroUserAction(FaroUserAction.CheckEditClicked)}
      />
      <LinkButton
        href={duplicateCheckUrl(check)}
        icon="copy"
        tooltip="Duplicate check"
        disabled={!canWriteChecks}
        onClick={() => {
          trackFaroUserAction(FaroUserAction.CheckDuplicateClicked);
          trackDuplicateCheckButtonClicked({ checkType: getCheckType(check.settings) });
        }}
        variant="secondary"
        fill="text"
        className={cx({ [styles.disabledLinkButton]: !canWriteChecks })}
      />
      <IconButton
        tooltip="Delete check"
        name="trash-alt"
        onClick={() => {
          trackFaroUserAction(FaroUserAction.CheckDeleteClicked);
          setShowDeleteModal(true);
        }}
        disabled={!canDeleteChecks}
      />
      <ConfirmModal
        isOpen={showDeleteModal}
        title="Delete check"
        body="Are you sure you want to delete this check?"
        confirmText="Delete check"
        onConfirm={() => {
          trackFaroUserAction(FaroUserAction.CheckDeleteConfirmationClicked);
          deleteCheck(check);
          setShowDeleteModal(false);
        }}
        onDismiss={() => {
          trackFaroUserAction(FaroUserAction.CheckDeleteCancellationClicked);
          setShowDeleteModal(false);
        }}
      />
    </div>
  );
};

const getStyles = (theme: GrafanaTheme2) => {
  const containerName = CHECK_LIST_CARD_CONTAINER_NAME;
  const containerQuery = `@container ${containerName} (max-width: ${theme.breakpoints.values.md}px)`;

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
    }),
    dashboardIconLink: css({
      display: 'none',
      [containerQuery]: {
        display: 'inline-flex',
      },
    }),
    // Disabled text-fill LinkButtons use text.disabled, which is nearly
    // indistinguishable from the enabled text.secondary in the dark theme.
    // Match IconButton's disabled treatment (which adds opacity) so all
    // disabled row actions read the same.
    disabledLinkButton: css({
      opacity: 0.65,
    }),
  };
};
