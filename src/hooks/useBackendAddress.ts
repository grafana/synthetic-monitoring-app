import { useMemo } from 'react';

import { useSMDS } from './useSMDS';

export function useBackendAddress() {
  const smDS = useSMDS();
  const backendAddress = smDS.instanceSettings.jsonData.apiHost || ``;
  const display = backendAddress.replace('https://', '');

  return useMemo(() => display, [display]);
}
