import { useQuery } from '@tanstack/react-query';
import { dateTime } from '@grafana/data';
import { renderHook } from '@testing-library/react';

import { useAppTime } from 'contexts/AppTimeProvider';
import { useCheckDashboard } from 'contexts/CheckDashboardProvider';
import { useSMDatasourceContext } from 'contexts/SMDatasourceContext';
import { useLogsDS } from 'hooks/useLogsDS';
import { useMetricsDS } from 'hooks/useMetricsDS';

import { useDashboardPanelQuery } from './useDashboardPanelQuery';
import {
  useDashboardQuerySemanticValues,
  useDashboardTimeRange,
} from './useDashboardQuerySemanticValues';

jest.mock('@tanstack/react-query', () => ({
  useQuery: jest.fn(),
}));

jest.mock('contexts/AppTimeProvider', () => ({
  useAppTime: jest.fn(),
}));

jest.mock('contexts/CheckDashboardProvider', () => ({
  useCheckDashboard: jest.fn(),
}));

jest.mock('contexts/SMDatasourceContext', () => ({
  useSMDatasourceContext: jest.fn(),
}));

jest.mock('hooks/useLogsDS', () => ({
  useLogsDS: jest.fn(),
}));

jest.mock('hooks/useMetricsDS', () => ({
  useMetricsDS: jest.fn(),
}));

jest.mock('dashboards/components/buildPanelMenu', () => ({
  buildPanelMenu: jest.fn(() => []),
}));

jest.mock('./useDashboardQuerySemanticValues', () => ({
  useDashboardQuerySemanticValues: jest.fn(),
  useDashboardTimeRange: jest.fn(),
}));

const explicitRange = { from: 100, to: 200 };
const timeRange = {
  from: dateTime(explicitRange.from),
  to: dateTime(explicitRange.to),
  raw: { from: dateTime(explicitRange.from), to: dateTime(explicitRange.to) },
};

describe('useDashboardPanelQuery', () => {
  beforeEach(() => {
    jest.mocked(useAppTime).mockReturnValue({ timezone: 'utc' } as ReturnType<typeof useAppTime>);
    jest.mocked(useCheckDashboard).mockReturnValue({
      check: { id: 96 },
    } as ReturnType<typeof useCheckDashboard>);
    jest.mocked(useSMDatasourceContext).mockReturnValue({
      smDS: { meta: { jsonData: { stackId: 1 } } },
    } as unknown as ReturnType<typeof useSMDatasourceContext>);
    jest.mocked(useMetricsDS).mockReturnValue({ uid: 'metrics' } as ReturnType<typeof useMetricsDS>);
    jest.mocked(useLogsDS).mockReturnValue(undefined);
    jest.mocked(useDashboardTimeRange).mockReturnValue(timeRange);
    jest.mocked(useDashboardQuerySemanticValues).mockReturnValue({
      job: 'health',
      instance: 'https://example.test',
      probes: ['london'],
      rangeSeconds: 1,
      interval: '1s',
      intervalMs: 1_000,
      rateInterval: '1s',
    });
    jest.mocked(useQuery).mockReturnValue({
      data: undefined,
      error: null,
      isError: false,
      isFetching: false,
      isPending: true,
    } as ReturnType<typeof useQuery>);
  });

  it('passes an explicit range to time and semantic query hooks', () => {
    renderHook(() =>
      useDashboardPanelQuery(
        {
          id: 'baseline',
          pluginId: 'timeseries',
          fieldConfig: { defaults: {}, overrides: [] },
          options: {},
          targets: [{ refId: 'A', expr: 'up' }],
        },
        { range: explicitRange }
      )
    );

    expect(useDashboardTimeRange).toHaveBeenCalledWith(explicitRange);
    expect(useDashboardQuerySemanticValues).toHaveBeenCalledWith(500, explicitRange);
  });
});
