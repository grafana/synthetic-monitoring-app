import { ADHOC_HISTORY_LIST_FIELDS } from 'features/adhocHistory/adhocHistory.constants';

// Ad-hoc result lines as published by the agent, one per probe. "New" lines come from agents that
// include the run metadata (job, client_type, success, ...); "old" lines predate it.
export interface AdHocResultLineFixture {
  time: number;
  probe: string;
  body: Record<string, unknown>;
}

const BASE_TIME = Date.UTC(2026, 0, 15, 12, 0, 0);

function probeSuccessTimeseries(success: boolean) {
  return [
    {
      name: 'probe_success',
      help: 'whether the check was successful',
      type: 1,
      metric: [{ gauge: { value: success ? 1 : 0 } }],
    },
    {
      name: 'probe_duration_seconds',
      help: 'duration of the check in seconds',
      type: 1,
      metric: [{ gauge: { value: 0.5 } }],
    },
  ];
}

function buildLine({
  time,
  probe,
  id,
  target,
  checkName,
  success,
  metadata,
}: {
  time: number;
  probe: string;
  id: string;
  target: string;
  checkName: string;
  success: boolean;
  metadata?: Record<string, unknown>;
}): AdHocResultLineFixture {
  return {
    time,
    probe,
    body: {
      level: 'warn',
      id,
      target,
      probe,
      check_name: checkName,
      ...(metadata && { success, duration_seconds: 0.5, ...metadata }),
      logs: [
        { level: 'info', msg: `${probe} ${success ? 'succeeded' : 'failed'}`, time: new Date(time).toISOString() },
      ],
      timeseries: probeSuccessTimeseries(success),
      message: 'ad-hoc check done',
    },
  };
}

export const GCX_ADHOC_RUN_ID = 'aaaaaaaa-0000-4000-8000-000000000001';
export const APP_ADHOC_RUN_ID = 'aaaaaaaa-0000-4000-8000-000000000002';
export const OLD_ADHOC_RUN_ID = 'aaaaaaaa-0000-4000-8000-000000000003';

// Newest run: started from gcx, two probes requested, one failed.
export const GCX_ADHOC_RUN_LINES: AdHocResultLineFixture[] = [
  buildLine({
    time: BASE_TIME + 2000,
    probe: 'Frankfurt',
    id: GCX_ADHOC_RUN_ID,
    target: 'https://grafana.com/',
    checkName: 'http',
    success: true,
    metadata: {
      job: 'Grafana homepage',
      labels: [{ name: 'env', value: 'prod' }],
      client_type: 'gcx',
      probes_requested: 2,
    },
  }),
  buildLine({
    time: BASE_TIME + 2500,
    probe: 'Tokyo',
    id: GCX_ADHOC_RUN_ID,
    target: 'https://grafana.com/',
    checkName: 'http',
    success: false,
    metadata: {
      job: 'Grafana homepage',
      labels: [{ name: 'env', value: 'prod' }],
      client_type: 'gcx',
      probes_requested: 2,
    },
  }),
];

// Started from the app, two probes requested but only one reported back.
export const APP_ADHOC_RUN_LINES: AdHocResultLineFixture[] = [
  buildLine({
    time: BASE_TIME - 60_000,
    probe: 'Frankfurt',
    id: APP_ADHOC_RUN_ID,
    target: 'example.com',
    checkName: 'ping',
    success: true,
    metadata: {
      job: 'Example ping',
      client_type: 'grafana-synthetic-monitoring-app',
      probes_requested: 2,
    },
  }),
];

// Published by an agent that predates the run metadata.
export const OLD_ADHOC_RUN_LINES: AdHocResultLineFixture[] = [
  buildLine({
    time: BASE_TIME - 120_000,
    probe: 'Frankfurt',
    id: OLD_ADHOC_RUN_ID,
    target: 'https://old.example.com/',
    checkName: 'http',
    success: true,
  }),
];

export const ADHOC_HISTORY_LINES: AdHocResultLineFixture[] = [
  ...GCX_ADHOC_RUN_LINES,
  ...APP_ADHOC_RUN_LINES,
  ...OLD_ADHOC_RUN_LINES,
];

const STREAM_LABELS = { source: 'synthetic-monitoring', type: 'adhoc' };

// Mirrors what Loki returns for `| json <fields> | line_format "{{.id}}"`: the requested fields are
// extracted into (string) labels when present in the line, and the line itself is replaced by the id.
function toListRow(line: AdHocResultLineFixture) {
  const extracted = ADHOC_HISTORY_LIST_FIELDS.reduce<Record<string, string>>((acc, field) => {
    const value = line.body[field];

    if (value !== undefined) {
      acc[field] = String(value);
    }

    return acc;
  }, {});

  return {
    labels: { ...STREAM_LABELS, probe: line.probe, ...extracted },
    line: String(line.body.id),
    time: line.time,
  };
}

function toDetailRow(line: AdHocResultLineFixture) {
  return {
    labels: { ...STREAM_LABELS, probe: line.probe },
    line: JSON.stringify(line.body),
    time: line.time,
  };
}

function lokiFrames(refId: string, rows: Array<{ labels: Record<string, string>; line: string; time: number }>) {
  // Loki returns lines newest first
  const sorted = [...rows].sort((a, b) => b.time - a.time);

  return {
    results: {
      [refId]: {
        status: 200,
        frames: [
          {
            schema: {
              refId,
              meta: { typeVersion: [0, 0], custom: { frameType: 'LabeledTimeValues' } },
              fields: [
                { name: 'labels', type: 'other', typeInfo: { frame: 'json.RawMessage' } },
                { name: 'Time', type: 'time', typeInfo: { frame: 'time.Time' } },
                { name: 'Line', type: 'string', typeInfo: { frame: 'string' } },
                { name: 'tsNs', type: 'string', typeInfo: { frame: 'string' } },
                {
                  name: 'labelTypes',
                  type: 'other',
                  typeInfo: { frame: 'json.RawMessage' },
                  config: { custom: { hidden: true } },
                },
                { name: 'id', type: 'string', typeInfo: { frame: 'string' } },
              ],
            },
            data: {
              values: [
                sorted.map((row) => row.labels),
                sorted.map((row) => row.time),
                sorted.map((row) => row.line),
                sorted.map((row) => `${row.time}000000`),
                sorted.map(() => ({})),
                sorted.map((row, index) => `${row.time}_${index}_${row.line.slice(0, 8)}`),
              ],
            },
          },
        ],
      },
    },
  };
}

export function adHocHistoryListResponse(refId: string, lines: AdHocResultLineFixture[] = ADHOC_HISTORY_LINES) {
  return lokiFrames(refId, lines.map(toListRow));
}

export function adHocRunResponse(refId: string, lines: AdHocResultLineFixture[]) {
  return lokiFrames(refId, lines.map(toDetailRow));
}
