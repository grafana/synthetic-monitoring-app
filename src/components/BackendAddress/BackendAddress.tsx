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
        Based on the region of your stack, you need to use a different API server URL when setting up a private probe.
        This is the backend address for your stack:
      </p>
      <pre>{display}</pre>
    </>
  );
};
