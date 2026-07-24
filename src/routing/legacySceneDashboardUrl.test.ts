import { type ComparisonReferenceSpec } from 'dashboards/comparison/comparisonReference.types';

import { serializeDashboardUrl, serializeLegacyDashboardUrl } from './dashboardUrl';
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

  it.each<ComparisonReferenceSpec>([
    { kind: 'normal' },
    { kind: 'previous' },
    { kind: 'shifted', presetId: 'future-preset-id' },
    {
      kind: 'custom',
      from: '2026-06-01T08:00:00.000Z',
      to: '2026-06-01T11:00:00.000Z',
      matchPrimaryDuration: false,
    },
  ])('round-trips legacy comparison state: %o', (comparison) => {
    const params = serializeLegacyDashboardUrl({ version: 1, comparison });

    expect(transformLegacySceneDashboardUrl(params).comparison).toEqual(comparison);
  });

  it('prefers canonical comparison state over legacy comparison state', () => {
    const params = new URLSearchParams('sm-compare=shifted&sm-compare-preset=future-preset-id&compare=previous');

    expect(transformLegacySceneDashboardUrl(params).comparison).toEqual({
      kind: 'shifted',
      presetId: 'future-preset-id',
    });
  });

  it('imports legacy comparison into semantic state that can be written canonically', () => {
    const legacy = new URLSearchParams('compare=shifted&compare.preset=14d&keep=1');
    const state = transformLegacySceneDashboardUrl(legacy);
    const canonical = serializeDashboardUrl(state, legacy);

    expect(state.comparison).toEqual({ kind: 'shifted', presetId: '14d' });
    expect(canonical.get('sm-compare')).toBe('shifted');
    expect(canonical.get('sm-compare-preset')).toBe('14d');
    expect(canonical.get('compare')).toBeNull();
    expect(canonical.get('compare.preset')).toBeNull();
    expect(canonical.get('keep')).toBe('1');
  });

  it.each([
    'sm-compare=unknown',
    'sm-compare-preset=14d',
    'sm-compare-from=2026-06-01T08%3A00%3A00.000Z',
  ])('does not use legacy fallback when malformed canonical comparison state is present: %s', (canonicalState) => {
    const params = new URLSearchParams(
      `${canonicalState}&compare=shifted&compare.preset=7d`
    );
    const state = transformLegacySceneDashboardUrl(params);
    const serialized = serializeDashboardUrl(state, params);

    expect(state.comparison).toBeUndefined();
    expect(serialized.get('sm-compare')).toBeNull();
    expect(serialized.get('compare')).toBeNull();
  });

  it('preserves or clears legacy comparison params according to the tri-state patch', () => {
    const existing = new URLSearchParams('compare=shifted&compare.preset=future-preset-id');

    const preserved = serializeLegacyDashboardUrl({ version: 1, comparison: undefined }, existing);
    const cleared = serializeLegacyDashboardUrl({ version: 1, comparison: null }, existing);

    expect(preserved.get(LEGACY_SCENE_DASHBOARD_KEYS.comparison)).toBe('shifted');
    expect(preserved.get(LEGACY_SCENE_DASHBOARD_KEYS.comparisonPreset)).toBe('future-preset-id');
    expect(cleared.get(LEGACY_SCENE_DASHBOARD_KEYS.comparison)).toBeNull();
    expect(cleared.get(LEGACY_SCENE_DASHBOARD_KEYS.comparisonPreset)).toBeNull();
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
