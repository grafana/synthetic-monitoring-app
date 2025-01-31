import React from 'react';
import { screen, within } from '@testing-library/react';
import { DataTestIds } from 'test/dataTestIds';
import { PRIVATE_PROBE, PUBLIC_PROBE } from 'test/fixtures/probes';
import { render } from 'test/render';
import { probeToMetadataProbe } from 'test/utils';

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
