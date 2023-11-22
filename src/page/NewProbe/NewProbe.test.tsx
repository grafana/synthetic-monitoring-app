import React from 'react';
import { screen, waitFor } from '@testing-library/react';
import { render } from 'test/render';
import { fillProbeForm, UPDATED_VALUES } from 'test/utils';
import { getInstanceMock, instanceSettings } from 'datasource/__mocks__/DataSource';

import { ROUTES } from 'types';
import { getRoute } from 'components/Routing';

import { NewProbe } from './NewProbe';
import 'test/silenceErrors';

const TOKEN_VALUE = `a very tasty token`;

const addProbe = jest.fn().mockImplementation(() => Promise.resolve({ probe: UPDATED_VALUES, token: TOKEN_VALUE }));

const renderNewProbe = () => {
  const mockedInstance = getInstanceMock(instanceSettings);
  mockedInstance.addProbe = addProbe;

  return render(<NewProbe />, {
    route: getRoute(ROUTES.NewProbe),
    path: getRoute(ROUTES.NewProbe),
    instance: {
      api: mockedInstance,
    },
  });
};

it(`creates a new probe, displays the modal and redirects on close`, async () => {
  const { history, user } = renderNewProbe();
  await fillProbeForm(user);

  const saveButton = await screen.findByRole('button', { name: 'Add new probe' });
  await user.click(saveButton);
  await waitFor(() => expect(screen.queryByText(TOKEN_VALUE)).toBeInTheDocument());
  const dismiss = screen.getByRole('button', { name: 'Go back to probes list' });
  await user.click(dismiss);
  await waitFor(() => expect(history.location.pathname).toBe(getRoute(ROUTES.Probes)));
});
