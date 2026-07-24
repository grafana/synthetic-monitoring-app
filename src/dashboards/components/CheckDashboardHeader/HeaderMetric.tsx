import React from 'react';
import { GrafanaTheme2, IconName } from '@grafana/data';
import { Icon, Spinner, Text, useStyles2 } from '@grafana/ui';
import { css, cx } from '@emotion/css';
import { useDashboardPanelQuery } from 'dashboards/hooks/useDashboardPanelQuery';

import { HeaderMetricDefinition } from './CheckDashboardHeader.types';
import { HealthState } from './health/checkHealth.types';
import { Check } from 'types';

import { useCheckHealthOptional } from './health/CheckHealthContext';
import { AlertFiringMarker } from './AlertFiringMarker';
import { HeaderMetricSparkline } from './HeaderMetricSparkline';
import { MetricAlertControl } from './MetricAlertControl';
import { type HeaderMetricComparisonVisual, useHeaderMetricComparison } from './useHeaderMetricComparison';

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
  state,
  visual,
}: {
  sparkline: NonNullable<HeaderMetricDefinition['sparkline']>;
  state?: HealthState;
  visual?: HeaderMetricComparisonVisual;
}) {
  const { panelData } = useDashboardPanelQuery(sparkline.definition);
  const series = sparkline.selectSeries(panelData);

  return series ? <HeaderMetricSparkline sparkline={series} state={state} visual={visual} /> : null;
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
  const comparison = useHeaderMetricComparison({
    metric,
    primaryValue: value,
    primaryData: panelData,
  });
  const displayValue = value === null && isLoading ? 'Loading' : metric.formatValue(value);
  const secondaryText = metric.getSecondaryText?.(value);
  const health = useCheckHealthOptional()?.metrics[metric.id];
  const hasSecondary = Boolean(secondaryText || metric.secondary);
  const hasSummary = health != null;
  const hasFiringMarker =
    health?.alert.state === 'firing' || health?.alert.state === 'historical';
  const hasStatus = hasSecondary || hasSummary || hasFiringMarker;

  return (
    <section aria-label={metric.label} className={styles.metric} role="region">
      <div className={styles.labelRow}>
        <div className={styles.labelGroup}>
          <Text variant="h4" element="h2">
            {metric.label}
          </Text>
        </div>
        {check ? <MetricAlertControl check={check} metric={metric} /> : null}
      </div>
      <div className={cx(styles.valueRow, hasStatus && styles.valueRowBeforeStatus)}>
        <div className={styles.valueCluster}>
          <strong className={cx(styles.value, health && styles[health.rangeState])}>
            {displayValue}
          </strong>
          {isLoading && value !== null ? (
            <span aria-label={`Updating ${metric.label}`} className={styles.updating}>
              <Spinner size="sm" />
            </span>
          ) : null}
        </div>
        {metric.sparkline ? (
          <HeaderMetricSparklineSlot
            sparkline={metric.sparkline}
            state={health?.rangeState}
            visual={comparison?.visual}
          />
        ) : null}
      </div>
      {hasStatus ? (
        <div className={styles.statusRow}>
          <div className={styles.statusLeading}>
            {hasSecondary ? (
              <div className={styles.secondary}>
                {secondaryText ? <span>{secondaryText}</span> : null}
                {metric.secondary ? <HeaderMetricSecondary secondary={metric.secondary} /> : null}
              </div>
            ) : null}
            {hasSummary ? (
              <div className={styles.summary}>
                {health ? (
                  <Icon
                    aria-hidden
                    className={cx(styles.rangeStatus, styles[health.rangeState])}
                    name={HEALTH_ICON[health.rangeState]}
                    size="md"
                  />
                ) : null}
                {health?.trend ? (
                  <span aria-label={`${metric.label} trend`} className={styles.trend} role="status">
                    {health.trend.label}
                  </span>
                ) : null}
              </div>
            ) : null}
          </div>
          {health?.alert ? (
            <AlertFiringMarker alert={health.alert} metricLabel={metric.label} />
          ) : null}
        </div>
      ) : null}
      {comparison?.state === 'loading' ? (
        <span
          aria-live="polite"
          className={styles.comparisonLoading}
          data-testid="header-metric-comparison-loading"
        >
          <Spinner size="sm" />
          <span>Loading comparison</span>
        </span>
      ) : null}
      {comparison?.summary ? (
        <div className={styles.comparison}>
          <span>{comparison.summary}</span>
          {comparison.detail ? <span>{comparison.detail}</span> : null}
        </div>
      ) : null}
      {comparison?.message ? (
        <span
          aria-atomic="true"
          aria-live="polite"
          className={styles.comparisonUnavailable}
        >
          {comparison.message}
        </span>
      ) : null}
    </section>
  );
}

const getStyles = (theme: GrafanaTheme2) => ({
  metric: css({
    display: 'flex',
    flexDirection: 'column',
    gap: 0,
    height: '100%',
    minWidth: 0,
    width: '100%',
  }),
  labelRow: css({
    alignItems: 'center',
    display: 'flex',
    gap: theme.spacing(1),
    marginBottom: theme.spacing(1.5), // 12px → metrics/sparkline
    minWidth: 0,
    width: '100%',
  }),
  labelGroup: css({
    alignItems: 'center',
    display: 'flex',
    flex: '1 1 auto',
    gap: theme.spacing(0.5),
    minWidth: 0,
  }),
  infoButton: css({
    alignItems: 'center',
    background: 'transparent',
    border: 0,
    color: theme.colors.text.secondary,
    cursor: 'pointer',
    display: 'inline-flex',
    padding: 0,
  }),
  valueRow: css({
    alignItems: 'center',
    display: 'flex',
    gap: theme.spacing(1.5),
    minWidth: 0,
    width: '100%',
  }),
  valueRowBeforeStatus: css({
    marginBottom: theme.spacing(3)
  }),
  valueCluster: css({
    alignItems: 'center',
    display: 'flex',
    flex: '0 0 auto',
    gap: theme.spacing(1),
  }),
  value: css({
    // Keep sparklines aligned across cards; sized for the widest common value ("100.00%").
    display: 'block',
    fontSize: theme.typography.h1.fontSize,
    fontVariantNumeric: 'tabular-nums',
    lineHeight: theme.typography.h1.lineHeight,
    width: '7ch',
  }),
  healthy: css({ color: theme.colors.success.text }),
  degraded: css({ color: theme.colors.warning.text }),
  unhealthy: css({ color: theme.colors.error.text }),
  unknown: css({ color: theme.colors.text.primary }),
  rangeStatus: css({
    flexShrink: 0,
  }),
  updating: css({ color: theme.colors.text.secondary, display: 'inline-flex' }),
  statusRow: css({
    alignItems: 'flex-end',
    display: 'flex',
    gap: theme.spacing(1),
    justifyContent: 'space-between',
    minWidth: 0,
    width: '100%',
  }),
  statusLeading: css({
    display: 'flex',
    flex: '1 1 auto',
    flexDirection: 'column',
    gap: theme.spacing(0.25),
    minWidth: 0,
  }),
  secondary: css({
    color: theme.colors.text.secondary,
    fontSize: theme.typography.bodySmall.fontSize,
    minWidth: 0,
  }),
  summary: css({
    alignItems: 'center',
    display: 'flex',
    gap: theme.spacing(0.75),
    minWidth: 0,
  }),
  trend: css({
    color: theme.colors.text.secondary,
    fontSize: theme.typography.bodySmall.fontSize,
  }),
  comparison: css({
    color: theme.colors.text.secondary,
    display: 'flex',
    flexDirection: 'column',
    fontSize: theme.typography.bodySmall.fontSize,
    gap: theme.spacing(0.25),
    marginTop: theme.spacing(0.5),
    minWidth: 0,
  }),
  comparisonLoading: css({
    alignItems: 'center',
    color: theme.colors.text.secondary,
    display: 'inline-flex',
    fontSize: theme.typography.bodySmall.fontSize,
    gap: theme.spacing(0.5),
    marginTop: theme.spacing(0.5),
  }),
  comparisonUnavailable: css({
    color: theme.colors.text.secondary,
    fontSize: theme.typography.bodySmall.fontSize,
    marginTop: theme.spacing(0.5),
  }),
  toggletipContent: css({ display: 'flex', flexDirection: 'column', gap: theme.spacing(1.5) }),
});
