import React, { ChangeEvent } from 'react';
import { GrafanaTheme2 } from '@grafana/data';
import { Checkbox, useStyles2 } from '@grafana/ui';
import { css, cx } from '@emotion/css';
import { DataTestIds } from 'test/dataTestIds';

import { Label } from 'types';
import { checkToUsageCalcValues, getCheckType } from 'utils';
import { useUsageCalc } from 'hooks/useUsageCalc';
import { AlertStatus } from 'components/AlertStatus/AlertStatus';
import { LatencyGauge, SuccessRateGaugeCheckReachability, SuccessRateGaugeCheckUptime } from 'components/Gauges';
import { CHECK_LIST_CARD_CONTAINER_NAME } from 'page/CheckList/CheckList.constants';
import { CheckCardLabel } from 'page/CheckList/components/CheckCardLabel';
import { CheckFolderBadge } from 'page/CheckList/components/CheckFolderBadge';
import { CheckItemActionButtons } from 'page/CheckList/components/CheckItemActionButtons';
import { CheckListItemProps } from 'page/CheckList/components/CheckListItem';
import { CheckListItemDetails } from 'page/CheckList/components/CheckListItemDetails';
import { CheckStatusType } from 'page/CheckList/components/CheckStatusType';
import { DisableReasonHint } from 'page/CheckList/components/DisableReasonHint';

export const CheckListItemCard = ({
  check,
  runtimeAlertState,
  onLabelSelect,
  onTypeSelect,
  onStatusSelect,
  selected,
  onToggleCheckbox,
  foldersMap,
  foldersLoading,
}: CheckListItemProps) => {
  const styles = useStyles2(getStyles);
  const checkType = getCheckType(check.settings);
  const usage = useUsageCalc([checkToUsageCalcValues(check)]);

  return (
    <div
      className={cx(styles.container, {
        [styles.disabledCard]: !check.enabled,
        [styles.firingAlertCard]: runtimeAlertState.firingCount > 0,
      })}
    >
      <div className={styles.cardWrapper} data-testid={DataTestIds.CheckCard}>
        <div>
          <Checkbox
            aria-label="Select check"
            onChange={(e: ChangeEvent<HTMLInputElement>) => {
              e.stopPropagation();
              onToggleCheckbox(check.id!);
            }}
            checked={selected}
          />
        </div>
        <div className={styles.wrapper}>
          <div className={cx(styles.body, { [styles.bodyDisabled]: !check.enabled })}>
            <div className={styles.checkInfoContainer}>
              <div className={styles.titleRow}>
                <h3 className={styles.heading}>{check.job}</h3>
                <AlertStatus check={check} runtimeAlertState={runtimeAlertState} />
                {check.disableReason && <DisableReasonHint disableReason={check.disableReason} />}
              </div>
              <div className={styles.checkTarget}>{check.target}</div>
              <div className={styles.stackCenter}>
                <CheckStatusType
                  enabled={check.enabled}
                  checkType={checkType}
                  onClickStatus={onStatusSelect}
                  onClickType={onTypeSelect}
                />
                <CheckListItemDetails
                  frequency={check.frequency}
                  activeSeries={usage?.activeSeries}
                  probeLocations={check.probes.length}
                  executionsRate={usage?.checksPerMonth}
                  layout="wrap"
                />
              </div>
            </div>
            <div className={styles.stats}>
              {check.enabled && (
                <>
                  <div className={styles.statItem}>
                    <SuccessRateGaugeCheckUptime check={check} height={75} width={132} />
                  </div>
                  <div className={styles.statItem}>
                    <SuccessRateGaugeCheckReachability check={check} height={75} width={132} />
                  </div>
                  <div className={styles.statItem}>
                    <LatencyGauge check={check} height={75} width={148} />
                  </div>
                </>
              )}
            </div>
          </div>
          <div className={styles.footer}>
            <div className={styles.labelsContainer}>
              <CheckFolderBadge check={check} foldersMap={foldersMap} foldersLoading={foldersLoading} />
              {check.labels.map((label: Label, index) => (
                <CheckCardLabel key={index} label={label} onLabelSelect={onLabelSelect} />
              ))}
            </div>
            <CheckItemActionButtons check={check} responsiveDashboardLink className={styles.actions} />
          </div>
        </div>
      </div>
    </div>
  );
};

const getStyles = (theme: GrafanaTheme2) => {
  const containerName = CHECK_LIST_CARD_CONTAINER_NAME;
  const mediumContainerQuery = `@container ${containerName} (max-width: ${theme.breakpoints.values.lg}px)`;
  const narrowContainerQuery = `@container ${containerName} (max-width: ${theme.breakpoints.values.md}px)`;

  return {
    container: css({
      backgroundColor: theme.colors.background.secondary,
      borderRadius: '2px',
      border: `1px solid transparent`,
      containerName,
      containerType: 'inline-size',
    }),
    labelsContainer: css({
      display: 'flex',
      flexWrap: 'wrap',
      flex: '1 1 280px',
      gap: theme.spacing(1),
      minWidth: 0,
    }),
    heading: css({
      flex: '0 1 auto',
      minWidth: 0,
      marginBottom: 0,
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      whiteSpace: 'nowrap',
      [mediumContainerQuery]: {
        whiteSpace: 'normal',
      },
    }),
    cardWrapper: css({
      display: 'flex',
      alignItems: 'flex-start',
      padding: theme.spacing(2),
      gap: theme.spacing(2),
      [narrowContainerQuery]: {
        gap: theme.spacing(1.5),
        padding: theme.spacing(1.5),
      },
    }),
    disabledCard: css({
      backgroundColor: theme.colors.secondary.transparent,
    }),
    firingAlertCard: css({
      borderColor: theme.colors.error.border,
      boxShadow: `inset 4px 0 0 ${theme.colors.error.text}`,
    }),
    wrapper: css({
      overflow: 'hidden',
      flex: 1,
      minWidth: 0,
    }),
    body: css({
      display: 'grid',
      gridTemplateColumns: 'minmax(0, 1fr) auto',
      alignItems: 'start',
      gap: theme.spacing(2),
      paddingBottom: theme.spacing(2),
      borderBottom: `1px solid ${theme.colors.border.medium}`,
      marginBottom: theme.spacing(2),
      [mediumContainerQuery]: {
        gridTemplateColumns: '1fr',
      },
    }),
    bodyDisabled: css({
      borderColor: theme.colors.border.medium,
    }),
    checkInfoContainer: css({
      display: 'flex',
      flexDirection: 'column',
      gap: theme.spacing(1),
      overflow: 'hidden',
      minWidth: 0,
    }),
    stackCenter: css({
      display: 'flex',
      alignItems: 'center',
      flexWrap: 'wrap',
      gap: theme.spacing(1),
      minWidth: 0,
      [narrowContainerQuery]: {
        alignItems: 'flex-start',
      },
    }),
    titleRow: css({
      display: 'flex',
      alignItems: 'center',
      flexWrap: 'wrap',
      gap: theme.spacing(1),
      minWidth: 0,
    }),
    checkTarget: css({
      fontSize: theme.typography.bodySmall.fontSize,
      lineHeight: theme.typography.bodySmall.lineHeight,
      fontWeight: theme.typography.fontWeightBold,
      whiteSpace: 'nowrap',
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      maxWidth: '100%',
      [mediumContainerQuery]: {
        whiteSpace: 'normal',
        wordBreak: 'break-word',
      },
    }),
    stats: css({
      display: 'flex',
      alignItems: 'flex-start',
      justifyContent: 'flex-end',
      flexWrap: 'nowrap',
      gap: theme.spacing(2),
      [mediumContainerQuery]: {
        justifyContent: 'flex-start',
        flexWrap: 'wrap',
        gap: theme.spacing(1),
        paddingTop: theme.spacing(1),
        borderTop: `1px solid ${theme.colors.border.medium}`,
      },
    }),
    statItem: css({
      display: 'flex',
      justifyContent: 'flex-end',
      [mediumContainerQuery]: {
        justifyContent: 'flex-start',
      },
    }),
    footer: css({
      display: 'flex',
      alignItems: 'flex-start',
      flexWrap: 'wrap',
      gap: theme.spacing(1.5),
      minWidth: 0,
    }),
    actions: css({
      marginLeft: 'auto',
      [narrowContainerQuery]: {
        marginLeft: 0,
      },
    }),
  };
};
