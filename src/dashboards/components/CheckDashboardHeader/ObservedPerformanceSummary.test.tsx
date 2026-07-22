import React from 'react';
import { render, screen, within } from '@testing-library/react';
import { BASIC_HTTP_CHECK } from 'test/fixtures/checks';

import { CheckDashboardHeaderProfile, HeaderMetricDefinition } from './CheckDashboardHeader.types';

import { ObservedPerformanceSummary } from './ObservedPerformanceSummary';

jest.mock('dashboards/hooks/useDashboardPanelQuery', () => ({
  useDashboardPanelQuery: () => ({ panelData: { series: [] }, isLoading: false }),
}));

const uptimeMetric: HeaderMetricDefinition<typeof BASIC_HTTP_CHECK> = {
  id: 'uptime',
  label: 'Uptime',
  description: 'Uptime description',
  definition: { id: 'uptime', pluginId: 'stat', targets: [], fieldConfig: { defaults: {}, overrides: [] }, options: {} },
  selectValue: () => null,
  formatValue: () => 'N/A',
};

const profile: CheckDashboardHeaderProfile<typeof BASIC_HTTP_CHECK> = {
  getDefinition: jest.fn(),
  getMetrics: jest.fn(() => [uptimeMetric]),
  Narrative: () => <p>Factual availability narrative</p>,
};

describe('ObservedPerformanceSummary', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('keeps panel definitions stable when the check and profile have not changed', () => {
    const { rerender } = render(<ObservedPerformanceSummary check={BASIC_HTTP_CHECK} profile={profile} />);

    rerender(<ObservedPerformanceSummary check={BASIC_HTTP_CHECK} profile={profile} />);

    expect(profile.getMetrics).toHaveBeenCalledTimes(1);
  });

  it('groups the narrative and metric cells inside the bounded shared surface', () => {
    render(<ObservedPerformanceSummary check={BASIC_HTTP_CHECK} profile={profile} />);

    const summary = screen.getByRole('region', { name: 'Observed performance' });
    const surface = within(summary).getByTestId('observed-performance-surface');

    expect(summary).toHaveStyle({ maxWidth: '1040px' });
    expect(within(surface).getByText('Factual availability narrative')).toBeVisible();
    expect(within(surface).getAllByTestId('observed-performance-metric')).toHaveLength(1);
  });
});
