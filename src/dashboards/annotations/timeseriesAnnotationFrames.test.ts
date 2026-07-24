import { FieldType } from '@grafana/data';

import { toTimeseriesAnnotationFrames } from './timeseriesAnnotationFrames';

describe('toTimeseriesAnnotationFrames', () => {
  it('coalesces prometheus step samples into a continuous region for the timeseries panel', () => {
    const frames = toTimeseriesAnnotationFrames([
      {
        name: 'Show alerts firing',
        length: 4,
        fields: [
          { name: 'Time', type: FieldType.time, config: {}, values: [1_000, 11_000, 21_000, 31_000] },
          { name: 'Value', type: FieldType.number, config: {}, values: [1, 1, 1, 1] },
        ],
      },
    ]);

    expect(frames).toHaveLength(1);
    expect(frames[0]?.fields.find((field) => field.name === 'time')?.values).toEqual([1_000]);
    expect(frames[0]?.fields.find((field) => field.name === 'timeEnd')?.values).toEqual([31_000]);
    expect(frames[0]?.fields.find((field) => field.name === 'isRegion')?.values).toEqual([true]);
  });

  it('keeps separate firing windows when samples are interrupted', () => {
    const frames = toTimeseriesAnnotationFrames([
      {
        name: 'Show alerts firing',
        length: 5,
        fields: [
          {
            name: 'Time',
            type: FieldType.time,
            config: {},
            values: [1_000, 11_000, 21_000, 121_000, 131_000],
          },
          { name: 'Value', type: FieldType.number, config: {}, values: [1, 1, 0, 1, 1] },
        ],
      },
    ]);

    expect(frames[0]?.fields.find((field) => field.name === 'time')?.values).toEqual([1_000, 121_000]);
    expect(frames[0]?.fields.find((field) => field.name === 'timeEnd')?.values).toEqual([11_000, 131_000]);
  });

  it('preserves already-formed regions and exact timeseries field names', () => {
    const frames = toTimeseriesAnnotationFrames([
      {
        name: 'alerts',
        length: 1,
        fields: [
          { name: 'time', type: FieldType.time, config: {}, values: [1_000] },
          { name: 'timeEnd', type: FieldType.time, config: {}, values: [50_000] },
          { name: 'isRegion', type: FieldType.boolean, config: {}, values: [true] },
          { name: 'color', type: FieldType.string, config: {}, values: ['red'] },
        ],
      },
    ]);

    expect(frames).toHaveLength(1);
    expect(frames[0]?.fields.find((field) => field.name === 'time')?.values).toEqual([1_000]);
    expect(frames[0]?.fields.find((field) => field.name === 'timeEnd')?.values).toEqual([50_000]);
    expect(frames[0]?.fields.find((field) => field.name === 'color')?.values).toEqual(['red']);
  });

  it('drops frames that cannot supply annotation times', () => {
    expect(
      toTimeseriesAnnotationFrames([
        {
          name: 'empty',
          length: 0,
          fields: [],
        },
        {
          name: 'no-time',
          length: 1,
          fields: [{ name: 'Value', type: FieldType.number, config: {}, values: [1] }],
        },
      ])
    ).toEqual([]);
  });
});
