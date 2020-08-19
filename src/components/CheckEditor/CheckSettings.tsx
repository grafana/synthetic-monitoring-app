import React, { PureComponent } from 'react';
import { Settings, CheckType } from 'types';
import { PingSettingsForm } from 'components/PingSettings';
import { HttpSettingsForm } from 'components/http/HttpSettings';
import DnsSettingsForm from 'components/DnsSettings';
import TcpSettingsForm from 'components/TcpSettings';

interface Props {
  isEditor: boolean;
  settings: Settings;
  typeOfCheck: CheckType;
  onUpdate: (settings: Settings) => void;
}

interface State {
  settings?: Settings;
}

export default class CheckSettings extends PureComponent<Props, State> {
  state: State = {};

  componentDidMount() {
    const { settings } = this.props;
    this.setState({ settings });
  }

  componentDidUpdate(oldProps: Props) {
    const { settings, typeOfCheck } = this.props;
    if (typeOfCheck !== oldProps.typeOfCheck) {
      this.setState({ settings });
    }
  }

  onUpdate = () => {
    this.props.onUpdate(this.state.settings!);
  };

  onJsonChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    let settings: Settings = {};
    settings[this.props.typeOfCheck] = JSON.parse(event.target.value);
    this.setState({ settings: settings }, this.onUpdate);
  };

  onSettingsChange = (settings: Settings) => {
    this.setState({ settings: settings }, this.onUpdate);
  };

  render() {
    const { settings } = this.state;
    if (!settings) {
      return <div>Loading....</div>;
    }
    const { isEditor } = this.props;

    switch (this.props.typeOfCheck) {
      case CheckType.PING: {
        return <PingSettingsForm settings={settings} onUpdate={this.onSettingsChange} isEditor={isEditor} />;
      }
      case CheckType.HTTP: {
        return <HttpSettingsForm settings={settings} onUpdate={this.onSettingsChange} isEditor={isEditor} />;
      }
      case CheckType.DNS: {
        return <DnsSettingsForm settings={settings} onUpdate={this.onSettingsChange} isEditor={isEditor} />;
      }
      case CheckType.TCP: {
        return <TcpSettingsForm settings={settings} onUpdate={this.onSettingsChange} isEditor={isEditor} />;
      }
    }
  }
}
