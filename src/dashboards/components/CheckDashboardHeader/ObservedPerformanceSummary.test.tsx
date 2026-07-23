import React from 'react';
import { FieldType, GrafanaTheme2, LoadingState, PanelData } from '@grafana/data';
import { useTheme2 } from '@grafana/ui';
import { render, renderHook, screen, within } from '@testing-library/react';
import { useDashboardPanelQuery } from 'dashboards/hooks/useDashboardPanelQuery';
import { BASIC_HTTP_CHECK } from 'test/fixtures/checks';

import { CheckDashboardHeaderProfile, HeaderMetricDefinition } from './CheckDashboardHeader.types';
import { HEALTH_EXPLANATION_PRIORITY } from './health/checkHealth.types';

import { resolveCheckHealth } from './health/checkHealth';
import { CheckHealthProvider } from './health/CheckHealthContext';
import { ObservedPerformanceSummary } from './ObservedPerformanceSummary';

jest.mock('dashboards/hooks/useDashboardPanelQuery', () => ({
  useDashboardPanelQuery: jest.fn(() => ({ panelData: { series: [] }, isLoading: false })),
}));

jest.mock('./LiveIncidentPrompt', () => ({
  LiveIncidentPrompt: () => <div data-testid="live-incident-prompt">Live incident prompt</div>,
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

  it('keeps the compact shared surface without rendering a heading or narrative', () => {
    render(<ObservedPerformanceSummary check={BASIC_HTTP_CHECK} profile={profile} />);

    const summary = screen.getByRole('region', { name: 'Observed performance' });
    const surface = within(summary).getByTestId('observed-performance-surface');

    expect(summary).toHaveStyle({ width: '100%' });
    expect(within(surface).getAllByTestId('observed-performance-metric')).toHaveLength(1);
    expect(screen.queryByRole('heading', { name: 'Observed performance' })).not.toBeInTheDocument();
    expect(screen.queryByText('Factual availability narrative')).not.toBeInTheDocument();
    expect(screen.queryByTestId('health-summary')).not.toBeInTheDocument();
    expect(screen.queryByTestId('live-incident-prompt')).not.toBeInTheDocument();
  });

  it('installs an opted-in profile health provider around the summary and metrics', () => {
    const model = resolveCheckHealth({
      metricIds: ['uptime'],
      evidence: [],
      rangeMode: 'live',
      evaluationAt: 1,
    });
    const healthProfile: CheckDashboardHeaderProfile<typeof BASIC_HTTP_CHECK> = {
      ...profile,
      HealthProvider: ({ children }) => (
        <CheckHealthProvider value={model}>
          <div data-testid="health-provider">{children}</div>
        </CheckHealthProvider>
      ),
    };

    render(<ObservedPerformanceSummary check={BASIC_HTTP_CHECK} profile={healthProfile} />);

    expect(screen.getByTestId('health-provider')).toContainElement(
      screen.getByRole('status', { name: 'Check health' })
    );
    expect(screen.getByTestId('health-provider')).toContainElement(
      screen.getByTestId('observed-performance-surface')
    );
    expect(screen.getByTestId('health-provider')).toContainElement(
      screen.getByTestId('live-incident-prompt')
    );
  });

  it('shows healthy now while retaining an unhealthy selected-range value and recovery trend', () => {
    const { result } = renderHook<GrafanaTheme2, undefined>(useTheme2);
    const reachabilityMetric: HeaderMetricDefinition<typeof BASIC_HTTP_CHECK> = {
      ...uptimeMetric,
      id: 'reachability',
      label: 'Reachability',
      selectValue: (data) => data.series[0]?.fields[0]?.values[0] ?? null,
      formatValue: (value) => (value === null ? 'N/A' : `${(value * 100).toFixed(2)}%`),
    };
    const model = resolveCheckHealth({
      metricIds: ['reachability'],
      evidence: [
        {
          id: 'alert-inactive',
          kind: 'alert',
          scope: 'evaluation',
          state: 'healthy',
          metricId: 'reachability',
          summary: 'Reachability alert is not firing',
          range: { from: 0, to: 1 },
          explanationPriority: HEALTH_EXPLANATION_PRIORITY.alert,
        },
        {
          id: 'incident-earlier',
          kind: 'alert',
          scope: 'range',
          state: 'unhealthy',
          metricId: 'reachability',
          summary: 'Reachability was critical earlier in this range',
          range: { from: 0, to: 1 },
          explanationPriority: HEALTH_EXPLANATION_PRIORITY.alert,
        },
      ],
      rangeMode: 'live',
      evaluationAt: 1,
      trends: {
        reachability: {
          shape: 'returned',
          label: 'Recovered earlier in this range',
          source: 'alert',
        },
      },
    });
    const healthProfile: CheckDashboardHeaderProfile<typeof BASIC_HTTP_CHECK> = {
      ...profile,
      getMetrics: () => [reachabilityMetric],
      HealthProvider: ({ children }) => (
        <CheckHealthProvider value={model}>{children}</CheckHealthProvider>
      ),
    };
    jest.mocked(useDashboardPanelQuery).mockReturnValue({
      panelData: {
        state: LoadingState.Done,
        series: [
          {
            fields: [
              {
                name: 'Value',
                type: FieldType.number,
                values: [0.968],
                config: {},
              },
            ],
            length: 1,
          },
        ],
        timeRange: {} as PanelData['timeRange'],
      },
      isLoading: false,
      menuItems: undefined,
      title: undefined,
    });

    render(<ObservedPerformanceSummary check={BASIC_HTTP_CHECK} profile={healthProfile} />);

    expect(screen.getByRole('status', { name: 'Check health' })).toHaveTextContent('Healthy now');
    expect(screen.getByText('96.80%')).toHaveStyle({ color: result.current.colors.error.text });
    expect(screen.getByRole('status', { name: 'Reachability trend' })).toHaveTextContent(
      'Recovered earlier in this range'
    );
  });
});
