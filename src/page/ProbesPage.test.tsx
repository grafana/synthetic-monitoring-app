import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ProbeRouter } from './ProbeRouter';
import { InstanceContext } from 'contexts/InstanceContext';
import { getInstanceMock, instanceSettings } from '../datasource/__mocks__/DataSource';
import { AppPluginMeta } from '@grafana/data';
import { GlobalSettings, ROUTES } from 'types';
import { MemoryRouter, Route } from 'react-router-dom';
import { PLUGIN_URL_PATH } from 'components/constants';
jest.unmock('@grafana/runtime');
jest.setTimeout(10000);

interface RenderArgs {
  id?: string;
  loading?: boolean;
}

const renderProbesPage = ({ id, loading = false }: RenderArgs = {}) => {
  const meta = {} as AppPluginMeta<GlobalSettings>;
  return render(
    <MemoryRouter initialEntries={[`${PLUGIN_URL_PATH}${ROUTES.Probes}`]}>
      <Route path={`${PLUGIN_URL_PATH}${ROUTES.Probes}`}>
        <InstanceContext.Provider value={{ instance: { api: getInstanceMock(instanceSettings) }, loading, meta }}>
          <ProbeRouter />
        </InstanceContext.Provider>
      </Route>
    </MemoryRouter>
  );
};

const getAddNew = async () => {
  return await screen.findByRole('button', { name: 'New' });
};

it('shows probe editor when adding new', async () => {
  renderProbesPage();
  const addNew = await getAddNew();
  userEvent.click(addNew);
  const addProbeHeader = await screen.findByText('Add Probe');
  expect(addProbeHeader).toBeInTheDocument();
  const goBack = await screen.findByRole('button', { name: 'Back' });
  expect(addNew).not.toBeInTheDocument();
  userEvent.click(goBack);
  // Requery to determine if we are back on the probe page
  const secondAddNew = await getAddNew();
  await waitFor(() => expect(secondAddNew).toBeInTheDocument());
});

it('shows a probe when clicked', async () => {
  renderProbesPage();
  const probe = await screen.findByText('tacos');
  userEvent.click(probe);
  const probeEditorHeader = await screen.findByText('Configuration');
  const probeNameInput = await screen.findByLabelText('Probe Name', { exact: false });
  expect(probe).not.toBeInTheDocument();
  expect(probeEditorHeader).toBeInTheDocument();
  expect(probeNameInput).toHaveValue('tacos');
  const goBack = await screen.findByRole('button', { name: 'Back' });
  userEvent.click(goBack);
  // Requery to determine if we are back on the probe page
  const secondProbe = await screen.findByText('tacos');
  await waitFor(() => expect(secondProbe).toBeInTheDocument());
});
