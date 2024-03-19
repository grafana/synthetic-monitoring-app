import React, { FC } from 'react';
import { OrgRole } from '@grafana/data';

import { CheckType } from 'types';
import { hasRole } from 'utils';
import DnsSettingsForm from 'components/DnsSettings';
import { PingSettingsForm } from 'components/PingSettings';
import { TcpSettingsForm } from 'components/TcpSettings';
import { TracerouteSettingsForm } from 'components/TracerouteSettingsForm';
interface Props {
  typeOfCheck: CheckType;
}

export const CheckSettings: FC<Props> = ({ typeOfCheck }) => {
  const isEditor = hasRole(OrgRole.Editor);

  switch (typeOfCheck) {
    case CheckType.PING: {
      return <PingSettingsForm isEditor={isEditor} />;
    }
    case CheckType.DNS: {
      return <DnsSettingsForm isEditor={isEditor} />;
    }
    case CheckType.TCP: {
      return <TcpSettingsForm isEditor={isEditor} />;
    }
    case CheckType.Traceroute: {
      return <TracerouteSettingsForm isEditor={isEditor} />;
    }
    case CheckType.HTTP: {
      throw new Error('Invalid check type for this location');
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
