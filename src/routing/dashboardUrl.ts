import { type ComparisonReferenceSpec } from 'dashboards/comparison/comparisonReference.types';

import {
  ALL_PROBE_SENTINELS,
  DASHBOARD_URL_KEYS,
  DASHBOARD_URL_VERSION,
  LEGACY_SCENE_DASHBOARD_KEYS,
} from './dashboardUrlSchema';

interface ComparisonUrlKeys {
  kind: string;
  enabled: string;
  preset: string;
  from: string;
  to: string;
  matchDuration: string;
}

const CANONICAL_COMPARISON_URL_KEYS: ComparisonUrlKeys = {
  kind: DASHBOARD_URL_KEYS.comparison,
  enabled: DASHBOARD_URL_KEYS.comparisonEnabled,
  preset: DASHBOARD_URL_KEYS.comparisonPreset,
  from: DASHBOARD_URL_KEYS.comparisonFrom,
  to: DASHBOARD_URL_KEYS.comparisonTo,
  matchDuration: DASHBOARD_URL_KEYS.comparisonMatchDuration,
};

const LEGACY_COMPARISON_URL_KEYS: ComparisonUrlKeys = {
  kind: LEGACY_SCENE_DASHBOARD_KEYS.comparison,
  enabled: LEGACY_SCENE_DASHBOARD_KEYS.comparisonEnabled,
  preset: LEGACY_SCENE_DASHBOARD_KEYS.comparisonPreset,
  from: LEGACY_SCENE_DASHBOARD_KEYS.comparisonFrom,
  to: LEGACY_SCENE_DASHBOARD_KEYS.comparisonTo,
  matchDuration: LEGACY_SCENE_DASHBOARD_KEYS.comparisonMatchDuration,
};

const COMPARISON_URL_KEY_SETS = [CANONICAL_COMPARISON_URL_KEYS, LEGACY_COMPARISON_URL_KEYS];

export type DashboardUrlState = {
  version: typeof DASHBOARD_URL_VERSION;
  from?: string;
  to?: string;
  timezone?: string;
  refresh?: string;
  probes?: string[];
  comparison?: ComparisonReferenceSpec | null;
  comparisonEnabled?: boolean;
};

export type ParseDashboardUrlResult =
  | { ok: true; state: DashboardUrlState }
  | { ok: false; reason: 'unsupported-version'; version: string };

const DEFAULT_TIMEZONE = 'browser';
const RETIRED_SHIFTED_BASELINE_PRESETS = new Set(['14d', '21d', '30d']);

function parseVersion(search: URLSearchParams): ParseDashboardUrlResult | { version: number } {
  const rawVersion = search.get(DASHBOARD_URL_KEYS.version);

  if (rawVersion === null) {
    return { version: DASHBOARD_URL_VERSION };
  }

  const parsed = Number(rawVersion);

  if (!Number.isInteger(parsed) || parsed !== DASHBOARD_URL_VERSION) {
    return { ok: false, reason: 'unsupported-version', version: rawVersion };
  }

  return { version: parsed };
}

function parseProbes(search: URLSearchParams, key: string): string[] | undefined {
  const values = search.getAll(key).filter(Boolean);

  if (values.length === 0) {
    return undefined;
  }

  const normalized = values.filter((value) => !ALL_PROBE_SENTINELS.has(value));

  return normalized.length > 0 ? normalized : undefined;
}

function parseComparison(search: URLSearchParams, keys: ComparisonUrlKeys): ComparisonReferenceSpec | undefined {
  switch (search.get(keys.kind)) {
    case 'auto':
      return { kind: 'auto' };
    case 'normal':
      return { kind: 'auto' };
    case 'previous':
      return { kind: 'previous' };
    case 'baseline':
      return { kind: 'baseline', presetId: search.get(keys.preset) ?? '' };
    case 'shifted': {
      const presetId = search.get(keys.preset) ?? '';

      return RETIRED_SHIFTED_BASELINE_PRESETS.has(presetId)
        ? { kind: 'baseline', presetId }
        : { kind: 'shifted', presetId };
    }
    case 'custom':
      return {
        kind: 'custom',
        from: search.get(keys.from) ?? '',
        to: search.get(keys.to) ?? '',
        matchPrimaryDuration: search.get(keys.matchDuration) !== '0',
      };
    default:
      return undefined;
  }
}

function writeComparison(
  params: URLSearchParams,
  keys: ComparisonUrlKeys,
  comparison: ComparisonReferenceSpec | null | undefined,
  comparisonEnabled: boolean | undefined,
  preserved: URLSearchParams
): void {
  for (const comparisonKeys of COMPARISON_URL_KEY_SETS) {
    for (const key of Object.values(comparisonKeys)) {
      params.delete(key);
    }
  }

  const nextComparison =
    comparison === undefined
      ? hasCanonicalComparisonParameters(preserved)
        ? parseComparison(preserved, CANONICAL_COMPARISON_URL_KEYS)
        : parseComparison(preserved, LEGACY_COMPARISON_URL_KEYS)
      : comparison;
  const nextEnabled =
    comparisonEnabled === undefined
      ? parseComparisonEnabled(preserved, hasCanonicalComparisonParameters(preserved) ? CANONICAL_COMPARISON_URL_KEYS : LEGACY_COMPARISON_URL_KEYS)
      : comparisonEnabled;

  if (nextComparison === null || nextComparison === undefined) {
    return;
  }

  params.set(keys.kind, nextComparison.kind);

  if (nextEnabled === false) {
    params.set(keys.enabled, '0');
  }

  if (nextComparison.kind === 'baseline' || nextComparison.kind === 'shifted') {
    params.set(keys.preset, nextComparison.presetId);
  }

  if (nextComparison.kind === 'custom') {
    params.set(keys.from, nextComparison.from);
    params.set(keys.to, nextComparison.to);
    params.set(keys.matchDuration, nextComparison.matchPrimaryDuration ? '1' : '0');
  }
}

function parseComparisonEnabled(search: URLSearchParams, keys: ComparisonUrlKeys): boolean | undefined {
  const value = search.get(keys.enabled);

  if (value === null) {
    return undefined;
  }

  return value !== '0';
}

function hasComparisonParameters(params: URLSearchParams): boolean {
  return COMPARISON_URL_KEY_SETS.some((keys) => Object.values(keys).some((key) => params.has(key)));
}

export function hasCanonicalComparisonParameters(params: URLSearchParams): boolean {
  return Object.values(CANONICAL_COMPARISON_URL_KEYS).some((key) => params.has(key));
}

export function parseDashboardUrl(search: URLSearchParams): ParseDashboardUrlResult {
  const versionResult = parseVersion(search);

  if ('ok' in versionResult && versionResult.ok === false) {
    return versionResult;
  }

  const state: DashboardUrlState = {
    version: DASHBOARD_URL_VERSION,
    from: search.get(DASHBOARD_URL_KEYS.from) ?? undefined,
    to: search.get(DASHBOARD_URL_KEYS.to) ?? undefined,
    timezone: search.get(DASHBOARD_URL_KEYS.timezone) ?? undefined,
    refresh: search.get(DASHBOARD_URL_KEYS.refresh) ?? undefined,
    probes: parseProbes(search, DASHBOARD_URL_KEYS.probe),
    comparison: parseComparison(search, CANONICAL_COMPARISON_URL_KEYS),
    comparisonEnabled: parseComparisonEnabled(search, CANONICAL_COMPARISON_URL_KEYS),
  };

  return { ok: true, state };
}

export function serializeDashboardUrl(state: DashboardUrlState, existing?: URLSearchParams): URLSearchParams {
  const params = new URLSearchParams(existing ?? undefined);
  // undefined probes = leave existing probe params alone (time-only URL updates).
  // [] = clear probe filter ("All probes").
  const preservedProbes =
    state.probes === undefined ? params.getAll(DASHBOARD_URL_KEYS.probe) : undefined;
  const preservedComparison = new URLSearchParams(params);

  for (const key of Object.values(DASHBOARD_URL_KEYS)) {
    params.delete(key);
  }

  // Canonical URLs must not keep Scene leftovers (from/to/var-probe/etc).
  for (const key of Object.values(LEGACY_SCENE_DASHBOARD_KEYS)) {
    params.delete(key);
  }

  const hasExplicitState =
    state.from !== undefined ||
    state.to !== undefined ||
    state.timezone !== undefined ||
    state.refresh !== undefined ||
    state.probes !== undefined ||
    state.comparison !== undefined ||
    state.comparisonEnabled !== undefined ||
    hasComparisonParameters(preservedComparison) ||
    Boolean(preservedProbes?.length);

  if (!hasExplicitState) {
    return params;
  }

  params.set(DASHBOARD_URL_KEYS.version, String(state.version));

  if (state.from !== undefined) {
    params.set(DASHBOARD_URL_KEYS.from, state.from);
  }

  if (state.to !== undefined) {
    params.set(DASHBOARD_URL_KEYS.to, state.to);
  }

  if (state.timezone !== undefined) {
    params.set(DASHBOARD_URL_KEYS.timezone, state.timezone);
  }

  if (state.refresh !== undefined) {
    params.set(DASHBOARD_URL_KEYS.refresh, state.refresh);
  }

  const probesToWrite = state.probes !== undefined ? state.probes : preservedProbes;

  probesToWrite?.forEach((probe) => {
    params.append(DASHBOARD_URL_KEYS.probe, probe);
  });

  writeComparison(
    params,
    CANONICAL_COMPARISON_URL_KEYS,
    state.comparison,
    state.comparisonEnabled,
    preservedComparison
  );

  return params;
}

export function serializeLegacyDashboardUrl(state: DashboardUrlState, existing?: URLSearchParams): URLSearchParams {
  const params = new URLSearchParams(existing ?? undefined);
  const preservedProbes =
    state.probes === undefined ? params.getAll(LEGACY_SCENE_DASHBOARD_KEYS.probe) : undefined;
  const preservedComparison = new URLSearchParams(params);

  for (const key of Object.values(LEGACY_SCENE_DASHBOARD_KEYS)) {
    params.delete(key);
  }

  if (state.from !== undefined) {
    params.set(LEGACY_SCENE_DASHBOARD_KEYS.from, state.from);
  }

  if (state.to !== undefined) {
    params.set(LEGACY_SCENE_DASHBOARD_KEYS.to, state.to);
  }

  if (state.timezone !== undefined) {
    params.set(LEGACY_SCENE_DASHBOARD_KEYS.timezone, state.timezone);
  }

  if (state.refresh !== undefined) {
    params.set(LEGACY_SCENE_DASHBOARD_KEYS.refresh, state.refresh);
  }

  const probesToWrite = state.probes !== undefined ? state.probes : preservedProbes;

  probesToWrite?.forEach((probe) => {
    params.append(LEGACY_SCENE_DASHBOARD_KEYS.probe, probe);
  });

  writeComparison(
    params,
    LEGACY_COMPARISON_URL_KEYS,
    state.comparison,
    state.comparisonEnabled,
    preservedComparison
  );

  return params;
}

export function normalizeDashboardUrl(search: URLSearchParams): URLSearchParams {
  const parsed = parseDashboardUrl(search);

  if (!parsed.ok) {
    return new URLSearchParams(search);
  }

  return serializeDashboardUrl(parsed.state, search);
}

export function withDashboardUrlState(
  path: string,
  state: DashboardUrlState,
  existing?: URLSearchParams,
  format: 'canonical' | 'legacy' = 'canonical'
): string {
  const params = format === 'legacy' ? serializeLegacyDashboardUrl(state, existing) : serializeDashboardUrl(state, existing);
  const query = params.toString();

  return query ? `${path}?${query}` : path;
}

export function withLegacyDashboardUrlState(
  path: string,
  state: DashboardUrlState,
  existing?: URLSearchParams
): string {
  return withDashboardUrlState(path, state, existing, 'legacy');
}

export function getDefaultDashboardUrlState(): DashboardUrlState {
  return {
    version: DASHBOARD_URL_VERSION,
    timezone: DEFAULT_TIMEZONE,
  };
}

export function mergeDashboardUrlState(base: DashboardUrlState, patch: Partial<DashboardUrlState>): DashboardUrlState {
  return {
    version: DASHBOARD_URL_VERSION,
    from: 'from' in patch ? patch.from : base.from,
    to: 'to' in patch ? patch.to : base.to,
    timezone: 'timezone' in patch ? patch.timezone : base.timezone,
    // Allow explicit undefined/[] to clear refresh or probe filters.
    refresh: 'refresh' in patch ? patch.refresh : base.refresh,
    probes: 'probes' in patch ? patch.probes : base.probes,
    comparison: 'comparison' in patch ? patch.comparison : base.comparison,
    comparisonEnabled:
      'comparisonEnabled' in patch ? patch.comparisonEnabled : base.comparisonEnabled,
  };
}

export function parseLegacyDashboardComparison(search: URLSearchParams): ComparisonReferenceSpec | undefined {
  return parseComparison(search, LEGACY_COMPARISON_URL_KEYS);
}
