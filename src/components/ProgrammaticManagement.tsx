import React, { useContext } from 'react';

import { InstanceContext } from 'contexts/InstanceContext';
import { AccessToken } from 'components/AccessToken';
import { TerraformConfig } from 'components/TerraformConfig';

export const ProgrammaticManagement = () => {
  const { meta, instance } = useContext(InstanceContext);
  const initialized = meta?.enabled && instance.api;

  return (
    <div>
      <h3>Programmatic management</h3>
      {initialized && <AccessToken />}
      <br />
      <TerraformConfig />
    </div>
  );
};
