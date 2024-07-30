import React from 'react';
import { screen } from '@testing-library/react';
import { render } from 'test/render';

import { hasGlobalPermission } from 'utils';
import { ConfigActions } from 'components/ConfigActions';

jest.mock('utils', () => {
  return {
    ...jest.requireActual('utils'),
    hasGlobalPermission: jest.fn().mockReturnValue(true),
  };
});

it('shows disable option when activated', async () => {
  render(<ConfigActions initialized />);

  const disableButton = await screen.findByText('Disable synthetic monitoring');
  expect(disableButton).toBeInTheDocument();
});

it('shows enable action when disabled', async () => {
  render(<ConfigActions />, {
    meta: {
      enabled: false,
    },
  });

  const enableButton = await screen.findByText('Enable plugin');
  expect(enableButton).toBeInTheDocument();
});

it('shows setup action when not intialized', async () => {
  render(<ConfigActions />);
  const setupButton = await screen.findByText('Setup');
  expect(setupButton).toBeInTheDocument();
});

it(`doesn't show any config actions when the user doesn't have write permissions`, async () => {
  jest.mocked(hasGlobalPermission).mockReturnValue(false);

  render(<ConfigActions initialized />);

  expect(screen.queryByText('Disable synthetic monitoring')).not.toBeInTheDocument();
  expect(screen.queryByText('Enable plugin')).not.toBeInTheDocument();
  expect(screen.queryByText('Setup')).not.toBeInTheDocument();
});

it(`doesn't show any config actions when the user doesn't have write permissions and meta enabled is false`, async () => {
  jest.mocked(hasGlobalPermission).mockReturnValue(false);

  render(<ConfigActions />, {
    meta: {
      enabled: false,
    },
  });

  expect(screen.queryByText('Disable synthetic monitoring')).not.toBeInTheDocument();
  expect(screen.queryByText('Enable plugin')).not.toBeInTheDocument();
  expect(screen.queryByText('Setup')).not.toBeInTheDocument();
});
