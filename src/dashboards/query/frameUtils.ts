import { DataFrame } from '@grafana/data';

export function cloneFrame(frame: DataFrame): DataFrame {
  return {
    ...frame,
    fields: frame.fields.map((field) => ({
      ...field,
      values: Array.isArray(field.values) ? [...field.values] : field.values,
    })),
  };
}
