import { DataFrame } from '@grafana/data';

export function toTimeSeries(data: DataFrame[], labelSelector: (frame: DataFrame) => string) {
  return data.reduce<Record<string, Array<[number, number]>>>((acc, frame) => {
    const label = labelSelector(frame);
    const fields = frame.fields;
    const timeValues = fields.find((field) => field.name === 'Time')?.values;
    const valueValues = fields.find((field) => field.name === 'Value')?.values;

    if (!timeValues || !valueValues) {
      return acc;
    }

    const timeseries = timeValues.map((time, index) => {
      return [time, valueValues[index]];
    }) as Array<[number, number]>;

    acc[label] = timeseries;

    return acc;
  }, {});
}
