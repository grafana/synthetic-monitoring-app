import React, { PureComponent, ChangeEvent } from 'react';
import { DataSourcePluginOptionsEditorProps } from '@grafana/data';
import { SMOptions, SecureJsonData } from './types';
import { LegacyForms } from '@grafana/ui';
import { TenantView } from 'components/TenantView';

interface Props extends DataSourcePluginOptionsEditorProps<SMOptions, SecureJsonData> {}

export class ConfigEditor extends PureComponent<Props> {
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
    function isConfigured(): boolean {
      return (secureJsonFields && secureJsonFields.accessToken) as boolean;
    }
    return (
      <div>
        {isValid(options.jsonData) && isConfigured() && <TenantView settings={options.jsonData} />}
        <br />
        <div className="gf-form-group">
          <div className="gf-form-inline">
            <div className="gf-form">
              <LegacyForms.SecretFormField
                isConfigured={isConfigured()}
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
      </div>
    );
  }
}

export function isValid(settings: SMOptions): boolean {
  if (!settings) {
    return false;
  }

  const { apiHost, metrics, logs } = settings;
  if (!apiHost || !metrics || !metrics.grafanaName || !metrics.hostedId) {
    return false;
  }

  if (!logs || !logs.grafanaName || !logs.hostedId) {
    return false;
  }

  return true;
}
