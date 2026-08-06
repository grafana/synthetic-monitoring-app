export const CMAB_PLUGIN_ID = 'grafana-cmab-app';

export const CMAB_COST_ATTRIBUTION_WRITE = 'grafana-cmab-app.costattribution:write';

const CMAB_BASE = `/a/${CMAB_PLUGIN_ID}`;

export const CMAB_URLS = {
  home: CMAB_BASE,
  // Attribution labels are configured in the Settings tab of the Cost Management and Billing app.
  settings: `${CMAB_BASE}/settings`,
};

export const CMAB_SETUP_DOCS_URL =
  'https://grafana.com/docs/grafana-cloud/observe-and-act/testing/synthetic-monitoring/manage-labels/';

export const CAL_BANNER_DISMISSED_KEY = 'dismissedCostAttributionBanner';
