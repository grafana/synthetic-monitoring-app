import React from 'react';

import { AccessToken } from 'components/AccessToken';
import { TerraformConfig } from 'components/TerraformConfig';

export const ProgrammaticManagement = () => {
  return (
    <div>
      <h3>Programmatic management</h3>
      <AccessToken />
      <br />
      <TerraformConfig />
    </div>
  );
};
