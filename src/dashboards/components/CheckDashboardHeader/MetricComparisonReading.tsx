import React from 'react';
import { type GrafanaTheme2 } from '@grafana/data';
import { useStyles2 } from '@grafana/ui';
import { css } from '@emotion/css';

export interface MetricComparisonReadings {
  plain: string;
  reference: string;
}

export interface MetricComparisonReadingProps {
  metricLabel: string;
  readings: MetricComparisonReadings;
  caption: string;
}

export function MetricComparisonReading({ caption, metricLabel, readings }: MetricComparisonReadingProps) {
  const styles = useStyles2(getStyles);

  return (
    <div
      aria-label={`${metricLabel} comparison: ${readings.plain}. ${caption}`}
      className={styles.container}
      data-testid="header-metric-comparison-reading"
      role="status"
    >
      <span className={styles.readingValue}>{readings.plain}</span>
      <span className={styles.caption}>{caption}</span>
    </div>
  );
}

const getStyles = (theme: GrafanaTheme2) => ({
  container: css({
    alignItems: 'baseline',
    color: theme.colors.text.secondary,
    display: 'flex',
    flexWrap: 'wrap',
    fontSize: theme.typography.bodySmall.fontSize,
    gap: theme.spacing(0.5),
    minWidth: 0,
  }),
  readingValue: css({
    color: theme.colors.text.primary,
    fontVariantNumeric: 'tabular-nums',
    fontWeight: theme.typography.fontWeightMedium,
    whiteSpace: 'nowrap',
  }),
  caption: css({
    color: theme.colors.text.secondary,
    whiteSpace: 'nowrap',
  }),
});
