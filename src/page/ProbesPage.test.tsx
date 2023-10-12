import React from 'react';
import { screen, waitFor } from '@testing-library/react';

import { render } from 'test/render';
import { ProbeRouter } from './ProbeRouter';
import { ROUTES } from 'types';
import { PLUGIN_URL_PATH } from 'components/constants';
jest.setTimeout(10000);

const renderProbesPage = () => {
  return render(<ProbeRouter />, {
    path: `${PLUGIN_URL_PATH}${ROUTES.Probes}`,
    route: `${PLUGIN_URL_PATH}${ROUTES.Probes}`,
  });
};

const getAddNew = async () => {
  return await screen.findByRole('button', { name: 'New' });
};

it('shows probe editor when adding new', async () => {
  const { user } = renderProbesPage();
  const addNew = await getAddNew();
  await user.click(addNew);
  const addProbeHeader = await screen.findByText('Add Probe');
  expect(addProbeHeader).toBeInTheDocument();
  const goBack = await screen.findByRole('button', { name: 'Back' });
  expect(addNew).not.toBeInTheDocument();
  await user.click(goBack);
  // Requery to determine if we are back on the probe page
  const secondAddNew = await getAddNew();
  await waitFor(() => expect(secondAddNew).toBeInTheDocument());
});

it('shows a probe when clicked', async () => {
  const { user } = renderProbesPage();
  const probe = await screen.findByText('tacos');
  await user.click(probe);
  const probeEditorHeader = await screen.findByText('Configuration');
  const probeNameInput = await screen.findByLabelText('Probe Name', { exact: false });
  expect(probe).not.toBeInTheDocument();
  expect(probeEditorHeader).toBeInTheDocument();
  expect(probeNameInput).toHaveValue('tacos');
  const goBack = await screen.findByRole('button', { name: 'Back' });
  await user.click(goBack);
  // Requery to determine if we are back on the probe page
  const secondProbe = await screen.findByText('tacos');
  await waitFor(() => expect(secondProbe).toBeInTheDocument());
});
