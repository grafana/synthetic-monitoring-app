import { MSG_STRINGS_COMMON, MSG_STRINGS_HTTP } from 'features/parseCheckLogs/checkLogs.constants.msgs';
import { discardIncompleteChecks, groupByCheck, groupByProbe, groupLogs } from 'features/parseCheckLogs/groupLogs';

import { LabelsWithTime } from 'features/parseCheckLogs/checkLogs.types';

const discard1: LabelsWithTime = {
  time: 1713859200000,
  nanotime: 17138592000001000,
  value: {
    probe: 'probe1',
    msg: MSG_STRINGS_HTTP.MakingHTTPRequest,
    check_name: 'check1',
    detected_level: 'info',
    instance: 'instance1',
    job: 'job1',
    probe_success: '0',
    region: 'region1',
    service_name: 'service1',
    source: 'synthetic-monitoring-agent',
  },
};

const discard2: LabelsWithTime = {
  time: 1713859200,
  nanotime: 17138592000002000,
  value: {
    probe: 'probe1',
    msg: MSG_STRINGS_HTTP.ReceivedHTTPResponse,
    check_name: 'check1',
    detected_level: 'info',
    instance: 'instance1',
    job: 'job1',
    probe_success: '0',
    region: 'region1',
    service_name: 'service1',
    source: 'synthetic-monitoring-agent',
  },
};

// todo: need a log factory
const probe1_log1: LabelsWithTime = {
  time: 1713859200000,
  nanotime: 17138592000001000,
  value: {
    probe: 'probe1',
    msg: MSG_STRINGS_COMMON.BeginningCheck,
    check_name: 'check1',
    detected_level: 'info',
    instance: 'instance1',
    job: 'job1',
    probe_success: '0',
    region: 'region1',
    service_name: 'service1',
    source: 'synthetic-monitoring-agent',
  },
};

const probe1_log2: LabelsWithTime = {
  time: 1713859200000,
  nanotime: 17138592000002000,
  value: {
    probe: 'probe1',
    msg: MSG_STRINGS_COMMON.CheckFailed,
    check_name: 'check2',
    detected_level: 'error',
    instance: 'instance2',
    job: 'job2',
    probe_success: '0',
    region: 'region2',
    service_name: 'service2',
    source: 'synthetic-monitoring-agent',
  },
};

const probe2_log1: LabelsWithTime = {
  time: 1713859200000,
  nanotime: 17138592000001000,
  value: {
    probe: 'probe2',
    msg: MSG_STRINGS_COMMON.BeginningCheck,
    check_name: 'check1',
    detected_level: 'info',
    instance: 'instance1',
    job: 'job1',
    probe_success: '1',
    region: 'region1',
    service_name: 'service1',
    source: 'synthetic-monitoring-agent',
  },
};

const probe2_log2: LabelsWithTime = {
  time: 1713859200000,
  nanotime: 17138592000002000,
  value: {
    probe: 'probe2',
    msg: MSG_STRINGS_COMMON.CheckSucceeded,
    check_name: 'check2',
    detected_level: 'info',
    instance: 'instance2',
    job: 'job2',
    probe_success: '1',
    region: 'region2',
    service_name: 'service2',
    source: 'synthetic-monitoring-agent',
  },
};

describe('groupLogs', () => {
  it('should group logs by probe', () => {
    const logs: LabelsWithTime[] = [probe1_log1, probe1_log2, probe2_log1, probe2_log2, discard1, discard2];
    const groupedLogs = groupLogs(logs);

    expect(groupedLogs).toEqual([
      {
        probe: 'probe1',
        checks: [[probe1_log1, probe1_log2]],
      },
      {
        probe: 'probe2',
        checks: [[probe2_log1, probe2_log2]],
      },
    ]);
  });
});

describe('groupByProbe', () => {
  it('should group logs by probe', () => {
    const logs: LabelsWithTime[] = [probe1_log1, probe1_log2, probe2_log1, probe2_log2];
    const groupedLogs = groupByProbe(logs);

    expect(groupedLogs).toEqual({
      probe1: [probe1_log1, probe1_log2],
      probe2: [probe2_log1, probe2_log2],
    });
  });
});

describe('groupByCheck', () => {
  it('should group logs by check', () => {
    const logs: LabelsWithTime[] = [probe1_log1, probe1_log2];
    const groupedLogs = groupByCheck(logs);

    expect(groupedLogs).toEqual([[probe1_log1, probe1_log2]]);
  });
});

describe('discardIncompleteChecks', () => {
  it('should discard incomplete checks from the start', () => {
    const logs: LabelsWithTime[] = [probe2_log2, probe1_log1, probe1_log2];
    const filteredLogs = discardIncompleteChecks({
      logs,
      matchMsg: [MSG_STRINGS_COMMON.BeginningCheck],
    });

    expect(filteredLogs).toEqual([probe1_log1, probe1_log2]);
  });

  it('should discard incomplete checks from the end', () => {
    const logs: LabelsWithTime[] = [probe1_log1, probe1_log2, probe2_log1];
    const filteredLogs = discardIncompleteChecks({
      logs,
      matchMsg: [MSG_STRINGS_COMMON.CheckFailed, MSG_STRINGS_COMMON.CheckSucceeded],
      reverse: true,
    });

    expect(filteredLogs).toEqual([probe1_log1, probe1_log2]);
  });

  it(`should discard nothing if the logs are all complete`, () => {
    const logs: LabelsWithTime[] = [probe1_log1, probe1_log2, probe2_log1, probe2_log2];
    const filteredLogs = discardIncompleteChecks({
      logs,
      matchMsg: [MSG_STRINGS_COMMON.BeginningCheck],
    });

    expect(filteredLogs).toEqual(logs);
  });
});
