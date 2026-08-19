import React from 'react';
import { Field, FieldSparkline, FieldType, getMinMaxAndDelta } from '@grafana/data';
import { FieldColorModeId } from '@grafana/schema';
import { Sparkline as GrafanaSparkline, useTheme2 } from '@grafana/ui';

interface SparklineProps {
  /** Prometheus range-vector samples: [unix seconds, value] pairs. */
  points: Array<[number, number]>;
  width?: number;
  height?: number;
}

/**
 * Adapter over @grafana/ui's Sparkline, which expects a pre-processed field:
 * y.state.range must be computed (its y-scale callback throws without it),
 * non-finite values must be nulled, and the x interval set. This mirrors the
 * preparation Grafana's own table SparklineCell does before rendering.
 */
export const Sparkline = ({ points, width = 120, height = 28 }: SparklineProps) => {
  const theme = useTheme2();

  // PromQL division can yield NaN (0/0) or Infinity (x/0) samples; null them
  // (rather than dropping them) so x and y stay aligned and gaps stay honest.
  const yValues = points.map(([, value]) => (Number.isFinite(value) ? value : null));
  const finiteCount = yValues.filter((value) => value !== null).length;

  if (finiteCount === 0) {
    return null;
  }

  // Grafana's Sparkline refuses to render fewer than two values — show a dot
  // rather than nothing so a young check still registers as "has data".
  if (finiteCount === 1) {
    return (
      // Decorative, like the full sparkline: the latency value next to it
      // carries the information.
      <svg width={width} height={height} aria-hidden="true">
        <circle cx={width / 2} cy={height / 2} r={3} fill={theme.colors.primary.main} />
      </svg>
    );
  }

  const y: Field = {
    name: 'latency',
    type: FieldType.number,
    values: yValues,
    config: {},
  };
  const range = getMinMaxAndDelta(y);
  y.config.min = range.min;
  y.config.max = range.max;
  y.state = { range };

  const x: Field = {
    name: 'time',
    type: FieldType.time,
    values: points.map(([time]) => time * 1000),
    config: points.length > 1 ? { interval: (points[1][0] - points[0][0]) * 1000 } : {},
  };

  const sparkline: FieldSparkline = { x, y };

  return (
    <GrafanaSparkline
      theme={theme}
      width={width}
      height={height}
      sparkline={sparkline}
      config={{
        color: { mode: FieldColorModeId.Fixed, fixedColor: theme.colors.primary.main },
        custom: { lineWidth: 1, fillOpacity: 0 },
      }}
    />
  );
};
