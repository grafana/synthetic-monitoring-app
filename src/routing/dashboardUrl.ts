import {
  ALL_PROBE_SENTINELS,
  DASHBOARD_URL_KEYS,
  DASHBOARD_URL_VERSION,
  LEGACY_SCENE_DASHBOARD_KEYS,
} from './dashboardUrlSchema';

export type DashboardUrlState = {
  version: typeof DASHBOARD_URL_VERSION;
  from?: string;
  to?: string;
  timezone?: string;
  refresh?: string;
  probes?: string[];
};

export type ParseDashboardUrlResult =
  | { ok: true; state: DashboardUrlState }
  | { ok: false; reason: 'unsupported-version'; version: string };

const DEFAULT_TIMEZONE = 'browser';

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
  };

  return { ok: true, state };
}

export function serializeDashboardUrl(state: DashboardUrlState, existing?: URLSearchParams): URLSearchParams {
  const params = new URLSearchParams(existing ?? undefined);
  // undefined probes = leave existing probe params alone (time-only URL updates).
  // [] = clear probe filter ("All probes").
  const preservedProbes =
    state.probes === undefined ? params.getAll(DASHBOARD_URL_KEYS.probe) : undefined;

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

  return params;
}

export function serializeLegacyDashboardUrl(state: DashboardUrlState, existing?: URLSearchParams): URLSearchParams {
  const params = new URLSearchParams(existing ?? undefined);
  const preservedProbes =
    state.probes === undefined ? params.getAll(LEGACY_SCENE_DASHBOARD_KEYS.probe) : undefined;

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
  };
}
