import { useSMDS } from './useSMDS';

export function useLogsDS() {
  const smDS = useSMDS();

  return smDS.getLogsDS();
}
