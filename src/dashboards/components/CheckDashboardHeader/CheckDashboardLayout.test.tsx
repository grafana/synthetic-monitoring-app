import React from 'react';
import { render, screen, within } from '@testing-library/react';
import { BASIC_HTTP_CHECK } from 'test/fixtures/checks';

import { CheckDashboardHeaderProfile, CheckHeaderDefinitionModel } from './CheckDashboardHeader.types';

import { CheckDashboardLayout } from './CheckDashboardLayout';

jest.mock('./CheckIdentitySummary', () => ({
  CheckIdentitySummary: () => <div data-testid="dashboard-band">Check identity</div>,
}));
jest.mock('./DashboardScopeControls', () => ({
  DashboardScopeControls: () => <div data-testid="dashboard-band">Dashboard scope controls</div>,
}));
jest.mock('./ObservedPerformanceSummary', () => ({
  ObservedPerformanceSummary: () => <div data-testid="dashboard-band">Observed performance</div>,
}));
jest.mock('./CheckDefinitionSummary', () => ({
  CheckDefinitionSummary: () => <div data-testid="dashboard-band">Check configuration</div>,
}));

const definition: CheckHeaderDefinitionModel = {
  title: 'HTTP check',
  typeLabel: 'HTTP',
  facts: [],
  labels: [],
};

const profile: CheckDashboardHeaderProfile<typeof BASIC_HTTP_CHECK> = {
  getDefinition: jest.fn(() => definition),
  getMetrics: jest.fn(() => []),
  Narrative: () => null,
};

describe('CheckDashboardLayout', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('orders the information bands and keeps sticky scope with the dashboard content', () => {
    render(
      <CheckDashboardLayout check={BASIC_HTTP_CHECK} profile={profile}>
        <div data-testid="dashboard-content">Panels</div>
      </CheckDashboardLayout>
    );

    const layout = screen.getByTestId('check-dashboard-layout');
    const bands = within(layout).getAllByTestId('dashboard-band');

    expect(bands.map((band) => band.textContent)).toEqual([
      'Check identity',
      'Observed performance',
      'Check configuration',
      'Dashboard scope controls',
    ]);
    expect(within(layout).getByTestId('dashboard-content')).toHaveTextContent('Panels');
    expect(profile.getDefinition).toHaveBeenCalledTimes(1);

    const stickyScope = within(layout).getByTestId('dashboard-scope-sticky');
    expect(stickyScope).toHaveStyle({ position: 'sticky', top: '48px' });
    expect(layout).toContainElement(stickyScope);
    expect(layout).toContainElement(screen.getByTestId('dashboard-content'));
  });
});
