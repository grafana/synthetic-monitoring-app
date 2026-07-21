import { dateTimeParse } from '@grafana/data';

import { ALL_PROBE_SENTINELS, LEGACY_SCENE_DASHBOARD_KEYS } from './dashboardUrlSchema';
import { DashboardUrlState, mergeDashboardUrlState, parseDashboardUrl } from './dashboardUrl';

function parseLegacyProbes(search: URLSearchParams): string[] | undefined {
  const values = search.getAll(LEGACY_SCENE_DASHBOARD_KEYS.probe).filter(Boolean);

  if (values.length === 0) {
    return undefined;
  }

  const normalized = values.filter((value) => !ALL_PROBE_SENTINELS.has(value));

  return normalized.length > 0 ? normalized : undefined;
}

function parseLegacyTimeWindow(search: URLSearchParams): { from?: string; to?: string } {
  const center = search.get(LEGACY_SCENE_DASHBOARD_KEYS.time);
  const window = search.get(LEGACY_SCENE_DASHBOARD_KEYS.timeWindow);

  if (!center || !window) {
    return {};
  }

  const centerMs = dateTimeParse(center, { timeZone: 'utc' })?.valueOf();

  if (centerMs === undefined || Number.isNaN(centerMs)) {
    return {};
  }

  const windowMs = parseDurationToMs(window);

  if (windowMs === undefined) {
    return {};
  }

  const fromMs = centerMs - windowMs / 2;
  const toMs = centerMs + windowMs / 2;

  return {
    from: String(fromMs),
    to: String(toMs),
  };
}

function parseDurationToMs(value: string): number | undefined {
  const match = /^(\d+)(ms|s|m|h|d|w|M|y)$/.exec(value.trim());

  if (!match) {
    return undefined;
  }

  const amount = Number(match[1]);
  const unit = match[2];

  switch (unit) {
    case 'ms':
      return amount;
    case 's':
      return amount * 1_000;
    case 'm':
      return amount * 60_000;
    case 'h':
      return amount * 3_600_000;
    case 'd':
      return amount * 86_400_000;
    case 'w':
      return amount * 604_800_000;
    default:
      return undefined;
  }
}

export function transformLegacySceneDashboardUrl(search: URLSearchParams): DashboardUrlState {
  const canonical = parseDashboardUrl(search);
  const baseState: DashboardUrlState = canonical.ok
    ? { ...canonical.state }
    : {
        version: 1,
      };

  const timeWindow = parseLegacyTimeWindow(search);
  const legacyFrom = search.get(LEGACY_SCENE_DASHBOARD_KEYS.from) ?? undefined;
  const legacyTo = search.get(LEGACY_SCENE_DASHBOARD_KEYS.to) ?? undefined;

  const nextState: DashboardUrlState = { ...baseState };

  if (baseState.from === undefined && baseState.to === undefined) {
    nextState.from = timeWindow.from ?? legacyFrom;
    nextState.to = timeWindow.to ?? legacyTo;
  } else if (baseState.from === undefined) {
    nextState.from = timeWindow.from ?? legacyFrom;
  } else if (baseState.to === undefined) {
    nextState.to = timeWindow.to ?? legacyTo;
  }

  if (baseState.timezone === undefined) {
    nextState.timezone = search.get(LEGACY_SCENE_DASHBOARD_KEYS.timezone) ?? undefined;
  }

  if (baseState.refresh === undefined) {
    nextState.refresh = search.get(LEGACY_SCENE_DASHBOARD_KEYS.refresh) ?? undefined;
  }

  if (baseState.probes === undefined) {
    nextState.probes = parseLegacyProbes(search);
  }

  return mergeDashboardUrlState({ version: 1 }, nextState);
}

export function stripLegacySceneDashboardKeys(search: URLSearchParams): URLSearchParams {
  const params = new URLSearchParams(search);

  for (const key of Object.values(LEGACY_SCENE_DASHBOARD_KEYS)) {
    params.delete(key);
  }

  return params;
}
