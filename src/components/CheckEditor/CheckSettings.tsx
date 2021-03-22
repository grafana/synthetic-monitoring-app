import React, { FC } from 'react';
import { CheckType } from 'types';
import { PingSettingsForm } from 'components/PingSettings';
import { HttpSettingsForm } from 'components/http/HttpSettings';
import DnsSettingsForm from 'components/DnsSettings';
import { TcpSettingsForm } from 'components/TcpSettings';
import { TracerouteSettingsForm } from 'components/TracerouteSettingsForm';

interface Props {
  isEditor: boolean;
  typeOfCheck: CheckType;
}

export const CheckSettings: FC<Props> = ({ isEditor, typeOfCheck }) => {
  switch (typeOfCheck) {
    case CheckType.PING: {
      return <PingSettingsForm isEditor={isEditor} />;
    }
    case CheckType.HTTP: {
      return <HttpSettingsForm isEditor={isEditor} />;
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
  }
};
