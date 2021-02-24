import { getLocationSrv } from '@grafana/runtime';
import React, { useContext, ChangeEvent } from 'react';
import appEvents from 'grafana/app/core/app_events';
import { SuccessRateGauge } from 'components/SuccessRateGauge';
import { checkType as getCheckType, dashboardUID } from 'utils';
// Types
import { Check, CheckType, FilteredCheck, Label } from 'types';
import { IconButton, useStyles, Checkbox, ButtonGroup, HorizontalGroup, TagList, Badge } from '@grafana/ui';
import { css, cx } from 'emotion';
import { InstanceContext } from './InstanceContext';
import { AppEvents, GrafanaTheme } from '@grafana/data';
import { calculateUsage } from 'checkUsageCalc';
import { CheckCardLabel } from './CheckCardLabel';
import { LatencyGauge } from './LatencyGauge';
import { CheckStatusPill } from './CheckStatusPill';

interface Props {
  check: FilteredCheck;
  selected: boolean;
  onLabelSelect: (label: Label) => void;
  onToggleCheckbox: (checkId: number) => void;
}

const getStyles = (theme: GrafanaTheme) => ({
  cardWrapper: css`
    display: flex;
    flex-direction: row;
    background-color: ${theme.colors.bg2};
    border: 1px solid #343b40;
    border-radius: 2px;
    width: 100%;
    padding: ${theme.spacing.md};
    cursor: pointer;
    margin-bottom: ${theme.spacing.sm};
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
  checkDetails: css`
    font-size: ${theme.typography.size.sm};
    line-height: ${theme.typography.lineHeight.sm};
    margin-bottom: ${theme.spacing.sm};
  `,
  stats: css`
    display: flex;
    flex-direction: row;
    align-items: center;
  `,
  actionButtonGroup: css`
    align-self: flex-start;
    display: flex;
    align-items: center;
  `,
  statusPill: css`
    margin-right: ${theme.spacing.xs};
  `,
});

export const CheckCard = ({ check, onLabelSelect, selected, onToggleCheckbox }: Props) => {
  const { instance } = useContext(InstanceContext);
  const styles = useStyles(getStyles);
  const checkType = getCheckType(check.settings);

  const showDashboard = (check: Check, checkType: CheckType) => {
    const target = dashboardUID(checkType, instance.api);

    if (!target) {
      appEvents.emit(AppEvents.alertError, ['Dashboard not found']);
      return;
    }

    getLocationSrv().update({
      partial: false,
      path: `d/${target.uid}`,
      query: {
        'var-instance': check.target,
        'var-job': check.job,
      },
    });
  };

  const usage = calculateUsage({
    probeCount: check.probes.length,
    checkType,
    frequencySeconds: check.frequency / 1000,
    useFullMetrics: !check.basicMetricsOnly,
  });

  return (
    <div
      onClick={(e) => {
        e.stopPropagation();
        showDashboard(check, checkType);
      }}
      className={styles.cardWrapper}
      aria-label="check-card"
    >
      <div className={styles.checkbox} onClick={(e) => e.stopPropagation()}>
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
          <div className={styles.checkDetails}>
            {checkType.toUpperCase()} | {check.frequency / 1000}s frequency | {usage.activeSeries} active series
          </div>
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
        <div className={styles.actionButtonGroup}>
          <CheckStatusPill enabled={check.enabled} className={styles.statusPill} />
          <ButtonGroup>
            <IconButton
              name="pen"
              onClick={(e) => {
                e.stopPropagation();
                getLocationSrv().update({
                  partial: true,
                  query: {
                    id: check.id,
                  },
                });
              }}
            />
            <IconButton name="trash-alt" />
          </ButtonGroup>
        </div>
      </div>
    </div>
  );
};
