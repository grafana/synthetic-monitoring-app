import { faker } from '@faker-js/faker';
import { MSG_STRINGS_COMMON } from 'features/parseCheckLogs/checkLogs.constants.msgs';
import { Factory } from 'fishery';

import {
  ExecutionEndedLog,
  ExecutionFailedLog,
  ExecutionLabelType,
  ExecutionLogs,
  ExecutionSucceededLog,
  StartingLog,
  UnknownExecutionLog,
} from 'features/parseCheckLogs/checkLogs.types';
import { CheckType } from 'types';

// Factory for CheckLabelType
const checkLabelTypeFactory = Factory.define<ExecutionLabelType>(() => ({
  check_name: 'I',
  detected_level: 'S',
  instance: 'I',
  job: 'I',
}));

export const unknownExecutionLogFactory = Factory.define<UnknownExecutionLog>(({ params }) => {
  const { Time = faker.date.recent().getTime() } = params;
  const job = faker.company.name();
  const instance = faker.internet.ip();

  return {
    Time,
    tsNs: Time * 1000,
    labels: {
      probe: ``,
      msg: ``,
      check_name: CheckType.HTTP,
      detected_level: 'info' as const,
      instance,
      job,
      probe_success: faker.datatype.boolean() ? '1' : '0',
      region: faker.location.countryCode(),
      service_name: job,
      source: 'synthetic-monitoring-agent' as const,
    },
    Line: faker.lorem.sentence(),
    labelTypes: checkLabelTypeFactory.build(),
    id: faker.string.uuid(),
  };
});

export const startingLogFactory = Factory.define<StartingLog>(({ params }) => {
  const log = unknownExecutionLogFactory.build(params);

  return {
    ...log,
    labels: {
      ...log.labels,
      msg: MSG_STRINGS_COMMON.BeginningCheck,
    },
  };
});

export const succeededLogFactory = Factory.define<ExecutionSucceededLog>(({ params }) => {
  const log = unknownExecutionLogFactory.build(params);

  return {
    ...log,
    labels: {
      ...log.labels,
      duration_seconds: faker.number.float({ min: 0.1, max: 30.0, fractionDigits: 3 }).toString(),
      msg: MSG_STRINGS_COMMON.CheckSucceeded,
      probe_success: '1' as const,
    },
  };
});

export const failedLogFactory = Factory.define<ExecutionFailedLog>(({ params }) => {
  const log = unknownExecutionLogFactory.build(params);

  return {
    ...log,
    labels: {
      ...log.labels,
      duration_seconds: faker.number.float({ min: 0.1, max: 30.0, fractionDigits: 3 }).toString(),
      msg: MSG_STRINGS_COMMON.CheckFailed,
      probe_success: '0' as const,
    },
  };
});

interface EndingLogTransientParams {
  isSuccess: boolean;
}

export const endingLogFactory = Factory.define<ExecutionEndedLog, EndingLogTransientParams>(
  ({ params, transientParams }) => {
    const { isSuccess } = transientParams;
    const { labels, ...rest } = params;
    const { probe_success, ...restLabels } = labels ?? {};
    console.log(rest.Time);

    return isSuccess
      ? succeededLogFactory.build({
          labels: {
            ...restLabels,
            msg: MSG_STRINGS_COMMON.CheckSucceeded,
          },
          ...rest,
        })
      : failedLogFactory.build({
          labels: {
            ...restLabels,
            msg: MSG_STRINGS_COMMON.CheckFailed,
          },
          ...rest,
        });
  }
);

export const executionLogsFactory = Factory.define<ExecutionLogs>(({ transientParams }) => {
  const { isSuccess, probeName } = transientParams;

  const labels = {
    probe: probeName,
  };

  const startingLog = startingLogFactory.build({
    labels: {
      ...labels,
      probe_success: isSuccess ? ('1' as const) : ('0' as const),
    },
  });
  const endingLog = isSuccess
    ? succeededLogFactory.build({
        labels,
      })
    : failedLogFactory.build({
        labels,
      });

  return [startingLog, endingLog];
});
