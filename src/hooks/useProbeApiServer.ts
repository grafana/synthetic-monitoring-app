import byocProbeMappings from 'data/byocProbeAPIServerMappings.json';
import devProbeMappings from 'data/devProbeAPIServerMappings.json';
import probeMappings from 'data/probeAPIServerMappings.json';
import { useBackendAddress } from 'hooks/useBackendAddress';

export const GRAFANA_DEV_ENTRY = {
  backendAddress: 'synthetic-monitoring-api-dev.grafana-dev.net',
  apiServerURL: 'synthetic-monitoring-grpc-dev.grafana-dev.net:443',
  region: '',
  provider: '',
};

// The us-central2 cluster was migrated to prod-us-central-7 (grafana/synthetic-monitoring-api#1352)
// but existing stacks may still be provisioned with the legacy apiHost, which remains routable for
// backwards compatibility. Remove once stack provisioning no longer hands out the legacy address.
export const LEGACY_US_CENTRAL2_ENTRY = {
  backendAddress: 'synthetic-monitoring-api-us-central2.grafana.net',
  apiServerURL: 'synthetic-monitoring-grpc-us-central-7.grafana.net:443',
  region: 'United States',
  provider: 'Azure',
};

export function useProbeApiServer() {
  const backendAddress = useBackendAddress();
  const probeMapping = [
    ...probeMappings,
    ...byocProbeMappings,
    ...devProbeMappings,
    GRAFANA_DEV_ENTRY,
    LEGACY_US_CENTRAL2_ENTRY,
  ].find((mapping) => mapping.backendAddress === backendAddress);

  if (!probeMapping) {
    return undefined;
  }

  return probeMapping.apiServerURL;
}
