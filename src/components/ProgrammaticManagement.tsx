import React from 'react';

import { useInitialised } from 'hooks/useInitialised';
import { AccessToken } from 'components/AccessToken';
import { TerraformConfig } from 'components/TerraformConfig';

export const ProgrammaticManagement = () => {
  const initialised = useInitialised();

  return (
    <div>
      <h3>Programmatic management</h3>
      {initialised && <AccessToken />}
      <br />
      <TerraformConfig />
    </div>
  );
};
