import React, { type PropsWithChildren } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { dateTime } from '@grafana/data';
import { act, renderHook, waitFor } from '@testing-library/react';
import { of, Subject } from 'rxjs';

import { createValueFrame } from '../query/types';
import { useAppTime } from 'contexts/AppTimeProvider';
import { useCheckDashboard } from 'contexts/CheckDashboardProvider';
import { useSMDatasourceContext } from 'contexts/SMDatasourceContext';
import { useLogsDS } from 'hooks/useLogsDS';
import { useMetricsDS } from 'hooks/useMetricsDS';

import { applyTransforms } from '../query/applyTransforms';
import { executeQueries } from '../query/executeQueries';
import { useDashboardPanelQuery } from './useDashboardPanelQuery';
import {
  useDashboardQuerySemanticValues,
  useDashboardTimeRange,
} from './useDashboardQuerySemanticValues';

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

jest.mock('../query/executeQueries', () => ({
  executeQueries: jest.fn(),
}));

jest.mock('../query/applyTransforms', () => ({
  ...jest.requireActual('../query/applyTransforms'),
  applyTransforms: jest.fn(),
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
const definition = {
  id: 'baseline',
  pluginId: 'timeseries',
  fieldConfig: { defaults: {}, overrides: [] },
  options: {},
  targets: [{ refId: 'A', expr: 'up' }],
};

function createQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });
}

function queryWrapper(queryClient: QueryClient) {
  return function QueryWrapper({ children }: PropsWithChildren) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
  };
}

describe('useDashboardPanelQuery', () => {
  beforeEach(() => {
    jest.mocked(executeQueries).mockReset().mockResolvedValue({ results: [], aborted: false });
    jest.mocked(applyTransforms).mockReset().mockImplementation((frames) => of(frames));
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
  });

  it('passes an explicit range to time and semantic query hooks', () => {
    const queryClient = createQueryClient();

    renderHook(() =>
      useDashboardPanelQuery(definition, { range: explicitRange, enabled: false }),
      { wrapper: queryWrapper(queryClient) }
    );

    expect(useDashboardTimeRange).toHaveBeenCalledWith(explicitRange);
    expect(useDashboardQuerySemanticValues).toHaveBeenCalledWith(500, explicitRange);
  });

  it('pauses execution without changing cache identity and resumes the same request', async () => {
    const queryClient = createQueryClient();
    const range = { from: 1_700_000_000_000, to: 1_700_003_600_000 };
    const { result, rerender } = renderHook(
      ({ enabled }) => useDashboardPanelQuery(definition, { range, enabled }),
      {
        initialProps: { enabled: false },
        wrapper: queryWrapper(queryClient),
      }
    );

    expect(executeQueries).not.toHaveBeenCalled();
    expect(result.current.panelData).toMatchObject({
      state: 'Done',
      series: [],
    });
    expect(result.current.isLoading).toBe(false);

    const pausedQueries = queryClient.getQueryCache().getAll();
    expect(pausedQueries).toHaveLength(1);
    const pausedQueryHash = pausedQueries[0].queryHash;

    rerender({ enabled: true });

    await waitFor(() => expect(executeQueries).toHaveBeenCalledTimes(1));
    expect(queryClient.getQueryCache().getAll()).toHaveLength(1);
    expect(queryClient.getQueryCache().getAll()[0].queryHash).toBe(pausedQueryHash);
  });

  it('publishes successful non-transformed frames on the first settled render', async () => {
    const queryClient = createQueryClient();
    const settledSnapshots: Array<{ isLoading: boolean; state: string; seriesLength: number }> = [];
    jest.mocked(executeQueries).mockResolvedValue({
      results: [
        {
          requestId: 'baseline',
          datasourceUid: 'metrics',
          frames: [createValueFrame('A', 1)],
        },
      ],
      aborted: false,
    });

    const { result } = renderHook(
      () => {
        const current = useDashboardPanelQuery(definition);
        settledSnapshots.push({
          isLoading: current.isLoading,
          state: current.panelData.state,
          seriesLength: current.panelData.series.length,
        });

        return current;
      },
      { wrapper: queryWrapper(queryClient) }
    );

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.panelData).toMatchObject({
      state: 'Done',
      series: [{ refId: 'A' }],
    });
    expect(settledSnapshots.filter(({ isLoading }) => !isLoading)).toEqual([
      {
        isLoading: false,
        state: 'Done',
        seriesLength: 1,
      },
    ]);
    expect(applyTransforms).not.toHaveBeenCalled();
  });

  it('keeps current transformed data loading without exposing prior-query frames', async () => {
    const queryClient = createQueryClient();
    const firstOutput = new Subject<Array<ReturnType<typeof createValueFrame>>>();
    const secondOutput = new Subject<Array<ReturnType<typeof createValueFrame>>>();
    const transformedDefinition = {
      ...definition,
      id: 'transformed-first',
      transforms: [{ id: 'reduce' }],
    };
    jest.mocked(applyTransforms).mockImplementation((frames) =>
      frames[0]?.refId === 'raw-first' ? firstOutput : secondOutput
    );
    jest
      .mocked(executeQueries)
      .mockResolvedValueOnce({
        results: [
          {
            requestId: 'transformed-first',
            datasourceUid: 'metrics',
            frames: [createValueFrame('raw-first', 1)],
          },
        ],
        aborted: false,
      })
      .mockResolvedValueOnce({
        results: [
          {
            requestId: 'transformed-second',
            datasourceUid: 'metrics',
            frames: [createValueFrame('raw-second', 2)],
          },
        ],
        aborted: false,
      });

    const { result, rerender } = renderHook(
      ({ panelDefinition }) => useDashboardPanelQuery(panelDefinition),
      {
        initialProps: { panelDefinition: transformedDefinition },
        wrapper: queryWrapper(queryClient),
      }
    );

    await waitFor(() =>
      expect(queryClient.getQueryCache().getAll()[0]?.state.fetchStatus).toBe('idle')
    );
    expect(applyTransforms).toHaveBeenCalledWith(
      [expect.objectContaining({ refId: 'raw-first' })],
      transformedDefinition.transforms,
      expect.any(Object)
    );
    expect(result.current.isLoading).toBe(true);
    expect(result.current.panelData.series).toEqual([]);

    act(() => {
      firstOutput.next([createValueFrame('transformed-first', 10)]);
    });

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.panelData.series).toMatchObject([{ refId: 'transformed-first' }]);

    rerender({
      panelDefinition: {
        ...transformedDefinition,
        id: 'transformed-second',
      },
    });

    await waitFor(() => expect(executeQueries).toHaveBeenCalledTimes(2));
    await waitFor(() =>
      expect(queryClient.getQueryCache().getAll()[1]?.state.fetchStatus).toBe('idle')
    );
    expect(applyTransforms).toHaveBeenCalledWith(
      [expect.objectContaining({ refId: 'raw-second' })],
      transformedDefinition.transforms,
      expect.any(Object)
    );
    expect(result.current.isLoading).toBe(true);
    expect(result.current.panelData.series).toEqual([]);

    act(() => {
      secondOutput.next([createValueFrame('transformed-second', 20)]);
    });

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.panelData.series).toMatchObject([{ refId: 'transformed-second' }]);
  });
});
