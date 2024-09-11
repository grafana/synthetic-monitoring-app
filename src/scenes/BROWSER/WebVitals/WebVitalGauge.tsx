import React from 'react';
import { GrafanaTheme2 } from '@grafana/data';
import { Icon, LinkButton, Tooltip, useStyles2 } from '@grafana/ui';
import { css } from '@emotion/css';

import { WebVitalName } from './types';

import { getWebVitalValueConfig } from './utils';
import { WebVitalBarGauge } from './WebVitalBarGauge';
import { WebVitalValue } from './WebVitalValue';

interface WebVitalGaugeProps {
  name: WebVitalName;
  longName: string;
  value: number;
  description?: string;
  exploreLink?: string;
}

export function WebVitalGauge({ value, name, longName, description, exploreLink }: WebVitalGaugeProps) {
  const styles = useStyles2(getStyles);

  const valueConfig = getWebVitalValueConfig(name, value);

  return (
    <div className={styles.container}>
      <div>
        <div className={styles.fullNameContainer}>
          <h3 className={styles.shortName}>{name}</h3>
          {exploreLink ? (
            <LinkButton
              key="explore"
              tooltip={'Explore'}
              target="_blank"
              icon="compass"
              size="sm"
              variant="secondary"
              href={`/explore?left=${exploreLink}`}
            ></LinkButton>
          ) : null}
        </div>
        <div className={styles.nameWrapper}>
          <span className={styles.fullName}>{longName}</span>
          {description ? (
            <Tooltip content={description}>
              <Icon name="question-circle" size="sm" />
            </Tooltip>
          ) : null}
        </div>
      </div>

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
    }),
    shortName: css({
      color: `${theme.colors.text.primary}`,
      fontWeight: '700',
      marginBottom: '0',
      textTransform: 'uppercase',
    }),
    fullNameContainer: css({
      color: `${theme.colors.text.secondary}`,
      display: 'flex',
      justifyContent: 'space-between',
    }),
    nameWrapper: css({
      display: 'flex',
      alignItems: 'center',
      gap: `${theme.spacing(1)}`,
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
