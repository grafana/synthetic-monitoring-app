import { DataFrame, FieldType } from '@grafana/data';

import { annotationFramesToEvents, coalesceAdjacentAnnotationEvents } from './annotationEvents';

describe('annotationFramesToEvents', () => {
  it('maps time and timeEnd fields to event ranges', () => {
    const frame: DataFrame = {
      name: 'annotations',
      refId: 'Anno',
      fields: [
        { name: 'time', type: FieldType.time, config: {}, values: [1, 3] },
        { name: 'timeEnd', type: FieldType.time, config: {}, values: [2, 4] },
      ],
      length: 2,
    };

    expect(annotationFramesToEvents([frame])).toEqual([
      [1, 2],
      [3, 4],
    ]);
  });

  it('accepts datasource time fields with Grafana title casing', () => {
    const frame: DataFrame = {
      name: 'annotations',
      refId: 'Anno',
      fields: [
        { name: 'Time', type: FieldType.time, config: {}, values: [1_000, 11_000, 21_000] },
        { name: 'Value', type: FieldType.number, config: {}, values: [1, 1, 1] },
      ],
      length: 3,
    };

    expect(annotationFramesToEvents([frame])).toEqual([[1_000, 21_000]]);
  });

  it('skips inactive prometheus samples when coalescing series into regions', () => {
    const frame: DataFrame = {
      name: 'annotations',
      refId: 'Anno',
      fields: [
        { name: 'Time', type: FieldType.time, config: {}, values: [1_000, 11_000, 21_000, 31_000, 41_000] },
        { name: 'Value', type: FieldType.number, config: {}, values: [1, 1, 0, 1, 1] },
      ],
      length: 5,
    };

    expect(annotationFramesToEvents([frame])).toEqual([
      [1_000, 11_000],
      [31_000, 41_000],
    ]);
  });
});

describe('coalesceAdjacentAnnotationEvents', () => {
  it('merges consecutive instant samples into a single region', () => {
    expect(
      coalesceAdjacentAnnotationEvents([
        [1_000, 1_000],
        [11_000, 11_000],
        [21_000, 21_000],
      ])
    ).toEqual([[1_000, 21_000]]);
  });

  it('keeps separate firing windows when the gap exceeds the inferred step', () => {
    expect(
      coalesceAdjacentAnnotationEvents([
        [1_000, 1_000],
        [11_000, 11_000],
        [121_000, 121_000],
        [131_000, 131_000],
      ])
    ).toEqual([
      [1_000, 11_000],
      [121_000, 131_000],
    ]);
  });

  it('does not rewrite events that already have distinct range ends', () => {
    expect(
      coalesceAdjacentAnnotationEvents([
        [1_000, 50_000],
        [60_000, 90_000],
      ])
    ).toEqual([
      [1_000, 50_000],
      [60_000, 90_000],
    ]);
  });
});
