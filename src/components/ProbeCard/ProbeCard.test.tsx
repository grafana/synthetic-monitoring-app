import React from 'react';
import { screen } from '@testing-library/react';
import { OFFLINE_PROBE, ONLINE_PROBE, PRIVATE_PROBE, PUBLIC_PROBE } from 'test/fixtures';
import { render } from 'test/render';
import { runTestAsViewer } from 'test/utils';

import { ROUTES } from 'types';
import { getRoute } from 'components/Routing';

import { ProbeCard } from './ProbeCard';
import 'test/silenceErrors';

it(`Displays the correct information`, () => {
  const probe = ONLINE_PROBE;
  render(<ProbeCard probe={probe} />);
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

it(`Displays the correct information for an online probe`, () => {
  render(<ProbeCard probe={ONLINE_PROBE} />);
  expect(screen.getByText(`Online`)).toBeInTheDocument();
});

it(`Displays the correct information for an offline probe`, () => {
  render(<ProbeCard probe={OFFLINE_PROBE} />);
  expect(screen.getByText(`Offline`)).toBeInTheDocument();
});

it(`Displays the correct information for a private probe`, () => {
  render(<ProbeCard probe={PRIVATE_PROBE} />);
  expect(screen.getByText(`Private`, { exact: false })).toBeInTheDocument();
  expect(screen.getByText(`Edit`)).toBeInTheDocument();
});

it(`Displays the correct information for a private probe as a viewer`, () => {
  runTestAsViewer();
  render(<ProbeCard probe={PRIVATE_PROBE} />);
  expect(screen.getByText(`View`)).toBeInTheDocument();
});

it(`Displays the correct information for a public probe`, () => {
  render(<ProbeCard probe={PUBLIC_PROBE} />);
  expect(screen.getByText(`Public`)).toBeInTheDocument();
  expect(screen.getByText(`View`)).toBeInTheDocument();
});

it('handles probe click', async () => {
  const probe = PRIVATE_PROBE;
  const { history, user } = render(<ProbeCard probe={probe} />);
  await user.click(screen.getByText(probe.name));
  expect(history.location.pathname).toBe(`${getRoute(ROUTES.EditProbe)}/${probe.id}`);
});
