import { DataFrame, FieldType } from '@grafana/data';

import { annotationFramesToEvents } from './annotationEvents';

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
      fields: [{ name: 'Time', type: FieldType.time, config: {}, values: [1, 3] }],
      length: 2,
    };

    expect(annotationFramesToEvents([frame])).toEqual([
      [1, 1],
      [3, 3],
    ]);
  });
});
