import React from 'react';
import { GrafanaTheme2, IconName } from '@grafana/data';
import { Icon, Spinner, useStyles2 } from '@grafana/ui';
import { css, cx } from '@emotion/css';
import { useDashboardPanelQuery } from 'dashboards/hooks/useDashboardPanelQuery';

import { HeaderMetricDefinition } from './CheckDashboardHeader.types';
import { HealthState } from './health/checkHealth.types';
import { Check } from 'types';
import { Toggletip } from 'components/Toggletip';

import { useCheckHealthOptional } from './health/CheckHealthContext';
import { HeaderMetricSparkline } from './HeaderMetricSparkline';
import { MetricAlertControl } from './MetricAlertControl';

const HEALTH_ICON: Record<HealthState, IconName> = {
  healthy: 'check-circle',
  degraded: 'exclamation-triangle',
  unhealthy: 'exclamation-circle',
  unknown: 'question-circle',
};

function HeaderMetricSecondary({ secondary }: { secondary: NonNullable<HeaderMetricDefinition['secondary']> }) {
  const { panelData } = useDashboardPanelQuery(secondary.definition);
  const text = secondary.selectText(panelData);

  return text ? <span>{text}</span> : null;
}

function HeaderMetricSparklineSlot({
  sparkline,
}: {
  sparkline: NonNullable<HeaderMetricDefinition['sparkline']>;
}) {
  const { panelData } = useDashboardPanelQuery(sparkline.definition);
  const series = sparkline.selectSeries(panelData);

  return series ? <HeaderMetricSparkline sparkline={series} /> : null;
}

export function HeaderMetric<TCheck extends Check>({
  check,
  metric,
}: {
  check?: TCheck;
  metric: HeaderMetricDefinition<TCheck>;
}) {
  const styles = useStyles2(getStyles);
  const { panelData, isLoading } = useDashboardPanelQuery(metric.definition);
  const value = metric.selectValue(panelData);
  const displayValue = value === null && isLoading ? 'Loading' : metric.formatValue(value);
  const Details = metric.Details;
  const secondaryText = metric.getSecondaryText?.(value);
  const health = useCheckHealthOptional()?.metrics[metric.id];

  return (
    <section aria-label={metric.label} className={styles.metric} role="region">
      <div className={styles.copy}>
        <div className={styles.labelRow}>
          <span className={styles.label}>{metric.label}</span>
          <Toggletip
            content={
              <div className={styles.toggletipContent}>
                <span>{metric.description}</span>
                {Details && check ? <Details check={check} /> : null}
              </div>
            }
          >
            <button aria-label={`About ${metric.label}`} className={styles.infoButton} type="button">
              <Icon name="info-circle" />
            </button>
          </Toggletip>
          {check ? <MetricAlertControl check={check} metric={metric} /> : null}
        </div>
        <div className={styles.valueBlock}>
          <div className={styles.valueRow}>
            {health ? (
              <Icon
                aria-hidden
                className={cx(styles.rangeStatus, styles[health.rangeState])}
                name={HEALTH_ICON[health.rangeState]}
                size="md"
              />
            ) : null}
            <strong className={cx(styles.value, health && styles[health.rangeState])}>
              {displayValue}
            </strong>
            {isLoading && value !== null ? (
              <span aria-label={`Updating ${metric.label}`} className={styles.updating}>
                <Spinner size="sm" />
              </span>
            ) : null}
          </div>
          {health?.trend ? (
            <span
              aria-label={`${metric.label} trend`}
              className={styles.trend}
              role="status"
            >
              {health.trend.label}
            </span>
          ) : null}
          {secondaryText || metric.secondary ? (
            <div className={styles.secondary}>
              {secondaryText ? <span>{secondaryText}</span> : null}
              {metric.secondary ? <HeaderMetricSecondary secondary={metric.secondary} /> : null}
            </div>
          ) : null}
        </div>
      </div>
      {metric.sparkline ? <HeaderMetricSparklineSlot sparkline={metric.sparkline} /> : null}
    </section>
  );
}

const getStyles = (theme: GrafanaTheme2) => ({
  metric: css({
    alignItems: 'stretch',
    display: 'flex',
    gap: theme.spacing(1.5),
    minWidth: 0,
  }),
  copy: css({
    display: 'flex',
    flex: '0 1 auto',
    flexDirection: 'column',
    gap: theme.spacing(1),
    minWidth: 0,
  }),
  labelRow: css({ alignItems: 'center', display: 'flex', gap: theme.spacing(0.5) }),
  label: css({ color: theme.colors.text.secondary, fontSize: theme.typography.bodySmall.fontSize }),
  infoButton: css({
    alignItems: 'center',
    background: 'transparent',
    border: 0,
    color: theme.colors.text.secondary,
    cursor: 'pointer',
    display: 'inline-flex',
    padding: 0,
  }),
  valueBlock: css({
    display: 'flex',
    flexDirection: 'column',
    gap: theme.spacing(1.5),
    minWidth: 0,
  }),
  valueRow: css({
    alignItems: 'center',
    display: 'flex',
    gap: theme.spacing(1),
  }),
  value: css({
    fontSize: `calc(${theme.typography.h1.fontSize} * 1.5)`,
    lineHeight: theme.typography.h1.lineHeight,
  }),
  healthy: css({ color: theme.colors.success.text }),
  degraded: css({ color: theme.colors.warning.text }),
  unhealthy: css({ color: theme.colors.error.text }),
  unknown: css({ color: theme.colors.text.primary }),
  rangeStatus: css({
    flexShrink: 0,
  }),
  updating: css({ color: theme.colors.text.secondary, display: 'inline-flex' }),
  trend: css({
    color: theme.colors.text.secondary,
    fontSize: theme.typography.bodySmall.fontSize,
  }),
  secondary: css({
    color: theme.colors.text.secondary,
    display: 'flex',
    flexDirection: 'column',
    fontSize: theme.typography.bodySmall.fontSize,
  }),
  toggletipContent: css({ display: 'flex', flexDirection: 'column', gap: theme.spacing(1.5) }),
});
