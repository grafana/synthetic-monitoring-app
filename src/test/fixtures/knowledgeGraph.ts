import { toDataFrame } from '@grafana/data';

/**
 * Node-graph frames matching the KG datasource's Cypher entityGraph contract (frames_cypher.go
 * in the KG plugin): a SyntheticCheck entity, its monitored service (carrying a critical
 * insight), one downstream dependency and one upstream caller.
 */
export function buildNeighbourhoodFrames() {
  const checkId = 'SyntheticCheck:my check__https://grafana.com:unknown::';
  const serviceId = 'Service:frontend:prod::otel-demo';
  const downstreamId = 'Service:cart:prod::otel-demo';
  const upstreamId = 'Service:gateway:prod::otel-demo';

  const nodes = toDataFrame({
    name: 'nodes',
    fields: [
      { name: 'id', values: [checkId, serviceId, downstreamId, upstreamId] },
      { name: 'title', values: ['my check__https://grafana.com', 'frontend', 'cart', 'gateway'] },
      { name: 'subtitle', values: ['SyntheticCheck', 'Service', 'Service', 'Service'] },
      { name: 'mainstat', values: [0, 0, 0, 0] },
      { name: 'secondarystat', values: [0, 2, 0, 0] },
      { name: 'arc__success', values: [1, 0, 1, 1] },
      { name: 'arc__errors', values: [0, 1, 0, 0] },
      { name: 'arc__amend', values: [0, 0, 0, 0] },
      { name: 'arc__warning', values: [0, 0, 0, 0] },
      { name: 'icon', values: ['heart-rate', 'apps', 'apps', 'apps'] },
      { name: 'noderadius', values: [35, 35, 35, 35] },
      { name: 'env', values: ['unknown', 'prod', 'prod', 'prod'] },
      { name: 'site', values: ['', '', '', ''] },
      { name: 'namespace', values: ['', 'otel-demo', 'otel-demo', 'otel-demo'] },
      { name: 'insightNames', values: ['', 'ErrorRatioBreach,LatencyAverageBreach', '', ''] },
    ],
  });

  const edges = toDataFrame({
    name: 'edges',
    fields: [
      { name: 'id', values: ['edge-0', 'edge-1', 'edge-2'] },
      // MONITORED_BY: Service → SyntheticCheck; CALLS: frontend → cart, gateway → frontend.
      { name: 'source', values: [serviceId, serviceId, upstreamId] },
      { name: 'target', values: [checkId, downstreamId, serviceId] },
      { name: 'mainstat', values: [0, 0, 0] },
    ],
  });

  return { nodes, edges, ids: { checkId, serviceId, downstreamId, upstreamId } };
}
