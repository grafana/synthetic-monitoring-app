import { useSyntheticMonitoringDS } from './useSyntheticMonitoringDS';

export function useLogsDS() {
  const smDS = useSyntheticMonitoringDS();

  return smDS.getLogsDS();
}
