import React from 'react';

import { useCanWriteSM } from 'hooks/useDSPermission';
import { useInitialised } from 'hooks/useInitialised';
import { AccessToken } from 'components/AccessToken';
import { TerraformConfig } from 'components/TerraformConfig';

export const ProgrammaticManagement = () => {
  const initialised = useInitialised();
  const canCreateAccessToken = useCanWriteSM();

  return (
    <div>
      <h5>Programmatic management</h5>
      {initialised && canCreateAccessToken && <AccessToken />}
      <br />
      <TerraformConfig />
    </div>
  );
};
