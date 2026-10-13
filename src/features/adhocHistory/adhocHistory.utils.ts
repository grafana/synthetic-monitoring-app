import { AdHocHistoryListLabels, AdHocHistoryRun, AdHocRunSummary } from './adhocHistory.types';
import { ParsedLokiRecord } from 'features/parseLokiLogs/parseLokiLogs.types';

import { ADHOC_HISTORY_LIST_FIELDS, ADHOC_HISTORY_STREAM_SELECTOR } from './adhocHistory.constants';

export type AdHocHistoryListRecord = ParsedLokiRecord<AdHocHistoryListLabels, Record<string, string>>;

export function buildAdHocHistoryListQuery() {
  return `${ADHOC_HISTORY_STREAM_SELECTOR} | json ${ADHOC_HISTORY_LIST_FIELDS.join(', ')} | line_format "{{.id}}"`;
}

export function buildAdHocRunQuery(id: string) {
  return `${ADHOC_HISTORY_STREAM_SELECTOR} |= "${id}"`;
}

function parseBoolean(value?: string) {
  if (value === 'true') {
    return true;
  }

  if (value === 'false') {
    return false;
  }

  return undefined;
}

function parseNumber(value?: string) {
  if (value === undefined || value === '') {
    return undefined;
  }

  const parsed = Number(value);

  return Number.isFinite(parsed) ? parsed : undefined;
}

function emptyToUndefined(value?: string) {
  return value ? value : undefined;
}

// Groups the per-probe result lines into runs, newest run first.
export function toAdHocHistoryRuns(records: AdHocHistoryListRecord[]): AdHocHistoryRun[] {
  const seenRecords = new Set<string>();
  const runs = new Map<string, AdHocHistoryRun>();

  for (const record of records) {
    // consecutive pages overlap on their boundary timestamp
    if (seenRecords.has(record.id)) {
      continue;
    }

    seenRecords.add(record.id);

    const { labels } = record;
    const id = labels.id ?? record.body;
    const time = record.timestamp;

    if (!id) {
      continue;
    }

    const run: AdHocHistoryRun = runs.get(id) ?? {
      id,
      time,
      lastTime: time,
      target: labels.target ?? '',
      checkType: labels.check_name ?? '',
      job: emptyToUndefined(labels.job),
      clientType: emptyToUndefined(labels.client_type),
      probesRequested: parseNumber(labels.probes_requested),
      probes: [],
    };

    run.time = Math.min(run.time, time);
    run.lastTime = Math.max(run.lastTime, time);
    run.probes.push({
      probe: labels.probe,
      time,
      success: parseBoolean(labels.success),
      durationSeconds: parseNumber(labels.duration_seconds),
    });

    runs.set(id, run);
  }

  return [...runs.values()]
    .map((run) => ({ ...run, probes: [...run.probes].sort((a, b) => a.probe.localeCompare(b.probe)) }))
    .sort((a, b) => b.time - a.time);
}

export function getRunSummary(run: AdHocHistoryRun): AdHocRunSummary {
  const total = Math.max(run.probesRequested ?? 0, run.probes.length);
  const missing = total - run.probes.length;
  const passed = run.probes.filter((probe) => probe.success === true).length;

  if (run.probes.some((probe) => probe.success === undefined)) {
    return { status: 'unknown', passed, total, missing };
  }

  return { status: passed === total ? 'passed' : 'failed', passed, total, missing };
}
