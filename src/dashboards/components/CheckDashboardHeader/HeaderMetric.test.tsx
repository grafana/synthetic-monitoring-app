import React from 'react';
import { dateTime, FieldType, LoadingState, PanelData } from '@grafana/data';
import { render, screen } from '@testing-library/react';
import { useDashboardPanelQuery } from 'dashboards/hooks/useDashboardPanelQuery';

import { HeaderMetricDefinition } from './CheckDashboardHeader.types';

import { HeaderMetric } from './HeaderMetric';

jest.mock('dashboards/hooks/useDashboardPanelQuery', () => ({ useDashboardPanelQuery: jest.fn() }));

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

function queryResult(panelData: PanelData, isLoading: boolean) {
  return { panelData, isLoading, menuItems: undefined, title: undefined };
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
});
