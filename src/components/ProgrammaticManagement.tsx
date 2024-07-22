import React, { useContext } from 'react';

import { InstanceContext } from 'contexts/InstanceContext';
import { useMeta } from 'hooks/useMeta';
import { AccessToken } from 'components/AccessToken';
import { TerraformConfig } from 'components/TerraformConfig';

export const ProgrammaticManagement = () => {
  const { instance } = useContext(InstanceContext);
  const { enabled } = useMeta();
  const initialized = enabled && instance.api;

  return (
    <div>
      <h3>Programmatic management</h3>
      {initialized && <AccessToken />}
      <br />
      <TerraformConfig />
    </div>
  );
};
