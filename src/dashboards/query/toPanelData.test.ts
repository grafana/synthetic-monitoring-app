import { FieldType, LoadingState } from '@grafana/data';
import { lastValueFrom } from 'rxjs';

import { createValueFrame } from './types';

import { applyTransforms } from './applyTransforms';
import { toPanelData } from './toPanelData';

describe('toPanelData', () => {
  it('returns partial data with warnings when target errors exist', () => {
    const panelData = toPanelData([
      {
        requestId: 'request-1',
        datasourceUid: 'prom-a',
        frames: [createValueFrame('A', 1)],
        errors: [{ refId: 'B', message: 'target failed' }],
      },
    ]);

    expect(panelData.state).toBe(LoadingState.Done);
    expect(panelData.series).toHaveLength(1);
    expect(panelData.errors?.[0]?.message).toBe('target failed');
  });

  it('returns a fatal error when no frames are available', () => {
    const panelData = toPanelData([
      {
        requestId: 'request-1',
        datasourceUid: 'prom-a',
        frames: [],
        fatalError: 'fatal failure',
      },
    ]);

    expect(panelData.state).toBe(LoadingState.Error);
    expect(panelData.error?.message).toBe('fatal failure');
  });
});

describe('applyTransforms', () => {
  it('returns cloned frames without mutating the source input', async () => {
    const source = [createValueFrame('A', 1)];
    const transformed = await lastValueFrom(
      applyTransforms(source, [], {
        interpolate: (value: string) => value,
      })
    );

    expect(transformed[0]).not.toBe(source[0]);
    expect(transformed[0]?.fields[0]?.values).toEqual([1]);
    expect(transformed[0]?.fields[0]?.type).toBe(FieldType.number);
  });
});
