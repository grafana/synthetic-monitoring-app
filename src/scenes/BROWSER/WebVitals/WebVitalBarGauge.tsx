import React from 'react';
import { GrafanaTheme2 } from '@grafana/data';
import { useStyles2 } from '@grafana/ui';
import { css, cx } from '@emotion/css';

import { WebVitalValueConfig } from './types';

import { GaugeArrow } from './GaugeArrow';
import { webVitalFormatter } from './WebVitalGauge';

interface WebVitalBarGaugeProps {
  value: WebVitalValueConfig;
}

export function WebVitalBarGauge({ value }: WebVitalBarGaugeProps) {
  const styles = useStyles2(getStyles);

  const { originalValue = null } = value;

  const hasValue = originalValue !== null;
  const thresholds = value.thresholds;
  const [needsImprovement, poor] = thresholds;

  const valuePosition = hasValue ? getArrowPosition(thresholds, originalValue) : 0;

  const leftScore = value.score ?? undefined;

  return (
    <div className={styles.gaugeAndLegendContainer}>
      <div className={cx(styles.partitionContainer, `score--${leftScore} `)}>
        <div className={styles.partition} />
        <div className={styles.partition}>
          <Marker />
        </div>
        <div className={styles.partition}>
          <Marker />
        </div>
        {hasValue && <GaugeArrow value={valuePosition} />}
      </div>
      <div className={styles.legend}>
        <div>
          {webVitalFormatter(needsImprovement, value.unitType)}
          {value.unit}
        </div>
        <div>
          {webVitalFormatter(poor, value.unitType)}
          {value.unit}
        </div>
      </div>
    </div>
  );
}

function Marker() {
  const styles = useStyles2(getStyles);
  return (
    <div className={styles.marker}>
      <div></div>
      <div></div>
    </div>
  );
}

function getArrowPosition(thresholds: [number, number] | readonly [number, number], value: number) {
  const [good, needsImprovement] = thresholds;

  // Good
  if (value <= good) {
    return (value / good) * 33.333333;
  }

  // Needs improvement
  if (value <= needsImprovement) {
    const sectionSize = needsImprovement - good;
    const relativeValue = value - good;

    return 33.333333 + (relativeValue / sectionSize) * 33.333333;
  }

  // Poor
  const sectionSize = good;
  const relativeValue = value - needsImprovement;

  return Math.min(66.666666 + (relativeValue / sectionSize) * 33.333333, 100);
}

function getStyles(theme: GrafanaTheme2) {
  const partition = css({
    flex: '0 0 33.333333%',
  });

  return {
    partition,
    gaugeAndLegendContainer: css({
      margin: '0 0.25rem',
    }),
    partitionContainer: css({
      display: 'flex',
      height: '10px',
      width: '100%',
      position: 'relative',
      backgroundColor: `${theme.colors.border.weak}`,

      [`&.score--good .${partition}:nth-child(1)`]: {
        backgroundColor: `${theme.visualization.getColorByName('green')}`,
      },

      [`&.score--needs_improvement .${partition}:nth-child(2)`]: {
        backgroundColor: `${theme.visualization.getColorByName('orange')}`,
      },

      [`&.score--poor .${partition}:nth-child(3)`]: {
        backgroundColor: `${theme.visualization.getColorByName('red')}`,
      },
    }),
    legend: css({
      display: 'flex',
      justifyContent: 'center',

      position: 'relative',

      color: `${theme.colors.text.primary}`,
      fontSize: '10px',
      marginTop: `${theme.spacing(1.5)}`,

      '& > div': {
        flex: '0 0 33.33333%',
        textAlign: 'center',
        position: 'relative',

        '&:nth-child(2)': {
          '&::before': {
            left: '66.666666%',
          },
          '&::after': {
            left: 'calc(66.666666% - 1.5px)',
          },
        },
      },
    }),
    marker: css({
      display: 'flex',
      alignItems: 'center',
      flexDirection: 'column',

      position: 'relative',
      top: '10px',

      width: '1px',
      height: '13px',

      transform: 'translate(-50%, -1px)',

      backgroundColor: `${theme.colors.text.primary}`,

      'div:first-of-type': {
        width: `${theme.spacing(0.5)}`,
        height: `${theme.spacing(0.5)}`,
        borderRadius: '50%',
        backgroundColor: `${theme.colors.text.primary}`,
      },
    }),
  };
}
