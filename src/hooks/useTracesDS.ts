import { config } from '@grafana/runtime';

export function useTracesDS() {
  // Try the well-known Grafana Cloud traces datasource first
  const byUid = Object.values(config.datasources).find((ds) => ds.uid === 'grafanacloud-traces');
  if (byUid) {
    return byUid;
  }

  // Fall back to finding any Tempo datasource
  return Object.values(config.datasources).find((ds) => ds.type === 'tempo');
}
