export const FULL_ADMIN_ACCESS = {
  'grafana-synthetic-monitoring-app:read': true,
  'grafana-synthetic-monitoring-app:write': true,
  'grafana-synthetic-monitoring-app.plugin:write': true,
  'grafana-synthetic-monitoring-app.checks:write': true,
  'grafana-synthetic-monitoring-app.probes:write': true,
  'grafana-synthetic-monitoring-app.alerts:write': true,
  'grafana-synthetic-monitoring-app.thresholds:write': true,
  'grafana-synthetic-monitoring-app.access-tokens:write': true,
  'grafana-synthetic-monitoring-app.checks:read': true,
  'grafana-synthetic-monitoring-app.probes:read': true,
  'grafana-synthetic-monitoring-app.alerts:read': true,
  'grafana-synthetic-monitoring-app.thresholds:read': true,
  'grafana-synthetic-monitoring-app.checks:delete': true,
  'grafana-synthetic-monitoring-app.probes:delete': true,
  'grafana-synthetic-monitoring-app.alerts:delete': true,
  'grafana-synthetic-monitoring-app.thresholds:delete': true,
};

export const FULL_WRITER_ACCESS = {
  'grafana-synthetic-monitoring-app:read': true,
  'grafana-synthetic-monitoring-app:write': true,
  'grafana-synthetic-monitoring-app.checks:write': true,
  'grafana-synthetic-monitoring-app.probes:write': true,
  'grafana-synthetic-monitoring-app.alerts:write': true,
  'grafana-synthetic-monitoring-app.thresholds:write': true,
  'grafana-synthetic-monitoring-app.access-tokens:write': true,
  'grafana-synthetic-monitoring-app.checks:read': true,
  'grafana-synthetic-monitoring-app.probes:read': true,
  'grafana-synthetic-monitoring-app.alerts:read': true,
  'grafana-synthetic-monitoring-app.thresholds:read': true,
  'grafana-synthetic-monitoring-app.checks:delete': true,
  'grafana-synthetic-monitoring-app.probes:delete': true,
  'grafana-synthetic-monitoring-app.alerts:delete': true,
  'grafana-synthetic-monitoring-app.thresholds:delete': true,
};

export const FULL_READONLY_ACCESS = {
  'grafana-synthetic-monitoring-app:read': true,
  'grafana-synthetic-monitoring-app.checks:read': true,
  'grafana-synthetic-monitoring-app.probes:read': true,
  'grafana-synthetic-monitoring-app.alerts:read': true,
  'grafana-synthetic-monitoring-app.thresholds:read': true,
};
