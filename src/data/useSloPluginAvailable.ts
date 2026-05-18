import { useQuery } from '@tanstack/react-query';
import { getAppPluginVersion } from '@grafana/runtime';

const SLO_PLUGIN_ID = 'grafana-slo-app';

export function useSloPluginAvailable() {
  return useQuery({
    queryKey: ['sloPluginAvailable'],
    queryFn: async () => {
      const version = await getAppPluginVersion(SLO_PLUGIN_ID);
      return version != null;
    },
  });
}
