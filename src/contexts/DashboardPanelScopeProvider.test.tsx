import React from 'react';
import { MemoryRouter, useLocation } from 'react-router';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BASIC_HTTP_CHECK } from 'test/fixtures/checks';

import { DASHBOARD_URL_KEYS } from 'routing/dashboardUrlSchema';
import { useProbes } from 'data/useProbes';

import { CheckDashboardProvider } from './CheckDashboardProvider';
import {
  DashboardPanelScopeProvider,
  useDashboardPanelScope,
  useDashboardPanelScopeOptional,
} from './DashboardPanelScopeProvider';

jest.mock('data/useProbes', () => ({ useProbes: jest.fn() }));

function PanelScopeConsumer() {
  const { probes, setProbes, catalog, catalogLoading, catalogError } = useDashboardPanelScope();

  return (
    <>
      <output data-testid="selected-probes">{probes.join(',')}</output>
      <output data-testid="probe-catalog">{catalog.join(',')}</output>
      <output data-testid="catalog-loading">{String(catalogLoading)}</output>
      <output data-testid="catalog-error">{String(catalogError)}</output>
      <button type="button" onClick={() => setProbes(['ohio'])}>
        Select Ohio
      </button>
      <button type="button" onClick={() => setProbes([])}>
        Clear probes
      </button>
    </>
  );
}

function LocationConsumer() {
  return <output data-testid="location-search">{useLocation().search}</output>;
}

function OptionalScopeConsumer() {
  return <output data-testid="optional-scope">{String(useDashboardPanelScopeOptional())}</output>;
}

function renderPanelScope(initialEntry: string) {
  return render(
    <MemoryRouter initialEntries={[initialEntry]}>
      <CheckDashboardProvider check={BASIC_HTTP_CHECK} urlFormat="canonical">
        <DashboardPanelScopeProvider>
          <PanelScopeConsumer />
          <LocationConsumer />
        </DashboardPanelScopeProvider>
      </CheckDashboardProvider>
    </MemoryRouter>
  );
}

function mockProbeCatalog({
  isError = false,
  isLoading = false,
}: {
  isError?: boolean;
  isLoading?: boolean;
} = {}) {
  jest.mocked(useProbes).mockReturnValue({
    data: [
      { id: BASIC_HTTP_CHECK.probes[0], name: 'frankfurt' },
      { id: BASIC_HTTP_CHECK.probes[1], name: 'ohio' },
    ],
    isError,
    isLoading,
  } as ReturnType<typeof useProbes>);
}

describe('DashboardPanelScopeProvider', () => {
  beforeEach(() => {
    mockProbeCatalog();
  });

  it('reads selected probes from the canonical URL and exposes the configured catalog', () => {
    renderPanelScope('/checks/1?sm-v=1&sm-probe=frankfurt');

    expect(screen.getByTestId('selected-probes')).toHaveTextContent('frankfurt');
    expect(screen.getByTestId('probe-catalog')).toHaveTextContent('frankfurt,ohio');
    expect(screen.getByTestId('catalog-loading')).toHaveTextContent('false');
    expect(screen.getByTestId('catalog-error')).toHaveTextContent('false');
  });

  it('writes probe selection to the canonical URL while preserving time state', async () => {
    const user = userEvent.setup();
    renderPanelScope('/checks/1?sm-v=1&sm-from=now-3h&sm-to=now');

    await user.click(screen.getByRole('button', { name: 'Select Ohio' }));

    await waitFor(() => {
      const search = screen.getByTestId('location-search').textContent ?? '';
      expect(search).toContain('sm-from=now-3h');
      expect(search).toContain('sm-to=now');
      expect(search).toContain('sm-probe=ohio');
    });
  });

  it('clears the effective probe filter from the URL', async () => {
    const user = userEvent.setup();
    renderPanelScope('/checks/1?sm-v=1&sm-probe=frankfurt');

    await user.click(screen.getByRole('button', { name: 'Clear probes' }));

    await waitFor(() => {
      expect(screen.getByTestId('selected-probes')).toHaveTextContent('');
      expect(screen.getByTestId('location-search')).not.toHaveTextContent(DASHBOARD_URL_KEYS.probe);
    });
  });

  it('removes unknown URL probes after the configured catalog loads', async () => {
    renderPanelScope('/checks/1?sm-v=1&sm-probe=unknown');

    await waitFor(() => {
      expect(screen.getByTestId('selected-probes')).toHaveTextContent('');
      expect(screen.getByTestId('location-search')).not.toHaveTextContent(DASHBOARD_URL_KEYS.probe);
    });
  });

  it('retains URL selection when the catalog fails', () => {
    mockProbeCatalog({ isError: true });
    renderPanelScope('/checks/1?sm-v=1&sm-probe=frankfurt');

    expect(screen.getByTestId('selected-probes')).toHaveTextContent('frankfurt');
    expect(screen.getByTestId('catalog-error')).toHaveTextContent('true');
  });

  it('returns null from the optional hook outside panel scope', () => {
    render(
      <MemoryRouter>
        <CheckDashboardProvider check={BASIC_HTTP_CHECK}>
          <OptionalScopeConsumer />
        </CheckDashboardProvider>
      </MemoryRouter>
    );

    expect(screen.getByTestId('optional-scope')).toHaveTextContent('null');
  });
});
