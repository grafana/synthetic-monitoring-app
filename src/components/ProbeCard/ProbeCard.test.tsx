import React from 'react';
import { screen } from '@testing-library/react';
import { OFFLINE_PROBE, ONLINE_PROBE, PRIVATE_PROBE, PUBLIC_PROBE } from 'test/fixtures/probes';
import { render } from 'test/render';
import { runTestAsViewer } from 'test/utils';

import { ROUTES } from 'types';
import { getRoute } from 'components/Routing.utils';

import { ProbeCard } from './ProbeCard';

it(`Displays the correct information`, async () => {
  const probe = ONLINE_PROBE;
  render(<ProbeCard probe={probe} />);
  await screen.findByText(probe.name);
  expect(screen.getByText(probe.name)).toBeInTheDocument();
  expect(screen.getByText(/Version:/)).toBeInTheDocument();
  expect(screen.getByText(probe.version, { exact: false })).toBeInTheDocument();

  expect(screen.getByText(/Labels:/)).toBeInTheDocument();
  for (let i = 0; i < probe.labels.length; i++) {
    const label = probe.labels[i];
    const labelText = screen.getByText(new RegExp(`${label.name}:${label.value}`));
    expect(labelText).toBeInTheDocument();
  }
});

it(`Displays the correct information for an online probe`, async () => {
  render(<ProbeCard probe={ONLINE_PROBE} />);
  const text = await screen.findByText(`Online`);
  expect(text).toBeInTheDocument();
});

it(`Displays the correct information for an offline probe`, async () => {
  render(<ProbeCard probe={OFFLINE_PROBE} />);
  const text = await screen.findByText(`Offline`);
  expect(text).toBeInTheDocument();
});

it(`Displays the correct information for a private probe`, async () => {
  render(<ProbeCard probe={PRIVATE_PROBE} />);
  const text = await screen.findByText(`Private`, { exact: false });
  expect(text).toBeInTheDocument();
  expect(screen.getByText(`Edit`)).toBeInTheDocument();
});

it(`Displays the correct information for a private probe as a viewer`, async () => {
  runTestAsViewer();
  render(<ProbeCard probe={PRIVATE_PROBE} />);
  const text = await screen.findByText(`View`);
  expect(text).toBeInTheDocument();
});

it(`Displays the correct information for a public probe`, async () => {
  render(<ProbeCard probe={PUBLIC_PROBE} />);
  const text = await screen.findByText(`Public`);
  expect(text).toBeInTheDocument();
  expect(screen.getByText(`View`)).toBeInTheDocument();
});

it('handles probe click', async () => {
  const probe = PRIVATE_PROBE;
  const { history, user } = render(<ProbeCard probe={probe} />);
  await screen.findByText(probe.name);
  await user.click(screen.getByText(probe.name));
  expect(history.location.pathname).toBe(`${getRoute(ROUTES.EditProbe)}/${probe.id}`);
});
