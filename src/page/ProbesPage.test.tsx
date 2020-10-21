import React, { useState } from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ProbesPage } from './ProbesPage';
import { InstanceContext } from 'components/InstanceContext';
import { getInstanceMock, instanceSettings } from '../datasource/__mocks__/DataSource';
import * as runtime from '@grafana/runtime';
import { AppPluginMeta } from '@grafana/data';
import { GlobalSettings } from 'types';
jest.setTimeout(10000);

interface RenderArgs {
  id?: string;
  loading?: boolean;
}

const WithRouter = ({ id, loading = false }: RenderArgs = {}) => {
  const [routerId, setRouterId] = useState(id);
  jest.spyOn(runtime, 'getLocationSrv').mockImplementation(() => ({
    update: ({ query }) => {
      const queryId = query?.id?.toString() ?? '';
      setRouterId(queryId);
    },
  }));
  const meta = {} as AppPluginMeta<GlobalSettings>;
  return (
    <InstanceContext.Provider value={{ instance: { api: getInstanceMock(instanceSettings) }, loading, meta }}>
      <ProbesPage id={routerId} />
    </InstanceContext.Provider>
  );
};

const renderProbesPage = ({ id, loading = false }: RenderArgs = {}) => {
  render(<WithRouter id={id} loading={loading} />);
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
  waitFor(() => expect(secondAddNew).toBeInTheDocument());
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
  waitFor(() => expect(secondProbe).toBeInTheDocument());
});
