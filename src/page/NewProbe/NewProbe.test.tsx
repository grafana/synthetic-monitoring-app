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

//regression for https://github.com/grafana/support-escalations/issues/11171
test(`Doesn't show a validation error for valid longitude values`, async () => {
  const { user } = renderNewProbe();
  const saveButton = await screen.findByText('Add new probe');
  const longitudeInput = await screen.findByLabelText('Longitude');
  await user.type(longitudeInput, '180.01');
  await user.click(saveButton);

  const errorMsg = await screen.queryByText('Longitude must be less than 180');
  expect(errorMsg).toBeInTheDocument();

  await user.clear(longitudeInput);
  await user.type(longitudeInput, '116.3971');
  expect(expect(errorMsg).not.toBeInTheDocument());
});
