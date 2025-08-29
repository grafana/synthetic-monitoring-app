import { faker } from '@faker-js/faker';
import { MSG_STRINGS_COMMON } from 'features/parseCheckLogs/checkLogs.constants.msgs';
import { Factory } from 'fishery';

import {
  ExecutionEndedLog,
  ExecutionFailedLog,
  ExecutionLogs,
  ExecutionSucceededLog,
  FailedLogLabels,
  StartingLog,
  StartingLogLabels,
  SucceededLogLabels,
  UnknownExecutionLog,
} from 'features/parseCheckLogs/checkLogs.types';
import { CheckType } from 'types';

const labelTypes = {
  check_name: 'I',
  detected_level: 'S',
  instance: 'I',
  job: 'I',
} as const;

// these are factories that create parsedLokiLogs
// they do not create logs which are returned by the datasource
// so are unsuitable for using for MSW

interface ExecutionLogTransientParams {
  isSuccess: boolean;
}

export function buildExecutionLogFactory<L extends Record<string, string>>(labels: L) {
  return Factory.define<UnknownExecutionLog<L>, ExecutionLogTransientParams>(({ params, transientParams }) => {
    const base = unknownExecutionLogFactory.build(params, {
      transient: transientParams,
    });

    return {
      ...base,
      labels: {
        ...base.labels,
        ...labels,
      },
    };
  });
}

export const unknownExecutionLogFactory = Factory.define<UnknownExecutionLog, ExecutionLogTransientParams>(
  ({ params, transientParams }) => {
    const { Time = faker.date.recent().getTime() } = params;
    const { isSuccess = Math.random() > 0.5 } = transientParams;
    const job = faker.company.name();
    const instance = faker.internet.ip();

    return {
      Time,
      tsNs: Time * 1000000,
      labels: {
        probe: ``,
        msg: ``,
        check_name: CheckType.HTTP,
        detected_level: 'info' as const,
        instance,
        job,
        level: 'info' as const,
        probe_success: isSuccess ? '1' : '0',
        region: faker.location.countryCode(),
        service_name: job,
        source: 'synthetic-monitoring-agent' as const,
      },
      Line: faker.lorem.sentence(),
      labelTypes,
      id: faker.string.uuid(),
    };
  }
);

const startingLogLabels = {
  msg: MSG_STRINGS_COMMON.BeginningCheck,
  timeout_seconds: '10',
  type: CheckType.HTTP,
} as const;

export const startingLogFactory: Factory<StartingLog> = buildExecutionLogFactory<StartingLogLabels>(startingLogLabels);

const succeededLogLabels = {
  duration_seconds: faker.number.float({ min: 0.1, max: 30.0, fractionDigits: 3 }).toString(),
  msg: MSG_STRINGS_COMMON.CheckSucceeded,
  probe_success: '1' as const,
} as const;

export const succeededLogFactory: Factory<ExecutionSucceededLog> =
  buildExecutionLogFactory<SucceededLogLabels>(succeededLogLabels);

const failedLogLabels = {
  duration_seconds: faker.number.float({ min: 0.1, max: 30.0, fractionDigits: 3 }).toString(),
  msg: MSG_STRINGS_COMMON.CheckFailed,
  probe_success: '0' as const,
} as const;

export const failedLogFactory: Factory<ExecutionFailedLog> = buildExecutionLogFactory<FailedLogLabels>(failedLogLabels);

interface EndingLogTransientParams {
  isSuccess: boolean;
}

export const endingLogFactory = Factory.define<ExecutionEndedLog, EndingLogTransientParams>(
  ({ params, transientParams }) => {
    const { isSuccess = Math.random() > 0.5 } = transientParams;
    const { labels, ...rest } = params;

    return isSuccess
      ? succeededLogFactory.build({
          labels: {
            ...labels,
            probe_success: '1' as const,
            msg: MSG_STRINGS_COMMON.CheckSucceeded,
          },
          ...rest,
        })
      : failedLogFactory.build({
          labels: {
            ...labels,
            level: 'error' as const,
            detected_level: 'error' as const,
            probe_success: '0' as const,
            msg: MSG_STRINGS_COMMON.CheckFailed,
          },
          ...rest,
        });
  }
);

interface ExecutionLogsTransientParams {
  commonLabels: Record<string, string>;
  executionDuration: number;
  isSuccess: boolean;
  logs: UnknownExecutionLog[];
  probeName: string;
}

export const executionLogsFactory = Factory.define<ExecutionLogs, ExecutionLogsTransientParams>(
  ({ transientParams = {} }) => {
    const { commonLabels, logs = [], isSuccess, executionDuration = 1000 } = transientParams;

    const startingLog = startingLogFactory.build({
      labels: {
        ...commonLabels,
        probe_success: isSuccess ? ('1' as const) : ('0' as const),
      },
    });

    const endingLog = endingLogFactory.build(
      {
        labels: {
          ...commonLabels,
          duration_seconds: String(executionDuration / 1000),
        },
      },
      {
        transient: {
          isSuccess,
        },
      }
    );

    return [startingLog, ...logs.map((log) => ({ ...log, labels: { ...log.labels, ...commonLabels } })), endingLog];
  }
);
