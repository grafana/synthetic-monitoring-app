import React from 'react';
import { GrafanaTheme2 } from '@grafana/data';
import { Icon, Tooltip, useStyles2 } from '@grafana/ui';
import { css, cx } from '@emotion/css';

import { MetricAlertModel } from './health/checkHealth.types';

function getTooltip(state: 'firing' | 'historical', fireCount: number): string {
  if (state === 'firing') {
    return fireCount > 1
      ? `Alert is firing · ${fireCount} episodes in this range`
      : 'Alert is firing';
  }

  return fireCount > 1
    ? `Alert fired ${fireCount} times in this range`
    : 'Alert fired once in this range';
}

export function AlertFiringMarker({
  alert,
  metricLabel,
}: {
  alert: MetricAlertModel;
  metricLabel: string;
}) {
  const styles = useStyles2(getStyles);

  if (alert.state !== 'firing' && alert.state !== 'historical') {
    return null;
  }

  const fireCount = alert.fireCount ?? 0;

  if (fireCount < 1) {
    return null;
  }

  const tooltip = getTooltip(alert.state, fireCount);

  return (
    <Tooltip content={tooltip}>
      <span
        aria-label={`${tooltip} for ${metricLabel}`}
        className={cx(styles.marker, alert.state === 'firing' ? styles.firing : styles.historical)}
        role="status"
      >
        <Icon aria-hidden name="bolt" size="sm" />
        {fireCount > 1 ? <span className={styles.count}>×{fireCount}</span> : null}
      </span>
    </Tooltip>
  );
}

const getStyles = (theme: GrafanaTheme2) => ({
  marker: css({
    alignItems: 'center',
    display: 'inline-flex',
    flexShrink: 0,
    fontSize: theme.typography.bodySmall.fontSize,
    fontWeight: theme.typography.fontWeightMedium,
    gap: theme.spacing(0.25),
    lineHeight: 1,
  }),
  firing: css({
    color: theme.colors.error.text,
  }),
  historical: css({
    color: theme.colors.warning.text,
  }),
  count: css({
    fontVariantNumeric: 'tabular-nums',
  }),
});
