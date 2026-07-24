import { type ExplicitComparisonReferenceSpec } from './comparisonReference.types';

import {
  resolveComparisonReference,
  setLockedCustomBoundary,
} from './resolveComparisonReference';

const primary = {
  from: Date.parse('2026-07-09T08:00:00.000Z'),
  to: Date.parse('2026-07-09T11:00:00.000Z'),
};

describe('resolveComparisonReference', () => {
  it('accepts only explicit comparison reference specs', () => {
    const spec: ExplicitComparisonReferenceSpec = { kind: 'previous' };

    expect(resolveComparisonReference(spec, primary, 'utc')).toMatchObject({ status: 'valid' });

    if (false) {
      // @ts-expect-error Automatic comparison must resolve to an explicit reference before range resolution.
      resolveComparisonReference({ kind: 'auto' }, primary, 'utc');
    }
  });

  it.each([
    [
      { kind: 'previous' } as const,
      {
        status: 'valid',
        range: {
          from: Date.parse('2026-07-09T05:00:00.000Z'),
          to: Date.parse('2026-07-09T08:00:00.000Z'),
        },
        equalDuration: true,
      },
    ],
    [
      { kind: 'baseline', presetId: '14d' } as const,
      {
        status: 'valid',
        range: {
          from: Date.parse('2026-06-25T08:00:00.000Z'),
          to: Date.parse('2026-07-09T08:00:00.000Z'),
        },
        equalDuration: false,
      },
    ],
    [
      { kind: 'shifted', presetId: '7d' } as const,
      {
        status: 'valid',
        range: {
          from: Date.parse('2026-07-02T08:00:00.000Z'),
          to: Date.parse('2026-07-02T11:00:00.000Z'),
        },
        equalDuration: true,
      },
    ],
    [
      {
        kind: 'custom',
        from: '2026-07-09T05:00:00.000Z',
        to: '2026-07-09T08:00:00.000Z',
        matchPrimaryDuration: true,
      } as const,
      { status: 'valid', equalDuration: true },
    ],
  ])('resolves %o references', (spec, expected) => {
    expect(resolveComparisonReference(spec, primary, 'utc')).toMatchObject(expected);
  });

  it('rejects a custom reference that overlaps the primary range', () => {
    expect(
      resolveComparisonReference(
        {
          kind: 'custom',
          from: '2026-07-09T07:59:59.999Z',
          to: '2026-07-09T09:00:00.000Z',
          matchPrimaryDuration: false,
        },
        primary,
        'utc'
      )
    ).toEqual({ status: 'invalid', reason: 'overlaps-primary' });
  });

  it.each([
    ['ends at the primary start', '2026-07-09T05:00:00.000Z', '2026-07-09T08:00:00.000Z'],
    ['starts at the primary end', '2026-07-09T11:00:00.000Z', '2026-07-09T14:00:00.000Z'],
  ])('accepts a custom reference that %s', (_description, from, to) => {
    expect(
      resolveComparisonReference(
        { kind: 'custom', from, to, matchPrimaryDuration: false },
        primary,
        'utc'
      )
    ).toMatchObject({ status: 'valid' });
  });

  it('rejects an unknown shifted preset', () => {
    expect(resolveComparisonReference({ kind: 'shifted', presetId: 'missing' }, primary, 'utc')).toEqual({
      status: 'invalid',
      reason: 'unknown-preset',
    });
  });

  it('rejects an unknown baseline preset', () => {
    expect(resolveComparisonReference({ kind: 'baseline', presetId: 'missing' }, primary, 'utc')).toEqual({
      status: 'invalid',
      reason: 'unknown-preset',
    });
  });

  it.each([
    ['invalid timestamp', 'not-a-timestamp', '2026-07-09T08:00:00.000Z'],
    ['reversed range', '2026-07-09T08:00:00.000Z', '2026-07-09T05:00:00.000Z'],
  ])('rejects a custom reference with an %s', (_description, from, to) => {
    expect(
      resolveComparisonReference(
        { kind: 'custom', from, to, matchPrimaryDuration: false },
        primary,
        'utc'
      )
    ).toEqual({ status: 'invalid', reason: 'invalid-range' });
  });

  it('locks the custom end when its start boundary changes', () => {
    expect(
      setLockedCustomBoundary({
        boundary: 'from',
        value: 200,
        primaryDurationMs: 50,
        current: { from: 100, to: 150 },
      })
    ).toEqual({ from: 200, to: 250 });
  });

  it('locks the custom start when its end boundary changes', () => {
    expect(
      setLockedCustomBoundary({
        boundary: 'to',
        value: 200,
        primaryDurationMs: 50,
        current: { from: 100, to: 150 },
      })
    ).toEqual({ from: 150, to: 200 });
  });
});
