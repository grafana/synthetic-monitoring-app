import React from 'react';
import { GrafanaTheme2 } from '@grafana/data';
import { useTheme2 } from '@grafana/ui';
import { renderHook, screen, waitFor, within } from '@testing-library/react';
import { DataTestIds, PROBES_TEST_ID } from 'test/dataTestIds';
import { OFFLINE_PROBE, PRIVATE_PROBE, PUBLIC_PROBE } from 'test/fixtures/probes';
import { apiRoute } from 'test/handlers';
import { render } from 'test/render';
import { server } from 'test/server';
import { probeToMetadataProbe } from 'test/utils';

import { PROBE_REFETCH_INTERVAL } from 'data/useProbes';

import { Probes } from './Probes';

const renderProbeList = () => {
  return render(<Probes />);
};

it(`renders private probes in the correct list`, async () => {
  renderProbeList();
  const privateProbesList = await screen.findByTestId(DataTestIds.PRIVATE_PROBES_LIST);
  const privateProbe = await within(privateProbesList).findByText(probeToMetadataProbe(PRIVATE_PROBE).displayName);
  expect(privateProbe).toBeInTheDocument();
});

it(`renders public probes in the correct list`, async () => {
  renderProbeList();
  const publicProbesList = await screen.findByTestId(DataTestIds.PUBLIC_PROBES_LIST);
  const publicProbe = await within(publicProbesList).findByText(probeToMetadataProbe(PUBLIC_PROBE).displayName);
  expect(publicProbe).toBeInTheDocument();
});

it('renders add new button', async () => {
  renderProbeList();
  const addNewButton = await screen.findByText('Add Private Probe');
  expect(addNewButton).toBeInTheDocument();
});

it(`probe statuses update automatically`, async () => {
  jest.useFakeTimers({ legacyFakeTimers: true });
  server.use(
    apiRoute('listProbes', {
      result: () => {
        return {
          json: [OFFLINE_PROBE],
        };
      },
    })
  );

  const { result } = renderHook<GrafanaTheme2, undefined>(useTheme2);
  const offlineColor = result.current.colors.error.text;
  const onlineColor = result.current.colors.success.text;

  renderProbeList();
  const offlineStatus = await screen.findByTestId(PROBES_TEST_ID.cards.status);
  expect(offlineStatus).toHaveStyle(`background-color: ${offlineColor}`);

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

  await waitFor(
    async () => {
      const onlineStatus = await screen.findByTestId(PROBES_TEST_ID.cards.status);
      expect(onlineStatus).toHaveStyle(`background-color: ${onlineColor}`);
    },
    { timeout: 5000 }
  );

  jest.useRealTimers();
});
