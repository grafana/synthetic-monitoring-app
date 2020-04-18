import React, { PureComponent, ChangeEvent } from 'react';
import { SecretFormField } from '@grafana/ui';
import { DataSourcePluginOptionsEditorProps } from '@grafana/data';
import { WorldpingOptions, SecureJsonData } from './types';

interface Props extends DataSourcePluginOptionsEditorProps<WorldpingOptions> {}

interface State {}

export class ConfigEditor extends PureComponent<Props, State> {
  onAccessTokenChange = (event: ChangeEvent<HTMLInputElement>) => {
    const { onOptionsChange, options } = this.props;
    onOptionsChange({
      ...options,
      secureJsonData: {
        accessToken: event.target.value,
      },
    });
  };

  onResetAccessToken = () => {
    const { onOptionsChange, options } = this.props;
    onOptionsChange({
      ...options,
      secureJsonFields: {
        ...options.secureJsonFields,
        accessToken: false,
      },
      secureJsonData: {
        ...options.secureJsonData,
        accessToken: '',
      },
    });
  };

  render() {
    const { options } = this.props;
    const { secureJsonFields } = options;
    const secureJsonData = (options.secureJsonData || {}) as SecureJsonData;

    return (
      <div className="gf-form-group">
        <h4>NOTE: this is normally created using the wizard... for now enter manually</h4>
        <div className="gf-form-inline">
          <div className="gf-form">
            <SecretFormField
              isConfigured={(secureJsonFields && secureJsonFields.accessToken) as boolean}
              value={secureJsonData.accessToken || ''}
              label="Access Token"
              placeholder="access token saved on the server"
              labelWidth={10}
              inputWidth={20}
              onReset={this.onResetAccessToken}
              onChange={this.onAccessTokenChange}
            />
          </div>
        </div>
      </div>
    );
  }
}
