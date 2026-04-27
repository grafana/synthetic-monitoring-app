import React, { ChangeEvent, useMemo } from 'react';
import { GrafanaTheme2 } from '@grafana/data';
import { Checkbox, useStyles2 } from '@grafana/ui';
import { css, cx } from '@emotion/css';

import { checkToUsageCalcValues, getCheckType } from 'utils';
import { useUsageCalc } from 'hooks/useUsageCalc';
import { AlertStatus } from 'components/AlertStatus/AlertStatus';
import { getMissingCalNames, splitLabels } from 'page/CheckList/CheckList.utils';
import { CheckItemActionButtons } from 'page/CheckList/components/CheckItemActionButtons';
import { CheckListItemProps } from 'page/CheckList/components/CheckListItem';
import { CheckListItemDetails } from 'page/CheckList/components/CheckListItemDetails';
import { CheckStatusType } from 'page/CheckList/components/CheckStatusType';
import { DisableReasonHint } from 'page/CheckList/components/DisableReasonHint';

export const CheckListItemRow = ({
  check,
  runtimeAlertState,
  calNames,
  onLabelSelect,
  onTypeSelect,
  onStatusSelect,
  selected,
  onToggleCheckbox,
}: CheckListItemProps) => {
  const styles = useStyles2(getStyles);
  const checkType = getCheckType(check.settings);
  const usage = useUsageCalc([checkToUsageCalcValues(check)]);
  const { calLabels, customLabels } = useMemo(() => splitLabels(check.labels, calNames), [check.labels, calNames]);
  const missingCalNames = useMemo(() => getMissingCalNames(check.labels, calNames), [check.labels, calNames]);

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
          <AlertStatus check={check} compact runtimeAlertState={runtimeAlertState} />
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
          labels={customLabels}
          calLabels={calLabels}
          missingCalNames={missingCalNames}
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
    gridTemplateColumns: 'auto minmax(150px, 1.25fr) minmax(100px, 1fr) auto auto auto',
    alignItems: 'center',
    gridColumnGap: theme.spacing(2),
    padding: theme.spacing(1.5, 2),
  }),
  checkTarget: css({
    display: `flex`,
    fontSize: theme.typography.bodySmall.fontSize,
    minWidth: 0,
    overflow: 'hidden',
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
});
