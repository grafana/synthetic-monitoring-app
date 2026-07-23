import React from 'react';
import { dateTime, FieldType, GrafanaTheme2, LoadingState, PanelData } from '@grafana/data';
import { useTheme2 } from '@grafana/ui';
import { render, renderHook, screen } from '@testing-library/react';
import { useDashboardPanelQuery } from 'dashboards/hooks/useDashboardPanelQuery';
import { BASIC_HTTP_CHECK } from 'test/fixtures/checks';

import { HeaderMetricDefinition } from './CheckDashboardHeader.types';
import { HEALTH_EXPLANATION_PRIORITY, HealthState } from './health/checkHealth.types';

import { resolveCheckHealth } from './health/checkHealth';
import { CheckHealthProvider } from './health/CheckHealthContext';
import { HeaderMetric } from './HeaderMetric';

jest.mock('dashboards/hooks/useDashboardPanelQuery', () => ({ useDashboardPanelQuery: jest.fn() }));
jest.mock('./HeaderMetricSparkline', () => ({
  HeaderMetricSparkline: () => <div data-testid="header-metric-sparkline" />,
}));
jest.mock('./MetricAlertControl', () => ({
  MetricAlertControl: () => <div data-testid="metric-alert-control" />,
}));

const metric: HeaderMetricDefinition = {
  id: 'uptime',
  label: 'Uptime',
  description: 'Uptime description',
  definition: { id: 'uptime', pluginId: 'stat', targets: [], fieldConfig: { defaults: {}, overrides: [] }, options: {} },
  selectValue: (data) => data.series[0]?.fields[0]?.values[0] ?? null,
  formatValue: (value) => (value === null ? 'N/A' : `${(value * 100).toFixed(2)}%`),
};

function data(state: LoadingState, value?: number): PanelData {
  return {
    state,
    series: value === undefined ? [] : [{ fields: [{ name: 'value', type: FieldType.number, values: [value], config: {} }], length: 1 }],
    timeRange: { from: dateTime(0), to: dateTime(1), raw: { from: dateTime(0), to: dateTime(1) } },
  };
}

function sparklineData(state: LoadingState = LoadingState.Done): PanelData {
  return {
    state,
    series: [
      {
        length: 2,
        fields: [
          { name: 'Time', type: FieldType.time, values: [0, 1000], config: {} },
          { name: 'Value', type: FieldType.number, values: [0.9, 1], config: {} },
        ],
      },
    ],
    timeRange: { from: dateTime(0), to: dateTime(1), raw: { from: dateTime(0), to: dateTime(1) } },
  };
}

function queryResult(panelData: PanelData, isLoading: boolean) {
  return { panelData, isLoading, menuItems: undefined, title: undefined };
}

function renderWithHealth({
  rangeState,
  trend,
  metricDefinition = metric,
}: {
  rangeState: HealthState;
  trend?: string;
  metricDefinition?: HeaderMetricDefinition;
}) {
  const healthModel = resolveCheckHealth({
    metricIds: [metricDefinition.id],
    evidence: [
      {
        id: 'evaluation',
        kind: 'guardrail',
        scope: 'evaluation',
        state: 'healthy',
        metricId: metricDefinition.id,
        summary: 'Healthy at evaluation point',
        range: { from: 0, to: 1 },
        explanationPriority: HEALTH_EXPLANATION_PRIORITY.guardrail,
      },
      {
        id: 'range',
        kind: 'guardrail',
        scope: 'range',
        state: rangeState,
        metricId: metricDefinition.id,
        summary: 'Selected range quality',
        range: { from: 0, to: 1 },
        explanationPriority: HEALTH_EXPLANATION_PRIORITY.guardrail,
      },
    ],
    rangeMode: 'live',
    evaluationAt: 1,
    trends: trend
      ? {
          [metricDefinition.id]: {
            shape: 'returned',
            label: trend,
            source: 'alert',
          },
        }
      : undefined,
  });

  return render(
    <CheckHealthProvider value={healthModel}>
      <HeaderMetric metric={metricDefinition} />
    </CheckHealthProvider>
  );
}

describe('HeaderMetric', () => {
  it('renders a formatted value independently', () => {
    jest.mocked(useDashboardPanelQuery).mockReturnValue(queryResult(data(LoadingState.Done, 0.9998), false));

    render(<HeaderMetric metric={metric} />);

    expect(screen.getByRole('region', { name: 'Uptime' })).toHaveTextContent('99.98%');
  });

  it('renders loading when no usable value has arrived', () => {
    jest.mocked(useDashboardPanelQuery).mockReturnValue(queryResult(data(LoadingState.Loading), true));

    render(<HeaderMetric metric={metric} />);

    expect(screen.getByRole('region', { name: 'Uptime' })).toHaveTextContent('Loading');
  });

  it('places the metric alert control beside the metric information when a check is available', () => {
    jest.mocked(useDashboardPanelQuery).mockReturnValue(queryResult(data(LoadingState.Done, 0.9998), false));

    render(<HeaderMetric check={BASIC_HTTP_CHECK} metric={metric} />);

    expect(screen.getByTestId('metric-alert-control')).toBeVisible();
  });

  it('keeps a previous value visible while refreshing', () => {
    jest.mocked(useDashboardPanelQuery).mockReturnValue(queryResult(data(LoadingState.Loading, 0.99), true));

    render(<HeaderMetric metric={metric} />);

    expect(screen.getByRole('region', { name: 'Uptime' })).toHaveTextContent('99.00%');
    expect(screen.getByLabelText('Updating Uptime')).toBeVisible();
  });

  it('does not apply legacy threshold colours to factual values', () => {
    jest.mocked(useDashboardPanelQuery).mockReturnValue(queryResult(data(LoadingState.Done, 0.9998), false));
    const metricWithLegacyColor = { ...metric, getColor: () => '#ff0000' };

    render(<HeaderMetric metric={metricWithLegacyColor} />);

    expect(screen.getByText('99.98%')).not.toHaveStyle({ color: '#ff0000' });
  });

  it.each([
    ['healthy', 'success'],
    ['degraded', 'warning'],
    ['unhealthy', 'error'],
    ['unknown', 'text'],
  ] as const)('uses the selected-range %s tone for the value', (rangeState, tone) => {
    const { result } = renderHook<GrafanaTheme2, undefined>(useTheme2);
    jest.mocked(useDashboardPanelQuery).mockReturnValue(queryResult(data(LoadingState.Done, 0.968), false));

    renderWithHealth({ rangeState });

    const expectedColor =
      tone === 'text' ? result.current.colors.text.primary : result.current.colors[tone].text;
    expect(screen.getByText('96.80%')).toHaveStyle({ color: expectedColor });
  });

  it('renders the provider-supplied trend without deriving new language', () => {
    jest.mocked(useDashboardPanelQuery).mockReturnValue(queryResult(data(LoadingState.Done, 0.968), false));

    renderWithHealth({
      rangeState: 'unhealthy',
      trend: 'Recovered earlier in this range',
    });

    expect(screen.getByRole('status', { name: 'Uptime trend' })).toHaveTextContent(
      'Recovered earlier in this range'
    );
  });

  it('omits the trend line when the health provider supplies no trend', () => {
    jest.mocked(useDashboardPanelQuery).mockReturnValue(queryResult(data(LoadingState.Done, 0.968), false));

    renderWithHealth({ rangeState: 'healthy' });

    expect(screen.queryByRole('status', { name: 'Uptime trend' })).not.toBeInTheDocument();
  });

  it('retains the selected-range tone while refreshing a previous value', () => {
    const { result } = renderHook<GrafanaTheme2, undefined>(useTheme2);
    jest.mocked(useDashboardPanelQuery).mockReturnValue(queryResult(data(LoadingState.Loading, 0.968), true));

    renderWithHealth({ rangeState: 'unhealthy' });

    expect(screen.getByText('96.80%')).toHaveStyle({ color: result.current.colors.error.text });
    expect(screen.getByLabelText('Updating Uptime')).toBeVisible();
  });

  it('renders a sparkline when series data is available and omits it when empty', () => {
    const metricWithSparkline: HeaderMetricDefinition = {
      ...metric,
      sparkline: {
        definition: {
          id: 'uptime-sparkline',
          pluginId: 'timeseries',
          targets: [],
          fieldConfig: { defaults: {}, overrides: [] },
          options: {},
        },
        selectSeries: (panelData) => {
          const field = panelData.series[0]?.fields.find((entry) => entry.type === FieldType.number);
          return field && field.values.length >= 2 ? { y: field, timeRange: panelData.timeRange } : null;
        },
      },
    };

    jest
      .mocked(useDashboardPanelQuery)
      .mockReturnValueOnce(queryResult(data(LoadingState.Done, 0.9998), false))
      .mockReturnValueOnce(queryResult(sparklineData(), false));

    const { rerender } = render(<HeaderMetric metric={metricWithSparkline} />);

    expect(screen.getByTestId('header-metric-sparkline')).toBeVisible();

    jest
      .mocked(useDashboardPanelQuery)
      .mockReturnValueOnce(queryResult(data(LoadingState.Done, null as unknown as number), false))
      .mockReturnValueOnce(queryResult(data(LoadingState.Done), false));

    rerender(<HeaderMetric metric={metricWithSparkline} />);

    expect(screen.queryByTestId('header-metric-sparkline')).not.toBeInTheDocument();
  });
});
