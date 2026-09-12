export interface ExecutionLogSpec {
  probe: string;
  probeSuccess: '0' | '1';
  time: number;
  durationSeconds?: string;
}

interface CreateExecutionLogsResponseOptions {
  job: string;
  instance: string;
  logs: ExecutionLogSpec[];
}

// Builds a minimal Loki response containing one execution-ended log per spec,
// in the same frame shape as the recorded `checkLogs.ts` fixture but with
// controllable timestamps and probe_success values.
export function createExecutionLogsResponse(
  refId: string,
  { job, instance, logs }: CreateExecutionLogsResponseOptions
) {
  const labels = logs.map(({ probe, probeSuccess, durationSeconds = '0.5' }) => {
    const level = probeSuccess === '1' ? 'info' : 'error';
    const msg = probeSuccess === '1' ? 'Check succeeded' : 'Check failed';

    return {
      check_name: 'http',
      detected_level: level,
      duration_seconds: durationSeconds,
      instance,
      job,
      level,
      msg,
      probe,
      probe_success: probeSuccess,
      region: 'EMEA',
      source: 'synthetic-monitoring-agent',
      target: instance,
    };
  });

  return {
    results: {
      [refId]: {
        status: 200,
        frames: [
          {
            schema: {
              refId,
              meta: {
                typeVersion: [0, 0],
                custom: {
                  frameType: 'LabeledTimeValues',
                },
                executedQueryString: `Expr: {job="${job}", instance="${instance}"} | logfmt |="duration_seconds="`,
              },
              fields: [
                { name: 'labels', type: 'other', typeInfo: { frame: 'json.RawMessage' } },
                { name: 'Time', type: 'time', typeInfo: { frame: 'time.Time' } },
                { name: 'Line', type: 'string', typeInfo: { frame: 'string' } },
                { name: 'tsNs', type: 'string', typeInfo: { frame: 'string' } },
                { name: 'labelTypes', type: 'other', typeInfo: { frame: 'json.RawMessage' } },
                { name: 'id', type: 'string', typeInfo: { frame: 'string' } },
              ],
            },
            data: {
              values: [
                labels,
                logs.map(({ time }) => time),
                labels.map(
                  ({ msg, level, duration_seconds, probe_success }) =>
                    `level=${level} msg="${msg}" probe_success=${probe_success} duration_seconds=${duration_seconds}`
                ),
                logs.map(({ time }) => `${time}000000`),
                logs.map(() => ({})),
                logs.map(({ time, probe }) => `${time}000000_${probe}`),
              ],
            },
          },
        ],
      },
    },
  };
}
