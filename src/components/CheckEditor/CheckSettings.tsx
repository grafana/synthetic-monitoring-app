import React, { PureComponent } from 'react';
import { Settings, CheckType, Label } from 'types';
import { PingSettingsForm } from 'components/PingSettings';
import { HttpSettingsForm } from 'components/http/HttpSettings';
import DnsSettingsForm from 'components/DnsSettings';
import TcpSettingsForm from 'components/TcpSettings';

export interface OnUpdateArgs {
  settings: Settings;
  labels?: Label[];
}

interface Props {
  isEditor: boolean;
  labels: Label[];
  settings: Settings;
  typeOfCheck: CheckType;
  onUpdate: (values: OnUpdateArgs) => void;
}

interface State {
  settings?: Settings;
  labels?: Label[];
}

export default class CheckSettings extends PureComponent<Props, State> {
  state: State = {};

  componentDidMount() {
    const { settings, labels = [] } = this.props;
    this.setState({ settings, labels });
  }

  componentDidUpdate(oldProps: Props) {
    const { settings, typeOfCheck, labels } = this.props;
    if (typeOfCheck !== oldProps.typeOfCheck) {
      this.setState({ settings, labels });
    }
  }

  onUpdate = () => {
    this.props.onUpdate({ settings: this.state.settings!, labels: this.state.labels });
  };

  onJsonChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    let settings: Settings = {};
    settings[this.props.typeOfCheck] = JSON.parse(event.target.value);
    this.setState({ settings: settings }, this.onUpdate);
  };

  onSettingsChange = (settings: Settings, labels: Label[]) => {
    this.setState({ settings, labels }, this.onUpdate);
  };

  render() {
    const { settings, labels } = this.state;
    if (!settings) {
      return <div>Loading....</div>;
    }
    const { isEditor } = this.props;

    switch (this.props.typeOfCheck) {
      case CheckType.PING: {
        return (
          <PingSettingsForm labels={labels} settings={settings} onUpdate={this.onSettingsChange} isEditor={isEditor} />
        );
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
