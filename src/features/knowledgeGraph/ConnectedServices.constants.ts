export const CONNECTED_SERVICES_TITLE = 'Connected services';
export const CONNECTED_SERVICES_SUBTITLE = 'Neighbourhood from the Knowledge Graph.';

export const CONNECTED_SERVICES_TEST_ID = {
  section: 'connected-services-section',
  graph: 'connected-services-graph',
  node: 'connected-services-node',
  edge: 'connected-services-edge',
  loading: 'connected-services-loading',
  error: 'connected-services-error',
  empty: 'connected-services-empty',
  zeroState: 'connected-services-zero-state',
} as const;

/**
 * Insight-ring severity colors, pinned to the Knowledge Graph's own values
 * (`assertsColors` in the KG plugin) so a check's ring reads identically on both surfaces.
 */
export const KG_SEVERITY_COLORS = {
  critical: '#F2495C',
  warning: '#FF9830',
  info: '#5794F2',
} as const;
