import { MSG_STRINGS_COMMON, MSG_STRINGS_HTTP } from 'features/parseCheckLogs/checkLogs.constants.msgs';
import {
  discardIncompleteChecks,
  groupByExecution,
  groupByProbe,
  parseCheckLogs,
} from 'features/parseCheckLogs/parseCheckLogs';

import {
  ExecutionFailedLog,
  ExecutionLabelType,
  ExecutionSucceededLog,
  StartingLog,
  UnknownExecutionLog,
} from 'features/parseCheckLogs/checkLogs.types';
import { MakingHTTPRequestLog, ReceivedHTTPResponseLog } from 'features/parseCheckLogs/checkLogs.types.http';
import { CheckType } from 'types';

const labelTypes: ExecutionLabelType = {
  check_name: 'I',
  detected_level: 'S',
  instance: 'I',
  job: 'I',
};

const discard1: MakingHTTPRequestLog = {
  Time: 1713859200000,
  tsNs: 17138592000001000,
  labels: {
    probe: 'probe1',
    host: 'host1',
    url: 'url1',
    msg: MSG_STRINGS_HTTP.MakingHTTPRequest,
    check_name: CheckType.HTTP,
    detected_level: 'info',
    instance: 'instance1',
    job: 'job1',
    probe_success: '0',
    region: 'region1',
    service_name: 'service1',
    source: 'synthetic-monitoring-agent',
  },
  Line: 'line1',
  labelTypes,
  id: 'id1',
};

const discard2: ReceivedHTTPResponseLog = {
  Time: 1713859200,
  tsNs: 17138592000002000,
  labels: {
    probe: 'probe1',
    http_request: 'http_request1',
    msg: MSG_STRINGS_HTTP.ReceivedHTTPResponse,
    check_name: CheckType.HTTP,
    detected_level: 'info',
    instance: 'instance1',
    job: 'job1',
    probe_success: '0',
    region: 'region1',
    service_name: 'service1',
    source: 'synthetic-monitoring-agent',
  },
  Line: 'line2',
  labelTypes,
  id: 'id2',
};

// todo: need a log factory
const probe1_log1: StartingLog = {
  Time: 1713859200000,
  tsNs: 17138592000001000,
  labels: {
    probe: 'probe1',
    msg: MSG_STRINGS_COMMON.BeginningCheck,
    check_name: CheckType.HTTP,
    detected_level: 'info',
    instance: 'instance1',
    job: 'job1',
    probe_success: '0',
    region: 'region1',
    service_name: 'service1',
    source: 'synthetic-monitoring-agent',
  },
  Line: 'line3',
  labelTypes,
  id: 'id3',
};

const probe1_log2: ExecutionFailedLog = {
  Time: 1713859200000,
  tsNs: 17138592000002000,
  labels: {
    probe: 'probe1',
    duration_seconds: '10',
    msg: MSG_STRINGS_COMMON.CheckFailed,
    check_name: CheckType.HTTP,
    detected_level: 'error',
    instance: 'instance2',
    job: 'job2',
    probe_success: '0',
    region: 'region2',
    service_name: 'service2',
    source: 'synthetic-monitoring-agent',
  },
  Line: 'line4',
  labelTypes,
  id: 'id4',
};

const probe2_log1: StartingLog = {
  Time: 1713859200000,
  tsNs: 17138592000001000,
  labels: {
    probe: 'probe2',
    msg: MSG_STRINGS_COMMON.BeginningCheck,
    check_name: CheckType.HTTP,
    detected_level: 'info',
    instance: 'instance1',
    job: 'job1',
    probe_success: '1',
    region: 'region1',
    service_name: 'service1',
    source: 'synthetic-monitoring-agent',
  },
  Line: 'line5',
  labelTypes,
  id: 'id5',
};

const probe2_log2: ExecutionSucceededLog = {
  Time: 1713859200000,
  tsNs: 17138592000002000,
  labels: {
    probe: 'probe2',
    duration_seconds: '10',
    msg: MSG_STRINGS_COMMON.CheckSucceeded,
    check_name: CheckType.HTTP,
    detected_level: 'info',
    instance: 'instance2',
    job: 'job2',
    probe_success: '1',
    region: 'region2',
    service_name: 'service2',
    source: 'synthetic-monitoring-agent',
  },
  Line: 'line6',
  labelTypes,
  id: 'id6',
};

describe('groupLogs', () => {
  it('should group logs by probe', () => {
    const logs: UnknownExecutionLog[] = [probe1_log1, probe1_log2, probe2_log1, probe2_log2, discard1, discard2];
    const groupedLogs = parseCheckLogs(logs);

    expect(groupedLogs).toEqual([
      {
        probe: 'probe1',
        checks: [[probe1_log1, probe1_log2]],
        id: `id2`,
      },
      {
        probe: 'probe2',
        checks: [[probe2_log1, probe2_log2]],
        id: `id6`,
      },
    ]);
  });
});

describe('groupByProbe', () => {
  it('should group logs by probe', () => {
    const logs: UnknownExecutionLog[] = [probe1_log1, probe1_log2, probe2_log1, probe2_log2];
    const groupedLogs = groupByProbe(logs);

    expect(groupedLogs).toEqual({
      probe1: [probe1_log1, probe1_log2],
      probe2: [probe2_log1, probe2_log2],
    });
  });
});

describe('groupByExecution', () => {
  it('should group logs by exeuction', () => {
    const logs: UnknownExecutionLog[] = [probe1_log1, probe1_log2];
    const groupedLogs = groupByExecution(logs);

    expect(groupedLogs).toEqual([[probe1_log1, probe1_log2]]);
  });
});

describe('discardIncompleteChecks', () => {
  it('should discard incomplete checks from the start', () => {
    const logs: UnknownExecutionLog[] = [probe2_log2, probe1_log1, probe1_log2];
    const filteredLogs = discardIncompleteChecks({
      logs,
      matchMsg: [MSG_STRINGS_COMMON.BeginningCheck],
    });

    expect(filteredLogs).toEqual([probe1_log1, probe1_log2]);
  });

  it('should discard incomplete checks from the end', () => {
    const logs: UnknownExecutionLog[] = [probe1_log1, probe1_log2, probe2_log1];
    const filteredLogs = discardIncompleteChecks({
      logs,
      matchMsg: [MSG_STRINGS_COMMON.CheckFailed, MSG_STRINGS_COMMON.CheckSucceeded],
      reverse: true,
    });

    expect(filteredLogs).toEqual([probe1_log1, probe1_log2]);
  });

  it(`should discard nothing if the logs are all complete`, () => {
    const logs: UnknownExecutionLog[] = [probe1_log1, probe1_log2, probe2_log1, probe2_log2];
    const filteredLogs = discardIncompleteChecks({
      logs,
      matchMsg: [MSG_STRINGS_COMMON.BeginningCheck],
    });

    expect(filteredLogs).toEqual(logs);
  });
});

describe('splitMultipleExecutions', () => {
  it('should split multiple executions', () => {
    const logs: UnknownExecutionLog[] = [probe1_log1, probe1_log2, probe1_log1, probe1_log2];
    const result = groupByExecution(logs);
    expect(result).toEqual([
      [probe1_log1, probe1_log2],
      [probe1_log1, probe1_log2],
    ]);
  });
});
