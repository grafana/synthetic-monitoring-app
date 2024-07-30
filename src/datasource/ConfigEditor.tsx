import React, { PureComponent } from 'react';
import { DataSourcePluginOptionsEditorProps } from '@grafana/data';
import { LegacyForms } from '@grafana/ui';

import { SecureJsonData, SMOptions } from './types';
import { InitializedJsonData } from 'types';

type ConfigEditorProps = DataSourcePluginOptionsEditorProps<SMOptions, SecureJsonData>;
type Options = ConfigEditorProps['options'];

export class ConfigEditor extends PureComponent<ConfigEditorProps> {
  render() {
    const { onOptionsChange, options } = this.props;

    return <ConfigEditorContent options={options} onOptionsChange={onOptionsChange} />;
  }
}

const ConfigEditorContent = ({
  options,
  onOptionsChange,
}: {
  options: Options;
  onOptionsChange: (options: Options) => void;
}) => {
  const { secureJsonData } = options;

  return (
    <>
      <br />
      <div className="gf-form-group">
        <div className="gf-form-inline">
          <div className="gf-form">
            <LegacyForms.SecretFormField
              isConfigured
              value={secureJsonData?.accessToken || ''}
              label="Access Token"
              placeholder="access token saved on the server"
              labelWidth={10}
              inputWidth={20}
              onReset={() => {
                onOptionsChange(resetAccessToken(options));
              }}
              onChange={(event) => {
                onOptionsChange({
                  ...options,
                  secureJsonData: {
                    accessToken: event.target.value,
                  },
                });
              }}
            />
          </div>
        </div>
      </div>
    </>
  );
};

function resetAccessToken(options: Options): Options {
  return {
    ...options,
    secureJsonFields: {
      ...options.secureJsonFields,
      accessToken: false,
    },
    secureJsonData: {
      ...options.secureJsonData,
      accessToken: '',
    },
  };
}

export function isValid(settings?: InitializedJsonData): boolean {
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
