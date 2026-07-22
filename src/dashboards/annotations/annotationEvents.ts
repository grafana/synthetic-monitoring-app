import { DataFrame } from '@grafana/data';

export function annotationFramesToEvents(frames: DataFrame[]): number[][] {
  const frame = frames[0];

  if (!frame) {
    return [];
  }

  const timeStarts = frame.fields.find((field) => field.name.toLowerCase() === 'time')?.values ?? [];
  const timeEnds = frame.fields.find((field) => field.name.toLowerCase() === 'timeend')?.values ?? [];

  return timeStarts.map((timeStart, index) => [timeStart, timeEnds[index] ?? timeStart]);
}

export function mergeAnnotationFrames(framesByLayer: Record<string, DataFrame[]>): DataFrame[] {
  return Object.values(framesByLayer).flat();
}
