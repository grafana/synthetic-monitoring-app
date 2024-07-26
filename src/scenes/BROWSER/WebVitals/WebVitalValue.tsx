import React from 'react';
import { GrafanaTheme2 } from '@grafana/data';
import { useStyles2 } from '@grafana/ui';
import { css, cx } from '@emotion/css';

import { WEB_VITAL_CONFIG, WebVitalName, WebVitalScore, WebVitalValueConfig } from './types';

interface WebVitalValueProps {
  value: WebVitalValueConfig;
}

export function WebVitalValue({ value }: WebVitalValueProps) {
  const styles = useStyles2(getStyles);

  return (
    <div>
      <h4 className={cx(styles.container, `score--${value.score}`)}>
        <span className={styles.value}>{value.value}</span>
        {value.unit && <span className={styles.unit}>{value.unit}</span>}
      </h4>
    </div>
  );
}

export function getWebVitalScore(name: WebVitalName, value: number | null): WebVitalScore | undefined {
  const thresholds = WEB_VITAL_CONFIG[name]?.thresholds;

  if (!thresholds || value === null) {
    return undefined;
  }

  const [good, poor] = thresholds;

  if (good >= value) {
    return 'good';
  }

  if (poor < value) {
    return 'poor';
  }

  return 'needs_improvement';
}

export function getStyles(theme: GrafanaTheme2) {
  const value = css({});

  return {
    value,
    container: css({
      display: 'flex',
      gap: `${theme.spacing(0.5)}`,
      alignItems: 'flex-end',
      color: `${theme.colors.text.secondary}`,
      fontWeight: '700',
      lineHeight: '100%',

      [`&.score--good:not(&.score--isComparing) .${value}:first-child`]: {
        color: `${theme.visualization.getColorByName('green')}`,
      },

      [`&.score--needs_improvement:not(&.score--isComparing) .${value}:first-child`]: {
        color: `${theme.visualization.getColorByName('orange')}`,
      },

      [`&.score--poor:not(&.score--isComparing) .${value}:first-child`]: {
        color: `${theme.visualization.getColorByName('red')}`,
      },

      [`&.score--isComparing .${value}:first-child`]: {
        color: `${theme.colors.info.text}`,
      },
    }),
    scoreCopy: css({
      fontWeight: 'normal',
      fontSize: `${theme.typography.bodySmall.fontSize}`,
      lineHeight: '100%',
    }),
    unit: css({
      fontWeight: 'normal',
      fontSize: `${theme.typography.bodySmall.fontSize}`,
      linHeight: '100%',
      marginLeft: -`${theme.spacing(0.5)}`,
    }),
  };
}
