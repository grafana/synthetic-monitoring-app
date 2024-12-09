import React from 'react';
import { GrafanaTheme2 } from '@grafana/data';
import { useTheme2 } from '@grafana/ui';
import { renderHook, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { DataTestIds } from 'test/dataTestIds';
import { OFFLINE_PROBE, ONLINE_PROBE, PRIVATE_PROBE, PUBLIC_PROBE } from 'test/fixtures/probes';
import { render } from 'test/render';
import { probeToExtendedProbe, runTestAsRBACReader, runTestAsViewer } from 'test/utils';

import { type ExtendedProbe } from 'types';
import { ROUTES } from 'routing/types';
import { generateRoutePath } from 'routing/utils';

import { ProbeCard } from './ProbeCard';

it(`Displays the correct information`, async () => {
  const probe = probeToExtendedProbe(ONLINE_PROBE);
  render(<ProbeCard probe={probe} />);

  await screen.findByText(probe.name);

  expect(screen.getByText((content) => content.startsWith(probe.name))).toBeInTheDocument();
  expect(screen.getByText(/Version:/)).toBeInTheDocument();
  expect(screen.getByText(probe.version, { exact: false })).toBeInTheDocument();

  expect(screen.getByText(/Labels:/)).toBeInTheDocument();
  for (let i = 0; i < probe.labels.length; i++) {
    const label = probe.labels[i];
    expect(screen.getByText(label.name, { exact: false })).toHaveTextContent(`${label.name}: ${label.value}`);
  }
});

it(`Displays the correct information for an online probe`, async () => {
  const { result } = renderHook<GrafanaTheme2, undefined>(useTheme2);
  const probe = probeToExtendedProbe(ONLINE_PROBE);

  render(<ProbeCard probe={probe} />);
  await screen.findByText(probe.name);

  // Check status circle
  const status = screen.getByTestId('probe-online-status');
  expect(status).toBeInTheDocument();
  expect(status).toHaveStyle(`background-color: ${result.current.colors.success.text}`);

  // Check status tooltip
  await userEvent.hover(status);
  const tooltip = await screen.findByTestId('probe-online-status-tooltip');
  expect(tooltip).toBeInTheDocument();
  expect(tooltip).toHaveTextContent(`Probe ${probe.name} is online`);
});

it(`Displays the correct information for an offline probe`, async () => {
  const { result } = renderHook<GrafanaTheme2, undefined>(useTheme2);
  const probe = probeToExtendedProbe(OFFLINE_PROBE);

  render(<ProbeCard probe={probe} />);
  await screen.findByText(probe.name);

  // Check status circle
  const status = screen.getByTestId('probe-online-status');
  expect(status).toBeInTheDocument();
  expect(status).toHaveStyle(`background-color: ${result.current.colors.error.text}`);

  // Check status tooltip
  await userEvent.hover(status);
  const tooltip = await screen.findByTestId('probe-online-status-tooltip');
  expect(tooltip).toBeInTheDocument();
  expect(tooltip).toHaveTextContent(`Probe ${probe.name} is offline`);
});

it(`Displays the correct information for a private probe`, async () => {
  const probe = probeToExtendedProbe(PRIVATE_PROBE);

  render(<ProbeCard probe={probe} />);
  await screen.findByText(probe.name, { exact: false });

  const button = screen.getByTestId('probe-card-action-button');
  expect(button).toBeInTheDocument();
  expect(button).toHaveTextContent('Edit');
});

it(`Displays the correct information for a private probe as a viewer`, async () => {
  runTestAsViewer();
  const probe = probeToExtendedProbe(PRIVATE_PROBE);

  render(<ProbeCard probe={probe} />);
  await screen.findByText(probe.name, { exact: false });

  const button = screen.getByTestId('probe-card-action-button');
  expect(button).toBeInTheDocument();
  expect(button).toHaveTextContent('View');
});

it(`Displays the correct information for a private probe as a RBAC viewer`, async () => {
  runTestAsRBACReader();
  const probe = probeToExtendedProbe(PRIVATE_PROBE);

  render(<ProbeCard probe={probe} />);
  await screen.findByText(probe.name, { exact: false });

  const button = screen.getByTestId('probe-card-action-button');
  expect(button).toBeInTheDocument();
  expect(button).toHaveTextContent('View');
});

it(`Displays the correct information for a public probe`, async () => {
  const probe = probeToExtendedProbe(PUBLIC_PROBE);

  render(<ProbeCard probe={probe} />);
  await screen.findByText(probe.name, { exact: false });

  const button = screen.getByTestId('probe-card-action-button');
  expect(button).toBeInTheDocument();
  expect(button).toHaveTextContent('View');
});

it('handles public probe click', async () => {
  const probe = probeToExtendedProbe(PUBLIC_PROBE);
  const { user } = render(<ProbeCard probe={probe} />);
  await screen.findByText(probe.name);
  await user.click(screen.getByText(probe.name));

  expect(screen.getByTestId(DataTestIds.TEST_ROUTER_INFO_PATHNAME)).toHaveTextContent(
    generateRoutePath(ROUTES.ViewProbe, { id: probe.id! })
  );
});

it('handles private probe click', async () => {
  const probe = probeToExtendedProbe(PRIVATE_PROBE);
  const { user } = render(<ProbeCard probe={probe} />);
  await screen.findByText(probe.name);
  await user.click(screen.getByText(probe.name));

  expect(screen.getByTestId(DataTestIds.TEST_ROUTER_INFO_PATHNAME)).toHaveTextContent(
    generateRoutePath(ROUTES.EditProbe, { id: probe.id! })
  );
});

it.each<[ExtendedProbe, string]>([
  [probeToExtendedProbe(PUBLIC_PROBE, [11]), 'Used in 1 check'],
  [probeToExtendedProbe(PRIVATE_PROBE, [11, 22, 33, 44, 55, 66]), 'Used in 6 checks'],
])(
  'Displays the correct information for a probe that is in use',

  async (probe: ExtendedProbe, expectedText: string) => {
    const { user } = render(<ProbeCard probe={probe} />);

    await screen.findByText(probe.name);

    const usageLink = screen.getByTestId(DataTestIds.PROBE_USAGE_LINK);
    expect(usageLink).toBeInTheDocument();
    expect(usageLink).toHaveTextContent(expectedText);
    await user.click(usageLink);
    expect(screen.getByTestId(DataTestIds.TEST_ROUTER_INFO_PATHNAME)).toHaveTextContent(
      generateRoutePath(ROUTES.Checks)
    );
    expect(screen.getByTestId(DataTestIds.TEST_ROUTER_INFO_SEARCH)).toHaveTextContent(`?probes=${probe.name}`);
  }
);

it('Displays the correct information for a probe that is NOT in use', async () => {
  const probe = probeToExtendedProbe(PUBLIC_PROBE);

  render(<ProbeCard probe={probe} />);
  await screen.findByText(probe.name);

  const usageLink = screen.queryByTestId(DataTestIds.PROBE_USAGE_LINK);
  expect(usageLink).not.toBeInTheDocument();
});
