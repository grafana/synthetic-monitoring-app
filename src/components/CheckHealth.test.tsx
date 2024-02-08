import React from 'react';
import { waitFor } from '@testing-library/react';
import { render } from 'test/render';

import { AlertSensitivity, Check } from 'types';

import { CheckHealth } from './CheckHealth';

const defaultCheck = {
  basicMetricsOnly: true,
  id: 2,
  alertSensitivity: AlertSensitivity.None,
  tenantId: 1,
  frequency: 60000,
  offset: 0,
  timeout: 2500,
  enabled: true,
  labels: [],
  settings: {
    ping: {
      ipVersion: 'V4',
      dontFragment: false,
    },
  },
  probes: [1],
  target: 'grafana.com',
  job: 'tacos',
  created: 1597928927.7490728,
  modified: 1597928927.7490728,
} as Check;

const renderCheckHealth = (check: Check = defaultCheck) => {
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
