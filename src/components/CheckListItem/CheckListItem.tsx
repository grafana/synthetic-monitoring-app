import React, { ChangeEvent } from 'react';
import { SuccessRateGauge } from 'components/SuccessRateGauge';
import { checkType as getCheckType } from 'utils';
// Types
import { CheckListViewType, FilteredCheck, Label } from 'types';
import { useStyles, Checkbox, HorizontalGroup } from '@grafana/ui';
import { css, cx } from 'emotion';
import { GrafanaTheme } from '@grafana/data';
import { calculateUsage } from 'checkUsageCalc';
import { CheckCardLabel } from '../CheckCardLabel';
import { LatencyGauge } from '../LatencyGauge';
import { CheckItemActionButtons } from './CheckItemActionButtons';
import { CheckListItemDetails } from './CheckListItemDetails';

interface Props {
  check: FilteredCheck;
  selected: boolean;
  onLabelSelect: (label: Label) => void;
  onToggleCheckbox: (checkId: number) => void;
  viewType: CheckListViewType;
}

const getStyles = (theme: GrafanaTheme) => ({
  container: css`
    background-color: ${theme.colors.bg2};
    border: 1px solid #343b40;
    border-radius: 2px;
    width: 100%;
    margin-bottom: ${theme.spacing.sm};
  `,
  cardWrapper: css`
    display: flex;
    flex-direction: row;
    padding: ${theme.spacing.md};
  `,
  listCardWrapper: css`
    display: grid;
    height: 48px;
    grid-template-columns: auto 300px auto auto auto;
    align-content: center;
    grid-column-gap: ${theme.spacing.md};
  `,
  disabledCard: css`
    background-color: ${theme.colors.bg3};
  `,
  checkbox: css`
    margin-right: ${theme.spacing.sm};
    display: flex;
    align-items: flex-start;
  `,
  body: css`
    display: flex;
    flex-direction: row;
    flex-grow: 1;
    border-right: 1px solid #343b40;
    padding-right: ${theme.spacing.md};
    overflow: hidden;
  `,
  noBorder: css`
    border-right: none;
  `,
  checkInfoContainer: css`
    flex-grow: 1;
    overflow: hidden;
  `,
  checkTarget: css`
    font-size: ${theme.typography.size.sm};
    line-height: ${theme.typography.lineHeight.sm};
    font-weight: ${theme.typography.weight.bold};
    margin-bottom: ${theme.spacing.sm};
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  `,
  checkTargetListView: css`
    max-width: 400px;
    margin-bottom: 0px;
  `,
  checkJobListView: css`
    flex-grow: 1;
    white-space: nowrap;
    margin-bottom: 0px;
  `,
  stats: css`
    display: flex;
    flex-direction: row;
    align-items: center;
  `,
  actionContainer: css`
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    height: 100%;
  `,
});

export const CheckListItem = ({
  check,
  onLabelSelect,
  selected,
  onToggleCheckbox,
  viewType = CheckListViewType.Card,
}: Props) => {
  const styles = useStyles(getStyles);
  const checkType = getCheckType(check.settings);

  const usage = calculateUsage({
    probeCount: check.probes.length,
    checkType,
    frequencySeconds: check.frequency / 1000,
    useFullMetrics: !check.basicMetricsOnly,
  });

  if (viewType === CheckListViewType.List) {
    return (
      <div className={cx(styles.container, { [styles.disabledCard]: !check.enabled })}>
        <div className={styles.listCardWrapper}>
          <div className={styles.checkbox}>
            <Checkbox
              onChange={(e: ChangeEvent<HTMLInputElement>) => {
                e.stopPropagation();
                onToggleCheckbox(check.id);
              }}
              checked={selected}
            />
          </div>
          <h4 className={styles.checkJobListView}>{check.job}</h4>
          <div className={cx(styles.checkTarget, styles.checkTargetListView)}>{check.target}</div>
          <CheckListItemDetails checkType={checkType} frequency={check.frequency} activeSeries={usage.activeSeries} />
          <CheckItemActionButtons check={check} />
        </div>
      </div>
    );
  }

  return (
    <div className={cx(styles.container, { [styles.disabledCard]: !check.enabled })}>
      <div className={styles.cardWrapper} aria-label="check-card">
        <div className={styles.checkbox}>
          <Checkbox
            onChange={(e: ChangeEvent<HTMLInputElement>) => {
              e.stopPropagation();
              onToggleCheckbox(check.id);
            }}
            checked={selected}
          />
        </div>
        <div className={cx(styles.body, { [styles.noBorder]: !check.enabled })}>
          <div className={styles.checkInfoContainer}>
            <h3>{check.job}</h3>
            <div className={styles.checkTarget}>{check.target}</div>
            <CheckListItemDetails checkType={checkType} frequency={check.frequency} activeSeries={usage.activeSeries} />
            <div>
              <HorizontalGroup wrap>
                {check.labels.map((label: Label, index) => (
                  <CheckCardLabel key={index} label={label} onLabelSelect={onLabelSelect} />
                ))}
              </HorizontalGroup>
            </div>
          </div>
        </div>
        <div className={styles.stats}>
          {check.enabled && (
            <>
              <SuccessRateGauge
                labelNames={['instance', 'job']}
                labelValues={[check.target, check.job]}
                height={75}
                width={120}
                sparkline={false}
              />
              <LatencyGauge target={check.target} job={check.job} height={75} width={120} />
            </>
          )}
          <div className={styles.actionContainer}>
            <CheckItemActionButtons check={check} />
          </div>
        </div>
      </div>
    </div>
  );
};
