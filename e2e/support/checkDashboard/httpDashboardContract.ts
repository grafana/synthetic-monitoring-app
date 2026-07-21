export const HTTP_DASHBOARD_PANELS = {
  uptime: 'Uptime',
  reachability: 'Reachability',
  averageLatency: 'Average latency',
  sslExpiry: 'SSL Expiry',
  frequency: 'Frequency',
  errorRateByProbe: 'Error rate by probe',
  errorRate: /^Error Rate : /,
  responseLatencyByPhase: /^Response latency by phase: /,
  responseLatencyByProbe: 'Response latency by probe',
  logs: /^Logs for checks: /,
} as const;

export const HTTP_DASHBOARD_CONTROLS = {
  editCheck: 'Edit check',
  probe: 'probe',
  uptimeView: 'Uptime',
  reachabilityView: 'Reachability',
  viewDashboard: 'View dashboard',
} as const;

export const HTTP_DASHBOARD_PANEL_MENU_ITEMS = {
  copyJson: 'Copy JSON',
  explore: 'Explore',
} as const;

export const HTTP_DASHBOARD_PROBE_OPTIONS = {
  all: 'All',
} as const;

export const HTTP_DASHBOARD_LEGENDS = {
  httpPhases: ['connect', 'processing', 'resolve', 'tls', 'transfer'],
  navigableMap: 'Navigable map',
} as const;

export const HTTP_DASHBOARD_TIMEPOINT = {
  checkFailed: 'Check failed',
  configuredFrequency: 'Configured frequency:',
  statusCode: 'status_code=503',
} as const;
