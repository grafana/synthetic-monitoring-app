import type { NavModelItem } from '@grafana/data';

export const NAV_AGENTIC_CHILD: NavModelItem = {
  pluginId: 'grafana-agentictesting-app',
  id: 'agentic',
  text: 'Agentic testing',
};

export const NAV_K6_CHILD: NavModelItem = {
  pluginId: 'k6-app',
  id: 'k6',
  text: 'Performance testing',
};

export const NAV_SM_CHILD: NavModelItem = {
  pluginId: 'grafana-synthetic-monitoring-app',
  id: 'sm',
  text: 'Synthetic monitoring',
};

export const NAV_BOTH_PLUGINS: NavModelItem = {
  text: 'Testing & synthetics',
  children: [NAV_AGENTIC_CHILD, NAV_K6_CHILD, NAV_SM_CHILD],
};

export const NAV_SM_ONLY: NavModelItem = {
  ...NAV_BOTH_PLUGINS,
  children: [NAV_SM_CHILD],
};

export const NAV_K6_ONLY: NavModelItem = {
  ...NAV_BOTH_PLUGINS,
  children: [NAV_K6_CHILD],
};

export const NAV_AGENTIC_K6: NavModelItem = {
  ...NAV_BOTH_PLUGINS,
  children: [NAV_AGENTIC_CHILD, NAV_K6_CHILD],
};
