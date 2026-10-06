import { DataFrame } from '@grafana/data';

/** Apply folder visibility to the joined table, including rows from metrics queries. */
export function filterChecksById(frames: DataFrame[], visibleIds: Set<string>): DataFrame[] {
  return frames.map((frame) => {
    const id = frame.fields.find((field) => field.name === 'id');
    const rows = Array.from({ length: frame.length }, (_, index) => index).filter(
      (index) => id && visibleIds.has(String(id.values[index]))
    );

    return {
      ...frame,
      length: rows.length,
      fields: frame.fields.map((field) => ({ ...field, values: rows.map((index) => field.values[index]) })),
    };
  });
}
