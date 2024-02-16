import React from 'react';
import { screen, waitFor } from '@testing-library/react';
import { BASIC_PING_CHECK } from 'test/fixtures/checks';
import { TERRAFORM_BASIC_PING_CHECK } from 'test/fixtures/terraform';
import { render } from 'test/render';
import { getInstanceMock } from 'datasource/__mocks__/DataSource';

import { TerraformConfig } from './TerraformConfig';

const renderTerraformConfig = async () => {
  const api = getInstanceMock();
  api.listChecks = jest.fn().mockResolvedValue([BASIC_PING_CHECK]);

  return waitFor(() =>
    render(<TerraformConfig />, {
      instance: {
        api,
      },
    })
  );
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

  if (!config[0].textContent) {
    throw new Error('config has no content');
  }

  expect(JSON.parse(config[0].textContent)).toEqual(TERRAFORM_BASIC_PING_CHECK);
});
