import React from 'react';
import { screen } from '@testing-library/react';
import { PRIVATE_PROBE, PUBLIC_PROBE, UPDATED_PROBE_TOKEN_RESPONSE } from 'test/fixtures/probes';
import { apiRoute, getServerRequests } from 'test/handlers';
import { render } from 'test/render';
import { server } from 'test/server';

import { Probe, ROUTES } from 'types';
import { formatDate } from 'utils';
import { getRoute } from 'components/Routing.utils';

import { generateRoutePath } from '../../routes';
import { DataTestIds } from '../../test/dataTestIds';
import { EditProbe } from './EditProbe';

const renderEditProbe = (probe: Probe) => {
  return render(<EditProbe />, {
    route: `${getRoute(ROUTES.EditProbe)}/:id`,
    path: `${getRoute(ROUTES.EditProbe)}/${probe.id}`,
  });
};

describe(`Public probes`, () => {
  it(`displays the correct information`, async () => {
    renderEditProbe(PUBLIC_PROBE);
    const text = await screen.findByText(/They cannot be edited/);
    expect(text).toBeInTheDocument();
    checkInformation(PUBLIC_PROBE);
  });

  it(`does not allow editing public probes`, async () => {
    renderEditProbe(PUBLIC_PROBE);

    await screen.findByText('Back');
    expect(getSaveButton()).not.toBeInTheDocument();
    expect(getResetTokenButton()).not.toBeInTheDocument();
  });
});

describe(`Private probes`, () => {
  it(`displays the correct information`, async () => {
    renderEditProbe(PRIVATE_PROBE);
    const text = await screen.findByText(/This probe is private/);
    expect(text).toBeInTheDocument();
    expect(screen.getByDisplayValue(PRIVATE_PROBE.labels[0].name)).toBeInTheDocument();
    expect(screen.getByDisplayValue(PRIVATE_PROBE.labels[0].value)).toBeInTheDocument();

    checkInformation(PRIVATE_PROBE);
  });

  it('updates existing probe and redirects to the probes list', async () => {
    const { record, read } = getServerRequests();
    server.use(apiRoute(`updateProbe`, {}, record));
    const { user } = renderEditProbe(PRIVATE_PROBE);
    await screen.findByText(/This probe is private/);

    const saveButton = getSaveButton();
    await user.click(saveButton!);

    expect(screen.getByTestId(DataTestIds.TEST_ROUTER_INFO_PATHNAME)).toHaveTextContent(
      generateRoutePath(ROUTES.Probes)
    );

    const { body } = await read();

    expect(body).toEqual(PRIVATE_PROBE);
  });

  it(`shows the token modal on update`, async () => {
    const { user } = renderEditProbe(PRIVATE_PROBE);
    await screen.findByText(/This probe is private/);
    const resetButton = getResetTokenButton();
    await user.click(resetButton!);

    const confirmButton = await screen.findByText('Reset Token');
    await user.click(confirmButton);

    const tokenValue = await screen.findByText(UPDATED_PROBE_TOKEN_RESPONSE);
    expect(tokenValue).toBeInTheDocument();
  });
});

// extract these so we can be sure the assertion for them NOT existing is accurate
// as they work when we are confirming their existence
function getSaveButton() {
  return screen.queryByText('Update probe');
}

function getResetTokenButton() {
  return screen.queryByText('Reset Access Token');
}

function checkInformation(probe: Probe) {
  expect(screen.getByDisplayValue(probe.name)).toBeInTheDocument();
  expect(screen.getByText(probe.region)).toBeInTheDocument();
  expect(screen.getByDisplayValue(probe.latitude)).toBeInTheDocument();
  expect(screen.getByDisplayValue(probe.longitude)).toBeInTheDocument();
  expect(screen.getByText(probe.version)).toBeInTheDocument();
  expect(screen.getByText(probe.online ? 'Online' : 'Offline')).toBeInTheDocument();
  expect(screen.getByText(formatDate(probe.modified! * 1000))).toBeInTheDocument();
}
