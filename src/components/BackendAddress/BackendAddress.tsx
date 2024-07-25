import React from 'react';

import { useSMDS } from 'hooks/useSMDS';

type BackendAddressProps = {
  omitHttp?: boolean;
  text?: string;
};

export const BackendAddress = ({ omitHttp }: BackendAddressProps) => {
  const smDS = useSMDS();
  const backendAddress = smDS.instanceSettings.jsonData.apiHost || ``;
  const display = omitHttp ? backendAddress.replace('https://', '') : backendAddress;

  return (
    <>
      <div className="h3">Backend address</div>
      <p>
        The agent will need to connect to the instance of the Synthetics API that corresponds with the region of your
        stack. This is the backend address for your stack:
      </p>
      <pre>{display}</pre>
    </>
  );
};
