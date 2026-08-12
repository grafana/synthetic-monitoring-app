import { DataFrame, FieldType } from '@grafana/data';

import {
  annotationFramesToEvents,
  annotationFramesToNamedAlertEpisodes,
  coalesceAdjacentAnnotationEvents,
  getAlertEpisodeStateAt,
  mergeAnnotationFrames,
} from './annotationEvents';

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

  it('reads every frame returned by a grouped annotation query', () => {
    const frames: DataFrame[] = [
      {
        name: 'first alert',
        fields: [
          { name: 'Time', type: FieldType.time, config: {}, values: [1_000] },
          { name: 'Value', type: FieldType.number, config: {}, values: [1] },
        ],
        length: 1,
      },
      {
        name: 'second alert',
        fields: [
          { name: 'Time', type: FieldType.time, config: {}, values: [2_000] },
          { name: 'Value', type: FieldType.number, config: {}, values: [1] },
        ],
        length: 1,
      },
    ];

    expect(annotationFramesToEvents(frames)).toEqual([
      [1_000, 1_000],
      [2_000, 2_000],
    ]);
  });
});

describe('mergeAnnotationFrames', () => {
  it('preserves the layer color when merging raw annotation frames', () => {
    const [frame] = mergeAnnotationFrames(
      {
        'Show alerts firing': [
          {
            name: 'ALERTS',
            fields: [{ name: 'Time', type: FieldType.time, config: {}, values: [1_000] }],
            length: 1,
          },
        ],
      },
      { 'Show alerts firing': 'red' }
    );

    expect(frame?.meta?.custom?.annotationColor).toBe('red');
  });
});

describe('annotationFramesToNamedAlertEpisodes', () => {
  it('preserves the alertname label for each grouped series', () => {
    const frames: DataFrame[] = [
      {
        name: 'ALERTS',
        fields: [
          { name: 'Time', type: FieldType.time, config: {}, values: [1_000, 11_000] },
          {
            name: 'Value',
            type: FieldType.number,
            config: {},
            labels: { alertname: 'ProbeFailedExecutionsTooHigh' },
            values: [1, 1],
          },
        ],
        length: 2,
      },
      {
        name: 'ALERTS',
        fields: [
          { name: 'Time', type: FieldType.time, config: {}, values: [31_000, 41_000] },
          {
            name: 'Value',
            type: FieldType.number,
            config: {},
            labels: { alertname: 'HTTPRequestDurationTooHighAvg' },
            values: [1, 1],
          },
        ],
        length: 2,
      },
    ];

    expect(annotationFramesToNamedAlertEpisodes(frames)).toEqual([
      { alertName: 'ProbeFailedExecutionsTooHigh', from: 1_000, to: 11_000 },
      { alertName: 'HTTPRequestDurationTooHighAvg', from: 31_000, to: 41_000 },
    ]);
  });

  it('falls back to the frame name when the datasource omits alert labels', () => {
    const frame: DataFrame = {
      name: 'ProbeFailedExecutionsTooHigh',
      fields: [
        { name: 'Time', type: FieldType.time, config: {}, values: [1_000] },
        { name: 'Value', type: FieldType.number, config: {}, values: [1] },
      ],
      length: 1,
    };

    expect(annotationFramesToNamedAlertEpisodes([frame])).toEqual([
      { alertName: 'ProbeFailedExecutionsTooHigh', from: 1_000, to: 1_000 },
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

describe('getAlertEpisodeStateAt', () => {
  const alertName = 'ProbeFailedExecutionsTooHigh';

  it('treats an episode within the query-step tolerance as firing', () => {
    expect(getAlertEpisodeStateAt([{ alertName, from: 1_000, to: 1_900 }], alertName, 2_000, 200)).toBe('firing');
  });

  it('distinguishes resolved and absent episodes', () => {
    expect(getAlertEpisodeStateAt([{ alertName, from: 1_000, to: 1_500 }], alertName, 2_000, 200)).toBe('resolved');
    expect(getAlertEpisodeStateAt([], alertName, 2_000, 200)).toBe('none');
  });

  it('ignores episodes for other alerts and episodes that start after the evaluation point', () => {
    expect(
      getAlertEpisodeStateAt(
        [
          { alertName: 'HTTPRequestDurationTooHighAvg', from: 1_000, to: 2_000 },
          { alertName, from: 2_100, to: 2_500 },
        ],
        alertName,
        2_000,
        200
      )
    ).toBe('none');
  });
});
