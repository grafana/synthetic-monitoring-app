import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ProbeList } from './ProbeList';
import { InstanceContext } from 'contexts/InstanceContext';
import { getInstanceMock, instanceSettings } from '../datasource/__mocks__/DataSource';
import { AppPluginMeta } from '@grafana/data';
import { GlobalSettings } from 'types';

const onAddNew = jest.fn();
const onSelectProbe = jest.fn();

const defaultProbes = [
  {
    name: 'tacos',
    id: 35,
    public: false,
    latitude: 0.0,
    longitude: 0.0,
    region: '',
    labels: [],
    online: false,
    onlineChange: 0,
    version: 'v1',
    deprecated: false,
  },
  {
    name: 'burritos',
    id: 24,
    public: false,
    latitude: 0.0,
    longitude: 0.0,
    region: '',
    labels: [{ name: 'chimi', value: 'churri' }],
    online: false,
    onlineChange: 0,
    version: 'v1',
    deprecated: false,
  },
];

const renderProbeList = ({ probes = defaultProbes } = {}) => {
  const meta = {} as AppPluginMeta<GlobalSettings>;
  render(
    <InstanceContext.Provider value={{ instance: { api: getInstanceMock(instanceSettings) }, loading: false, meta }}>
      <ProbeList probes={probes} onAddNew={onAddNew} onSelectProbe={onSelectProbe} />
    </InstanceContext.Provider>
  );
};

it('renders offline probes', async () => {
  renderProbeList();
  const tacosProbe = await screen.findByText('tacos');
  const burritosProbe = await screen.findByText('burritos');
  const offlineStatus = await screen.findAllByText('Offline');
  expect(tacosProbe).toBeInTheDocument();
  expect(burritosProbe).toBeInTheDocument();
  expect(offlineStatus.length).toBe(2);
});

it('renders online probes', async () => {
  const onlineProbes = defaultProbes.map((probe) => ({ ...probe, online: true }));
  renderProbeList({ probes: onlineProbes });
  const onlineStatus = await screen.findAllByText('Online');
  expect(onlineStatus.length).toBe(2);
});

it('renders labels', async () => {
  renderProbeList();
  const label = await screen.findByText('chimi:churri');
  expect(label).toBeInTheDocument();
});

it('handles probe click', async () => {
  renderProbeList();
  const tacosProbe = await screen.findByText('tacos');
  userEvent.click(tacosProbe);
  expect(onSelectProbe).toHaveBeenCalledWith(35);
});

it('handles add new', async () => {
  renderProbeList();
  const addNewButton = await screen.findByRole('button', { name: 'New' });
  userEvent.click(addNewButton);
  expect(onAddNew).toHaveBeenCalledTimes(1);
});
