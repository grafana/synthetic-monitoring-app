import React, { useContext } from 'react';

import { InstanceContext } from 'contexts/InstanceContext';

type BackendAddressProps = {
  omitHttp?: boolean;
  text?: string;
};

export const BackendAddress = ({ omitHttp }: BackendAddressProps) => {
  const { instance } = useContext(InstanceContext);
  const backendAddress = instance.api?.instanceSettings.jsonData.apiHost || ``;
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
