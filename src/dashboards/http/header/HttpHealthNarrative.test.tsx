import React from 'react';
import { dateTime, FieldType, LoadingState, PanelData } from '@grafana/data';
import { render, screen } from '@testing-library/react';
import { useDashboardPanelQuery } from 'dashboards/hooks/useDashboardPanelQuery';
import { BASIC_HTTP_CHECK } from 'test/fixtures/checks';

import { HttpHealthNarrative } from './HttpHealthNarrative';

jest.mock('dashboards/hooks/useDashboardPanelQuery', () => ({ useDashboardPanelQuery: jest.fn() }));

function result(refId: string, value: number): PanelData['series'][number] {
  return { refId, fields: [{ name: 'value', type: FieldType.number, values: [value], config: {} }], length: 1 };
}

const timeRange = { from: dateTime(0), to: dateTime(1), raw: { from: dateTime(0), to: dateTime(1) } };

describe('HttpHealthNarrative', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('combines uptime and execution facts into a summary line', () => {
    jest.mocked(useDashboardPanelQuery).mockImplementation((definition) => ({
      panelData: {
        state: LoadingState.Done,
        series:
          definition.id === 'http-uptime'
            ? [result('uptime', 0.9998)]
            : [result('total', 4096), result('successful', 4044), result('failed', 52)],
        timeRange,
      },
      isLoading: false,
      menuItems: undefined,
      title: undefined,
    }));

    render(<HttpHealthNarrative check={BASIC_HTTP_CHECK} />);

    expect(screen.getByText(/Available from at least one location 99.98% of the time/)).toBeVisible();
    expect(screen.getByText(/52 of 4,096 individual executions failed/)).toBeVisible();
  });

  it('keeps its query definitions stable across renders', () => {
    jest.mocked(useDashboardPanelQuery).mockImplementation((definition) => ({
      panelData: {
        state: LoadingState.Done,
        series: definition.id === 'http-uptime' ? [result('uptime', 1)] : [],
        timeRange,
      },
      isLoading: false,
      menuItems: undefined,
      title: undefined,
    }));

    const { rerender } = render(<HttpHealthNarrative check={BASIC_HTTP_CHECK} />);
    const initialUptimeDefinition = jest.mocked(useDashboardPanelQuery).mock.calls[0][0];
    const initialExecutionDefinition = jest.mocked(useDashboardPanelQuery).mock.calls[1][0];

    rerender(<HttpHealthNarrative check={BASIC_HTTP_CHECK} />);

    expect(jest.mocked(useDashboardPanelQuery).mock.calls[2][0]).toBe(initialUptimeDefinition);
    expect(jest.mocked(useDashboardPanelQuery).mock.calls[3][0]).toBe(initialExecutionDefinition);
  });
});
