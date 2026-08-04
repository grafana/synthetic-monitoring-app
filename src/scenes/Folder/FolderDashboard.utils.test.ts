import { BASIC_HTTP_CHECK } from 'test/fixtures/checks';

import { Check } from 'types';
import { CheckRuntimeAlertStates, getCheckCompositeKey } from 'data/useCheckAlertStates';

import { FolderCheckMetrics } from './FolderDashboard.hooks';
import { orderChecksByAttention } from './FolderDashboard.utils';
import { ExecutionRecord, FolderExecutionLogs } from './FolderSwimlane.hooks';

function makeCheck(job: string): Check {
  return { ...BASIC_HTTP_CHECK, id: job.length, job, target: `https://${job}.example.com` };
}

function makeMetrics(downJobs: string[]): FolderCheckMetrics {
  return {
    getSummary: (check: Check) => ({ isUp: !downJobs.includes(check.job) }),
    upCount: 0,
    downCount: downJobs.length,
    downChecks: [],
    avgReachability: undefined,
    isLoading: false,
  };
}

function makeFailure(check: Check, timestamp: number): ExecutionRecord {
  return {
    timestamp,
    probe: 'probe-1',
    success: false,
    durationSeconds: 1,
    job: check.job,
    instance: check.target,
  };
}

function makeExecutionLogs(failures: ExecutionRecord[]): FolderExecutionLogs {
  return {
    timeRange: { from: 0, to: 10_000 },
    executionsByCheck: new Map(),
    failures,
    isLoading: false,
  };
}

function makeAlertStates(firingJobToCheck: Check[]): CheckRuntimeAlertStates {
  return Object.fromEntries(
    firingJobToCheck.map((check) => [
      getCheckCompositeKey(check.job, check.target),
      { firingCount: 1, firingAlertNames: new Set(['alert']) },
    ])
  );
}

describe(`orderChecksByAttention`, () => {
  it(`orders down before alerting before recent failures before healthy`, () => {
    const healthy = makeCheck('aaa-healthy');
    const failedRecently = makeCheck('failed-recently');
    const alerting = makeCheck('alerting');
    const down = makeCheck('down');

    const result = orderChecksByAttention(
      [healthy, failedRecently, alerting, down],
      makeMetrics([down.job]),
      makeAlertStates([alerting]),
      makeExecutionLogs([makeFailure(failedRecently, 500), makeFailure(down, 900)])
    );

    expect(result.map((check) => check.job)).toEqual([down.job, alerting.job, failedRecently.job, healthy.job]);
  });

  it(`orders more failures first within the recent-failures tier, then most recent`, () => {
    const oneOldFailure = makeCheck('one-old');
    const oneNewFailure = makeCheck('one-new');
    const twoFailures = makeCheck('two');

    const result = orderChecksByAttention(
      [oneOldFailure, oneNewFailure, twoFailures],
      makeMetrics([]),
      undefined,
      makeExecutionLogs([
        makeFailure(oneOldFailure, 100),
        makeFailure(oneNewFailure, 900),
        makeFailure(twoFailures, 200),
        makeFailure(twoFailures, 300),
      ])
    );

    expect(result.map((check) => check.job)).toEqual([twoFailures.job, oneNewFailure.job, oneOldFailure.job]);
  });

  it(`orders healthy checks alphabetically`, () => {
    const zebra = makeCheck('zebra');
    const apple = makeCheck('apple');
    const mango = makeCheck('mango');

    const result = orderChecksByAttention([zebra, apple, mango], makeMetrics([]), undefined, makeExecutionLogs([]));

    expect(result.map((check) => check.job)).toEqual([apple.job, mango.job, zebra.job]);
  });
});
