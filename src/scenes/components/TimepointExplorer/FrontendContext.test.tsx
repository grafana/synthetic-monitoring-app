import React, { useState } from 'react';
import { DataFrameJSON } from '@grafana/data';
import { screen, waitFor, within } from '@testing-library/react';
import { endingLogFactory, startingLogFactory } from 'test/factories/executionLogs';
import { COMPLEX_BROWSER_CHECK } from 'test/fixtures/checks';
import {
  CURRENT_BUILD_SOURCE_MAP,
  faroMetricFrame,
  faroRunFrame,
  FRONTEND_RUN_DURATION as RUN_DURATION,
  FRONTEND_TIMEPOINT_START as TIMEPOINT_START,
  FrontendContextRun as Run,
  OHIO_FRONTEND_RETRY as OHIO_RETRY,
  OHIO_FRONTEND_RUN as OHIO_RUN,
  OREGON_FRONTEND_RUN as OREGON_RUN,
} from 'test/fixtures/frontendContext';
import { apiRoute, getServerRequests } from 'test/handlers';
import { DatasourceQueryRequest } from 'test/handlers/queryDatasource';
import { render } from 'test/render';
import { server } from 'test/server';
import { selectOption } from 'test/utils';

import { ExecutionEndedLog, ExecutionLogs } from 'features/parseCheckLogs/checkLogs.types';
import { CheckType } from 'types';
import { ONE_HOUR_IN_MS } from 'utils.constants';
import { TimepointExplorerContext } from 'scenes/components/TimepointExplorer/TimepointExplorer.context';
import {
  CheckConfig,
  StatefulTimepoint,
  StatelessTimepoint,
  TimepointViewerSource,
  ViewerState,
} from 'scenes/components/TimepointExplorer/TimepointExplorer.types';
import { TimepointViewerExecutions } from 'scenes/components/TimepointExplorer/TimepointViewerExecutions';

jest.mock('scenes/Common/useSceneVar', () => ({
  useSceneVar: () => ['.*'],
}));

jest.mock('scenes/Common/useSceneVarProbes', () => ({
  useSceneVarProbes: () => ['Ohio', 'Oregon'],
}));

type ContextValue = NonNullable<React.ContextType<typeof TimepointExplorerContext>>;

const FREQUENCY = 10 * 60 * 1000;
const CONFIG: CheckConfig = {
  frequency: FREQUENCY,
  from: TIMEPOINT_START - 6 * FREQUENCY,
  to: TIMEPOINT_START + FREQUENCY,
};
const TIMEPOINT: StatelessTimepoint = {
  adjustedTime: TIMEPOINT_START,
  timepointDuration: FREQUENCY,
  index: 0,
  config: CONFIG,
};
const NEXT_TIMEPOINT: StatelessTimepoint = {
  ...TIMEPOINT,
  adjustedTime: TIMEPOINT_START + FREQUENCY,
  index: 1,
};

const ALL_RUNS = [OHIO_RUN, OHIO_RETRY, OREGON_RUN];

function buildExecution(run: Run): ExecutionLogs {
  const start = TIMEPOINT_START + run.startOffset;
  const labels = { probe: run.probe, execution_id: run.executionId };

  return [
    startingLogFactory.build({ timestamp: start, labels }),
    endingLogFactory.build(
      { timestamp: start + RUN_DURATION, labels: { ...labels, duration_seconds: String(RUN_DURATION / 1000) } },
      { transient: { isSuccess: run.success ?? false } }
    ),
  ];
}

function renderViewer(runs: Run[], initialProbe: string) {
  const executionsByProbe = runs.reduce<Record<string, ExecutionLogs[]>>((acc, run) => {
    acc[run.probe] = [...(acc[run.probe] ?? []), buildExecution(run)];
    return acc;
  }, {});

  const probeResults = Object.fromEntries(
    Object.entries(executionsByProbe).map(([probe, executions]) => [
      probe,
      executions.map((execution) => execution[execution.length - 1] as ExecutionEndedLog),
    ])
  );

  const statefulTimepoint: StatefulTimepoint = {
    ...TIMEPOINT,
    status: 'failure',
    probeResults,
    maxProbeDuration: RUN_DURATION,
  };

  const probeExecutions = Object.entries(executionsByProbe).map(([probeName, executions]) => ({
    probeName,
    executions,
  }));

  function Harness() {
    const [viewerState, setViewerState] = useState<ViewerState>([TIMEPOINT, initialProbe, 0]);
    const [selectedSource, setSelectedSource] = useState<TimepointViewerSource>('synthetic');
    const [viewerTimepoint = TIMEPOINT, viewerProbeName] = viewerState;

    // Only the fields the viewer and the panel read.
    const value = {
      check: COMPLEX_BROWSER_CHECK,
      checkType: CheckType.Browser,
      checkConfigs: [CONFIG],
      currentAdjustedTime: TIMEPOINT_START + 3 * FREQUENCY,
      listLogsMap: { [TIMEPOINT_START]: statefulTimepoint },
      viewerState,
      handleViewerStateChange: setViewerState,
      handleHoverStateChange: () => {},
      vizOptions: { success: '#73bf69', failure: '#f2495c', missing: '#8e8e8e', pending: '#5794f2' },
      yAxisMax: RUN_DURATION,
    } as unknown as ContextValue;

    return (
      <TimepointExplorerContext.Provider value={value}>
        <button type="button" onClick={() => setViewerState([NEXT_TIMEPOINT, initialProbe, 0])}>
          Next timepoint
        </button>
        {/* TimepointViewer remounts the executions for every timepoint. */}
        <TimepointViewerExecutions
          key={viewerTimepoint.adjustedTime}
          isLoading={false}
          logsView="event"
          onChangeSource={setSelectedSource}
          pendingProbeNames={[]}
          probeExecutions={probeExecutions}
          probeNameToView={viewerProbeName}
          selectedSource={selectedSource}
          timepoint={viewerTimepoint}
        />
      </TimepointExplorerContext.Provider>
    );
  }

  return render(<Harness />);
}

async function findPanel() {
  return screen.findByRole('tabpanel', { name: 'Real user context' });
}

type Query = DatasourceQueryRequest['queries'][number];

function setupFaroApi({
  runs = ALL_RUNS,
  metrics = {},
  failedRefs = [],
  failureType = 'http',
}: {
  runs?: Run[];
  metrics?: Record<string, DataFrameJSON[]> | ((query: Query) => DataFrameJSON[] | Promise<DataFrameJSON[]>);
  failedRefs?: string[];
  failureType?: 'http' | 'query';
} = {}) {
  const requests = getServerRequests();
  server.use(
    apiRoute(
      'queryDatasource',
      {
        result: async (request) => {
          const { queries } = (await request.json()) as DatasourceQueryRequest;
          if (failureType === 'http' && queries.some(({ refId }) => failedRefs.includes(refId))) {
            return { status: 500, json: { message: 'Datasource unavailable' } };
          }

          return {
            json: {
              results: Object.fromEntries(
                await Promise.all(
                  queries.map(async (query) => {
                    const { refId, expr } = query;
                    if (failedRefs.includes(refId)) {
                      return [refId, { error: 'Datasource unavailable', status: 500 }];
                    }
                    const run = runs.find(({ executionId }) => expr.includes(`k6_testRunId="sm:${executionId}"`));
                    const frames = run
                      ? [faroRunFrame(run, refId)]
                      : typeof metrics === 'function'
                        ? await metrics(query)
                        : (metrics[refId] ?? []);
                    return [refId, { frames }];
                  })
                )
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

async function queriedExpressions(requests: ReturnType<typeof getServerRequests>) {
  const bodies = await Promise.all(requests.requests.map((_, index) => requests.read(index)));
  return bodies.flatMap(({ body }) => (body as DatasourceQueryRequest).queries);
}

async function openContext(runs = [OHIO_RUN]) {
  const view = renderViewer(runs, runs[0].probe);
  await view.user.click(await screen.findByRole('tab', { name: 'Real user context' }));
  return view;
}

describe('FrontendContext with several probes', () => {
  let requests: ReturnType<typeof getServerRequests>;

  beforeEach(() => {
    requests = setupFaroApi();
  });

  it('keeps the probe tabs above the source rail', async () => {
    const { user } = renderViewer([OHIO_RUN], 'Ohio');

    expect(await screen.findByRole('tab', { name: 'Execution logs' })).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByRole('tab', { name: /Ohio/ })).toBeInTheDocument();
    expect(screen.queryByRole('tabpanel', { name: 'Real user context' })).not.toBeInTheDocument();

    screen.getByRole('tab', { name: 'Execution logs' }).focus();
    await user.keyboard('{ArrowDown}');

    expect(screen.getByRole('tab', { name: 'Real user context' })).toHaveFocus();
    expect(await within(await findPanel()).findByText(OHIO_RUN.error)).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /Ohio/ })).toBeInTheDocument();

    await user.click(screen.getByRole('tab', { name: 'Execution logs' }));

    expect(screen.getByRole('tab', { name: /Ohio/ })).toBeInTheDocument();
    expect(screen.queryByRole('tabpanel', { name: 'Real user context' })).not.toBeInTheDocument();
  });

  it('explains when Frontend Observability has no session for the execution', async () => {
    setupFaroApi({ runs: [] });
    const { user } = renderViewer([OHIO_RUN], 'Ohio');

    await user.click(await screen.findByRole('tab', { name: 'Real user context' }));

    expect(
      await screen.findByText(
        "Frontend Observability has no session for this execution, so it can't be compared with real users."
      )
    ).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Add RUM to your app' })).toHaveAttribute(
      'href',
      expect.stringContaining('https://grafana.com/docs/grafana-cloud/monitor-applications/frontend-observability')
    );
  });

  it('keeps the selected source when moving to another timepoint', async () => {
    const { user } = renderViewer([OHIO_RUN], 'Ohio');

    await user.click(await screen.findByRole('tab', { name: 'Real user context' }));
    expect(await within(await findPanel()).findByText(OHIO_RUN.error)).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Next timepoint' }));

    expect(screen.getByRole('tab', { name: 'Real user context' })).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByRole('tab', { name: 'Execution logs' })).toHaveAttribute('aria-selected', 'false');
    expect(await screen.findByText('No browser execution is selected for this timepoint.')).toBeInTheDocument();
  });

  it(`shows each probe tab's own run`, async () => {
    const { user } = renderViewer([OHIO_RUN, OREGON_RUN], 'Ohio');

    await user.click(await screen.findByRole('tab', { name: 'Real user context' }));
    expect(await within(await findPanel()).findByText(OHIO_RUN.error)).toBeInTheDocument();

    await user.click(screen.getByRole('tab', { name: /Oregon/ }));

    expect(await within(await findPanel()).findByText(OREGON_RUN.error)).toBeInTheDocument();
    expect(screen.queryByText(OHIO_RUN.error)).not.toBeInTheDocument();

    await user.click(screen.getByRole('tab', { name: /Ohio/ }));

    expect(await within(await findPanel()).findByText(OHIO_RUN.error)).toBeInTheDocument();
    expect(screen.queryByText(OREGON_RUN.error)).not.toBeInTheDocument();

    const queries = await queriedExpressions(requests);
    expect(queries.map(({ expr }) => expr).join('\n')).toContain(`k6_testRunId="sm:${OHIO_RUN.executionId}"`);
    expect(queries.map(({ expr }) => expr).join('\n')).toContain(`k6_testRunId="sm:${OREGON_RUN.executionId}"`);
    expect(queries.map(({ expr }) => expr).join('\n')).not.toContain(`k6_testRunId="sm:${OHIO_RETRY.executionId}"`);
  });

  it('follows the selected execution when a probe ran more than once in a timepoint', async () => {
    const { user } = renderViewer([OHIO_RUN, OHIO_RETRY, OREGON_RUN], 'Ohio');

    await user.click(await screen.findByRole('tab', { name: 'Real user context' }));
    expect(await within(await findPanel()).findByText(OHIO_RUN.error)).toBeInTheDocument();

    await selectOption(user, { label: /^Execution$/, option: 'Execution 2 of 2' });

    expect(await within(await findPanel()).findByText(OHIO_RETRY.error)).toBeInTheDocument();
    expect(screen.queryByText(OHIO_RUN.error)).not.toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Real user context' })).toHaveAttribute('aria-selected', 'true');

    await user.click(screen.getByRole('tab', { name: 'Execution logs' }));
    expect(screen.getByRole('button', { name: 'Select execution 2' })).toHaveAttribute('aria-pressed', 'true');
  });
});

describe('FrontendContext diagnostic evidence', () => {
  const runEnd = TIMEPOINT_START + OHIO_RUN.startOffset + RUN_DURATION;
  const pageMetrics = {
    visits: [faroMetricFrame('visits', { page_id: '/' }, [[runEnd, 10]])],
    errors: [faroMetricFrame('errors', { page_id: '/' }, [[runEnd, 2]])],
  };

  it('filters every comparison to the environment reported by the selected run', async () => {
    const requests = setupFaroApi({ metrics: pageMetrics });
    await openContext();

    expect(await screen.findByText('20% with JS errors')).toBeInTheDocument();
    await waitFor(async () => {
      const queries = await queriedExpressions(requests);
      const comparisons = queries.filter(({ refId }) => refId !== 'faroRunContext');
      expect(comparisons.map(({ refId }) => refId)).toEqual(
        expect.arrayContaining(['builds', 'loads', 'sessions', 'trend', 'visits', 'errors'])
      );
      comparisons.forEach(({ expr }) => expect(expr).toContain('app_environment="production"'));
    });
  });

  it('changes the environment comparison when another probe targets the same app in staging', async () => {
    const stagingRun = { ...OREGON_RUN, appEnvironment: 'staging', startOffset: OHIO_RUN.startOffset };
    setupFaroApi({
      runs: [OHIO_RUN, stagingRun],
      metrics: ({ refId, expr }) => {
        if (refId !== 'visits') {
          return [];
        }
        return [
          faroMetricFrame(refId, { page_id: '/' }, [[runEnd, expr.includes('app_environment="staging"') ? 40 : 10]]),
        ];
      },
    });
    const { user } = await openContext([OHIO_RUN, stagingRun]);
    expect(await screen.findByText('10 sessions')).toBeInTheDocument();

    await user.click(screen.getByRole('tab', { name: /Oregon/ }));

    expect(await screen.findByText('40 sessions')).toBeInTheDocument();
    expect(screen.queryByText('10 sessions')).not.toBeInTheDocument();
  });

  it('explains that comparisons include all environments when the run does not report one', async () => {
    const run = { ...OHIO_RUN, appEnvironment: undefined };
    const requests = setupFaroApi({ runs: [run] });
    await openContext([run]);

    expect(await screen.findByText('Environment not reported; comparing across environments.')).toBeInTheDocument();
    expect(await screen.findByText('No matching real-user sessions in the last hour')).toBeInTheDocument();
    const queries = await queriedExpressions(requests);
    queries.forEach(({ expr }) => expect(expr).not.toContain('app_environment='));
  });

  it('shows unknown build age when no history was returned', async () => {
    setupFaroApi();
    await openContext();

    expect(
      await screen.findByText('Not enough build history to determine when this build started serving.')
    ).toBeInTheDocument();
    expect(screen.queryByText(/Already serving at the start/)).not.toBeInTheDocument();
  });

  it('waits for build history before warning that most users have an earlier-observed build', async () => {
    let resolveHistory!: (frames: DataFrameJSON[]) => void;
    const history = new Promise<DataFrameJSON[]>((resolve) => {
      resolveHistory = resolve;
    });
    setupFaroApi({
      metrics: ({ refId }) => {
        if (refId === 'builds') {
          return history;
        }
        if (refId === 'loads') {
          return [
            faroMetricFrame('loads', { app_version: '1.0.0', app_bundle_id: 'current-build' }, [[runEnd, 10]]),
            faroMetricFrame('loads', { app_version: '0.9.0', app_bundle_id: 'previous-build' }, [[runEnd, 90]]),
          ];
        }
        return [];
      },
    });
    await openContext();

    expect(await screen.findByText(/10% of real-user page loads.*Build order is unknown\./)).toBeInTheDocument();
    expect(screen.queryByText('Not the build most users get')).not.toBeInTheDocument();
    expect(screen.queryByText('Most users on an earlier-observed build')).not.toBeInTheDocument();

    resolveHistory([
      faroMetricFrame(
        'builds',
        { app_version: '0.9.0', app_bundle_id: 'previous-build' },
        [[runEnd - 4 * ONE_HOUR_IN_MS, 90]]
      ),
      faroMetricFrame(
        'builds',
        { app_version: '1.0.0', app_bundle_id: 'current-build' },
        [[runEnd - 2 * ONE_HOUR_IN_MS, 10]]
      ),
    ]);

    expect(await screen.findByText('Most users on an earlier-observed build')).toBeInTheDocument();
    expect(screen.queryByText(/Build order is unknown\./)).not.toBeInTheDocument();
  });

  it('keeps build-share counts neutral when the build history query fails', async () => {
    setupFaroApi({
      failedRefs: ['builds'],
      metrics: {
        loads: [
          faroMetricFrame('loads', { app_version: '1.0.0', app_bundle_id: 'current-build' }, [[runEnd, 10]]),
          faroMetricFrame('loads', { app_version: '0.9.0', app_bundle_id: 'previous-build' }, [[runEnd, 90]]),
        ],
      },
    });
    await openContext();

    expect(await screen.findByText("Couldn't load build history.")).toBeInTheDocument();
    expect(
      await screen.findByText(
        '10% of real-user page loads in the last hour were on this build; 90% were on 0.9.0 · previou. Build order is unknown.'
      )
    ).toBeInTheDocument();
    expect(screen.queryByText('Not the build most users get')).not.toBeInTheDocument();
    expect(screen.queryByText('Most users on an earlier-observed build')).not.toBeInTheDocument();
    expect(screen.queryByText('Most users on a later-observed build')).not.toBeInTheDocument();
  });

  it('explains that exact error-message matching can miss errors with different values', async () => {
    setupFaroApi();
    await openContext();

    expect(await screen.findByText(OHIO_RUN.error)).toBeInTheDocument();
    expect(
      await screen.findByText(
        'Only exact error-message matches are counted; messages with different values may be missed.'
      )
    ).toBeInTheDocument();
  });

  it('describes the first observation of a sole recent build without claiming it existed all day', async () => {
    setupFaroApi({
      metrics: {
        builds: [
          faroMetricFrame('builds', { app_version: '1.0.0', app_bundle_id: 'current-build' }, [[TIMEPOINT_START, 50]]),
        ],
      },
    });
    await openContext();

    expect(await screen.findByText('First seen in window')).toBeInTheDocument();
    expect(screen.getByText(/First observed between/)).toBeInTheDocument();
    expect(screen.queryByText(/Already serving at the start/)).not.toBeInTheDocument();
  });

  it('keeps source-map upload time separate from the first observed build interval', async () => {
    setupFaroApi({
      metrics: {
        builds: [
          faroMetricFrame('builds', { app_version: '1.0.0', app_bundle_id: 'current-build' }, [[TIMEPOINT_START, 50]]),
        ],
      },
    });
    const requests = getServerRequests();
    server.use(
      apiRoute(
        'listFaroSourceMaps',
        {
          result: () => ({
            json: {
              bundles: [{ ...CURRENT_BUILD_SOURCE_MAP, Created: new Date(TIMEPOINT_START).toISOString() }],
            },
          }),
        },
        requests.record
      )
    );
    await openContext();

    expect(await screen.findByText(/source maps (were )?uploaded/i)).toBeInTheDocument();
    expect(await screen.findByText('First seen in window')).toBeInTheDocument();
    expect(screen.getByText(/First observed between/)).toBeInTheDocument();
    const { request } = await requests.read(0, false);
    expect(new URL(request.url).searchParams.get('filter')).toBe('current-build');
    expect(screen.queryByText(/deployed at/i)).not.toBeInTheDocument();
  });

  it('describes browser errors on a successful check without claiming the check failed', async () => {
    const run = { ...OHIO_RUN, success: true };
    setupFaroApi({ runs: [run], metrics: pageMetrics });
    await openContext([run]);

    const table = await screen.findByRole('table', { name: 'Real-user sessions on the pages this run visited' });
    expect(within(table).getByText('Browser error observed here')).toBeInTheDocument();
    expect(within(table).queryByText('this run failed here')).not.toBeInTheDocument();
  });

  it('keeps every affected page when the same error occurred more than once', async () => {
    const run = {
      ...OHIO_RUN,
      records: [
        { kind: 'exception', type: 'Error', value: OHIO_RUN.error, page_id: '/cart' },
        { kind: 'exception', type: 'Error', value: OHIO_RUN.error, page_id: '/checkout' },
      ],
    };
    setupFaroApi({
      runs: [run],
      metrics: {
        visits: ['/cart', '/checkout'].map((page_id) => faroMetricFrame('visits', { page_id }, [[runEnd, 10]])),
      },
    });
    await openContext([run]);

    const table = await screen.findByRole('table', { name: 'Real-user sessions on the pages this run visited' });
    const rows = within(table).getAllByRole('row');
    expect(rows).toHaveLength(2);
    for (const row of rows) {
      expect(within(row).getByText('Browser error observed here')).toBeInTheDocument();
    }
    expect(screen.getAllByText(OHIO_RUN.error)).toHaveLength(1);
  });

  it('marks the actual last page when the run returns to an earlier page', async () => {
    const run = {
      ...OHIO_RUN,
      records: ['/', '/cart', '/'].map((page_id) => ({ kind: 'measurement', type: 'web-vitals', page_id })),
    };
    setupFaroApi({
      runs: [run],
      metrics: {
        visits: ['/', '/cart'].map((page_id) => faroMetricFrame('visits', { page_id }, [[runEnd, 10]])),
      },
    });
    await openContext([run]);

    const table = await screen.findByRole('table', { name: 'Real-user sessions on the pages this run visited' });
    const rows = within(table).getAllByRole('row');
    expect(within(rows[0]).getByRole('rowheader', { name: '/' })).toBeInTheDocument();
    expect(within(rows[0]).getByText('this run ended here')).toBeInTheDocument();
    expect(within(rows[1]).queryByText('this run ended here')).not.toBeInTheDocument();
  });

  it.each(['http', 'query'] as const)('distinguishes %s query failures from no matching users', async (failureType) => {
    setupFaroApi({ failedRefs: ['builds', 'loads', 'sessions', 'visits'], failureType });
    await openContext();

    expect(await screen.findByText("Couldn't load build history.")).toBeInTheDocument();
    expect(await screen.findByText("Couldn't load real-user build comparisons.")).toBeInTheDocument();
    expect(await screen.findByText("Couldn't check real users")).toBeInTheDocument();
    expect(await screen.findByText("Couldn't load real-user sessions.")).toBeInTheDocument();
    expect(screen.queryByText('No matching real-user sessions in the last hour')).not.toBeInTheDocument();
    expect(
      screen.queryByText('No real-user sessions on these pages in the hour before this run.')
    ).not.toBeInTheDocument();
  });

  it('does not present a failed session lookup as evidence that the session is absent', async () => {
    setupFaroApi({ failedRefs: ['faroRunContext'] });
    const { user } = await openContext();

    expect(await screen.findByText(/Couldn.t load.*session/)).toBeInTheDocument();
    expect(screen.queryByText(/Frontend Observability has no session/)).not.toBeInTheDocument();

    setupFaroApi();
    await user.click(screen.getByRole('button', { name: 'Retry' }));
    expect(await screen.findByText(OHIO_RUN.error)).toBeInTheDocument();
  });

  it('keeps comparison windows at or before the selected execution end', async () => {
    const requests = setupFaroApi({ metrics: pageMetrics });
    await openContext();
    expect(await screen.findByText('20% with JS errors')).toBeInTheDocument();
    await waitFor(async () => {
      const queries = await queriedExpressions(requests);
      expect(queries.some(({ refId }) => refId === 'trend')).toBe(true);
    });

    const bodies = await Promise.all(requests.requests.map((_, index) => requests.read(index)));
    const comparisons = bodies
      .map(({ body }) => body as DatasourceQueryRequest)
      .filter(({ queries }) => queries.every(({ refId }) => refId !== 'faroRunContext'));
    comparisons.forEach(({ to }) => expect(Number(to)).toBeLessThanOrEqual(runEnd));
  });
});
