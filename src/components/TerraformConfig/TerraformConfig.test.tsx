import React from 'react';
import { screen, waitFor } from '@testing-library/react';
import { render } from 'test/render';

import { TerraformConfig } from './TerraformConfig';

const renderTerraformConfig = async () => {
  return waitFor(() => render(<TerraformConfig />));
};

const openConfig = async () => {
  const { user } = await renderTerraformConfig();
  const launchButton = await screen.findByRole('button', { name: 'Generate config' });
  await user.click(launchButton);
  const modalHeader = await screen.findByRole('heading', { name: 'Terraform config' });
  expect(modalHeader).toBeInTheDocument();
};

it('renders without crashing', async () => {
  await openConfig();
});

it('displays correct config', async () => {
  await openConfig();
  const config = await screen.findAllByTestId('clipboard-content');
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
        a_jobname_example_com: {
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
          region: 'EMEA',
        },
      },
    },
  };
  if (!config[0].textContent) {
    throw new Error('config has no content');
  }
  expect(JSON.parse(config[0].textContent)).toEqual(expectedConfig);
});
