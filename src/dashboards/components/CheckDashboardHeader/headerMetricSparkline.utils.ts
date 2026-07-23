import { Field, FieldSparkline, FieldType, LoadingState, PanelData } from '@grafana/data';

import type { TrendSample } from './health/metricTrend';

function withSparklineRangeState(field: Field): Field | null {
  let min = Number.POSITIVE_INFINITY;
  let max = Number.NEGATIVE_INFINITY;

  for (const value of field.values) {
    if (typeof value === 'number' && Number.isFinite(value)) {
      min = Math.min(min, value);
      max = Math.max(max, value);
    }
  }

  if (!Number.isFinite(min) || !Number.isFinite(max)) {
    return null;
  }

  // @grafana/ui Sparkline's getYRange destructures field.state.range and throws without it.
  return {
    ...field,
    state: {
      ...field.state,
      range: { min, max, delta: max - min },
    },
  };
}

export function selectSparklineSeries(data: PanelData): FieldSparkline | null {
  if (data.state === LoadingState.Error) {
    return null;
  }

  for (const frame of data.series) {
    const timeField = frame.fields.find((field) => field.type === FieldType.time);
    const numberField = frame.fields.find((field) => field.type === FieldType.number);

    if (!numberField || numberField.values.length < 2) {
      continue;
    }

    const y = withSparklineRangeState(numberField);

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

function valuesToArray(values: ArrayLike<unknown> | { toArray: () => unknown[] }): unknown[] {
  return typeof (values as { toArray?: () => unknown[] }).toArray === 'function'
    ? (values as { toArray: () => unknown[] }).toArray()
    : Array.from(values as ArrayLike<unknown>);
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
