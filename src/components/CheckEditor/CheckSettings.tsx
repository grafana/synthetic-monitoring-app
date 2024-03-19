import React, { FC } from 'react';
import { OrgRole } from '@grafana/data';

import { CheckType } from 'types';
import { hasRole } from 'utils';
import { TcpSettingsForm } from 'components/TcpSettings';
import { TracerouteSettingsForm } from 'components/TracerouteSettingsForm';
interface Props {
  typeOfCheck: CheckType;
}

export const CheckSettings: FC<Props> = ({ typeOfCheck }) => {
  const isEditor = hasRole(OrgRole.Editor);

  switch (typeOfCheck) {
    case CheckType.PING: {
      throw new Error('Invalid check type for this location');
    }
    case CheckType.HTTP: {
      throw new Error('Invalid check type for this location');
    }
    case CheckType.DNS: {
      throw new Error('Invalid check type for this location');
    }
    case CheckType.TCP: {
      return <TcpSettingsForm isEditor={isEditor} />;
    }
    case CheckType.Traceroute: {
      return <TracerouteSettingsForm isEditor={isEditor} />;
    }
    case CheckType.MULTI_HTTP: {
      throw new Error('Invalid check type for this location');
    }
    case CheckType.Scripted: {
      throw new Error('Invalid check type for this location');
    }
    case CheckType.GRPC: {
      throw new Error('Invalid check type for this location');
    }
  }
};
