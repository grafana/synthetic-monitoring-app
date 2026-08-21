import { config } from '@grafana/runtime';

const KG_DATASOURCE_UID = 'grafanacloud-knowledgegraph';
const KG_DATASOURCE_TYPE = 'grafana-knowledgegraph-datasource';

/**
 * Resolves the Knowledge Graph datasource bundled with the asserts app. Mirrors useTracesDS: prefer
 * the well-known Grafana Cloud UID, then fall back to any datasource of the KG type (handles stacks
 * that provision it under a custom UID). Returns undefined when the datasource isn't present.
 */
export function useKGDS() {
  const byUid = Object.values(config.datasources).find((ds) => ds.uid === KG_DATASOURCE_UID);
  if (byUid) {
    return byUid;
  }

  return Object.values(config.datasources).find((ds) => ds.type === KG_DATASOURCE_TYPE);
}
