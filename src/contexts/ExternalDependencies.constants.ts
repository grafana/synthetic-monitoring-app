/** Grafana app plugin IDs that Synthetic Monitoring optionally integrates with. */
export const EXTERNAL_DEPENDENCY_PLUGIN_IDS = {
  slo: 'grafana-slo-app',
} as const;

export type ExternalDependencyKey = keyof typeof EXTERNAL_DEPENDENCY_PLUGIN_IDS;
