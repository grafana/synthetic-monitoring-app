import React, { ChangeEvent } from 'react';
import { GrafanaTheme2 } from '@grafana/data';
import { Checkbox, Stack, useStyles2 } from '@grafana/ui';
import { css, cx } from '@emotion/css';

import { Label } from 'types';
import { isAiAgentCheck } from 'utils.types';
import { checkToUsageCalcValues, getCheckType } from 'utils';
import { useUsageCalc } from 'hooks/useUsageCalc';
import { AlertStatus } from 'components/AlertStatus/AlertStatus';
import {
  AiCheckDurationGauge,
  AiCheckScoreGauge,
  LatencyGauge,
  SuccessRateGaugeCheckReachability,
  SuccessRateGaugeCheckUptime,
} from 'components/Gauges';
import { CheckCardLabel } from 'page/CheckList/components/CheckCardLabel';
import { CheckItemActionButtons } from 'page/CheckList/components/CheckItemActionButtons';
import { CheckListItemProps } from 'page/CheckList/components/CheckListItem';
import { CheckListItemDetails } from 'page/CheckList/components/CheckListItemDetails';
import { CheckStatusType } from 'page/CheckList/components/CheckStatusType';

export const CheckListItemCard = ({
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
      <div className={styles.cardWrapper} data-testid="check-card">
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
              <div className={styles.stackCenter}>
                <h3 className={styles.heading}>{check.job}</h3>
                <AlertStatus check={check} />
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
                />
              </div>
            </div>
            <div className={styles.stats}>
              {check.enabled && !isAiAgentCheck(check) ? (
                <>
                  <SuccessRateGaugeCheckUptime check={check} height={75} width={150} />
                  <SuccessRateGaugeCheckReachability check={check} height={75} width={150} />
                  <LatencyGauge check={check} height={75} width={175} />
                </>
              ) : (
                <>
                  <AiCheckScoreGauge check={check} height={75} width={150} />
                  <AiCheckDurationGauge check={check} height={75} width={175} />
                </>
              )}
            </div>
          </div>
          <Stack wrap="wrap" justifyContent="flex-start">
            <div className={styles.labelsContainer}>
              {check.labels.map((label: Label, index) => (
                <CheckCardLabel key={index} label={label} onLabelSelect={onLabelSelect} />
              ))}
            </div>
            <CheckItemActionButtons check={check} />
          </Stack>
        </div>
      </div>
    </div>
  );
};

const getStyles = (theme: GrafanaTheme2) => ({
  container: css({
    backgroundColor: theme.colors.background.secondary,
    borderRadius: '2px',
  }),
  labelsContainer: css({
    display: 'flex',
    flexWrap: 'wrap',
    flexGrow: 1,
    gap: theme.spacing(1),
  }),
  heading: css({
    marginBottom: `0`,
  }),
  cardWrapper: css({
    display: 'flex',
    padding: theme.spacing(2),
    gap: theme.spacing(2),
  }),
  disabledCard: css({
    backgroundColor: theme.colors.secondary.transparent,
  }),
  wrapper: css({
    overflow: `hidden`,
    flex: 1,
  }),
  body: css({
    display: 'flex',
    paddingBottom: theme.spacing(2),
    borderBottom: `1px solid ${theme.colors.border.medium}`,
    marginBottom: theme.spacing(2),
    justifyContent: 'space-between',
  }),
  bodyDisabled: css({
    borderColor: theme.colors.border.medium,
  }),
  checkInfoContainer: css({
    display: 'flex',
    flexDirection: 'column',
    gap: theme.spacing(1),
    overflow: 'hidden',
  }),
  stackCenter: css({
    display: 'flex',
    alignItems: 'center',
    gap: theme.spacing(1),
  }),
  checkTarget: css({
    fontSize: theme.typography.bodySmall.fontSize,
    lineHeight: theme.typography.bodySmall.lineHeight,
    fontWeight: theme.typography.fontWeightBold,
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    maxWidth: '100%',
  }),
  stats: css({
    display: 'flex',
    alignItems: 'center',
  }),
});
