import React from 'react';
import { GrafanaTheme2 } from '@grafana/data';
import { Icon, Tooltip, useStyles2 } from '@grafana/ui';
import { css } from '@emotion/css';

import { WEB_VITAL_CONFIG, WebVitalName, WebVitalUnit, WebVitalValueConfig } from './types';

import { WebVitalBarGauge } from './WebVitalBarGauge';
import { getWebVitalScore, WebVitalValue } from './WebVitalValue';

interface WebVitalGaugeProps {
  name: WebVitalName;
  longName: string;
  value: number;
  description?: string;
}

export function WebVitalGauge({ value, name, longName, description }: WebVitalGaugeProps) {
  const styles = useStyles2(getStyles);

  const valueConfig = getWebVitalValueConfig(name, value);

  return (
    <div className={styles.container}>
      <div>
        <div className={styles.fullNameContainer}>
          <h3 className={styles.shortName}>{name}</h3>
          {description ? (
            <Tooltip content={description}>
              <Icon name="question-circle" size="lg" />
            </Tooltip>
          ) : null}
        </div>

        <span className={styles.fullName}>{longName}</span>
      </div>

      <div>
        <WebVitalValue value={valueConfig} />
        <WebVitalBarGauge value={valueConfig} />
      </div>
    </div>
  );
}

function getWebVitalValueConfig(name: WebVitalName, value: undefined | number | null = null): WebVitalValueConfig {
  const config = WEB_VITAL_CONFIG[name];
  if (!config) {
    throw new TypeError(`Unknown web vital name: ${name}`);
  }
  const score = getWebVitalScore(name, value);
  const unit = config.unit;
  const formattedValue = webVitalFormatter(value, unit);
  const thresholds = config.thresholds;

  return {
    name,
    value: formattedValue,
    score,
    unitType: unit,
    unit: getPresentationUnit(unit),
    originalValue: value,
    thresholds,
    toString() {
      return getWebVitalValueString(this);
    },
  };
}

function getWebVitalValueString(value: WebVitalValueConfig) {
  if (value.originalValue === null) {
    return '-';
  }
  if (value.unitType === 'score') {
    return value.value.toString();
  }

  return `${value.value}${value.unit}`;
}

export function webVitalFormatter(value: number | null, unit: WebVitalUnit) {
  if (value === null) {
    return '-';
  }

  switch (unit) {
    case 'milliseconds':
      return value.toFixed(0);
    case 'seconds':
      return (value > 0 ? value / 1000 : 0).toFixed(2);
    case 'score':
      return value.toFixed(2);
    default:
      return unit;
  }
}

function getPresentationUnit(unit: WebVitalValueConfig['unitType']) {
  switch (unit) {
    case 'seconds':
      return 's';
    case 'milliseconds':
      return 'ms';
    case 'score':
      return '';
    default:
      return unit;
  }
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
