import React from 'react';
import { GrafanaTheme2 } from '@grafana/data';
import { useStyles2 } from '@grafana/ui';
import { css } from '@emotion/css';

import { WebVitalName } from './types';

import { getWebVitalValueConfig } from './utils';
import { WebVitalBarGauge } from './WebVitalBarGauge';
import { WebVitalValue } from './WebVitalValue';

interface WebVitalGaugeProps {
  name: WebVitalName;
  longName: string;
  value: number;
}

export function WebVitalGauge({ value, name, longName }: WebVitalGaugeProps) {
  const styles = useStyles2(getStyles);
  const valueConfig = getWebVitalValueConfig(name, value);

  return (
    <div className={styles.container}>
      <span className={styles.fullName}>{longName}</span>

      <div>
        <WebVitalValue value={valueConfig} />
        <WebVitalBarGauge value={valueConfig} />
      </div>
    </div>
  );
}

export function getStyles(theme: GrafanaTheme2) {
  return {
    container: css({
      flex: '0 0 200px', // to give "needs improvement" some margin to fit on one line
      display: 'flex',
      flexDirection: 'column',
      gap: `${theme.spacing(1.5)}`,
      position: 'relative',
    }),

    fullName: css({
      color: `${theme.colors.text.secondary}`,
      fontSize: `${theme.typography.bodySmall.fontSize}`,
    }),
    score: css({
      fontWeight: '700',

      '& > span': {
        '&:not(:last-child)': {
          marginRight: `${theme.spacing(0.5)}`,
        },
      },
    }),
  };
}
