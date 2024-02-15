import React from 'react';
import { waitFor } from '@testing-library/react';
import { BASIC_PING_CHECK } from 'test/fixtures/checks';
import { render } from 'test/render';

import { CheckHealth } from './CheckHealth';

const renderCheckHealth = (check = BASIC_PING_CHECK) => {
  return render(<CheckHealth check={check} />);
};

test('renders without crashing', async () => {
  const { container } = renderCheckHealth();
  const icon = container.querySelector('svg');
  // should have a paused icon while loading
  expect(icon).toHaveClass('alert-state-paused');
  await waitFor(() => {
    // should turn to a green heart when data has loaded
    const heartIcon = container.querySelector('svg');
    expect(heartIcon).toHaveClass('alert-state-ok');
  });
});
