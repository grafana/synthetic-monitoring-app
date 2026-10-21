import React from 'react';
import { GrafanaTheme2 } from '@grafana/data';
import { useTheme2 } from '@grafana/ui';
import { renderHook, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { PROBES_TEST_ID, ROUTER_TEST_ID } from 'test/dataTestIds';
import { OFFLINE_PROBE, ONLINE_PROBE, PRIVATE_PROBE, PUBLIC_PROBE } from 'test/fixtures/probes';
import { TENANT_LABEL_MODE } from 'test/fixtures/tenants';
import { apiRoute } from 'test/handlers';
import { render } from 'test/render';
import { server } from 'test/server';
import { probeToExtendedProbe, runTestAsRBACReader, runTestAsViewer } from 'test/utils';

import { type ExtendedProbe } from 'types';
import { AppRoutes } from 'routing/types';
import { generateRoutePath } from 'routing/utils';
import { LabelMode } from 'datasource/responses.types';

import { ProbeCard } from './ProbeCard';

function mockLabelMode(mode: LabelMode) {
  server.use(
    apiRoute('getLabelMode', {
      result: () => ({ json: { ...TENANT_LABEL_MODE, mode } }),
    })
  );
}

describe('probe labels and the tenant label mode', () => {
  const probe = probeToExtendedProbe(PRIVATE_PROBE);
  const [firstLabel] = probe.labels;
  const lastLabel = probe.labels[probe.labels.length - 1];

  it('prefixes probe labels with label_ while the tenant is in PREFIXED mode', async () => {
    mockLabelMode(LabelMode.Prefixed);
    render(<ProbeCard probe={probe} />);

    expect(await screen.findByText(`label_${firstLabel.name}:`, { exact: false })).toBeInTheDocument();
  });

  it('keeps the label_ prefix while the tenant is in DUAL_WRITE mode, since both forms are still written', async () => {
    mockLabelMode(LabelMode.DualWrite);
    render(<ProbeCard probe={probe} />);

    expect(await screen.findByText(`label_${firstLabel.name}:`, { exact: false })).toBeInTheDocument();
  });

  it('shows probe labels without the label_ prefix once the tenant has moved to UNPREFIXED', async () => {
    mockLabelMode(LabelMode.Unprefixed);
    render(<ProbeCard probe={probe} />);

    // Wait for the card to settle on the unprefixed form before asserting the prefix is gone,
    // otherwise the loading-state default (prefixed) could make the negative assertion pass vacuously.
    // The last label has no trailing separator, so its own text is exactly `${name}: `.
    const label = await screen.findByText((content) => content.trim() === `${lastLabel.name}:`);
    expect(label).toHaveTextContent(`${lastLabel.name}: ${lastLabel.value}`);
    expect(screen.queryByText(/label_/)).not.toBeInTheDocument();
  });
});

it(`Displays the correct information`, async () => {
  const probe = probeToExtendedProbe(ONLINE_PROBE);
  render(<ProbeCard probe={probe} />);

  await screen.findByText(probe.displayName);

  expect(screen.getByText((content) => content.startsWith(probe.displayName))).toBeInTheDocument();
  expect(screen.getByText(/Version/)).toBeInTheDocument();
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
  await screen.findByText(probe.displayName);

  // Check status (heart icon, accessible via tooltip/aria)
  const status = screen.getByTestId(PROBES_TEST_ID.cards.status);
  expect(status).toBeInTheDocument();
  expect(status).toHaveStyle({ color: result.current.colors.success.text });

  // Check status tooltip
  await userEvent.hover(status);
  const tooltip = await screen.findByTestId(PROBES_TEST_ID.cards.statusTooltip);
  expect(tooltip).toBeInTheDocument();
  expect(tooltip).toHaveTextContent(`Probe ${probe.displayName} is online`);
});

it(`Displays the correct information for an offline probe`, async () => {
  const { result } = renderHook<GrafanaTheme2, undefined>(useTheme2);
  const probe = probeToExtendedProbe(OFFLINE_PROBE);

  render(<ProbeCard probe={probe} />);
  await screen.findByText(probe.displayName);

  // Check status (heart-break icon when offline >1 min, accessible via tooltip/aria)
  const status = screen.getByTestId(PROBES_TEST_ID.cards.status);
  expect(status).toBeInTheDocument();
  expect(status).toHaveStyle({ color: result.current.colors.error.text });

  // Check status tooltip
  await userEvent.hover(status);
  const tooltip = await screen.findByTestId(PROBES_TEST_ID.cards.statusTooltip);
  expect(tooltip).toBeInTheDocument();
  expect(tooltip).toHaveTextContent(`Probe ${probe.displayName} is offline`);
});

it(`Displays the correct information for a private probe`, async () => {
  const probe = probeToExtendedProbe(PRIVATE_PROBE);

  render(<ProbeCard probe={probe} />);
  await screen.findByText(probe.displayName, { exact: false });

  const button = screen.getByTestId(PROBES_TEST_ID.card.actionButton);
  expect(button).toBeInTheDocument();
  expect(button).toHaveTextContent('Edit');
});

it(`Displays the correct information for a private probe as a viewer`, async () => {
  runTestAsViewer();
  const probe = probeToExtendedProbe(PRIVATE_PROBE);

  render(<ProbeCard probe={probe} />);
  await screen.findByText(probe.displayName, { exact: false });

  const button = screen.getByTestId(PROBES_TEST_ID.card.actionButton);
  expect(button).toBeInTheDocument();
  expect(button).toHaveTextContent('View');
});

it(`Displays the correct information for a private probe as a RBAC viewer`, async () => {
  runTestAsRBACReader();
  const probe = probeToExtendedProbe(PRIVATE_PROBE);

  render(<ProbeCard probe={probe} />);
  await screen.findByText(probe.displayName, { exact: false });

  const button = screen.getByTestId(PROBES_TEST_ID.card.actionButton);
  expect(button).toBeInTheDocument();
  expect(button).toHaveTextContent('View');
});

it(`Displays the correct information for a public probe`, async () => {
  const probe = probeToExtendedProbe(PUBLIC_PROBE);

  render(<ProbeCard probe={probe} />);
  await screen.findByText(probe.displayName, { exact: false });

  const button = screen.getByTestId(PROBES_TEST_ID.card.actionButton);
  expect(button).toBeInTheDocument();
  expect(button).toHaveTextContent('View');
});

it('handles public probe click', async () => {
  const probe = probeToExtendedProbe(PUBLIC_PROBE);
  const { user } = render(<ProbeCard probe={probe} />);
  await screen.findByText(probe.displayName);
  await user.click(screen.getByText(probe.displayName));

  expect(screen.getByTestId(ROUTER_TEST_ID.pathname)).toHaveTextContent(
    generateRoutePath(AppRoutes.ViewProbe, { id: probe.id! })
  );
});

it('handles private probe click', async () => {
  const probe = probeToExtendedProbe(PRIVATE_PROBE);
  const { user } = render(<ProbeCard probe={probe} />);
  await screen.findByText(probe.displayName);
  await user.click(screen.getByText(probe.displayName));

  expect(screen.getByTestId(ROUTER_TEST_ID.pathname)).toHaveTextContent(
    generateRoutePath(AppRoutes.EditProbe, { id: probe.id! })
  );
});

it.each<[ExtendedProbe, string]>([
  [probeToExtendedProbe(PUBLIC_PROBE, [11]), 'View 1 check'],
  [probeToExtendedProbe(PRIVATE_PROBE, [11, 22, 33, 44, 55, 66]), 'View 6 checks'],
])(
  'Displays the correct information for a probe that is in use',

  async (probe: ExtendedProbe, expectedText: string) => {
    render(<ProbeCard probe={probe} />);

    await screen.findByText(probe.displayName);

    const usageLink = screen.getByTestId(PROBES_TEST_ID.usageLink);
    expect(usageLink).toBeInTheDocument();
    expect(usageLink).toHaveTextContent(expectedText);
    expect(usageLink).toHaveAttribute(
      'href',
      `${generateRoutePath(AppRoutes.Checks)}?probes=${encodeURIComponent(probe.name)}`
    );
  }
);

it('Displays the correct information for a probe that is NOT in use', async () => {
  const probe = probeToExtendedProbe(PUBLIC_PROBE);

  render(<ProbeCard probe={probe} />);
  await screen.findByText(probe.displayName);

  const usageLink = screen.queryByTestId(PROBES_TEST_ID.usageLink);
  expect(usageLink).not.toBeInTheDocument();
});
