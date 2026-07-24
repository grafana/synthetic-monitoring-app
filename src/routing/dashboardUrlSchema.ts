export const DASHBOARD_URL_VERSION = 1 as const;

export const DASHBOARD_URL_KEYS = {
  version: 'sm-v',
  from: 'sm-from',
  to: 'sm-to',
  timezone: 'sm-timezone',
  refresh: 'sm-refresh',
  probe: 'sm-probe',
  comparison: 'sm-compare',
  comparisonPreset: 'sm-compare-preset',
  comparisonFrom: 'sm-compare-from',
  comparisonTo: 'sm-compare-to',
  comparisonMatchDuration: 'sm-compare-match-duration',
} as const;

export type DashboardUrlKey = (typeof DASHBOARD_URL_KEYS)[keyof typeof DASHBOARD_URL_KEYS];

export const LEGACY_SCENE_DASHBOARD_KEYS = {
  from: 'from',
  to: 'to',
  timezone: 'timezone',
  refresh: 'refresh',
  probe: 'var-probe',
  time: 'time',
  timeWindow: 'time.window',
  job: 'var-job',
  instance: 'var-instance',
  alert: 'var-alert',
  runbook: 'var-runbook',
  comparison: 'compare',
  comparisonPreset: 'compare.preset',
  comparisonFrom: 'compare.from',
  comparisonTo: 'compare.to',
  comparisonMatchDuration: 'compare.matchDuration',
} as const;

export const ALL_PROBE_SENTINELS = new Set(['$__all', 'All', '__all', 'all']);
