import { arrayToDataFrame, DataFrame, DataTopic } from '@grafana/data';

import { annotationFramesToEvents } from './annotationEvents';

/**
 * Prepare annotation frames for Grafana's timeseries AnnotationsPlugin:
 * - Coalesce Prometheus step samples into continuous regions (time + timeEnd)
 * - Use exact field names (`time` / `timeEnd`) the panel indexes as vals.time
 *
 * Without coalescing, each ALERTS scrape paints as its own tick ("shimmer").
 */
export function toTimeseriesAnnotationFrames(frames: DataFrame[]): DataFrame[] {
  return frames
    .map((frame) => coalesceFrameToTimeseriesAnnotation(frame))
    .filter((frame): frame is DataFrame => frame != null);
}

function coalesceFrameToTimeseriesAnnotation(frame: DataFrame): DataFrame | null {
  if (!Array.isArray(frame?.fields) || frame.fields.length === 0) {
    return null;
  }

  const regions = annotationFramesToEvents([frame]);

  if (regions.length === 0) {
    return null;
  }

  const color = readAnnotationColor(frame);
  const text = frame.name?.trim() || undefined;
  const events = regions.map(([time, timeEnd]) => ({
    time,
    timeEnd,
    isRegion: time !== timeEnd,
    ...(color ? { color } : {}),
    ...(text ? { text } : {}),
  }));

  const coalesced = arrayToDataFrame(events);

  return {
    ...coalesced,
    name: frame.name,
    refId: frame.refId,
    meta: {
      ...frame.meta,
      ...coalesced.meta,
      dataTopic: DataTopic.Annotations,
    },
  };
}

function readAnnotationColor(frame: DataFrame): string | undefined {
  const colorField = frame.fields.find((field) => field.name.toLowerCase() === 'color');
  const first = colorField?.values?.[0];

  return typeof first === 'string' && first.length > 0 ? first : undefined;
}
