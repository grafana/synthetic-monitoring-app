import React, { useState } from 'react';
import { FieldType, toDataFrame } from '@grafana/data';
import { screen, within } from '@testing-library/react';
import { endingLogFactory, startingLogFactory } from 'test/factories/executionLogs';
import { COMPLEX_BROWSER_CHECK } from 'test/fixtures/checks';
import { render } from 'test/render';

import { ExecutionEndedLog, ExecutionLogs } from 'features/parseCheckLogs/checkLogs.types';
import { CheckType } from 'types';
import { TimepointExplorerContext } from 'scenes/components/TimepointExplorer/TimepointExplorer.context';
import {
  CheckConfig,
  StatefulTimepoint,
  StatelessTimepoint,
  TimepointViewerSource,
  ViewerState,
} from 'scenes/components/TimepointExplorer/TimepointExplorer.types';
import { TimepointViewerExecutions } from 'scenes/components/TimepointExplorer/TimepointViewerExecutions';

const mockQueryLoki = jest.fn();
const mockQueryDS = jest.fn();

jest.mock('hooks/useLogsDS', () => ({
  useLogsDS: () => jest.requireActual('test/fixtures/datasources').LOGS_DATASOURCE,
}));

jest.mock('features/queryDatasources/queryLoki', () => ({
  queryLoki: (args: unknown) => mockQueryLoki(args),
}));

jest.mock('features/queryDatasources/queryDS', () => ({
  queryDS: (args: unknown) => mockQueryDS(args),
}));

jest.mock('scenes/Common/useSceneVar', () => ({
  useSceneVar: () => ['.*'],
}));

jest.mock('scenes/Common/useSceneVarProbes', () => ({
  useSceneVarProbes: () => ['Ohio', 'Oregon'],
}));

type ContextValue = NonNullable<React.ContextType<typeof TimepointExplorerContext>>;

const FREQUENCY = 10 * 60 * 1000;
const TIMEPOINT_START = 1_791_393_600_000;
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

interface Run {
  probe: string;
  executionId: string;
  startOffset: number;
  error: string;
}

const OHIO_RUN: Run = {
  probe: 'Ohio',
  executionId: 'ohio-exec',
  startOffset: 60_000,
  error: 'TypeError: cart is undefined',
};
const OHIO_RETRY: Run = {
  probe: 'Ohio',
  executionId: 'ohio-retry-exec',
  startOffset: 4 * 60_000,
  error: 'NetworkError when attempting to fetch resource',
};
const OREGON_RUN: Run = {
  probe: 'Oregon',
  executionId: 'oregon-exec',
  startOffset: 90_000,
  error: "Response not ok. Status code: 500. Message: 'Failed to load products'",
};
const ALL_RUNS = [OHIO_RUN, OHIO_RETRY, OREGON_RUN];

const RUN_DURATION = 20_000;

function buildExecution(run: Run): ExecutionLogs {
  const start = TIMEPOINT_START + run.startOffset;
  const labels = { probe: run.probe, execution_id: run.executionId };

  return [
    startingLogFactory.build({ timestamp: start, labels }),
    endingLogFactory.build(
      { timestamp: start + RUN_DURATION, labels: { ...labels, duration_seconds: String(RUN_DURATION / 1000) } },
      { transient: { isSuccess: false } }
    ),
  ];
}

// The Faro records a browser-check run emits, keyed to it by k6_testRunId.
function faroFrame(run: Run) {
  const common = {
    app_id: '5385',
    app_name: 'ecommerce',
    session_id: `${run.executionId}-session`,
    page_id: '/',
    k6_isK6Browser: 'true',
    k6_testRunId: `sm:${run.executionId}`,
  };
  const records = [
    { ...common, kind: 'measurement', type: 'web-vitals' },
    { ...common, kind: 'exception', type: 'Error', value: run.error },
  ];
  const start = TIMEPOINT_START + run.startOffset;

  return toDataFrame({
    refId: 'faroRunContext',
    fields: [
      { name: 'labels', type: FieldType.other, values: records },
      { name: 'timestamp', type: FieldType.time, values: records.map((_, index) => start + 1000 + index) },
      { name: 'body', type: FieldType.string, values: records.map(() => '') },
      { name: 'labelTypes', type: FieldType.other, values: records.map(() => ({})) },
      { name: 'id', type: FieldType.string, values: records.map((_, index) => `${run.executionId}-${index}`) },
    ],
  });
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

function queriedExecutionIds() {
  return mockQueryLoki.mock.calls.map(([{ query }]) => {
    const match = /k6_testRunId="sm:([^"]+)"/.exec(query);
    return match?.[1];
  });
}

describe('FrontendContext with several probes', () => {
  beforeEach(() => {
    mockQueryLoki.mockReset();
    mockQueryDS.mockReset();
    mockQueryLoki.mockImplementation(async ({ query }: { query: string }) => {
      const run = ALL_RUNS.find(({ executionId }) => query.includes(`k6_testRunId="sm:${executionId}"`));
      return run ? [faroFrame(run)] : [];
    });
    mockQueryDS.mockResolvedValue({});
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
    mockQueryLoki.mockResolvedValue([]);
    const { user } = renderViewer([OHIO_RUN], 'Ohio');

    await user.click(await screen.findByRole('tab', { name: 'Real user context' }));

    expect(
      await screen.findByText(
        "Frontend Observability has no session for this execution, so it can't be compared with real users."
      )
    ).toBeInTheDocument();
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

    expect(queriedExecutionIds()).toEqual(expect.arrayContaining([OHIO_RUN.executionId, OREGON_RUN.executionId]));
    expect(queriedExecutionIds()).not.toContain(OHIO_RETRY.executionId);
  });

  it('follows the selected execution when a probe ran more than once in a timepoint', async () => {
    const { user } = renderViewer([OHIO_RUN, OHIO_RETRY, OREGON_RUN], 'Ohio');

    await user.click(await screen.findByRole('tab', { name: 'Real user context' }));
    expect(await within(await findPanel()).findByText(OHIO_RUN.error)).toBeInTheDocument();

    await user.click(screen.getByRole('tab', { name: 'Execution logs' }));
    await user.click(screen.getByRole('button', { name: '2' }));
    await user.click(screen.getByRole('tab', { name: 'Real user context' }));

    expect(await within(await findPanel()).findByText(OHIO_RETRY.error)).toBeInTheDocument();
    expect(screen.queryByText(OHIO_RUN.error)).not.toBeInTheDocument();
  });
});
