import React from 'react';
import { screen } from '@testing-library/react';
import { render } from 'test/render';

import { ProbeList } from './ProbeList';

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
  return render(<ProbeList probes={probes} onAddNew={onAddNew} onSelectProbe={onSelectProbe} />);
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
  const { user } = renderProbeList();
  const tacosProbe = await screen.findByText('tacos');
  await user.click(tacosProbe);
  expect(onSelectProbe).toHaveBeenCalledWith(35);
});

it('handles add new', async () => {
  const { user } = renderProbeList();
  const addNewButton = await screen.findByRole('button', { name: 'New' });
  await user.click(addNewButton);
  expect(onAddNew).toHaveBeenCalledTimes(1);
});
