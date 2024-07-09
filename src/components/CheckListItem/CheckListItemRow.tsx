import React, { ChangeEvent } from 'react';
import { GrafanaTheme2 } from '@grafana/data';
import { Checkbox, useStyles2 } from '@grafana/ui';
import { css, cx } from '@emotion/css';

import { checkToUsageCalcValues, getCheckType as getCheckType } from 'utils';
import { useUsageCalc } from 'hooks/useUsageCalc';
import { AlertStatus } from 'components/AlertStatus/AlertStatus';

import { CheckItemActionButtons } from './CheckItemActionButtons';
import { CheckListItemProps } from './CheckListItem';
import { CheckListItemDetails } from './CheckListItemDetails';
import { CheckStatusType } from './CheckStatusType';

export const CheckListItemRow = ({
  check,
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
    <div className={cx(styles.container, { [styles.disabledCard]: !check.enabled })}>
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
          <AlertStatus check={check} compact />
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
    border: `1px solid ${theme.colors.border.medium}`,
    borderRadius: '2px',
  }),
  disabledCard: css({
    backgroundColor: theme.colors.secondary.transparent,
  }),
  listCardWrapper: css({
    display: 'grid',
    gridTemplateColumns: 'auto 175px minmax(1px, 1fr) auto auto auto',
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
    width: '100%',
    gap: theme.spacing(1),
  }),
  truncatedText: css({
    textOverflow: 'ellipsis',
    overflow: 'hidden',
    whiteSpace: 'nowrap',
  }),
  listItemDetails: css({
    justifyContent: 'flex-end',
  }),
});
