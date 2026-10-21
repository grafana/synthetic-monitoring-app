import React from 'react';
import { act, screen, waitFor } from '@testing-library/react';
import { endingLogFactory } from 'test/factories/executionLogs';
import { BASIC_HTTP_CHECK, COMPLEX_BROWSER_CHECK } from 'test/fixtures/checks';
import {
  faroRunFrame,
  FRONTEND_RUN_DURATION,
  FRONTEND_TIMEPOINT_START,
  OHIO_FRONTEND_RUN,
} from 'test/fixtures/frontendContext';
import { apiRoute, getServerRequests } from 'test/handlers';
import { DatasourceQueryRequest } from 'test/handlers/queryDatasource';
import { render } from 'test/render';
import { server } from 'test/server';

import { CheckType } from 'types';
import { FrontendContext } from 'scenes/components/TimepointExplorer/FrontendContext';
import { FrontendO11yButton } from 'scenes/components/TimepointExplorer/FrontendO11yButton';
import { TimepointExplorerContext } from 'scenes/components/TimepointExplorer/TimepointExplorer.context';
import { StatefulTimepoint } from 'scenes/components/TimepointExplorer/TimepointExplorer.types';

jest.mock('scenes/Common/useSceneVar', () => ({ useSceneVar: () => ['.*'] }));
jest.mock('scenes/Common/useSceneVarProbes', () => ({ useSceneVarProbes: () => ['Ohio'] }));

type ContextValue = NonNullable<React.ContextType<typeof TimepointExplorerContext>>;

const run = OHIO_FRONTEND_RUN;
const frequency = 10 * 60_000;
const executionTime = FRONTEND_TIMEPOINT_START + run.startOffset + FRONTEND_RUN_DURATION;
const timepoint: StatefulTimepoint = {
  adjustedTime: FRONTEND_TIMEPOINT_START,
  timepointDuration: frequency,
  index: 0,
  config: { frequency, from: FRONTEND_TIMEPOINT_START, to: FRONTEND_TIMEPOINT_START + frequency },
  status: 'failure',
  maxProbeDuration: FRONTEND_RUN_DURATION,
  probeResults: {
    [run.probe]: [
      endingLogFactory.build({
        timestamp: executionTime,
        labels: {
          execution_id: run.executionId,
          probe: run.probe,
          duration_seconds: String(FRONTEND_RUN_DURATION / 1000),
        },
      }),
    ],
  },
};

function renderHeader({
  withPanel = false,
  pending = false,
  checkType = CheckType.Browser,
}: { withPanel?: boolean; pending?: boolean; checkType?: CheckType } = {}) {
  const value = {
    check: checkType === CheckType.Browser ? COMPLEX_BROWSER_CHECK : BASIC_HTTP_CHECK,
    checkType,
    checkConfigs: [timepoint.config],
    currentAdjustedTime: pending ? timepoint.adjustedTime : timepoint.adjustedTime + 3 * frequency,
    listLogsMap: { [timepoint.adjustedTime]: pending ? { ...timepoint, probeResults: {} } : timepoint },
    viewerState: [timepoint, run.probe, 0],
  } as unknown as ContextValue;

  return render(
    <TimepointExplorerContext.Provider value={value}>
      <FrontendO11yButton timepoint={timepoint} />
      {withPanel && <FrontendContext timepoint={timepoint} />}
    </TimepointExplorerContext.Provider>
  );
}

function setupSession() {
  const requests = getServerRequests();
  server.use(
    apiRoute(
      'queryDatasource',
      {
        result: async (request) => {
          const { queries } = (await request.json()) as DatasourceQueryRequest;
          return {
            json: {
              results: Object.fromEntries(
                queries.map(({ refId }) => [refId, { frames: refId === 'faroRunContext' ? [faroRunFrame(run)] : [] }])
              ),
            },
          };
        },
      },
      requests.record
    )
  );
  return requests;
}

afterEach(() => {
  jest.useRealTimers();
});

it('shares session discovery with the panel and opens the same frontend session', async () => {
  const requests = setupSession();
  const { queryClient } = renderHeader({ withPanel: true });

  expect(await screen.findByRole('link', { name: 'View frontend session' })).toHaveAttribute(
    'href',
    `/a/grafana-kowalski-app/apps/5385/sessions/${run.executionId}-session`
  );
  expect(await screen.findByText(run.error)).toBeInTheDocument();
  await waitFor(() => expect(queryClient.isFetching()).toBe(0));
  const bodies = await Promise.all(requests.requests.map((_, index) => requests.read(index)));
  const sessionQueries = bodies
    .flatMap(({ body }) => (body as DatasourceQueryRequest).queries)
    .filter(({ refId }) => refId === 'faroRunContext');
  expect(sessionQueries).toHaveLength(1);
  expect(screen.queryByRole('link', { name: 'Add RUM to your app' })).not.toBeInTheDocument();
});

it('offers setup after a completed lookup finds no session', async () => {
  server.use(apiRoute('queryDatasource'));
  renderHeader();

  expect(await screen.findByRole('link', { name: 'Add RUM to your app' })).toHaveAttribute(
    'href',
    expect.stringContaining('https://grafana.com/docs/grafana-cloud/monitor-applications/frontend-observability')
  );
  expect(screen.queryByRole('link', { name: 'View frontend session' })).not.toBeInTheDocument();
});

it('does not suggest setup when the session lookup fails', async () => {
  const requests = getServerRequests();
  server.use(
    apiRoute('queryDatasource', { result: () => ({ status: 500, json: { message: 'Unavailable' } }) }, requests.record)
  );
  const { queryClient } = renderHeader();

  await waitFor(() => {
    expect(requests.requests).toHaveLength(1);
    expect(queryClient.isFetching()).toBe(0);
  });
  expect(screen.queryByRole('link', { name: 'Add RUM to your app' })).not.toBeInTheDocument();
  expect(screen.queryByRole('link', { name: 'View frontend session' })).not.toBeInTheDocument();
});

it('replaces setup with the session link when recent telemetry arrives', async () => {
  jest.useFakeTimers({ now: executionTime + 1000, doNotFake: ['nextTick', 'queueMicrotask'] });
  server.use(apiRoute('queryDatasource'));
  renderHeader();

  expect(await screen.findByRole('link', { name: 'Add RUM to your app' })).toBeInTheDocument();
  setupSession();
  await act(async () => {
    await jest.advanceTimersByTimeAsync(5000);
  });

  expect(await screen.findByRole('link', { name: 'View frontend session' })).toBeInTheDocument();
  expect(screen.queryByRole('link', { name: 'Add RUM to your app' })).not.toBeInTheDocument();
});

it.each([{ pending: true }, { checkType: CheckType.Http }])('hides frontend actions for %j', async (options) => {
  const requests = setupSession();
  const { queryClient } = renderHeader(options);

  await waitFor(() => expect(queryClient.isFetching()).toBe(0));
  expect(requests.requests).toHaveLength(0);
  expect(screen.queryByRole('link', { name: 'Add RUM to your app' })).not.toBeInTheDocument();
  expect(screen.queryByRole('link', { name: 'View frontend session' })).not.toBeInTheDocument();
});
