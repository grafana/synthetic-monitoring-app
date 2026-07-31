import React from 'react';
import { useTheme2 } from '@grafana/ui';

interface SparklineProps {
  points: Array<[number, number]>;
  width?: number;
  height?: number;
}

export const Sparkline = ({ points: rawPoints, width = 120, height = 28 }: SparklineProps) => {
  const theme = useTheme2();

  // PromQL division can yield NaN (0/0) or Infinity (x/0) samples; a single
  // one poisons the min/max scaling and blanks the whole line.
  const points = rawPoints.filter(([, value]) => Number.isFinite(value));

  if (points.length === 0) {
    return null;
  }

  // A single point can't draw a line — show a dot rather than nothing so a
  // young check still registers as "has data".
  if (points.length === 1) {
    return (
      <svg width={width} height={height} role="img" aria-hidden="true">
        <circle cx={width / 2} cy={height / 2} r={3} fill={theme.colors.primary.main} />
      </svg>
    );
  }

  const values = points.map(([, value]) => value);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const pad = 2;

  const path = points
    .map(([, value], index) => {
      const x = pad + (index / (points.length - 1)) * (width - pad * 2);
      const y = pad + (1 - (value - min) / range) * (height - pad * 2);
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(' ');

  return (
    <svg width={width} height={height} role="img" aria-hidden="true">
      <polyline
        fill="none"
        stroke={theme.colors.primary.main}
        strokeWidth={2}
        strokeLinejoin="round"
        strokeLinecap="round"
        points={path}
      />
    </svg>
  );
};
