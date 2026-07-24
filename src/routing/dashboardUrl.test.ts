import { type ComparisonReferenceSpec } from 'dashboards/comparison/comparisonReference.types';

import {
  mergeDashboardUrlState,
  normalizeDashboardUrl,
  parseDashboardUrl,
  serializeDashboardUrl,
  serializeLegacyDashboardUrl,
  withDashboardUrlState,
  withLegacyDashboardUrlState,
} from './dashboardUrl';
import {
  DASHBOARD_URL_KEYS,
  LEGACY_SCENE_DASHBOARD_KEYS,
} from './dashboardUrlSchema';

describe('dashboardUrl', () => {
  it('round-trips canonical dashboard state', () => {
    const state = {
      version: 1 as const,
      from: 'now-3h',
      to: 'now',
      timezone: 'utc',
      refresh: '30s',
      probes: ['frankfurt', 'ohio'],
    };

    const serialized = serializeDashboardUrl(state);
    const parsed = parseDashboardUrl(serialized);

    expect(parsed).toEqual({ ok: true, state });
  });

  it.each<ComparisonReferenceSpec>([
    { kind: 'auto' },
    { kind: 'previous' },
    { kind: 'baseline', presetId: '14d' },
    { kind: 'shifted', presetId: 'future-preset-id' },
    {
      kind: 'custom',
      from: '2026-06-01T08:00:00.000Z',
      to: '2026-06-01T11:00:00.000Z',
      matchPrimaryDuration: false,
    },
  ])('round-trips canonical comparison state: %o', (comparison) => {
    const serialized = serializeDashboardUrl({
      version: 1,
      from: 'now-3h',
      to: 'now',
      comparison,
    });

    expect(parseDashboardUrl(serialized)).toEqual({
      ok: true,
      state: {
        version: 1,
        from: 'now-3h',
        to: 'now',
        comparison,
      },
    });
  });

  it('migrates the retired Normal comparison URL to automatic selection', () => {
    expect(parseDashboardUrl(new URLSearchParams('sm-v=1&sm-compare=normal'))).toEqual({
      ok: true,
      state: {
        version: 1,
        comparison: { kind: 'auto' },
      },
    });
  });

  it.each(['14d', '21d', '30d'])(
    'migrates the retired %s shifted comparison to a normal baseline',
    (presetId) => {
      expect(
        parseDashboardUrl(
          new URLSearchParams(`sm-v=1&sm-compare=shifted&sm-compare-preset=${presetId}`)
        )
      ).toEqual({
        ok: true,
        state: {
          version: 1,
          comparison: { kind: 'baseline', presetId },
        },
      });
    }
  );

  it('preserves unrelated query parameters', () => {
    const existing = new URLSearchParams('foo=bar&sm-from=now-1h');
    const serialized = serializeDashboardUrl(
      {
        version: 1,
        from: 'now-3h',
        to: 'now',
      },
      existing
    );

    expect(serialized.get('foo')).toBe('bar');
    expect(serialized.get(DASHBOARD_URL_KEYS.from)).toBe('now-3h');
  });

  it('strips legacy Scene query parameters from canonical URLs', () => {
    const existing = new URLSearchParams(
      [
        'foo=bar',
        `${LEGACY_SCENE_DASHBOARD_KEYS.from}=now-6h`,
        `${LEGACY_SCENE_DASHBOARD_KEYS.to}=now`,
        `${LEGACY_SCENE_DASHBOARD_KEYS.probe}=frankfurt`,
        `${LEGACY_SCENE_DASHBOARD_KEYS.job}=example-job`,
        `${LEGACY_SCENE_DASHBOARD_KEYS.instance}=https://example.com`,
        `${LEGACY_SCENE_DASHBOARD_KEYS.time}=2024-01-01T12:00:00.000Z`,
        `${LEGACY_SCENE_DASHBOARD_KEYS.timeWindow}=1h`,
      ].join('&')
    );
    const serialized = serializeDashboardUrl(
      {
        version: 1,
        from: 'now-3h',
        to: 'now',
      },
      existing
    );

    expect(serialized.get('foo')).toBe('bar');
    expect(serialized.get(DASHBOARD_URL_KEYS.from)).toBe('now-3h');
    expect(serialized.get(LEGACY_SCENE_DASHBOARD_KEYS.from)).toBeNull();
    expect(serialized.get(LEGACY_SCENE_DASHBOARD_KEYS.to)).toBeNull();
    expect(serialized.get(LEGACY_SCENE_DASHBOARD_KEYS.probe)).toBeNull();
    expect(serialized.get(LEGACY_SCENE_DASHBOARD_KEYS.job)).toBeNull();
    expect(serialized.get(LEGACY_SCENE_DASHBOARD_KEYS.instance)).toBeNull();
    expect(serialized.get(LEGACY_SCENE_DASHBOARD_KEYS.time)).toBeNull();
    expect(serialized.get(LEGACY_SCENE_DASHBOARD_KEYS.timeWindow)).toBeNull();
  });

  it('preserves repeated probe order', () => {
    const serialized = serializeDashboardUrl({
      version: 1,
      probes: ['singapore', 'frankfurt', 'singapore'],
    });

    expect(serialized.getAll(DASHBOARD_URL_KEYS.probe)).toEqual(['singapore', 'frankfurt', 'singapore']);
  });

  it('treats absent version as version one', () => {
    const params = new URLSearchParams(`${DASHBOARD_URL_KEYS.from}=now-6h`);

    expect(parseDashboardUrl(params)).toEqual({
      ok: true,
      state: {
        version: 1,
        from: 'now-6h',
      },
    });
  });

  it('returns unsupported-version without rewriting unknown sm-* state', () => {
    const params = new URLSearchParams(`${DASHBOARD_URL_KEYS.version}=99&${DASHBOARD_URL_KEYS.from}=now-1h&foo=bar`);

    expect(parseDashboardUrl(params)).toEqual({
      ok: false,
      reason: 'unsupported-version',
      version: '99',
    });
    expect(normalizeDashboardUrl(params).toString()).toBe(params.toString());
  });

  it('serializes legacy dashboard keys for Scene compatibility', () => {
    const params = serializeLegacyDashboardUrl({
      version: 1,
      from: 'now-3h',
      to: 'now',
      probes: ['frankfurt'],
    });

    expect(params.get(LEGACY_SCENE_DASHBOARD_KEYS.from)).toBe('now-3h');
    expect(params.get(LEGACY_SCENE_DASHBOARD_KEYS.to)).toBe('now');
    expect(params.getAll(LEGACY_SCENE_DASHBOARD_KEYS.probe)).toEqual(['frankfurt']);
    expect(params.get(DASHBOARD_URL_KEYS.from)).toBeNull();
  });

  it('builds canonical and legacy dashboard URLs', () => {
    const state = {
      version: 1 as const,
      from: 'now-3h',
      to: 'now',
    };

    expect(withDashboardUrlState('/checks/1', state)).toBe('/checks/1?sm-v=1&sm-from=now-3h&sm-to=now');
    expect(withLegacyDashboardUrlState('/checks/1', state)).toBe('/checks/1?from=now-3h&to=now');
  });

  it('merges dashboard state patches without dropping version', () => {
    expect(
      mergeDashboardUrlState(
        {
          version: 1,
          from: 'now-3h',
          probes: ['frankfurt'],
        },
        { to: 'now' }
      )
    ).toEqual({
      version: 1,
      from: 'now-3h',
      to: 'now',
      probes: ['frankfurt'],
    });
  });

  it('allows clearing probe filters via an empty probes patch', () => {
    expect(
      mergeDashboardUrlState(
        {
          version: 1,
          from: 'now-3h',
          probes: ['frankfurt'],
        },
        { probes: [] }
      )
    ).toEqual({
      version: 1,
      from: 'now-3h',
      probes: [],
    });
  });

  it('preserves existing probe params when serializing time-only state', () => {
    const existing = new URLSearchParams('sm-v=1&sm-from=now-3h&sm-probe=frankfurt&sm-probe=ohio');
    const serialized = serializeDashboardUrl(
      {
        version: 1,
        from: 'now-6h',
        to: 'now',
      },
      existing
    );

    expect(serialized.get(DASHBOARD_URL_KEYS.from)).toBe('now-6h');
    expect(serialized.getAll(DASHBOARD_URL_KEYS.probe)).toEqual(['frankfurt', 'ohio']);
  });

  it('preserves existing comparison params when serializing a time-only state', () => {
    const existing = new URLSearchParams('sm-v=1&sm-from=now-3h&sm-compare=shifted&sm-compare-preset=future-preset-id');
    const serialized = serializeDashboardUrl(
      {
        version: 1,
        from: 'now-6h',
        to: 'now',
        comparison: undefined,
      },
      existing
    );

    expect(serialized.get(DASHBOARD_URL_KEYS.comparison)).toBe('shifted');
    expect(serialized.get(DASHBOARD_URL_KEYS.comparisonPreset)).toBe('future-preset-id');
  });

  it('clears all comparison params when comparison is null', () => {
    const existing = new URLSearchParams(
      'sm-v=1&sm-compare=custom&sm-compare-from=2026-06-01T08%3A00%3A00.000Z&sm-compare-to=2026-06-01T11%3A00%3A00.000Z&sm-compare-match-duration=0'
    );
    const serialized = serializeDashboardUrl({ version: 1, comparison: null }, existing);

    expect(serialized.get(DASHBOARD_URL_KEYS.comparison)).toBeNull();
    expect(serialized.get(DASHBOARD_URL_KEYS.comparisonPreset)).toBeNull();
    expect(serialized.get(DASHBOARD_URL_KEYS.comparisonFrom)).toBeNull();
    expect(serialized.get(DASHBOARD_URL_KEYS.comparisonTo)).toBeNull();
    expect(serialized.get(DASHBOARD_URL_KEYS.comparisonMatchDuration)).toBeNull();
  });

  it('keeps unknown shifted preset IDs unchanged', () => {
    const serialized = serializeDashboardUrl({
      version: 1,
      comparison: { kind: 'shifted', presetId: 'future-preset-id' },
    });

    expect(serialized.get(DASHBOARD_URL_KEYS.comparisonPreset)).toBe('future-preset-id');
  });

  it('preserves missing custom comparison boundaries for later validation', () => {
    const parsed = parseDashboardUrl(new URLSearchParams('sm-compare=custom'));

    expect(parsed).toEqual({
      ok: true,
      state: {
        version: 1,
        comparison: {
          kind: 'custom',
          from: '',
          to: '',
          matchPrimaryDuration: true,
        },
      },
    });
  });

  it('migrates comparison state between URL formats when preserving undefined comparison state', () => {
    const canonical = serializeDashboardUrl(
      { version: 1, comparison: undefined },
      new URLSearchParams('compare=shifted&compare.preset=future-preset-id')
    );
    const legacy = serializeLegacyDashboardUrl(
      { version: 1, comparison: undefined },
      new URLSearchParams('sm-compare=shifted&sm-compare-preset=future-preset-id')
    );

    expect(canonical.get(DASHBOARD_URL_KEYS.comparison)).toBe('shifted');
    expect(canonical.get(DASHBOARD_URL_KEYS.comparisonPreset)).toBe('future-preset-id');
    expect(canonical.get(LEGACY_SCENE_DASHBOARD_KEYS.comparison)).toBeNull();
    expect(legacy.get(LEGACY_SCENE_DASHBOARD_KEYS.comparison)).toBe('shifted');
    expect(legacy.get(LEGACY_SCENE_DASHBOARD_KEYS.comparisonPreset)).toBe('future-preset-id');
    expect(legacy.get(DASHBOARD_URL_KEYS.comparison)).toBeNull();
  });

  it('clears comparison state from both URL formats', () => {
    const existing = new URLSearchParams(
      'sm-compare=previous&sm-compare-preset=canonical&compare=shifted&compare.preset=legacy'
    );
    const canonical = serializeDashboardUrl({ version: 1, comparison: null }, existing);
    const legacy = serializeLegacyDashboardUrl({ version: 1, comparison: null }, existing);

    for (const params of [canonical, legacy]) {
      expect(params.get(DASHBOARD_URL_KEYS.comparison)).toBeNull();
      expect(params.get(DASHBOARD_URL_KEYS.comparisonPreset)).toBeNull();
      expect(params.get(LEGACY_SCENE_DASHBOARD_KEYS.comparison)).toBeNull();
      expect(params.get(LEGACY_SCENE_DASHBOARD_KEYS.comparisonPreset)).toBeNull();
    }
  });

  it('replaces comparison state in the target URL format only', () => {
    const existing = new URLSearchParams(
      'sm-compare=previous&sm-compare-preset=canonical&compare=shifted&compare.preset=legacy'
    );
    const canonical = serializeDashboardUrl({ version: 1, comparison: { kind: 'auto' } }, existing);
    const legacy = serializeLegacyDashboardUrl({ version: 1, comparison: { kind: 'auto' } }, existing);

    expect(canonical.get(DASHBOARD_URL_KEYS.comparison)).toBe('auto');
    expect(canonical.get(LEGACY_SCENE_DASHBOARD_KEYS.comparison)).toBeNull();
    expect(legacy.get(LEGACY_SCENE_DASHBOARD_KEYS.comparison)).toBe('auto');
    expect(legacy.get(DASHBOARD_URL_KEYS.comparison)).toBeNull();
  });

  it('clears probe params when probes is an empty array', () => {
    const existing = new URLSearchParams('sm-v=1&sm-from=now-3h&sm-probe=frankfurt');
    const serialized = serializeDashboardUrl(
      {
        version: 1,
        from: 'now-3h',
        to: 'now',
        probes: [],
      },
      existing
    );

    expect(serialized.getAll(DASHBOARD_URL_KEYS.probe)).toEqual([]);
  });
});
