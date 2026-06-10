import React from 'react';
import { screen, waitFor, within } from '@testing-library/react';
import { DataTestIds } from 'test/dataTestIds';
import { BASIC_DNS_CHECK } from 'test/fixtures/checks';
import { OFFLINE_PROBE, PRIVATE_PROBE } from 'test/fixtures/probes';
import { apiRoute } from 'test/handlers';
import { render } from 'test/render';
import { server } from 'test/server';

import { AppRoutes } from 'routing/types';
import { generateRoutePath } from 'routing/utils';

import { HomePage } from './Home';

jest.mock('./components/TrendCharts', () => ({
  TrendCharts: () => <div data-testid="trend-charts" />,
}));

const renderHomePage = async () => {
  const res = render(<HomePage />, { route: AppRoutes.Home, path: generateRoutePath(AppRoutes.Home) });
  await waitFor(() => expect(screen.getByTestId('home-kpi-strip')).toBeInTheDocument(), { timeout: 10000 });

  return res;
};

describe('HomePage', () => {
  it('renders the empty state when there are no checks', async () => {
    server.use(apiRoute(`listChecks`, { result: () => ({ json: [] }) }));

    render(<HomePage />);

    expect(await screen.findByTestId(DataTestIds.ChecksEmptyState, { exact: false })).toBeInTheDocument();
  });

  it('shows the down check count in the KPI strip', async () => {
    await renderHomePage();

    const kpiStrip = screen.getByTestId('home-kpi-strip');
    const downCard = within(kpiStrip).getByText('Down').parentElement!;

    await waitFor(() => expect(within(downCard).getByText('1')).toBeInTheDocument());
  });

  it('lists the down check in the attention list with a link to its dashboard', async () => {
    await renderHomePage();

    const items = await screen.findAllByTestId('attention-list-item');
    expect(items).toHaveLength(1);

    const link = within(items[0]).getByRole('link', { name: BASIC_DNS_CHECK.job });
    expect(link).toHaveAttribute('href', generateRoutePath(AppRoutes.CheckDashboard, { id: BASIC_DNS_CHECK.id! }));
    expect(within(items[0]).getByText('Down')).toBeInTheDocument();
  });

  it('summarizes healthy checks instead of listing them', async () => {
    await renderHomePage();

    await screen.findAllByTestId('attention-list-item');

    expect(screen.getByText(/8 checks are healthy/)).toBeInTheDocument();
  });

  it('surfaces offline probes', async () => {
    server.use(apiRoute(`listProbes`, { result: () => ({ json: [PRIVATE_PROBE, OFFLINE_PROBE] }) }));

    await renderHomePage();

    const probeSection = await screen.findByTestId('probe-health-section');
    expect(within(probeSection).getByText(OFFLINE_PROBE.name)).toBeInTheDocument();
    expect(within(probeSection).getByText(/offline since/)).toBeInTheDocument();
  });

  it('reports all probes online when none are offline', async () => {
    server.use(apiRoute(`listProbes`, { result: () => ({ json: [PRIVATE_PROBE] }) }));

    await renderHomePage();

    const probeSection = await screen.findByTestId('probe-health-section');
    expect(within(probeSection).getByText(/are online/)).toBeInTheDocument();
  });
});
