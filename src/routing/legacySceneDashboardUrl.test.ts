import { LEGACY_SCENE_DASHBOARD_KEYS } from './dashboardUrlSchema';
import { stripLegacySceneDashboardKeys, transformLegacySceneDashboardUrl } from './legacySceneDashboardUrl';

describe('legacySceneDashboardUrl', () => {
  it('maps legacy Scene probe parameters to semantic state', () => {
    const params = new URLSearchParams();
    params.append(LEGACY_SCENE_DASHBOARD_KEYS.probe, 'frankfurt');
    params.append(LEGACY_SCENE_DASHBOARD_KEYS.probe, 'ohio');
    params.set(LEGACY_SCENE_DASHBOARD_KEYS.from, 'now-3h');
    params.set(LEGACY_SCENE_DASHBOARD_KEYS.to, 'now');
    params.set(LEGACY_SCENE_DASHBOARD_KEYS.refresh, '30s');

    expect(transformLegacySceneDashboardUrl(params)).toEqual({
      version: 1,
      from: 'now-3h',
      to: 'now',
      refresh: '30s',
      probes: ['frankfurt', 'ohio'],
    });
  });

  it('treats $__all as the absence of probe selection', () => {
    const params = new URLSearchParams();
    params.append(LEGACY_SCENE_DASHBOARD_KEYS.probe, '$__all');

    expect(transformLegacySceneDashboardUrl(params).probes).toBeUndefined();
  });

  it('prefers canonical time values over legacy Scene time values', () => {
    const params = new URLSearchParams();
    params.set('sm-from', 'now-6h');
    params.set('sm-to', 'now');
    params.set(LEGACY_SCENE_DASHBOARD_KEYS.from, 'now-1h');
    params.set(LEGACY_SCENE_DASHBOARD_KEYS.to, 'now');

    expect(transformLegacySceneDashboardUrl(params)).toEqual({
      version: 1,
      from: 'now-6h',
      to: 'now',
    });
  });

  it('converts legacy time and time.window into absolute bounds', () => {
    const params = new URLSearchParams();
    params.set(LEGACY_SCENE_DASHBOARD_KEYS.time, '2024-01-01T12:00:00.000Z');
    params.set(LEGACY_SCENE_DASHBOARD_KEYS.timeWindow, '1h');

    const state = transformLegacySceneDashboardUrl(params);

    expect(state.from).toBe(String(Date.parse('2024-01-01T12:00:00.000Z') - 1_800_000));
    expect(state.to).toBe(String(Date.parse('2024-01-01T12:00:00.000Z') + 1_800_000));
  });

  it('strips legacy Scene dashboard keys while preserving unrelated params', () => {
    const params = new URLSearchParams();
    params.set(LEGACY_SCENE_DASHBOARD_KEYS.job, 'job');
    params.set(LEGACY_SCENE_DASHBOARD_KEYS.from, 'now-3h');
    params.set('foo', 'bar');

    expect(stripLegacySceneDashboardKeys(params).toString()).toBe('foo=bar');
  });
});
