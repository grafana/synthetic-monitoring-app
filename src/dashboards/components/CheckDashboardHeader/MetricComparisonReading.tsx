import React, { useState } from 'react';
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

type ReadingMode = keyof MetricComparisonReadings;

const READING_ORDER: ReadingMode[] = ['plain', 'reference'];
const NEXT_READING_LABEL: Record<ReadingMode, string> = {
  plain: 'Show exact reference value',
  reference: 'Show plain-language comparison',
};

export function MetricComparisonReading({
  caption,
  metricLabel,
  readings,
}: MetricComparisonReadingProps) {
  const styles = useStyles2(getStyles);
  const [mode, setMode] = useState<ReadingMode>('plain');
  const reading = readings[mode];

  return (
    <div className={styles.container}>
      <button
        aria-label={`${metricLabel} comparison: ${reading}. ${caption}. ${NEXT_READING_LABEL[mode]}`}
        className={styles.reading}
        onClick={() => {
          const currentIndex = READING_ORDER.indexOf(mode);
          setMode(READING_ORDER[(currentIndex + 1) % READING_ORDER.length]!);
        }}
        type="button"
      >
        <span className={styles.readingValue}>{reading}</span>
        <span className={styles.caption}>{caption}</span>
      </button>
    </div>
  );
}

const getStyles = (theme: GrafanaTheme2) => ({
  container: css({
    display: 'flex',
    flexDirection: 'column',
    gap: theme.spacing(0.25),
    minWidth: 0,
  }),
  reading: css({
    alignItems: 'baseline',
    background: 'transparent',
    border: 0,
    color: theme.colors.text.secondary,
    cursor: 'pointer',
    display: 'flex',
    flexWrap: 'wrap',
    fontSize: theme.typography.bodySmall.fontSize,
    gap: theme.spacing(0.5),
    margin: 0,
    minWidth: 0,
    padding: 0,
    textAlign: 'start',
    '&:focus-visible': {
      outline: `2px solid ${theme.colors.primary.border}`,
      outlineOffset: theme.spacing(0.25),
    },
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
