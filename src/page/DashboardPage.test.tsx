import React from 'react';
import { MemoryRouter, Route, Routes } from 'react-router';
import { render, screen } from '@testing-library/react';
import { BASIC_DNS_CHECK, BASIC_HTTP_CHECK } from 'test/fixtures/checks';

import { AppRoutes } from 'routing/types';
import { generateRoutePath, getRoute } from 'routing/utils';
import { useChecks } from 'data/useChecks';
import { useCheckFolderAccess } from 'hooks/useCheckFolderAccess';

import { DashboardPage } from './DashboardPage';

jest.mock('data/useChecks');
jest.mock('hooks/useCheckFolderAccess');

jest.mock('./HttpDashboardRoute', () => ({
  HttpDashboardRoute: ({ check }: { check: { job: string } }) => (
    <div data-testid="http-dashboard-route">{check.job}</div>
  ),
}));

jest.mock('scenes/DNS/DnsDashboard', () => ({
  DNSDashboard: ({ check }: { check: { job: string } }) => (
    <div data-testid="dns-dashboard">{check.job}</div>
  ),
}));

const mockUseChecks = useChecks as jest.MockedFunction<typeof useChecks>;
const mockUseCheckFolderAccess = useCheckFolderAccess as jest.MockedFunction<typeof useCheckFolderAccess>;

function renderDashboardPage(checkId: number) {
  render(
    <MemoryRouter initialEntries={[generateRoutePath(AppRoutes.CheckDashboard, { id: checkId })]}>
      <Routes>
        <Route path={getRoute(AppRoutes.CheckDashboard)} element={<DashboardPage />} />
      </Routes>
    </MemoryRouter>
  );
}

describe('DashboardPage', () => {
  beforeEach(() => {
    mockUseCheckFolderAccess.mockReturnValue({
      getPermissions: () => ({ canRead: true }),
      isResolving: false,
    } as unknown as ReturnType<typeof useCheckFolderAccess>);
  });

  it('routes HTTP checks through HttpDashboardRoute', () => {
    mockUseChecks.mockReturnValue({
      data: [BASIC_HTTP_CHECK, BASIC_DNS_CHECK],
      isLoading: false,
    } as ReturnType<typeof useChecks>);

    renderDashboardPage(BASIC_HTTP_CHECK.id!);

    expect(screen.getByTestId('http-dashboard-route')).toHaveTextContent(BASIC_HTTP_CHECK.job);
    expect(screen.queryByTestId('dns-dashboard')).not.toBeInTheDocument();
  });

  it('routes DNS checks directly without the HTTP route seam', () => {
    mockUseChecks.mockReturnValue({
      data: [BASIC_HTTP_CHECK, BASIC_DNS_CHECK],
      isLoading: false,
    } as ReturnType<typeof useChecks>);

    renderDashboardPage(BASIC_DNS_CHECK.id!);

    expect(screen.getByTestId('dns-dashboard')).toHaveTextContent(BASIC_DNS_CHECK.job);
    expect(screen.queryByTestId('http-dashboard-route')).not.toBeInTheDocument();
  });
});
