import { useInstances } from 'contexts/InstanceContext';

export function useSyntheticMonitoringDS() {
  const { smDS } = useInstances();

  return smDS;
}
