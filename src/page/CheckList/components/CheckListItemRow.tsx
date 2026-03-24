import React, { ChangeEvent } from 'react';
import { GrafanaTheme2 } from '@grafana/data';
import { Checkbox, useStyles2 } from '@grafana/ui';
import { css, cx } from '@emotion/css';

import { checkToUsageCalcValues, getCheckType } from 'utils';
import { useUsageCalc } from 'hooks/useUsageCalc';
import { AlertStatus } from 'components/AlertStatus/AlertStatus';
import { CheckItemActionButtons } from 'page/CheckList/components/CheckItemActionButtons';
import { CheckListItemProps } from 'page/CheckList/components/CheckListItem';
import { CheckListItemDetails } from 'page/CheckList/components/CheckListItemDetails';
import { CheckRuntimeAlertBadge } from 'page/CheckList/components/CheckRuntimeAlertBadge';
import { CheckStatusType } from 'page/CheckList/components/CheckStatusType';
import { DisableReasonHint } from 'page/CheckList/components/DisableReasonHint';

export const CheckListItemRow = ({
  check,
  runtimeAlertState,
  onLabelSelect,
  onTypeSelect,
  onStatusSelect,
  selected,
  onToggleCheckbox,
}: CheckListItemProps) => {
  const styles = useStyles2(getStyles);
  const checkType = getCheckType(check.settings);
  const usage = useUsageCalc([checkToUsageCalcValues(check)]);

  return (
    <div
      className={cx(styles.container, {
        [styles.disabledCard]: !check.enabled,
        [styles.firingAlertRow]: runtimeAlertState.firingCount > 0,
      })}
    >
      <div className={styles.listCardWrapper}>
        <Checkbox
          aria-label="Select check"
          onChange={(e: ChangeEvent<HTMLInputElement>) => {
            e.stopPropagation();
            onToggleCheckbox(check.id!);
          }}
          checked={selected}
        />
        <div className={styles.checkJobListViewContainer}>
          <span className={styles.truncatedText} title={check.job}>
            {check.job}
          </span>
          <CheckRuntimeAlertBadge firingCount={runtimeAlertState.firingCount} className={styles.runtimeAlertBadge} />
          <AlertStatus check={check} compact />
          {check.disableReason && <DisableReasonHint disableReason={check.disableReason} />}
        </div>
        <div className={styles.checkTarget}>
          <span className={styles.truncatedText}>{check.target}</span>
        </div>
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
          className={styles.listItemDetails}
          labelCount={check.labels.length}
          labels={check.labels}
          onLabelClick={onLabelSelect}
          executionsRate={usage?.checksPerMonth}
        />
        <CheckItemActionButtons check={check} viewDashboardAsIcon />
      </div>
    </div>
  );
};

const getStyles = (theme: GrafanaTheme2) => ({
  container: css({
    backgroundColor: theme.colors.background.secondary,
    borderRadius: '2px',
    border: `1px solid transparent`,
  }),
  disabledCard: css({
    backgroundColor: theme.colors.secondary.transparent,
  }),
  firingAlertRow: css({
    borderColor: theme.colors.error.border,
    boxShadow: `inset 4px 0 0 ${theme.colors.error.text}`,
  }),
  listCardWrapper: css({
    display: 'grid',
    gridTemplateColumns: 'auto minmax(220px, 1.25fr) minmax(1px, 1fr) auto auto auto',
    alignItems: 'center',
    gridColumnGap: theme.spacing(2),
    padding: theme.spacing(1.5, 2),
  }),
  checkTarget: css({
    display: `flex`,
    fontSize: theme.typography.bodySmall.fontSize,
  }),
  checkJobListViewContainer: css({
    display: 'flex',
    alignItems: 'center',
    justifySelf: 'left',
    minWidth: 0,
    width: '100%',
    gap: theme.spacing(1),
  }),
  truncatedText: css({
    flex: 1,
    minWidth: 0,
    textOverflow: 'ellipsis',
    overflow: 'hidden',
    whiteSpace: 'nowrap',
  }),
  listItemDetails: css({
    justifyContent: 'flex-end',
  }),
  runtimeAlertBadge: css({
    flexShrink: 0,
  }),
});
