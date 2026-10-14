import { act, renderHook, waitFor } from '@testing-library/react';
import { endingLogFactory } from 'test/factories/executionLogs';
import { COMPLEX_BROWSER_CHECK } from 'test/fixtures/checks';
import {
  faroMetricFrame,
  faroRunFrame,
  FRONTEND_RUN_DURATION,
  FRONTEND_TIMEPOINT_START,
  FrontendContextRun,
  OHIO_FRONTEND_RETRY,
  OHIO_FRONTEND_RUN,
} from 'test/fixtures/frontendContext';
import { apiRoute, getServerRequests } from 'test/handlers';
import { DatasourceQueryRequest } from 'test/handlers/queryDatasource';
import { createWrapper } from 'test/render';
import { server } from 'test/server';

import { CheckEventType, StatefulTimepoint } from './TimepointExplorer.types';
import { getQueryClient } from 'data/queryClient';

import { BUILD_LOOKBACK_MS, useAppBuildChangeEvents, useFaroRunContext, useRunBuildHistory } from './FrontendContext.hooks';

afterEach(() => {
  jest.useRealTimers();
});

function timepointsWith(run: FrontendContextRun): Record<number, StatefulTimepoint> {
  const from = FRONTEND_TIMEPOINT_START;
  const frequency = 10 * 60_000;
  return {
    [from]: {
      adjustedTime: from,
      timepointDuration: frequency,
      index: 0,
      config: { frequency, from, to: from + frequency },
      status: 'failure',
      maxProbeDuration: FRONTEND_RUN_DURATION,
      probeResults: {
        [run.probe]: [
          endingLogFactory.build({
            timestamp: from + run.startOffset + FRONTEND_RUN_DURATION,
            labels: { execution_id: run.executionId, probe: run.probe },
          }),
        ],
      },
    },
  };
}

it('discovers the app and environment again when a new execution follows an unresolved session lookup', async () => {
  const requests = getServerRequests();
  const from = FRONTEND_TIMEPOINT_START - 60 * 60_000;
  const to = FRONTEND_TIMEPOINT_START + 10 * 60_000;
  server.use(
    apiRoute(
      'queryDatasource',
      {
        result: async (request) => {
          const { queries } = (await request.json()) as DatasourceQueryRequest;
          return {
            json: {
              results: Object.fromEntries(
                queries.map(({ refId, expr }) => {
                  const frames = expr.includes(`k6_testRunId="sm:${OHIO_FRONTEND_RETRY.executionId}"`)
                    ? [faroRunFrame(OHIO_FRONTEND_RETRY, refId)]
                    : refId === 'builds'
                      ? [
                          faroMetricFrame('builds', { app_version: '1.0.0', app_bundle_id: 'previous' }, [
                            [from + 5 * 60_000, 100],
                          ]),
                          faroMetricFrame('builds', { app_version: '1.0.0', app_bundle_id: 'current-build' }, [
                            [to, 100],
                          ]),
                        ]
                      : [];
                  return [refId, { frames }];
                })
              ),
            },
          };
        },
      },
      requests.record
    )
  );
  const queryClient = getQueryClient();
  const { Wrapper } = createWrapper({ queryClient });
  const { result, rerender } = renderHook(
    ({ listLogsMap }) => useAppBuildChangeEvents({ check: COMPLEX_BROWSER_CHECK, listLogsMap, from, to }),
    { wrapper: Wrapper, initialProps: { listLogsMap: timepointsWith(OHIO_FRONTEND_RUN) } }
  );

  await waitFor(() => {
    expect(requests.requests).toHaveLength(1);
    expect(queryClient.isFetching()).toBe(0);
  });
  expect(result.current).toEqual([]);

  rerender({ listLogsMap: timepointsWith(OHIO_FRONTEND_RETRY) });

  await waitFor(() => expect(result.current).toHaveLength(1));
  expect(result.current[0]).toMatchObject({ label: CheckEventType.AppBuildChanged });
  const bodies = await Promise.all(requests.requests.map((_, index) => requests.read(index)));
  const queries = bodies.flatMap(({ body }) => (body as DatasourceQueryRequest).queries);
  expect(queries.some(({ expr }) => expr.includes(`k6_testRunId="sm:${OHIO_FRONTEND_RETRY.executionId}"`))).toBe(true);
  expect(queries.find(({ refId }) => refId === 'builds')?.expr).toContain('app_environment="production"');
});

it('retries a recent execution near the end of an older timepoint while its Faro session is arriving', async () => {
  const run = { ...OHIO_FRONTEND_RUN, startOffset: 8 * 60_000 };
  const now = FRONTEND_TIMEPOINT_START + 9 * 60_000;
  jest.useFakeTimers({ now, doNotFake: ['nextTick', 'queueMicrotask'] });
  const requests = getServerRequests();
  server.use(apiRoute('queryDatasource', {}, requests.record));
  const { Wrapper } = createWrapper();
  const { result } = renderHook(
    () =>
      useFaroRunContext({
        executionId: run.executionId,
        executionTime: FRONTEND_TIMEPOINT_START + run.startOffset + FRONTEND_RUN_DURATION,
        from: FRONTEND_TIMEPOINT_START,
        to: FRONTEND_TIMEPOINT_START + 10 * 60_000,
      }),
    { wrapper: Wrapper }
  );

  await waitFor(() => expect(result.current.isSuccess).toBe(true));
  expect(result.current.data).toBeNull();
  expect(requests.requests).toHaveLength(1);
  server.use(
    apiRoute(
      'queryDatasource',
      { result: () => ({ json: { results: { faroRunContext: { frames: [faroRunFrame(run)] } } } }) },
      requests.record
    )
  );

  await act(async () => {
    await jest.advanceTimersByTimeAsync(5000);
  });

  await waitFor(() => expect(result.current.data?.sessionId).toBe(`${run.executionId}-session`));
  expect(requests.requests).toHaveLength(2);
});

it('keeps build markers and reuses the query as now moves within a bucket, then refreshes without flickering', async () => {
  const from = FRONTEND_TIMEPOINT_START - 60 * 60_000 + 10_000;
  const to = FRONTEND_TIMEPOINT_START + 10 * 60_000 + 10_000;
  const listLogsMap = timepointsWith(OHIO_FRONTEND_RUN);
  const requests = getServerRequests();
  let releaseRefresh!: () => void;
  const refreshResponse = new Promise<void>((resolve) => {
    releaseRefresh = resolve;
  });
  let buildRequests = 0;
  server.use(
    apiRoute(
      'queryDatasource',
      {
        result: async (request) => {
          const { queries } = (await request.json()) as DatasourceQueryRequest;
          if (queries[0].refId === 'faroRunContext') {
            return { json: { results: { faroRunContext: { frames: [faroRunFrame(OHIO_FRONTEND_RUN)] } } } };
          }

          buildRequests++;
          if (buildRequests > 1) {
            await refreshResponse;
          }
          const firstSeen = FRONTEND_TIMEPOINT_START + (buildRequests === 1 ? 5 : 10) * 60_000;
          return {
            json: {
              results: {
                builds: {
                  frames: [faroMetricFrame('builds', { app_version: '1.0.0' }, [[firstSeen, 100]])],
                },
              },
            },
          };
        },
      },
      requests.record
    )
  );
  const queryClient = getQueryClient();
  const { Wrapper } = createWrapper({ queryClient });
  const { result, rerender } = renderHook(
    ({ from, to }) => useAppBuildChangeEvents({ check: COMPLEX_BROWSER_CHECK, listLogsMap, from, to }),
    { wrapper: Wrapper, initialProps: { from, to } }
  );

  try {
    await waitFor(() => expect(result.current).toHaveLength(1));
    const markers = result.current;
    expect(markers[0].from).toBe(FRONTEND_TIMEPOINT_START);
    expect(buildRequests).toBe(1);
    const initialRequest = (await requests.read(1)).body as DatasourceQueryRequest;
    expect(initialRequest.from).toBe(String(from - 10_000));
    expect(initialRequest.to).toBe(String(to - 10_000));

    rerender({ from: from + 20_000, to: to + 20_000 });

    expect(result.current).toEqual(markers);
    expect(queryClient.isFetching()).toBe(0);
    expect(buildRequests).toBe(1);

    rerender({ from: from + 5 * 60_000, to: to + 5 * 60_000 });

    await waitFor(() => expect(buildRequests).toBe(2));
    expect(queryClient.isFetching()).toBe(1);
    expect(result.current).toEqual(markers);
    releaseRefresh();

    await waitFor(() => expect(result.current[0]?.from).toBe(FRONTEND_TIMEPOINT_START + 5 * 60_000));
    expect(buildRequests).toBe(2);
  } finally {
    releaseRefresh();
  }
});

it('clears old build markers while loading a different environment or app', async () => {
  const from = FRONTEND_TIMEPOINT_START - 60 * 60_000;
  const to = FRONTEND_TIMEPOINT_START + 10 * 60_000;
  const stagingRun = { ...OHIO_FRONTEND_RETRY, appEnvironment: 'staging' };
  const otherAppRun = {
    ...stagingRun,
    executionId: 'other-app-exec',
    records: [{ kind: 'measurement', app_id: 'other-app' }],
  };
  const runs = [OHIO_FRONTEND_RUN, stagingRun, otherAppRun];
  const requests = getServerRequests();
  let releaseBuild!: () => void;
  let pendingBuild = Promise.resolve();
  let buildRequests = 0;
  server.use(
    apiRoute(
      'queryDatasource',
      {
        result: async (request) => {
          const { queries } = (await request.json()) as DatasourceQueryRequest;
          const { refId, expr } = queries[0];
          if (refId === 'faroRunContext') {
            const run = runs.find(({ executionId }) => expr.includes(`k6_testRunId="sm:${executionId}"`))!;
            return { json: { results: { faroRunContext: { frames: [faroRunFrame(run)] } } } };
          }

          buildRequests++;
          await pendingBuild;
          return {
            json: {
              results: {
                builds: {
                  frames: [
                    faroMetricFrame('builds', { app_version: `${buildRequests}.0.0` }, [
                      [FRONTEND_TIMEPOINT_START, 100],
                    ]),
                  ],
                },
              },
            },
          };
        },
      },
      requests.record
    )
  );
  const { Wrapper } = createWrapper();
  const { result, rerender } = renderHook(
    ({ run }) =>
      useAppBuildChangeEvents({ check: COMPLEX_BROWSER_CHECK, listLogsMap: timepointsWith(run), from, to }),
    { wrapper: Wrapper, initialProps: { run: OHIO_FRONTEND_RUN } }
  );

  await waitFor(() => expect(result.current[0]?.description).toContain('1.0.0'));
  for (const [index, run] of [stagingRun, otherAppRun].entries()) {
    pendingBuild = new Promise<void>((resolve) => {
      releaseBuild = resolve;
    });
    try {
      rerender({ run });

      await waitFor(() => expect(buildRequests).toBe(index + 2));
      expect(result.current).toEqual([]);
      const { body } = await requests.read(requests.requests.length - 1);
      const expression = (body as DatasourceQueryRequest).queries[0].expr;
      expect(expression).toContain('app_environment="staging"');
      expect(expression).toContain(`app_id="${index === 0 ? '5385' : 'other-app'}"`);
      releaseBuild();

      await waitFor(() => expect(result.current[0]?.description).toContain(`${index + 2}.0.0`));
      expect(result.current[0].description).toContain('staging');
    } finally {
      releaseBuild();
    }
  }
});

it('keeps a fixed run history bounded by its exact completion time', async () => {
  const to = FRONTEND_TIMEPOINT_START + FRONTEND_RUN_DURATION;
  const requests = getServerRequests();
  server.use(
    apiRoute(
      'queryDatasource',
      {
        result: () => ({
          json: {
            results: {
              builds: {
                frames: [
                  faroMetricFrame('builds', { app_version: '1.0.0' }, [[to, 100]]),
                  faroMetricFrame('builds', { app_version: '2.0.0' }, [[to + 60_000, 100]]),
                ],
              },
            },
          },
        }),
      },
      requests.record
    )
  );
  const { Wrapper } = createWrapper();
  const { result } = renderHook(() => useRunBuildHistory({ appId: '5385', appEnvironment: 'production', to }), {
    wrapper: Wrapper,
  });

  await waitFor(() => expect(result.current.isSuccess).toBe(true));
  const { body } = await requests.read();
  expect(body).toMatchObject({ from: String(to - BUILD_LOOKBACK_MS), to: String(to) });
  expect(result.current.data?.activity).toHaveLength(1);
  expect(result.current.data?.activity[0]).toMatchObject({ build: { version: '1.0.0' }, firstSeen: to });
});
