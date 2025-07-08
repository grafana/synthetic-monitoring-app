import React from 'react';
import { GrafanaTheme2 } from '@grafana/data';
import { useStyles2, useTheme2 } from '@grafana/ui';
import { css, cx } from '@emotion/css';

interface GaugeArrowProps {
  value: number;
  type?: 'primary' | 'secondary';
}

export function GaugeArrow({ value, type }: GaugeArrowProps) {
  const styles = useStyles2(getStyles);
  const theme = useTheme2();
  const direction = type === 'secondary' ? 'up' : 'down';
  const fill = type === 'primary' ? theme.colors.primary.text : theme.colors.text.primary;
  const strokeColor = theme.isDark ? theme.colors.background.secondary : theme.colors.background.canvas;

  return (
    <svg
      width="20px"
      className={cx(direction, styles)}
      viewBox="0 0 35.6 17.8"
      style={{ left: `calc(${value}% - 10px)` }}
    >
      <rect
        transform="translate(5.8 -14) rotate(45 12 12)"
        width="24"
        height="24"
        fill={fill}
        stroke={strokeColor}
        strokeWidth="4"
      />
    </svg>
  );
}
const getStyles = (theme: GrafanaTheme2) =>
  css({
    position: 'absolute',
    top: '-4px',
    zIndex: '1', // To be above legend dots

    '&.up': {
      top: 'unset',
      bottom: '-4px',
      transform: 'rotate(180deg)',
    },
  });
