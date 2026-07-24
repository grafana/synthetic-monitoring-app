import { Field, FieldSparkline, FieldType, LoadingState, PanelData } from '@grafana/data';

import type { TrendSample } from './health/metricTrend';

export type SparklineYRange = { min: number; max: number };

export interface SparklinePoint {
  x: number;
  y: number;
}

export interface SparklineSample {
  at: number;
  value: number;
}

/** Fixed 0–1 scale so flat 100% ratio series sit at the top of the sparkline. */
export const RATIO_SPARKLINE_Y_RANGE: SparklineYRange = { min: 0, max: 1 };

function withSparklineRangeState(field: Field, fixedRange?: SparklineYRange): Field | null {
  let dataMin = Number.POSITIVE_INFINITY;
  let dataMax = Number.NEGATIVE_INFINITY;

  for (const value of field.values) {
    if (typeof value === 'number' && Number.isFinite(value)) {
      dataMin = Math.min(dataMin, value);
      dataMax = Math.max(dataMax, value);
    }
  }

  if (!Number.isFinite(dataMin) || !Number.isFinite(dataMax)) {
    return null;
  }

  const min = fixedRange?.min ?? dataMin;
  const max = fixedRange?.max ?? dataMax;

  // @grafana/ui Sparkline's getYRange destructures field.state.range and throws without it.
  return {
    ...field,
    state: {
      ...field.state,
      range: { min, max, delta: max - min },
    },
  };
}

export function selectSparklineSeries(data: PanelData, options?: { yRange?: SparklineYRange }): FieldSparkline | null {
  if (data.state === LoadingState.Error) {
    return null;
  }

  for (const frame of data.series) {
    const timeField = frame.fields.find((field) => field.type === FieldType.time);
    const numberField = frame.fields.find((field) => field.type === FieldType.number);

    if (!numberField || numberField.values.length < 2) {
      continue;
    }

    const y = withSparklineRangeState(numberField, options?.yRange);

    if (!y) {
      continue;
    }

    return {
      y,
      x: timeField,
      timeRange: data.timeRange,
    };
  }

  return null;
}

export function selectRatioSparklineSeries(data: PanelData): FieldSparkline | null {
  return selectSparklineSeries(data, { yRange: RATIO_SPARKLINE_Y_RANGE });
}

function valuesToArray(values: ArrayLike<unknown> | { toArray: () => unknown[] }): unknown[] {
  return typeof (values as { toArray?: () => unknown[] }).toArray === 'function'
    ? (values as { toArray: () => unknown[] }).toArray()
    : Array.from(values as ArrayLike<unknown>);
}

export function normalizeSparkline(
  sparkline: FieldSparkline,
  width: number,
  height: number,
  yMin: number,
  yMax: number,
  xRange?: { min: number; max: number }
): SparklinePoint[] {
  const samples = xRange
    ? getSparklineSamplesInTimeRange(sparkline, xRange)
    : getSparklineSamples(sparkline);
  const xMin =
    xRange?.min ?? samples.reduce((min, sample) => Math.min(min, sample.at), Number.POSITIVE_INFINITY);
  const xMax =
    xRange?.max ?? samples.reduce((max, sample) => Math.max(max, sample.at), Number.NEGATIVE_INFINITY);

  return samples.map(({ at, value }) => {
    const x = xMax === xMin ? width / 2 : ((at - xMin) / (xMax - xMin)) * width;
    const y = yMax === yMin ? height / 2 : height - ((value - yMin) / (yMax - yMin)) * height;

    return { x, y };
  });
}

export function getSparklineSamples(sparkline: FieldSparkline): SparklineSample[] {
  const values = valuesToArray(sparkline.y.values);
  const times = sparkline.x ? valuesToArray(sparkline.x.values) : values.map((_, index) => index);

  return values.flatMap<SparklineSample>((value, index) => {
    const at = times[index];

    if (typeof value !== 'number' || !Number.isFinite(value) || typeof at !== 'number' || !Number.isFinite(at)) {
      return [];
    }

    return [{ at, value }];
  });
}

/**
 * Display-series ranges are inclusive: samples at both selected endpoints are
 * visible. This differs from Prometheus window-end baseline buckets, which use
 * `(from, to]` because the timestamp describes the completed preceding window.
 */
export function getSparklineSamplesInTimeRange(
  sparkline: FieldSparkline,
  range?: { min: number; max: number }
): SparklineSample[] {
  const samples = getSparklineSamples(sparkline);
  const min = range?.min ?? sparkline.timeRange?.from.valueOf();
  const max = range?.max ?? sparkline.timeRange?.to.valueOf();

  if (
    typeof min !== 'number' ||
    typeof max !== 'number' ||
    !Number.isFinite(min) ||
    !Number.isFinite(max) ||
    max < min
  ) {
    return samples;
  }

  return samples.filter(({ at }) => at >= min && at <= max);
}

export function buildPolyline(points: SparklinePoint[]): string {
  return points.map(({ x, y }) => `${x},${y}`).join(' ');
}

export function panelDataToTrendSamples(data: PanelData): TrendSample[] {
  if (data.state === LoadingState.Error) {
    return [];
  }

  return data.series
    .flatMap<TrendSample>((frame) => {
      const timeField = frame.fields.find((field) => field.type === FieldType.time);
      const valueField = frame.fields.find((field) => field.type === FieldType.number);

      if (!timeField || !valueField) {
        return [];
      }

      const times = valuesToArray(timeField.values);
      const values = valuesToArray(valueField.values);

      return times.flatMap<TrendSample>((at, index) => {
        const value = values[index];

        return typeof at === 'number' &&
          Number.isFinite(at) &&
          typeof value === 'number' &&
          Number.isFinite(value)
          ? [{ at, value }]
          : [];
      });
    })
    .sort((left, right) => left.at - right.at);
}
