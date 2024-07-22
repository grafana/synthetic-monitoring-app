import React, { PureComponent } from 'react';
import { QueryClientProvider } from '@tanstack/react-query';
import { AppPluginMeta, DataSourcePluginOptionsEditorProps } from '@grafana/data';
import { Container, LegacyForms } from '@grafana/ui';

import { SecureJsonData, SMOptions } from './types';
import { GlobalSettings } from 'types';
import { DatasourceContextProvider } from 'contexts/DatasourceContextProvider';
import { MetaContextProvider } from 'contexts/MetaContext';
import { queryClient } from 'data/queryClient';
import { LinkedDatasourceView } from 'components/LinkedDatasourceView';

interface Props extends DataSourcePluginOptionsEditorProps<SMOptions, SecureJsonData> {}

export class ConfigEditor extends PureComponent<Props> {
  render() {
    const { onOptionsChange, options } = this.props;

    return <ConfigEditorContent options={options} onOptionsChange={onOptionsChange} />;
  }
}

const ConfigEditorContent = ({ options, onOptionsChange }: { options: any; onOptionsChange: any }) => {
  const { secureJsonData, jsonData } = options;

  return (
    <QueryClientProvider client={queryClient}>
      <MetaContextProvider meta={options}>
        <DatasourceContextProvider>
          {isValid(jsonData) && secureJsonData?.accessToken && (
            <Container margin="sm">
              <LinkedDatasourceView type="prometheus" />
              <LinkedDatasourceView type="loki" />
            </Container>
          )}
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
        </DatasourceContextProvider>
      </MetaContextProvider>
    </QueryClientProvider>
  );
};

function resetAccessToken(meta: AppPluginMeta<GlobalSettings>): AppPluginMeta<GlobalSettings> {
  return {
    ...meta,
    secureJsonFields: {
      ...meta.secureJsonFields,
      accessToken: false,
    },
    secureJsonData: {
      ...meta.secureJsonData,
      accessToken: '',
    },
  };
}

export function isValid(settings?: GlobalSettings): boolean {
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
