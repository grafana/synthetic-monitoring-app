import React from 'react';
import { screen, waitFor } from '@testing-library/react';
import { ADD_PROBE_TOKEN_RESPONSE } from 'test/fixtures/probes';
import { render } from 'test/render';
import { fillProbeForm } from 'test/utils';

import { ROUTES } from 'types';
import { getRoute } from 'components/Routing';

import { NewProbe } from './NewProbe';

jest.setTimeout(60000);

const renderNewProbe = () => {
  return render(<NewProbe />, {
    route: getRoute(ROUTES.NewProbe),
    path: getRoute(ROUTES.NewProbe),
  });
};

it(`creates a new probe, displays the modal and redirects on close`, async () => {
  const { history, user } = renderNewProbe();
  await fillProbeForm(user);

  const saveButton = await screen.findByText('Add new probe');
  await user.click(saveButton);
  await waitFor(() => expect(screen.queryByText(ADD_PROBE_TOKEN_RESPONSE)).toBeInTheDocument());
  const dismiss = screen.getByText('Go back to probes list');
  await user.click(dismiss);
  await waitFor(() => expect(history.location.pathname).toBe(getRoute(ROUTES.Probes)));
});
