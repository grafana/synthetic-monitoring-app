import React from 'react';
import { screen, waitFor } from '@testing-library/react';
import { DEFAULT_PROBES, PRIVATE_PROBE, PUBLIC_PROBE } from 'test/fixtures';
import { render } from 'test/render';
import { getInstanceMock, instanceSettings } from 'datasource/__mocks__/DataSource';

import { Probe, ROUTES } from 'types';
import { formatDate } from 'utils';
import { getRoute } from 'components/Routing';

import { EditProbe } from './EditProbe';
import 'test/silenceErrors';

const TOKEN_VALUE = `a very tasty token`;

const updateProbe = jest.fn().mockImplementation(() => Promise.resolve({ probe: PRIVATE_PROBE }));
const resetProbeToken = jest.fn().mockImplementation(() => Promise.resolve({ token: TOKEN_VALUE }));

const renderEditProbe = (probe: Probe) => {
  const mockedInstance = getInstanceMock(instanceSettings);
  mockedInstance.updateProbe = updateProbe;
  mockedInstance.resetProbeToken = resetProbeToken;

  return render(<EditProbe />, {
    route: `${getRoute(ROUTES.EditProbe)}/:id`,
    path: `${getRoute(ROUTES.EditProbe)}/${probe.id}`,
    instance: {
      api: mockedInstance,
    },
  });
};

describe(`Public probes`, () => {
  it(`displays the correct information`, () => {
    renderEditProbe(PUBLIC_PROBE);
    expect(screen.getByText(/They cannot be edited/)).toBeInTheDocument();
    checkInformation(PUBLIC_PROBE);
  });

  it(`does not allow editing public probes`, async () => {
    renderEditProbe(PUBLIC_PROBE);

    await screen.findByText('Back');
    expect(await getSaveButton()).not.toBeInTheDocument();
    expect(await getResetTokenButton()).not.toBeInTheDocument();
  });
});

describe(`Private probes`, () => {
  it(`displays the correct information`, () => {
    renderEditProbe(PRIVATE_PROBE);
    expect(screen.getByText(/This probe is private/)).toBeInTheDocument();
    expect(screen.getByDisplayValue(PRIVATE_PROBE.labels[0].name)).toBeInTheDocument();
    expect(screen.getByDisplayValue(PRIVATE_PROBE.labels[0].value)).toBeInTheDocument();

    checkInformation(PRIVATE_PROBE);
  });

  it('updates existing probe and redirects to the probes list', async () => {
    const { instance, history, user } = renderEditProbe(PRIVATE_PROBE);

    const saveButton = getSaveButton();
    await user.click(saveButton!);

    await waitFor(() => expect(history.location.pathname).toBe(getRoute(ROUTES.Probes)));
    expect(instance.api?.updateProbe).toHaveBeenCalledWith(PRIVATE_PROBE);
  });

  it(`shows the token modal on update`, async () => {
    const { user } = renderEditProbe(PRIVATE_PROBE);

    const resetButton = await getResetTokenButton();
    await user.click(resetButton!);

    const confirmButton = await screen.findByRole('button', { name: 'Reset Token' });
    await user.click(confirmButton);

    const tokenValue = await screen.findByText(TOKEN_VALUE);
    expect(tokenValue).toBeInTheDocument();
  });
});

// extract these so we can be sure the assertion for them NOT existing is accurate
// as they work when we are confirming their existence
function getSaveButton() {
  return screen.queryByRole('button', { name: 'Update probe' });
}

function getResetTokenButton() {
  return screen.queryByRole('button', { name: 'Reset Access Token' });
}

function checkInformation(probe: Probe) {
  expect(screen.getByDisplayValue(probe.name)).toBeInTheDocument();
  expect(screen.getByDisplayValue(probe.region)).toBeInTheDocument();
  expect(screen.getByDisplayValue(probe.latitude)).toBeInTheDocument();
  expect(screen.getByDisplayValue(probe.longitude)).toBeInTheDocument();
  expect(screen.getByText(probe.version)).toBeInTheDocument();
  expect(screen.getByText(probe.online ? 'Online' : 'Offline')).toBeInTheDocument();
  expect(screen.getByText(formatDate(probe.modified! * 1000))).toBeInTheDocument();
}
