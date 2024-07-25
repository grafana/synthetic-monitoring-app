import React from 'react';
import { screen } from '@testing-library/react';
import { render } from 'test/render';

import { ConfigActions } from 'components/ConfigActions';

it('shows disable option when activated', async () => {
  render(<ConfigActions initialized />);

  const disableButton = await screen.findByText('Disable synthetic monitoring');
  expect(disableButton).toBeInTheDocument();
});

// todo: fix these when permissions added
it('shows enable action when disabled', async () => {
  render(<ConfigActions />, {
    meta: {
      enabled: false,
    },
  });

  const enableButton = await screen.findByText('Enable plugin');
  expect(enableButton).toBeInTheDocument();
});

// todo: fix these when permissions added
it('shows setup action when not intialized', async () => {
  render(<ConfigActions />);
  const setupButton = await screen.findByText('Setup');
  expect(setupButton).toBeInTheDocument();
});
