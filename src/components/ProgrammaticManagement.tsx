import React from 'react';
import { TerraformConfig } from 'components/TerraformConfig';
import { AccessToken } from 'components/AccessToken';

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
