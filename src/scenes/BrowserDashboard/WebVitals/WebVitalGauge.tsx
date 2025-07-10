import React from 'react';
import { GrafanaTheme2 } from '@grafana/data';
import { Menu, PanelChrome, useStyles2 } from '@grafana/ui';
import { css } from '@emotion/css';

import { WebVitalConfig } from './types';

import { getWebVitalValueConfig } from './utils';
import { WebVitalBarGauge } from './WebVitalBarGauge';
import { WebVitalValue } from './WebVitalValue';

interface WebVitalGaugeProps extends Omit<WebVitalConfig, 'thresholds' | 'unit'> {
  value: number;
  exploreLink?: string;
}

export function WebVitalGauge({ value, name, longName, description, exploreLink }: WebVitalGaugeProps) {
  const styles = useStyles2(getStyles);
  const valueConfig = getWebVitalValueConfig(name, value);

  return (
    <div>
      <PanelChrome
        title={name.toUpperCase()}
        description={description}
        menu={() => <Menu>{exploreLink && <Menu.Item label="Explore" icon="compass" url={exploreLink} />}</Menu>}
      >
        <div className={styles.container}>
          <span className={styles.fullName}>{longName}</span>

          <div>
            <WebVitalValue value={valueConfig} />
            <WebVitalBarGauge value={valueConfig} />
          </div>
        </div>
      </PanelChrome>
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
