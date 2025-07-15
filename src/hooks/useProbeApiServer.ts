import { useBackendAddress } from 'hooks/useBackendAddress';
import probeMappings from 'page/NewProbe/probeAPIServerMappings.json';

export const GRAFANA_DEV_ENTRY = {
  backendAddress: 'synthetic-monitoring-api-dev.grafana-dev.net',
  apiServerURL: 'synthetic-monitoring-grpc-dev.grafana-dev.net:443',
  region: '',
  provider: '',
};

export function useProbeApiServer() {
  const backendAddress = useBackendAddress();
  const probeMapping = [...probeMappings, GRAFANA_DEV_ENTRY].find(
    (mapping) => mapping.backendAddress === backendAddress
  );

  if (!probeMapping) {
    return undefined;
  }

  return probeMapping.apiServerURL;
}
