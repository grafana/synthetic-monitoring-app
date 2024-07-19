import { useSyntheticMonitoringDS } from './useSyntheticMonitoringDS';

export function useMetricsDS() {
  const smDS = useSyntheticMonitoringDS();

  return smDS.getMetricsDS();
}
