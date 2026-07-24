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
import { MetricComparisonReading } from './MetricComparisonReading';
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
  const hasStatus = hasSecondary || hasSummary || comparison !== null;

  return (
    <section aria-label={metric.label} className={styles.metric} role="region">
      <div className={styles.labelRow}>
        <div className={styles.labelGroup}>
          <Text variant="h4" element="h2">
            {metric.label}
          </Text>
        </div>
        <div className={styles.labelActions}>
          {health?.alert ? (
            <AlertFiringMarker alert={health.alert} metricLabel={metric.label} />
          ) : null}
          {check ? <MetricAlertControl check={check} metric={metric} /> : null}
        </div>
      </div>
      <div
        className={cx(
          styles.evidenceRow,
          !metric.sparkline && styles.evidenceRowWithoutChart,
          hasStatus && styles.evidenceRowBeforeStatus
        )}
      >
        <div className={styles.metricReading} data-testid="header-metric-reading">
          <div className={styles.valueLine}>
            <strong className={cx(styles.value, health && styles[health.rangeState])}>
              {displayValue}
            </strong>
            {isLoading && value !== null ? (
              <span aria-label={`Updating ${metric.label}`} className={styles.updating}>
                <Spinner size="sm" />
              </span>
            ) : null}
          </div>
        </div>
        {metric.sparkline ? (
          <div className={styles.chartReading} data-testid="header-metric-chart">
            <HeaderMetricSparklineSlot
              sparkline={metric.sparkline}
              state={health?.rangeState}
              visual={comparison?.visual}
            />
          </div>
        ) : null}
      </div>
      {hasStatus ? (
        <div className={styles.statusRow} data-testid="header-metric-health">
          <div className={styles.statusLeading}>
            {hasSecondary ? (
              <div className={styles.secondary}>
                {secondaryText ? <span>{secondaryText}</span> : null}
                {metric.secondary ? <HeaderMetricSecondary secondary={metric.secondary} /> : null}
              </div>
            ) : null}
            {comparison?.state === 'ready' && comparison.readings && comparison.caption ? (
              <MetricComparisonReading
                caption={comparison.caption}
                metricLabel={metric.label}
                readings={comparison.readings}
              />
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
            {comparison?.message ? (
              <span
                aria-atomic="true"
                aria-live="polite"
                className={styles.comparisonUnavailable}
              >
                {comparison.message}
              </span>
            ) : null}
            {comparison === null && hasSummary ? (
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
        </div>
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
    containerType: 'inline-size',
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
  labelActions: css({
    alignItems: 'center',
    display: 'inline-flex',
    flexShrink: 0,
    gap: theme.spacing(1),
    marginLeft: 'auto',
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
  evidenceRow: css({
    alignItems: 'center',
    display: 'grid',
    gap: theme.spacing(2),
    gridTemplateColumns: 'minmax(0, 0.85fr) minmax(96px, 1.15fr)',
    minWidth: 0,
    width: '100%',
    '@container (max-width: 280px)': {
      alignItems: 'stretch',
      gridTemplateColumns: 'minmax(0, 1fr)',
    },
  }),
  evidenceRowWithoutChart: css({
    gridTemplateColumns: 'minmax(0, 1fr)',
  }),
  evidenceRowBeforeStatus: css({
    marginBottom: theme.spacing(2),
  }),
  metricReading: css({
    alignItems: 'flex-start',
    display: 'flex',
    flexDirection: 'column',
    gap: theme.spacing(1),
    minWidth: 0,
  }),
  valueLine: css({
    alignItems: 'center',
    display: 'flex',
    gap: theme.spacing(1),
    minWidth: 0,
  }),
  chartReading: css({
    minWidth: 0,
    width: '100%',
  }),
  value: css({
    display: 'block',
    fontSize: theme.typography.h1.fontSize,
    fontVariantNumeric: 'tabular-nums',
    lineHeight: theme.typography.h1.lineHeight,
    whiteSpace: 'nowrap',
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
    marginTop: 'auto',
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
  comparisonLoading: css({
    alignItems: 'center',
    color: theme.colors.text.secondary,
    display: 'inline-flex',
    fontSize: theme.typography.bodySmall.fontSize,
    gap: theme.spacing(0.5),
  }),
  comparisonUnavailable: css({
    color: theme.colors.text.secondary,
    fontSize: theme.typography.bodySmall.fontSize,
  }),
  toggletipContent: css({ display: 'flex', flexDirection: 'column', gap: theme.spacing(1.5) }),
});
