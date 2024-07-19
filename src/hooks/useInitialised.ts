import { useSyntheticMonitoringDS } from 'data/useSyntheticMonitoringDS';

import { useMeta } from './useMeta';

// todo: is this needed?
export function useInitialised() {
  const meta = useMeta();
  const smDS = useSyntheticMonitoringDS();

  return meta.enabled && smDS;
}
