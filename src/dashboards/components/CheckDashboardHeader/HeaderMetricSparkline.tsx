import React, { useEffect, useRef, useState } from 'react';
import { FieldSparkline, GrafanaTheme2 } from '@grafana/data';
import { AxisPlacement, GraphDrawStyle, ScaleDirection, ScaleOrientation, VisibilityMode } from '@grafana/schema';
import { Sparkline, UPlotChart, UPlotConfigBuilder, useStyles2, useTheme2 } from '@grafana/ui';
import { css } from '@emotion/css';

import { HealthState } from './health/checkHealth.types';

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
  const usesComparisonRenderer = visual !== undefined && visual.kind !== 'summary-only';

  useEffect(() => {
    const element = containerRef.current;

    if (!element) {
      return;
    }

    let initialMeasurementFrame: number | undefined;
    const measureUntilReady = () => {
      const measuredWidth = Math.floor(element.getBoundingClientRect().width);

      if (measuredWidth > 0) {
        setWidth(measuredWidth);
        initialMeasurementFrame = undefined;
        return;
      }

      initialMeasurementFrame = requestAnimationFrame(measureUntilReady);
    };

    measureUntilReady();

    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];

      if (!entry) {
        return;
      }

      const measuredWidth = Math.floor(entry.contentRect.width);

      if (measuredWidth > 0) {
        setWidth(measuredWidth);

        if (initialMeasurementFrame !== undefined) {
          cancelAnimationFrame(initialMeasurementFrame);
          initialMeasurementFrame = undefined;
        }
      }
    });

    observer.observe(element);

    return () => {
      if (initialMeasurementFrame !== undefined) {
        cancelAnimationFrame(initialMeasurementFrame);
      }

      observer.disconnect();
    };
  }, [usesComparisonRenderer]);

  if (!usesComparisonRenderer) {
    return (
      <div aria-hidden className={styles.container} data-testid="header-metric-sparkline">
        <div className={styles.plot} data-testid="header-metric-sparkline-plot" ref={containerRef}>
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
      </div>
    );
  }

  const primaryFacet = createElapsedFacet(sparkline);
  const referenceFacet =
    visual.kind === 'overlay' ? createElapsedFacet(visual.series) : createAverageFacet(visual.value);
  const sharedValues = [...finiteFacetValues(primaryFacet), ...finiteFacetValues(referenceFacet)];
  const { min: yMin, max: yMax } = getComparisonYRange(sparkline, sharedValues);
  const plotData: ComparisonPlotData = [null, primaryFacet, referenceFacet];
  const plotConfig = createComparisonPlotConfig(theme, color, yMin, yMax);
  const comparisonLabel = `Current range compared to ${visual.label}`;

  return (
    <div aria-label={comparisonLabel} className={styles.container} data-testid="header-metric-sparkline" role="group">
      {width > 0 ? (
        <>
          <span className={styles.visuallyHidden}>{seriesDescription('Current range', primaryFacet, 'current')}</span>
          <span className={styles.visuallyHidden}>{seriesDescription(visual.label, referenceFacet, 'reference')}</span>
        </>
      ) : null}
      <div className={styles.plot} data-testid="header-metric-sparkline-plot" ref={containerRef}>
        {width > 0 ? <UPlotChart config={plotConfig} data={plotData} height={SPARKLINE_HEIGHT} width={width} /> : null}
      </div>
    </div>
  );
}

type ComparisonFacet = [number[], Array<number | null>];
type ComparisonPlotData = [null, ComparisonFacet, ComparisonFacet];

function createElapsedFacet(sparkline: FieldSparkline): ComparisonFacet {
  const values = valuesToArray(sparkline.y.values);
  const rawTimes = sparkline.x ? valuesToArray(sparkline.x.values) : values.map((_, index) => index);
  const timeRange = getFacetTimeRange(sparkline, rawTimes);
  const x: number[] = [];
  const y: Array<number | null> = [];

  values.forEach((value, index) => {
    const at = rawTimes[index];

    if (typeof at !== 'number' || !Number.isFinite(at) || at < timeRange.min || at > timeRange.max) {
      return;
    }

    x.push(timeRange.max === timeRange.min ? 0.5 : (at - timeRange.min) / (timeRange.max - timeRange.min));
    y.push(typeof value === 'number' && Number.isFinite(value) ? value : null);
  });

  return [x, y];
}

function createAverageFacet(value: number): ComparisonFacet {
  return [
    [0, 1],
    [value, value],
  ];
}

function finiteFacetValues([, values]: ComparisonFacet): number[] {
  return values.flatMap((value) => (typeof value === 'number' ? [value] : []));
}

function valuesToArray(values: ArrayLike<unknown> | { toArray: () => unknown[] }): unknown[] {
  return typeof (values as { toArray?: () => unknown[] }).toArray === 'function'
    ? (values as { toArray: () => unknown[] }).toArray()
    : Array.from(values as ArrayLike<unknown>);
}

function getFacetTimeRange(sparkline: FieldSparkline, rawTimes: unknown[]): { min: number; max: number } {
  const configuredMin = sparkline.timeRange?.from.valueOf();
  const configuredMax = sparkline.timeRange?.to.valueOf();

  if (
    typeof configuredMin === 'number' &&
    typeof configuredMax === 'number' &&
    Number.isFinite(configuredMin) &&
    Number.isFinite(configuredMax) &&
    configuredMax >= configuredMin
  ) {
    return { min: configuredMin, max: configuredMax };
  }

  const finiteTimes = rawTimes.filter((value): value is number => typeof value === 'number' && Number.isFinite(value));

  return finiteTimes.length > 0 ? { min: Math.min(...finiteTimes), max: Math.max(...finiteTimes) } : { min: 0, max: 0 };
}

function createComparisonPlotConfig(
  theme: GrafanaTheme2,
  currentColor: string,
  yMin: number,
  yMax: number
): UPlotConfigBuilder {
  const config = new UPlotConfigBuilder();
  const facets = [
    { scale: 'x', auto: false, sorted: 1 as const },
    { scale: 'y', auto: false },
  ];

  config.setMode(2);
  config.setCursor({ show: false, x: false, y: false });
  config.setPadding([0, 0, 0, 0]);
  config.addScale({
    scaleKey: 'x',
    orientation: ScaleOrientation.Horizontal,
    direction: ScaleDirection.Right,
    range: () => [0, 1],
  });
  config.addScale({
    scaleKey: 'y',
    orientation: ScaleOrientation.Vertical,
    direction: ScaleDirection.Up,
    range: () => [yMin, yMax],
  });
  config.addAxis({
    scaleKey: 'x',
    theme,
    placement: AxisPlacement.Hidden,
    show: false,
  });
  config.addAxis({
    scaleKey: 'y',
    theme,
    placement: AxisPlacement.Hidden,
    show: false,
  });
  config.addSeries({
    scaleKey: 'y',
    facets,
    theme,
    drawStyle: GraphDrawStyle.Line,
    fillOpacity: 20,
    lineColor: currentColor,
    lineWidth: 1.5,
    pxAlign: false,
    showPoints: VisibilityMode.Never,
  });
  config.addSeries({
    scaleKey: 'y',
    facets,
    theme,
    drawStyle: GraphDrawStyle.Line,
    fillOpacity: 0,
    lineColor: theme.colors.primary.text,
    lineStyle: { fill: 'dash', dash: [4, 3] },
    lineWidth: 1.5,
    pxAlign: false,
    showPoints: VisibilityMode.Never,
  });

  return config;
}

function getComparisonYRange(sparkline: FieldSparkline, values: number[]): { min: number; max: number } {
  const configuredMin = sparkline.y.config.min;
  const configuredMax = sparkline.y.config.max;
  const min =
    typeof configuredMin === 'number' && Number.isFinite(configuredMin)
      ? configuredMin
      : values.length > 0
        ? Math.min(...values)
        : 0;
  const max =
    typeof configuredMax === 'number' && Number.isFinite(configuredMax)
      ? configuredMax
      : values.length > 0
        ? Math.max(...values)
        : 0;

  return { min, max };
}

function seriesDescription(label: string, facet: ComparisonFacet, kind: 'current' | 'reference'): string {
  const pointCount = finiteFacetValues(facet).length;

  if (pointCount === 0) {
    return `${label}, no plottable samples`;
  }

  if (pointCount === 1) {
    return `${label}, ${kind === 'current' ? 'filled' : 'hollow'} point`;
  }

  return `${label}, ${kind === 'current' ? 'solid' : 'dashed'} line`;
}

const getStyles = (theme: GrafanaTheme2) => ({
  container: css({
    alignSelf: 'stretch',
    display: 'flex',
    flex: '1 1 0',
    flexDirection: 'column',
    gap: theme.spacing(1),
    minWidth: theme.spacing(10),
    width: '100%',
  }),
  plot: css({
    height: SPARKLINE_HEIGHT,
    minWidth: 0,
    width: '100%',
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
