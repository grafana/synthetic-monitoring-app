import React, { PureComponent, ChangeEvent } from 'react';
import { DataSourcePluginOptionsEditorProps } from '@grafana/data';
import { WorldpingOptions, SecureJsonData } from './types';
import { LegacyForms } from '@grafana/ui';
import { TenantView } from 'components/TenantView';

interface Props extends DataSourcePluginOptionsEditorProps<WorldpingOptions, SecureJsonData> {}

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

    if (isValid(options.jsonData)) {
      return <TenantView settings={options.jsonData} worldping={options.name} />;
    }

    return (
      <div className="gf-form-group">
        <a href={`/plugins/grafana-worldping-app/?page=setup&instance=${options.name}`}>Configure</a>

        <div className="gf-form-inline">
          <div className="gf-form">
            <LegacyForms.SecretFormField
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

export function isValid(settings: WorldpingOptions): boolean {
  if (!settings) {
    return false;
  }

  const { metrics, logs } = settings;
  if (!metrics || !metrics.grafanaName || !metrics.hostedId) {
    return false;
  }

  if (!logs || !logs.grafanaName || !logs.hostedId) {
    return false;
  }

  return true;
}
