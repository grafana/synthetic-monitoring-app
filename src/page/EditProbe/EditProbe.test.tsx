import React from 'react';
import { screen, waitFor } from '@testing-library/react';
import { render } from 'test/render';

import { Probe, ROUTES } from 'types';
import { getInstanceMock, instanceSettings } from 'datasource/__mocks__/DataSource';
import { getRoute } from 'components/Routing';

import { EditProbe } from './EditProbe';

const TARGET_PROBE: Probe = {
  name: 'tacos',
  id: 32,
  public: false,
  latitude: 0.0,
  longitude: 0.0,
  region: 'EMEA',
  labels: [{ name: 'Mr', value: 'Orange' }],
  online: true,
  onlineChange: 0,
  version: 'unknown',
  deprecated: false,
};

const DEFAULT_PROBES = [
  TARGET_PROBE,
  {
    name: 'burritos',
    id: 42,
    public: true,
    latitude: 0.0,
    longitude: 0.0,
    region: 'AMER',
    labels: [{ name: 'Mr', value: 'Pink' }],
    online: false,
    onlineChange: 0,
    version: 'unknown',
    deprecated: false,
  },
];

const updateProbe = jest.fn().mockImplementation(() => Promise.resolve({ probe: TARGET_PROBE }));
const refetchProbes = jest.fn();

it('updates existing probe', async () => {
  const mockedInstance = getInstanceMock(instanceSettings);
  mockedInstance.updateProbe = updateProbe;

  const { instance, history, user } = render(<EditProbe probes={DEFAULT_PROBES} refetchProbes={refetchProbes} />, {
    route: `${getRoute(ROUTES.EditProbe)}/:id`,
    path: `${getRoute(ROUTES.EditProbe)}/${TARGET_PROBE.id}`,
    instance: {
      api: mockedInstance,
    },
  });

  const saveButton = await screen.findByRole('button', { name: 'Update probe' });
  await user.click(saveButton);
  await waitFor(() => {}, { timeout: 1000 });

  await waitFor(() => expect(history.location.pathname).toBe(getRoute(ROUTES.Probes)));
  expect(instance.api?.updateProbe).toHaveBeenCalledWith(TARGET_PROBE);
});
