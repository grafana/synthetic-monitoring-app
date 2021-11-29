import { TerraformConfig } from './TerraformConfig';
import { render, screen } from '@testing-library/react';
import React from 'react';
import userEvent from '@testing-library/user-event';
import { InstanceContext } from 'contexts/InstanceContext';
import { getInstanceMock } from 'datasource/__mocks__/DataSource';
import { AppPluginMeta } from '@grafana/data';
import { GlobalSettings } from 'types';

const renderTerraformConfig = async () => {
  const api = getInstanceMock();
  const instance = {
    api,
  };
  const meta = {} as AppPluginMeta<GlobalSettings>;
  return render(
    <InstanceContext.Provider value={{ instance, loading: false, meta }}>
      <TerraformConfig />
    </InstanceContext.Provider>
  );
};

const openConfig = async () => {
  await renderTerraformConfig();
  const launchButton = await screen.findByRole('button', { name: 'Generate config' });
  userEvent.click(launchButton);
  const modalHeader = await screen.findByRole('heading', { name: 'Terraform config' });
  expect(modalHeader).toBeInTheDocument();
};

it('renders without crashing', async () => {
  await openConfig();
});

it('displays correct config', async () => {
  await openConfig();
  const config = await screen.findByTestId('clipboard-content');
  const expectedConfig = {
    terraform: { required_providers: { grafana: { source: 'grafana/grafana' } } },
    provider: {
      grafana: {
        url: '',
        auth: '<add an api key from grafana.com>',
        sm_url: 'http://localhost:4030',
        sm_access_token: '<add an sm access token>',
      },
    },
    resource: {
      grafana_synthetic_monitoring_check: {
        a_jobname: {
          job: 'a jobname',
          target: 'example.com',
          enabled: true,
          probes: [1],
          labels: {},
          settings: { ping: { ip_version: 'V4', dont_fragment: false } },
        },
      },
      grafana_synthetic_monitoring_probe: {
        tacos: {
          labels: {
            Mr: 'Orange',
          },
          latitude: 0,
          longitude: 0,
          name: 'tacos',
          public: false,
          region: '',
        },
      },
    },
  };
  if (!config.textContent) {
    throw new Error('config has not content');
  }
  expect(JSON.parse(config.textContent)).toEqual(expectedConfig);
});
