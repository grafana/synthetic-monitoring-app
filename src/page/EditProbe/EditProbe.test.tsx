import React from 'react';
import { screen } from '@testing-library/react';
import { OFFLINE_PROBE, PRIVATE_PROBE, PUBLIC_PROBE, UPDATED_PROBE_TOKEN_RESPONSE } from 'test/fixtures/probes';
import { apiRoute, getServerRequests } from 'test/handlers';
import { render } from 'test/render';
import { server } from 'test/server';
import { probeToMetadataProbe } from 'test/utils';

import { Probe } from 'types';
import { formatDate } from 'utils';
import { AppRoutes } from 'routing/types';
import { generateRoutePath, getRoute } from 'routing/utils';
import { PROBE_REFETCH_INTERVAL } from 'data/useProbes';

import { DataTestIds } from '../../test/dataTestIds';
import { EditProbe } from './EditProbe';

const renderEditProbe = (probe: Probe, forceViewMode = false) => {
  const route = forceViewMode ? AppRoutes.ViewProbe : AppRoutes.EditProbe;
  return render(<EditProbe forceViewMode={forceViewMode} />, {
    route: `${getRoute(route)}/:id`,
    path: `${getRoute(route)}/${probe.id}`,
  });
};

describe(`Public probes`, () => {
  it(`displays the correct information`, async () => {
    renderEditProbe(PUBLIC_PROBE, true);
    await screen.findByText(/They cannot be edited/);
    
    // Wait for the probe data to load and form to be populated
    await screen.findByDisplayValue(probeToMetadataProbe(PUBLIC_PROBE).displayName);
    checkInformation(PUBLIC_PROBE);
  });

  it(`does not allow editing public probes`, async () => {
    renderEditProbe(PUBLIC_PROBE, true);

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
    
    // Wait for the form to be populated with data
    await screen.findByDisplayValue(PRIVATE_PROBE.labels[0].name);
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
      generateRoutePath(AppRoutes.Probes)
    );

    const { body } = await read();

    expect(body).toMatchObject(PRIVATE_PROBE);
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

  it('probe status updates automatically', async () => {
    jest.useFakeTimers({ legacyFakeTimers: true });
    const { record, requests } = getServerRequests();
    server.use(
      apiRoute(
        'listProbes',
        {
          result: () => {
            return {
              json: [OFFLINE_PROBE],
            };
          },
        },
        record
      )
    );

    renderEditProbe(OFFLINE_PROBE);

    await screen.findByText(/Offline/);
    expect(await requests.length).toBe(1);
    server.use(
      apiRoute('listProbes', {
        result: () => {
          return {
            json: [
              {
                ...OFFLINE_PROBE,
                online: true,
              },
            ],
          };
        },
      })
    );

    jest.advanceTimersByTime(PROBE_REFETCH_INTERVAL);

    expect(await screen.findByText(/Online/)).toBeInTheDocument();

    jest.useRealTimers();
  });

  it(`triggers a refetch when the sync icon is clicked`, async () => {
    server.use(
      apiRoute('listProbes', {
        result: () => {
          return {
            json: [OFFLINE_PROBE],
          };
        },
      })
    );

    const { user } = renderEditProbe(OFFLINE_PROBE);
    expect(await screen.findByText('Offline')).toBeInTheDocument();
    const syncIcon = await screen.findByRole('button', { name: "Get the probe's latest status" });

    server.use(
      apiRoute('listProbes', {
        result: () => {
          return {
            json: [
              {
                ...OFFLINE_PROBE,
                online: true,
              },
            ],
          };
        },
      })
    );

    await user.click(syncIcon);
    expect(await screen.findByText('Online')).toBeInTheDocument();
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
  expect(screen.getByDisplayValue(probeToMetadataProbe(probe).displayName)).toBeInTheDocument();
  expect(screen.getByText(probe.region)).toBeInTheDocument();
  expect(screen.getByDisplayValue(probe.latitude)).toBeInTheDocument();
  expect(screen.getByDisplayValue(probe.longitude)).toBeInTheDocument();
  expect(screen.getByText(probe.version)).toBeInTheDocument();
  expect(screen.getByText(probe.online ? 'Online' : 'Offline')).toBeInTheDocument();
  expect(screen.getByText(formatDate(probe.modified! * 1000))).toBeInTheDocument();
}
