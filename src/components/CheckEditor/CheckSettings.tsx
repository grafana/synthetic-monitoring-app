import React, { FC } from 'react';
import { Settings, CheckType, Label } from 'types';
import { PingSettingsForm } from 'components/PingSettings';
import { HttpSettingsForm } from 'components/http/HttpSettings';
import DnsSettingsForm from 'components/DnsSettings';
import TcpSettingsForm from 'components/TcpSettings';

interface Props {
  isEditor: boolean;
  labels: Label[];
  settings: Settings;
  typeOfCheck: CheckType;
}

export const CheckSettings: FC<Props> = ({ settings, labels = [], isEditor, typeOfCheck }) => {
  if (!settings) {
    return <div>Loading....</div>;
  }

  switch (typeOfCheck) {
    case CheckType.PING: {
      return <PingSettingsForm labels={labels} settings={settings.ping} isEditor={isEditor} />;
    }
    case CheckType.HTTP: {
      return <HttpSettingsForm labels={labels} settings={settings.http} isEditor={isEditor} />;
    }
    case CheckType.DNS: {
      return <DnsSettingsForm labels={labels} settings={settings.dns} isEditor={isEditor} />;
    }
    case CheckType.TCP: {
      return <TcpSettingsForm settings={settings} labels={labels} onUpdate={onUpdate} isEditor={isEditor} />;
    }
  }
};
