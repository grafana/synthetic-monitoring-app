import { dateTimeFormat, FieldType, LoadingState, PanelData } from '@grafana/data';

export function selectNumericValue(data: PanelData, refId?: string): number | null {
  if (data.state === LoadingState.Error) {
    return null;
  }

  const frames = refId ? data.series.filter((frame) => frame.refId === refId) : data.series;

  for (let frameIndex = frames.length - 1; frameIndex >= 0; frameIndex--) {
    const frame = frames[frameIndex]!;

    for (let fieldIndex = frame.fields.length - 1; fieldIndex >= 0; fieldIndex--) {
      const field = frame.fields[fieldIndex]!;

      if (field.type !== FieldType.number) {
        continue;
      }

      for (let valueIndex = field.values.length - 1; valueIndex >= 0; valueIndex--) {
        const value = field.values[valueIndex];

        if (typeof value === 'number' && Number.isFinite(value)) {
          return value;
        }
      }
    }
  }

  return null;
}

export function formatPercent(value: number | null): string {
  return value === null ? 'N/A' : `${(value * 100).toFixed(2)}%`;
}

export function formatSeconds(value: number | null): string {
  return value === null ? 'N/A' : `${value.toFixed(2)} s`;
}

export function formatDateFromNow(secondsFromNow: number | null, now = Date.now()): string | undefined {
  return secondsFromNow === null
    ? undefined
    : dateTimeFormat(now + secondsFromNow * 1000, { format: 'yyyy-MM-DD' });
}
