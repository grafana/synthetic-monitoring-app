import { MSG_STRINGS_COMMON } from 'features/parseCheckLogs/checkLogs.constants.msgs';
import {
  discardIncompleteChecks,
  groupByExecution,
  groupByProbe,
  parseCheckLogs,
} from 'features/parseCheckLogs/parseCheckLogs';
import {
  failedLogFactory,
  startingLogFactory,
  succeededLogFactory,
  unknownExecutionLogFactory,
} from 'test/factories/executionLogs';
import { httpResponseTimingsLogFactory } from 'test/factories/executionLogs.http';

import { UnknownExecutionLog } from 'features/parseCheckLogs/checkLogs.types';

const probe1_discard1 = httpResponseTimingsLogFactory.build({
  labels: {
    probe: 'probe1',
  },
});

const probe1_discard2 = unknownExecutionLogFactory.build({
  labels: {
    probe: 'probe1',
  },
});

const probe1_startingLog = startingLogFactory.build({
  labels: {
    probe: 'probe1',
  },
});

const probe1_failedLog = failedLogFactory.build({
  labels: {
    probe: 'probe1',
  },
});

const probe2_startingLog = startingLogFactory.build({
  labels: {
    probe: 'probe2',
  },
});

const probe2_succeededLog = succeededLogFactory.build({
  labels: {
    probe: 'probe2',
    duration_seconds: '10',
  },
});

describe('groupLogs', () => {
  it('should group logs by probe', () => {
    const logs: UnknownExecutionLog[] = [
      probe1_startingLog,
      probe1_failedLog,
      probe2_startingLog,
      probe2_succeededLog,
      probe1_discard1,
      probe1_discard2,
    ];
    const groupedLogs = parseCheckLogs(logs);

    expect(groupedLogs).toEqual([
      {
        probeName: 'probe1',
        executions: [[probe1_startingLog, probe1_failedLog]],
      },
      {
        probeName: 'probe2',
        executions: [[probe2_startingLog, probe2_succeededLog]],
      },
    ]);
  });
});

describe('groupByProbe', () => {
  it('should group logs by probe', () => {
    const logs: UnknownExecutionLog[] = [probe1_startingLog, probe1_failedLog, probe2_startingLog, probe2_succeededLog];
    const groupedLogs = groupByProbe(logs);

    expect(groupedLogs).toEqual({
      probe1: [probe1_startingLog, probe1_failedLog],
      probe2: [probe2_startingLog, probe2_succeededLog],
    });
  });
});

describe('groupByExecution', () => {
  it('should group logs by exeuction', () => {
    const logs: UnknownExecutionLog[] = [probe1_startingLog, probe1_failedLog];
    const groupedLogs = groupByExecution(logs);

    expect(groupedLogs).toEqual([[probe1_startingLog, probe1_failedLog]]);
  });
});

describe('discardIncompleteChecks', () => {
  it('should discard incomplete checks from the start', () => {
    const logs: UnknownExecutionLog[] = [probe2_succeededLog, probe1_startingLog, probe1_failedLog];
    const filteredLogs = discardIncompleteChecks({
      logs,
      matchMsg: [MSG_STRINGS_COMMON.BeginningCheck],
    });

    expect(filteredLogs).toEqual([probe1_startingLog, probe1_failedLog]);
  });

  it('should discard incomplete checks from the end', () => {
    const logs: UnknownExecutionLog[] = [probe1_startingLog, probe1_failedLog, probe2_startingLog];
    const filteredLogs = discardIncompleteChecks({
      logs,
      matchMsg: [MSG_STRINGS_COMMON.CheckFailed, MSG_STRINGS_COMMON.CheckSucceeded],
      reverse: true,
    });

    expect(filteredLogs).toEqual([probe1_startingLog, probe1_failedLog]);
  });

  it(`should discard nothing if the logs are all complete`, () => {
    const logs: UnknownExecutionLog[] = [probe1_startingLog, probe1_failedLog, probe2_startingLog, probe2_succeededLog];
    const filteredLogs = discardIncompleteChecks({
      logs,
      matchMsg: [MSG_STRINGS_COMMON.BeginningCheck],
    });

    expect(filteredLogs).toEqual(logs);
  });
});

describe('splitMultipleExecutions', () => {
  it('should split multiple executions', () => {
    const logs: UnknownExecutionLog[] = [probe1_startingLog, probe1_failedLog, probe1_startingLog, probe1_failedLog];
    const result = groupByExecution(logs);
    expect(result).toEqual([
      [probe1_startingLog, probe1_failedLog],
      [probe1_startingLog, probe1_failedLog],
    ]);
  });
});
