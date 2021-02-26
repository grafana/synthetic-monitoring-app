import React, { ChangeEvent, useState } from 'react';
import { SuccessRateGauge } from 'components/SuccessRateGauge';
import { checkType as getCheckType } from 'utils';
// Types
import { CheckListViewType, CheckType, FilteredCheck, Label } from 'types';
import { useStyles, Checkbox, HorizontalGroup } from '@grafana/ui';
import { css, cx } from 'emotion';
import { GrafanaTheme } from '@grafana/data';
import { calculateUsage } from 'checkUsageCalc';
import { CheckCardLabel } from '../CheckCardLabel';
import { LatencyGauge } from '../LatencyGauge';
import { CheckItemActionButtons } from './CheckItemActionButtons';
import { CheckListItemDetails } from './CheckListItemDetails';
import { CheckStatusType } from './CheckStatusType';

interface Props {
  check: FilteredCheck;
  selected: boolean;
  onLabelSelect: (label: Label) => void;
  onToggleCheckbox: (checkId: number) => void;
  onTypeSelect: (checkType: CheckType) => void;
  onStatusSelect: (checkStatus: boolean) => void;
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
    padding-bottom: ${theme.spacing.sm};
    overflow: none;
  `,
  listCardWrapper: css`
    display: grid;
    grid-template-columns: auto 145px minmax(1px, 1fr) auto auto auto;
    align-content: center;
    grid-column-gap: ${theme.spacing.md};
    padding: 12px ${theme.spacing.md};
  `,
  disabledCard: css`
    background-color: ${theme.colors.bg3};
  `,
  checkbox: css`
    padding-top: ${theme.spacing.xxs};
    margin-right: ${theme.spacing.sm};
    display: flex;
    align-items: flex-start;
  `,
  body: css`
    display: flex;
    flex-direction: row;
    flex-grow: 1;
    padding-right: ${theme.spacing.md};
    overflow: hidden;
    border-bottom: 1px solid #343b40;
  `,
  checkInfoContainer: css`
    flex-grow: 1;
    overflow: hidden;
  `,
  statusDetailsCardView: css`
    display: flex;
    flex-direction: row;
    align-items: center;
    margin-bottom: ${theme.spacing.sm};
  `,
  statusTypeCardView: css`
    margin-right: ${theme.spacing.sm};
  `,
  checkTarget: css`
    font-size: ${theme.typography.size.sm};
    line-height: ${theme.typography.lineHeight.sm};
    font-weight: ${theme.typography.weight.bold};
    margin-bottom: ${theme.spacing.sm};
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    max-width: 100%;
  `,
  checkTargetListView: css`
    margin-bottom: 0px;
    justify-self: left;
    font-weight: ${theme.typography.weight.regular};
    line-height: ${theme.typography.lineHeight.md};
    display: flex;
    align-items: center;
  `,
  checkJobListView: css`
    flex-grow: 1;
    white-space: nowrap;
    margin-bottom: 0px;
    justify-self: left;
    display: flex;
    align-items: center;
  `,
  listLabels: css`
    padding-top: ${theme.spacing.sm};
    grid-column: span 6;
    display: none;
  `,
  listLabelsOpen: css`
    display: unset;
  `,
  listItemDetails: css`
    justify-content: flex-end;
  `,
  stats: css`
    display: flex;
    flex-direction: row;
    align-items: center;
  `,
  footer: css`
    display: flex;
    flex-direction: row;
    align-items: flex-start;
    width: 100%;
    padding-top: ${theme.spacing.sm};
  `,
  verticalGroup: css`
    display: flex;
    flex-direction: column;
    width: 100%;
    overflow: hidden;
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
  onTypeSelect,
  onStatusSelect,
  selected,
  onToggleCheckbox,
  viewType = CheckListViewType.Card,
}: Props) => {
  const styles = useStyles(getStyles);
  const checkType = getCheckType(check.settings);
  const [listItemLabelsOpen, setListItemLabelsOpen] = useState(false);

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
          <span className={styles.checkJobListView}>{check.job}</span>
          <div className={cx(styles.checkTarget, styles.checkTargetListView)}>{check.target}</div>
          <CheckStatusType
            enabled={check.enabled}
            checkType={checkType}
            onClickStatus={onStatusSelect}
            onClickType={onTypeSelect}
          />
          <CheckListItemDetails
            frequency={check.frequency}
            activeSeries={usage.activeSeries}
            className={styles.listItemDetails}
            labelCount={check.labels.length}
            onViewLabelsClick={() => setListItemLabelsOpen(!listItemLabelsOpen)}
          />
          <CheckItemActionButtons check={check} />
          <div className={cx(styles.listLabels, { [styles.listLabelsOpen]: listItemLabelsOpen })}>
            <HorizontalGroup justify="flex-end" wrap>
              {check.labels.map((label: Label, index) => (
                <CheckCardLabel key={index} label={label} onLabelSelect={onLabelSelect} />
              ))}
            </HorizontalGroup>
          </div>
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
        <div className={styles.verticalGroup}>
          <div className={styles.body}>
            <div className={styles.checkInfoContainer}>
              <h3>{check.job}</h3>
              <div className={styles.checkTarget}>{check.target}</div>
              <div className={styles.statusDetailsCardView}>
                <CheckStatusType
                  enabled={check.enabled}
                  checkType={checkType}
                  onClickStatus={onStatusSelect}
                  onClickType={onTypeSelect}
                  className={styles.statusTypeCardView}
                />
                <CheckListItemDetails frequency={check.frequency} activeSeries={usage.activeSeries} />
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
            </div>
          </div>
          <div className={styles.footer}>
            <HorizontalGroup wrap>
              {check.labels.map((label: Label, index) => (
                <CheckCardLabel key={index} label={label} onLabelSelect={onLabelSelect} />
              ))}
            </HorizontalGroup>
            <div className={styles.actionContainer}>
              <CheckItemActionButtons check={check} showViewDashboard />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
