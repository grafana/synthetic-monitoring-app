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
});
