import React, { useEffect, useRef, useState } from 'react';
import { FieldSparkline, GrafanaTheme2 } from '@grafana/data';
import { GraphDrawStyle, VisibilityMode } from '@grafana/schema';
import { Sparkline, useStyles2, useTheme2 } from '@grafana/ui';
import { css } from '@emotion/css';

import { HealthState } from './health/checkHealth.types';

import {
  buildPolyline,
  getSparklineSamplesInTimeRange,
  normalizeSparkline,
  SparklinePoint,
} from './headerMetricSparkline.utils';
import type { HeaderMetricComparisonVisual } from './useHeaderMetricComparison';

const SPARKLINE_HEIGHT = 36;

function getSparklineColor(theme: GrafanaTheme2, state?: HealthState): string {
  if (!state) {
    return theme.colors.text.secondary;
  }

  return {
    healthy: theme.colors.success.text,
    degraded: theme.colors.warning.text,
    unhealthy: theme.colors.error.text,
    unknown: theme.colors.text.primary,
  }[state];
}

export function HeaderMetricSparkline({
  sparkline,
  state,
  visual,
}: {
  sparkline: FieldSparkline;
  state?: HealthState;
  visual?: HeaderMetricComparisonVisual;
}) {
  const styles = useStyles2(getStyles);
  const theme = useTheme2();
  const color = getSparklineColor(theme, state);
  const containerRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);

  useEffect(() => {
    const element = containerRef.current;

    if (!element) {
      return;
    }

    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];

      if (!entry) {
        return;
      }

      setWidth(Math.floor(entry.contentRect.width));
    });

    observer.observe(element);

    return () => observer.disconnect();
  }, []);

  if (!visual || visual.kind === 'summary-only') {
    return (
      <div aria-hidden className={styles.container} data-testid="header-metric-sparkline" ref={containerRef}>
        {width > 0 ? (
          <Sparkline
            height={SPARKLINE_HEIGHT}
            sparkline={sparkline}
            theme={theme}
            width={width}
            config={{
              color: { mode: 'fixed', fixedColor: color },
              custom: {
                drawStyle: GraphDrawStyle.Line,
                fillOpacity: 20,
                lineWidth: 1.5,
                showPoints: VisibilityMode.Never,
              },
            }}
          />
        ) : null}
      </div>
    );
  }

  const referenceValues =
    visual.kind === 'overlay'
      ? getSparklineSamplesInTimeRange(visual.series).map(({ value }) => value)
      : [visual.lower, visual.upper].filter((value) => Number.isFinite(value));
  const sharedValues = [
    ...getSparklineSamplesInTimeRange(sparkline).map(({ value }) => value),
    ...referenceValues,
  ];
  const yMin = sharedValues.length > 0 ? Math.min(...sharedValues) : 0;
  const yMax = sharedValues.length > 0 ? Math.max(...sharedValues) : 0;
  const primaryPoints = normalizeSparkline(
    sparkline,
    width,
    SPARKLINE_HEIGHT,
    yMin,
    yMax,
    getTimeDomain(sparkline)
  );
  const referencePoints =
    visual.kind === 'overlay'
      ? normalizeSparkline(
          visual.series,
          width,
          SPARKLINE_HEIGHT,
          yMin,
          yMax,
          getTimeDomain(visual.series)
        )
      : [];
  const comparisonLabel =
    visual.kind === 'normal-band'
      ? 'Current range with Normal band'
      : `Current range compared with ${visual.label}`;

  return (
    <div
      aria-label={comparisonLabel}
      className={styles.container}
      data-testid="header-metric-sparkline"
      ref={containerRef}
      role="group"
    >
      {width > 0 ? (
        <>
          <span className={styles.visuallyHidden}>{seriesDescription('Current range', primaryPoints, 'current')}</span>
          <span className={styles.visuallyHidden}>
            {visual.kind === 'normal-band'
              ? `${visual.label} band`
              : seriesDescription(visual.label, referencePoints, 'reference')}
          </span>
          <svg
            aria-hidden
            className={styles.svg}
            focusable="false"
            height={SPARKLINE_HEIGHT}
            viewBox={`0 0 ${width} ${SPARKLINE_HEIGHT}`}
            width="100%"
          >
            {visual.kind === 'normal-band' ? (
              <NormalBand
                height={SPARKLINE_HEIGHT}
                label={visual.label}
                lower={visual.lower}
                mutedColor={theme.colors.text.secondary}
                sparkline={sparkline}
                upper={visual.upper}
                width={width}
                yMax={yMax}
                yMin={yMin}
              />
            ) : (
              <SeriesMark
                color={theme.colors.text.secondary}
                kind="reference"
                points={referencePoints}
              />
            )}
            <SeriesMark color={color} kind="current" points={primaryPoints} />
          </svg>
          {visual.kind === 'overlay' ? (
            <div
              aria-hidden
              className={styles.legend}
              data-testid="header-metric-comparison-legend"
            >
              <LegendItem
                color={color}
                label="Current range"
                lineStyle="solid"
                styles={styles}
                testId="header-metric-current-legend-line"
              />
              <LegendItem
                color={theme.colors.text.secondary}
                label={visual.label}
                lineStyle="dashed"
                styles={styles}
                testId="header-metric-reference-legend-line"
              />
            </div>
          ) : null}
        </>
      ) : null}
    </div>
  );
}

function getTimeDomain(sparkline: FieldSparkline): { min: number; max: number } | undefined {
  const min = sparkline.timeRange?.from.valueOf();
  const max = sparkline.timeRange?.to.valueOf();

  return typeof min === 'number' &&
    typeof max === 'number' &&
    Number.isFinite(min) &&
    Number.isFinite(max) &&
    max > min
    ? { min, max }
    : undefined;
}

function LegendItem({
  color,
  label,
  lineStyle,
  styles,
  testId,
}: {
  color: string;
  label: string;
  lineStyle: 'solid' | 'dashed';
  styles: ReturnType<typeof getStyles>;
  testId: string;
}) {
  return (
    <span className={styles.legendItem}>
      <span
        className={styles.legendLine}
        data-line-style={lineStyle}
        data-testid={testId}
        style={{
          borderTopColor: color,
          borderTopStyle: lineStyle,
        }}
      />
      <span className={styles.legendLabel} title={label}>
        {label}
      </span>
    </span>
  );
}

function SeriesMark({
  color,
  kind,
  points,
}: {
  color: string;
  kind: 'current' | 'reference';
  points: SparklinePoint[];
}) {
  if (points.length === 0) {
    return null;
  }

  if (points.length === 1) {
    const [point] = points;

    return (
      <circle
        cx={point!.x}
        cy={point!.y}
        data-testid={`header-metric-${kind}-point`}
        fill={kind === 'current' ? color : 'none'}
        r={2.5}
        stroke={kind === 'reference' ? color : 'none'}
        strokeWidth={1.5}
        vectorEffect="non-scaling-stroke"
      />
    );
  }

  return (
    <polyline
      data-testid={`header-metric-${kind}-line`}
      fill="none"
      points={buildPolyline(points)}
      stroke={color}
      strokeDasharray={kind === 'reference' ? '4 3' : undefined}
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={1.5}
      vectorEffect="non-scaling-stroke"
    />
  );
}

function seriesDescription(
  label: string,
  points: SparklinePoint[],
  kind: 'current' | 'reference'
): string {
  if (points.length === 0) {
    return `${label}, no plottable samples`;
  }

  if (points.length === 1) {
    return `${label}, ${kind === 'current' ? 'filled' : 'hollow'} point`;
  }

  return `${label}, ${kind === 'current' ? 'solid' : 'dashed'} line`;
}

function NormalBand({
  height,
  label,
  lower,
  mutedColor,
  sparkline,
  upper,
  width,
  yMax,
  yMin,
}: {
  height: number;
  label: string;
  lower: number;
  mutedColor: string;
  sparkline: FieldSparkline;
  upper: number;
  width: number;
  yMax: number;
  yMin: number;
}) {
  const bandSparkline: FieldSparkline = {
    ...sparkline,
    x: undefined,
    y: {
      ...sparkline.y,
      name: label,
      values: [upper, lower],
    },
  };
  const [upperPoint, lowerPoint] = normalizeSparkline(bandSparkline, width, height, yMin, yMax);

  if (!upperPoint || !lowerPoint) {
    return null;
  }

  const rawTop = Math.min(upperPoint.y, lowerPoint.y);
  const rawBottom = Math.max(upperPoint.y, lowerPoint.y);
  const bandHeight = Math.min(height, Math.max(2, rawBottom - rawTop));
  const center = (rawTop + rawBottom) / 2;
  const y = Math.max(0, Math.min(height - bandHeight, center - bandHeight / 2));

  return (
    <rect
      data-testid="header-metric-normal-band"
      fill={mutedColor}
      fillOpacity={0.18}
      height={bandHeight}
      width={width}
      x={0}
      y={y}
    />
  );
}

const getStyles = (theme: GrafanaTheme2) => ({
  container: css({
    alignSelf: 'center',
    // Claim leftover row space so ResizeObserver gets a real width (not just minWidth).
    flex: '1 1 0',
    height: SPARKLINE_HEIGHT,
    minWidth: theme.spacing(10),
    position: 'relative',
    width: '100%',
  }),
  svg: css({
    display: 'block',
    height: SPARKLINE_HEIGHT,
    overflow: 'visible',
    width: '100%',
  }),
  legend: css({
    alignItems: 'center',
    bottom: 0,
    color: theme.colors.text.secondary,
    display: 'flex',
    fontSize: theme.typography.bodySmall.fontSize,
    gap: theme.spacing(1),
    justifyContent: 'flex-start',
    left: 0,
    lineHeight: 1,
    maxWidth: '100%',
    overflow: 'hidden',
    position: 'absolute',
    whiteSpace: 'nowrap',
  }),
  legendItem: css({
    alignItems: 'center',
    display: 'inline-flex',
    flex: '0 1 auto',
    gap: theme.spacing(0.5),
    minWidth: 0,
  }),
  legendLabel: css({
    minWidth: 0,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  }),
  legendLine: css({
    borderTopWidth: 1.5,
    display: 'inline-block',
    flex: '0 0 auto',
    width: theme.spacing(1.5),
  }),
  visuallyHidden: css({
    border: 0,
    clip: 'rect(0 0 0 0)',
    height: theme.spacing(0.125),
    margin: theme.spacing(-0.125),
    overflow: 'hidden',
    padding: 0,
    position: 'absolute',
    whiteSpace: 'nowrap',
    width: theme.spacing(0.125),
  }),
});
