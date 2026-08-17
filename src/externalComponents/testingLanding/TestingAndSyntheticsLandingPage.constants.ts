const SM_BASE = '/a/grafana-synthetic-monitoring-app';
const K6_BASE = '/a/k6-app';

export const SM_URLS = {
  home: `${SM_BASE}/home`,
  checks: `${SM_BASE}/checks`,
  chooseCheck: `${SM_BASE}/checks/choose-type`,
  newBrowser: `${SM_BASE}/checks/new/browser`,
  newEndpoint: `${SM_BASE}/checks/new/api-endpoint`,
  newScripted: `${SM_BASE}/checks/new/scripted`,
  probes: `${SM_BASE}/probes`,
  terraform: `${SM_BASE}/config/terraform`,
};

export const K6_URLS = {
  home: K6_BASE,
  projects: `${K6_BASE}/projects`,
};

export const SYNTHETICS_PLUGIN_ID = 'grafana-synthetic-monitoring-app';
export const PERFORMANCE_PLUGIN_ID = 'k6-app';
export const AGENTIC_PLUGIN_ID = 'grafana-agentictesting-app';

const AGENTIC_BASE = `/a/${AGENTIC_PLUGIN_ID}`;

export const AGENTIC_URLS = {
  home: AGENTIC_BASE,
  create: `${AGENTIC_BASE}/create`,
};
