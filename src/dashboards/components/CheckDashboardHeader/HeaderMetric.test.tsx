import React from 'react';
import { dateTime, FieldType, GrafanaTheme2, LoadingState, PanelData } from '@grafana/data';
import { useTheme2 } from '@grafana/ui';
import { render, renderHook, screen } from '@testing-library/react';
import { useDashboardPanelQuery } from 'dashboards/hooks/useDashboardPanelQuery';
import { BASIC_HTTP_CHECK } from 'test/fixtures/checks';

import { HeaderMetricDefinition } from './CheckDashboardHeader.types';
import { HEALTH_EXPLANATION_PRIORITY, HealthState, MetricAlertModel } from './health/checkHealth.types';

import { resolveCheckHealth } from './health/checkHealth';
import { CheckHealthProvider } from './health/CheckHealthContext';
import { HeaderMetric } from './HeaderMetric';
import { HeaderMetricComparisonVisual, useHeaderMetricComparison } from './useHeaderMetricComparison';

jest.mock('dashboards/hooks/useDashboardPanelQuery', () => ({ useDashboardPanelQuery: jest.fn() }));
jest.mock('./useHeaderMetricComparison', () => ({ useHeaderMetricComparison: jest.fn() }));
jest.mock('./HeaderMetricSparkline', () => ({
  HeaderMetricSparkline: ({ state, visual }: { state?: HealthState; visual?: HeaderMetricComparisonVisual }) => (
    <div
      data-health-state={state}
      data-testid="header-metric-sparkline"
      data-visual-kind={visual?.kind}
      data-visual-label={visual && 'label' in visual ? visual.label : undefined}
    />
  ),
}));
jest.mock('./MetricAlertControl', () => ({
  MetricAlertControl: () => <div data-testid="metric-alert-control" />,
}));

const metric: HeaderMetricDefinition = {
  id: 'uptime',
  label: 'Uptime',
  description: 'Uptime description',
  definition: {
    id: 'uptime',
    pluginId: 'stat',
    targets: [],
    fieldConfig: { defaults: {}, overrides: [] },
    options: {},
  },
  selectValue: (data) => data.series[0]?.fields[0]?.values[0] ?? null,
  formatValue: (value) => (value === null ? 'N/A' : `${(value * 100).toFixed(2)}%`),
};

function data(state: LoadingState, value?: number): PanelData {
  return {
    state,
    series:
      value === undefined
        ? []
        : [{ fields: [{ name: 'value', type: FieldType.number, values: [value], config: {} }], length: 1 }],
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
  alert,
  metricDefinition = metric,
}: {
  rangeState: HealthState;
  trend?: string;
  alert?: MetricAlertModel;
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
    alerts: alert ? { [metricDefinition.id]: alert } : undefined,
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
  beforeEach(() => {
    jest.mocked(useHeaderMetricComparison).mockReturnValue(null);
  });

  it('renders a formatted value independently', () => {
    jest.mocked(useDashboardPanelQuery).mockReturnValue(queryResult(data(LoadingState.Done, 0.9998), false));

    render(<HeaderMetric metric={metric} />);

    expect(screen.getByRole('region', { name: 'Uptime' })).toHaveTextContent('99.98%');
  });

  it('shows the dataless value while the first result is still loading', () => {
    jest.mocked(useDashboardPanelQuery).mockReturnValue(queryResult(data(LoadingState.Loading), true));

    render(<HeaderMetric metric={metric} />);

    expect(screen.getByRole('region', { name: 'Uptime' })).toHaveTextContent('N/A');
    expect(screen.getByTestId('inline-loading-bar')).toBeVisible();
    expect(screen.getByLabelText('Updating Uptime')).toBeVisible();
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
    expect(screen.getByTestId('inline-loading-bar')).toBeVisible();
    expect(screen.getByLabelText('Updating Uptime')).toBeVisible();
    expect(screen.queryByText('Loading')).not.toBeInTheDocument();
  });

  it('keeps the last settled value when a refresh briefly clears the reading', () => {
    jest.mocked(useDashboardPanelQuery).mockReturnValue(queryResult(data(LoadingState.Done, 0.99), false));

    const { rerender } = render(<HeaderMetric metric={metric} />);

    expect(screen.getByRole('region', { name: 'Uptime' })).toHaveTextContent('99.00%');

    jest.mocked(useDashboardPanelQuery).mockReturnValue(queryResult(data(LoadingState.Loading), true));
    rerender(<HeaderMetric metric={metric} />);

    expect(screen.getByRole('region', { name: 'Uptime' })).toHaveTextContent('99.00%');
    expect(screen.getByTestId('inline-loading-bar')).toBeVisible();
    expect(screen.queryByText('N/A')).not.toBeInTheDocument();
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

    const expectedColor = tone === 'text' ? result.current.colors.text.primary : result.current.colors[tone].text;
    expect(screen.getByText('96.80%')).toHaveStyle({ color: expectedColor });
  });

  it('renders the provider-supplied trend without deriving new language', () => {
    jest.mocked(useDashboardPanelQuery).mockReturnValue(queryResult(data(LoadingState.Done, 0.968), false));

    renderWithHealth({
      rangeState: 'unhealthy',
      trend: 'Recovered earlier in this range',
    });

    const health = screen.getByTestId('header-metric-health');
    expect(health).toContainElement(screen.getByRole('status', { name: 'Uptime trend' }));
    expect(health).toHaveTextContent('Recovered earlier in this range');
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
    expect(screen.getByTestId('header-metric-chart')).toContainElement(screen.getByTestId('header-metric-sparkline'));

    jest
      .mocked(useDashboardPanelQuery)
      .mockReturnValueOnce(queryResult(data(LoadingState.Done, null as unknown as number), false))
      .mockReturnValueOnce(queryResult(data(LoadingState.Done), false));

    rerender(<HeaderMetric metric={metricWithSparkline} />);

    expect(screen.queryByTestId('header-metric-sparkline')).not.toBeInTheDocument();
  });

  it('passes selected-range health to the sparkline', () => {
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
      .mockReturnValueOnce(queryResult(data(LoadingState.Done, 0.968), false))
      .mockReturnValueOnce(queryResult(sparklineData(), false));

    renderWithHealth({
      rangeState: 'unhealthy',
      metricDefinition: metricWithSparkline,
    });

    expect(screen.getByTestId('header-metric-sparkline')).toHaveAttribute('data-health-state', 'unhealthy');
  });

  it('replaces the selected-range health trend with comparison evidence while retaining alerts', () => {
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
    jest.mocked(useHeaderMetricComparison).mockReturnValue({
      state: 'ready',
      readings: {
        plain: '3.1 pp lower',
        reference: '99.90%',
      },
      caption: 'Compared to Previous period',
      visual: {
        kind: 'overlay',
        series: metricWithSparkline.sparkline!.selectSeries(sparklineData())!,
        label: 'Previous period',
      },
    });
    jest
      .mocked(useDashboardPanelQuery)
      .mockReturnValueOnce(queryResult(data(LoadingState.Done, 0.968), false))
      .mockReturnValueOnce(queryResult(sparklineData(), false));

    renderWithHealth({
      rangeState: 'unhealthy',
      trend: 'Recovered earlier in this range',
      alert: { state: 'firing', fireCount: 2 },
      metricDefinition: metricWithSparkline,
    });

    expect(screen.getByTestId('header-metric-sparkline')).toHaveAttribute('data-visual-kind', 'overlay');
    expect(screen.getByTestId('header-metric-sparkline')).toHaveAttribute('data-visual-label', 'Previous period');
    expect(screen.getByTestId('header-metric-sparkline')).toHaveAttribute('data-health-state', 'unhealthy');
    expect(screen.queryByRole('status', { name: 'Uptime trend' })).not.toBeInTheDocument();
    expect(screen.getByTestId('header-metric-health')).toContainElement(
      screen.getByRole('status', { name: /Uptime comparison: 3.1 pp lower/ })
    );
    expect(
      screen.getByRole('status', {
        name: 'Alert is firing · 2 episodes in this range for Uptime',
      })
    ).toBeVisible();
  });

  it('shows the reference with the primary reading and the difference in the status slot', () => {
    jest.mocked(useDashboardPanelQuery).mockReturnValue(queryResult(data(LoadingState.Done, 0.968), false));
    jest.mocked(useHeaderMetricComparison).mockReturnValue({
      state: 'ready',
      readings: {
        plain: '3.1 pp lower',
        reference: '99.90%',
      },
      caption: 'Compared to Previous period',
      detail: '96.80% selected · 99.90% reference',
      visual: { kind: 'summary-only' },
    });

    render(<HeaderMetric metric={metric} />);

    const primary = screen.getByText('96.80%');
    const reading = screen.getByTestId('header-metric-reading');
    const reference = screen.getByTestId('header-metric-comparison-value');
    expect(primary.tagName).toBe('STRONG');
    expect(primary).not.toHaveTextContent('Previous period');
    expect(reading).toContainElement(primary);
    expect(reading).toContainElement(reference);
    expect(reference).toHaveTextContent('99.90%');
    const difference = screen.getByRole('status', {
      name: /Uptime comparison: 3.1 pp lower/,
    });
    expect(reading).not.toContainElement(difference);
    expect(screen.getByTestId('header-metric-health')).toContainElement(difference);
    expect(screen.getByTestId('header-metric-health')).toHaveTextContent('Compared to Previous period');
    expect(screen.getByTestId('header-metric-health')).not.toHaveTextContent('99.90%');
    expect(screen.queryByText('96.80% selected · 99.90% reference')).not.toBeInTheDocument();
  });

  it('shows a top loading bar for comparison fetches and keeps unavailable copy in the status slot', () => {
    jest.mocked(useDashboardPanelQuery).mockReturnValue(queryResult(data(LoadingState.Done, 0.968), false));
    jest.mocked(useHeaderMetricComparison).mockReturnValue({
      state: 'loading',
    });

    const { rerender } = render(<HeaderMetric metric={metric} />);

    expect(screen.getByTestId('inline-loading-bar')).toBeVisible();
    expect(screen.getByLabelText('Updating Uptime')).toBeVisible();
    expect(screen.queryByTestId('header-metric-health')).not.toBeInTheDocument();
    expect(screen.queryByText('Loading comparison')).not.toBeInTheDocument();
    expect(screen.getByText('96.80%')).toBeVisible();

    jest.mocked(useHeaderMetricComparison).mockReturnValue({
      state: 'unavailable',
      message: 'Comparison unavailable',
    });
    rerender(<HeaderMetric metric={metric} />);

    const unavailable = screen.getByText('Comparison unavailable');
    expect(screen.getByTestId('header-metric-reading')).not.toContainElement(unavailable);
    expect(screen.getByTestId('header-metric-health')).toContainElement(unavailable);
    expect(unavailable).toBeVisible();
    expect(unavailable).toHaveAttribute('aria-live', 'polite');
    expect(unavailable).toHaveAttribute('aria-atomic', 'true');
    expect(unavailable).not.toHaveAttribute('tabindex');
    expect(document.activeElement).not.toBe(unavailable);
    expect(screen.getByText('96.80%')).toBeVisible();
  });

  it('keeps selected-range health colour independent when only display comparison changes', () => {
    const { result } = renderHook<GrafanaTheme2, undefined>(useTheme2);
    jest.mocked(useDashboardPanelQuery).mockReturnValue(queryResult(data(LoadingState.Done, 0.968), false));
    jest.mocked(useHeaderMetricComparison).mockReturnValue({
      state: 'ready',
      readings: {
        plain: '3.1 pp lower',
        reference: '99.90%',
      },
      caption: 'Compared to Previous period',
      visual: { kind: 'summary-only' },
    });

    const { rerender } = renderWithHealth({ rangeState: 'unhealthy' });

    expect(screen.getByText('96.80%')).toHaveStyle({ color: result.current.colors.error.text });

    jest.mocked(useHeaderMetricComparison).mockReturnValue({
      state: 'ready',
      readings: {
        plain: '8% faster',
        reference: '0.47 s',
      },
      caption: 'Compared to 30 days ago',
      visual: { kind: 'summary-only' },
    });
    rerender(
      <CheckHealthProvider
        value={resolveCheckHealth({
          metricIds: [metric.id],
          evidence: [
            {
              id: 'range',
              kind: 'guardrail',
              scope: 'range',
              state: 'unhealthy',
              metricId: metric.id,
              summary: 'Selected range quality',
              range: { from: 0, to: 1 },
              explanationPriority: HEALTH_EXPLANATION_PRIORITY.guardrail,
            },
          ],
          rangeMode: 'live',
          evaluationAt: 1,
        })}
      >
        <HeaderMetric metric={metric} />
      </CheckHealthProvider>
    );

    expect(screen.getByText('96.80%')).toHaveStyle({ color: result.current.colors.error.text });
    expect(screen.getByRole('status', { name: /Uptime comparison: 8% faster/ })).toBeVisible();
  });
});
