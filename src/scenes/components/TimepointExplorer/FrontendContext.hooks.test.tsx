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

import { useAppBuildChangeEvents, useFaroRunContext } from './FrontendContext.hooks';

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
