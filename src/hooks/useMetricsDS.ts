import { useSMDS } from './useSMDS';

export function useMetricsDS() {
  const smDS = useSMDS();

  return smDS.getMetricsDS();
}
