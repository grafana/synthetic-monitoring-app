import { useMemo } from 'react';

import { useSMDS } from './useSMDS';

const BACKEND_ADDRESS_DESCRIPTION =
  'The Synthetic Monitoring Agent will need to connect to the instance of the Synthetics API that corresponds with the region of your stack.';

/**
 * Returns the backend address of the Synthetic Monitoring instance
 * This hook exists so that the address can be displayed in multiple places, with different styling.
 *
 * @todo Remove the `omitHttp` parameter and always display the address without the protocol?
 * @param {boolean} omitHttp
 */
export function useBackendAddress(omitHttp?: boolean) {
  const smDS = useSMDS();
  const backendAddress = smDS.instanceSettings.jsonData.apiHost || ``;
  const display = omitHttp ? backendAddress.replace('https://', '') : backendAddress;

  return useMemo(() => {
    return [display, BACKEND_ADDRESS_DESCRIPTION];
  }, [display]);
}
