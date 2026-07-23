import { DataFrame } from '@grafana/data';

function getFieldValues(frame: DataFrame, name: string): unknown[] {
  const values = frame.fields.find((field) => field.name.toLowerCase() === name)?.values;
  if (!values) {
    return [];
  }

  // Grafana Field.values may be a Vector; materialise to a plain array for indexing.
  return typeof (values as { toArray?: () => unknown[] }).toArray === 'function'
    ? (values as { toArray: () => unknown[] }).toArray()
    : Array.from(values as ArrayLike<unknown>);
}

function asUnixMs(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === 'string' && value !== '') {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }

  return null;
}

function isActiveAnnotationValue(value: unknown): boolean {
  if (value == null || value === false) {
    return false;
  }

  if (typeof value === 'number') {
    return value !== 0 && Number.isFinite(value);
  }

  if (typeof value === 'string') {
    return value !== '' && value !== '0' && value.toLowerCase() !== 'false';
  }

  return true;
}

/**
 * Merge consecutive instant annotation samples into ranges.
 * Prometheus ALERTS queries return one sample per step; Grafana's annotation
 * processor normally coalesces these into regions with timeEnd. When we receive
 * raw series (or processEvents is unavailable), do that merge here.
 */
export function coalesceAdjacentAnnotationEvents(events: number[][]): number[][] {
  if (events.length <= 1) {
    return events;
  }

  const sorted = [...events].sort((a, b) => a[0] - b[0]);

  // Preserve already-formed regions from a proper annotation processor.
  if (sorted.some(([from, to]) => from !== to)) {
    return sorted;
  }

  const maxGapMs = inferMaxGapMs(sorted);
  const regions: number[][] = [];
  let start = sorted[0][0];
  let end = sorted[0][1];

  for (let i = 1; i < sorted.length; i++) {
    const [from, to] = sorted[i];

    if (from - end <= maxGapMs) {
      end = Math.max(end, to);
      continue;
    }

    regions.push([start, end]);
    start = from;
    end = to;
  }

  regions.push([start, end]);
  return regions;
}

function inferMaxGapMs(sortedInstantEvents: number[][]): number {
  const deltas: number[] = [];

  for (let i = 1; i < sortedInstantEvents.length; i++) {
    const delta = sortedInstantEvents[i][0] - sortedInstantEvents[i - 1][0];
    if (delta > 0) {
      deltas.push(delta);
    }
  }

  if (deltas.length === 0) {
    return 60_000;
  }

  deltas.sort((a, b) => a - b);
  const median = deltas[Math.floor(deltas.length / 2)];

  // Allow a little jitter above the query step without bridging long quiet gaps.
  return Math.max(median * 2, 1_000);
}

function seriesSamplesToAnnotationRegions(times: unknown[], values: unknown[]): number[][] {
  const parsedTimes = times.map(asUnixMs);
  const activeTimes = parsedTimes.filter((time, index): time is number => {
    return time != null && isActiveAnnotationValue(values[index]);
  });

  // If every sample looks inactive, still treat timestamps as alert points.
  // Some prometheus annotation responses omit meaningful Value semantics.
  const timesForRegions =
    activeTimes.length > 0
      ? activeTimes
      : parsedTimes.filter((time): time is number => time != null);

  const maxGapMs = inferMaxGapMs(timesForRegions.map((time) => [time, time]));
  const regions: number[][] = [];
  let start: number | null = null;
  let end: number | null = null;
  let cursor = 0;

  for (let index = 0; index < times.length; index++) {
    const time = parsedTimes[index];
    if (time == null) {
      continue;
    }

    const active =
      activeTimes.length === 0 ? true : isActiveAnnotationValue(values[index]);

    if (!active) {
      if (start !== null && end !== null) {
        regions.push([start, end]);
        start = null;
        end = null;
      }
      continue;
    }

    if (start === null || end === null) {
      start = time;
      end = time;
      cursor = time;
      continue;
    }

    if (time - cursor > maxGapMs) {
      regions.push([start, end]);
      start = time;
      end = time;
      cursor = time;
      continue;
    }

    end = time;
    cursor = time;
  }

  if (start !== null && end !== null) {
    regions.push([start, end]);
  }

  return regions;
}

function getSeriesValueValues(frame: DataFrame): unknown[] {
  const namedValue = getFieldValues(frame, 'value');
  if (namedValue.length > 0) {
    return namedValue;
  }

  // Prometheus frames often name the value field after the metric, not "Value".
  const valueField = frame.fields.find((field) => {
    const name = field.name.toLowerCase();
    return name !== 'time' && name !== 'timeend' && field.type === 'number';
  });

  if (!valueField?.values) {
    return [];
  }

  return typeof (valueField.values as { toArray?: () => unknown[] }).toArray === 'function'
    ? (valueField.values as { toArray: () => unknown[] }).toArray()
    : Array.from(valueField.values as ArrayLike<unknown>);
}

function annotationFrameToEvents(frame: DataFrame): number[][] {
  const timeStarts = getFieldValues(frame, 'time');
  const timeEnds = getFieldValues(frame, 'timeend');
  const values = getSeriesValueValues(frame);
  const hasValueField = values.length > 0;
  const hasTimeEndField = frame.fields.some((field) => field.name.toLowerCase() === 'timeend');
  const hasRangeEnds =
    hasTimeEndField && timeEnds.some((timeEnd, index) => timeEnd != null && timeEnd !== timeStarts[index]);

  // Raw prometheus series (Time + Value, no region ends) need sample→region conversion.
  if (hasValueField && !hasRangeEnds) {
    return seriesSamplesToAnnotationRegions(timeStarts, values);
  }

  const events: number[][] = [];

  for (let index = 0; index < timeStarts.length; index++) {
    const timeStart = asUnixMs(timeStarts[index]);
    if (timeStart == null) {
      continue;
    }

    const timeEnd = asUnixMs(timeEnds[index]);
    events.push([timeStart, timeEnd ?? timeStart]);
  }

  return coalesceAdjacentAnnotationEvents(events);
}

export function annotationFramesToEvents(frames: DataFrame[]): number[][] {
  return frames.flatMap(annotationFrameToEvents);
}

export interface NamedAlertEpisode {
  alertName: string;
  from: number;
  to: number;
}

export type AlertEpisodeState = 'firing' | 'resolved' | 'none';

export function getAlertEpisodeStateAt(
  episodes: NamedAlertEpisode[],
  alertName: string,
  at: number,
  toleranceMs: number
): AlertEpisodeState {
  const relevant = episodes.filter(
    (episode) => episode.alertName === alertName && episode.from <= at
  );

  if (relevant.length === 0) {
    return 'none';
  }

  return relevant.some((episode) => episode.to + toleranceMs >= at) ? 'firing' : 'resolved';
}

function getFrameAlertName(frame: DataFrame): string | null {
  for (const field of frame.fields) {
    const alertName = field.labels?.alertname;
    if (typeof alertName === 'string' && alertName.length > 0) {
      return alertName;
    }
  }

  return frame.name?.trim() || null;
}

export function annotationFramesToNamedAlertEpisodes(frames: DataFrame[]): NamedAlertEpisode[] {
  return frames.flatMap((frame) => {
    const alertName = getFrameAlertName(frame);

    if (!alertName) {
      return [];
    }

    return annotationFrameToEvents(frame).map(([from, to]) => ({ alertName, from, to }));
  });
}

export function mergeAnnotationFrames(framesByLayer: Record<string, DataFrame[]>): DataFrame[] {
  return Object.values(framesByLayer).flat();
}
