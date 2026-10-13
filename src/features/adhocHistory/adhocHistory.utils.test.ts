import { dataFrameFromJSON } from '@grafana/data';
import { parseLokiLogs } from 'features/parseLokiLogs/parseLokiLogs';
import {
  ADHOC_HISTORY_LINES,
  adHocHistoryListResponse,
  APP_ADHOC_RUN_ID,
  GCX_ADHOC_RUN_ID,
  OLD_ADHOC_RUN_ID,
} from 'test/fixtures/adhocHistory';

import { AdHocHistoryListLabels } from './adhocHistory.types';
import { LokiDataFrame } from 'features/parseLokiLogs/parseLokiLogs.types';

import {
  buildAdHocHistoryListQuery,
  buildAdHocRunQuery,
  getRunSummary,
  toAdHocHistoryRuns,
} from './adhocHistory.utils';

function parseListResponse(lines = ADHOC_HISTORY_LINES) {
  const response = adHocHistoryListResponse('A', lines);
  const frame = dataFrameFromJSON(response.results.A.frames[0] as any) as LokiDataFrame<
    AdHocHistoryListLabels,
    Record<string, string>
  >;

  return parseLokiLogs<AdHocHistoryListLabels, Record<string, string>>(frame);
}

describe('buildAdHocHistoryListQuery', () => {
  it('extracts only the summary fields and drops the line body', () => {
    expect(buildAdHocHistoryListQuery()).toBe(
      `{source="synthetic-monitoring", type="adhoc"} | json id, target, check_name, job, client_type, success, duration_seconds, probes_requested | line_format "{{.id}}"`
    );
  });
});

describe('buildAdHocRunQuery', () => {
  it('filters the result lines by run id', () => {
    expect(buildAdHocRunQuery(GCX_ADHOC_RUN_ID)).toBe(
      `{source="synthetic-monitoring", type="adhoc"} |= "${GCX_ADHOC_RUN_ID}"`
    );
  });
});

describe('toAdHocHistoryRuns', () => {
  it('groups probe results by run id, newest run first', () => {
    const runs = toAdHocHistoryRuns(parseListResponse());

    expect(runs.map((run) => run.id)).toEqual([GCX_ADHOC_RUN_ID, APP_ADHOC_RUN_ID, OLD_ADHOC_RUN_ID]);
    expect(runs[0].probes.map((probe) => probe.probe)).toEqual(['Frankfurt', 'Tokyo']);
  });

  it('reads the run metadata from new result lines', () => {
    const [gcxRun] = toAdHocHistoryRuns(parseListResponse());

    expect(gcxRun).toMatchObject({
      target: 'https://grafana.com/',
      checkType: 'http',
      job: 'Grafana homepage',
      clientType: 'gcx',
      probesRequested: 2,
      probes: [
        { probe: 'Frankfurt', success: true, durationSeconds: 0.5 },
        { probe: 'Tokyo', success: false, durationSeconds: 0.5 },
      ],
    });
    expect(gcxRun.time).toBe(Math.min(...gcxRun.probes.map((probe) => probe.time)));
    expect(gcxRun.lastTime).toBe(Math.max(...gcxRun.probes.map((probe) => probe.time)));
  });

  it('leaves the metadata undefined for result lines from older agents', () => {
    const runs = toAdHocHistoryRuns(parseListResponse());
    const oldRun = runs.find((run) => run.id === OLD_ADHOC_RUN_ID)!;

    expect(oldRun.job).toBeUndefined();
    expect(oldRun.clientType).toBeUndefined();
    expect(oldRun.probesRequested).toBeUndefined();
    expect(oldRun.probes).toEqual([expect.objectContaining({ probe: 'Frankfurt', success: undefined })]);
  });

  it('ignores the same log line returned by two overlapping pages', () => {
    const records = parseListResponse();
    const runs = toAdHocHistoryRuns([...records, records[0]]);

    expect(runs.flatMap((run) => run.probes)).toHaveLength(records.length);
  });
});

describe('getRunSummary', () => {
  it('passes a run when every requested probe succeeded', () => {
    const runs = toAdHocHistoryRuns(parseListResponse());
    const appRun = runs.find((run) => run.id === APP_ADHOC_RUN_ID)!;

    expect(getRunSummary({ ...appRun, probesRequested: 1 })).toEqual({
      status: 'passed',
      passed: 1,
      total: 1,
      missing: 0,
    });
  });

  it('fails a run when a probe failed', () => {
    const [gcxRun] = toAdHocHistoryRuns(parseListResponse());

    expect(getRunSummary(gcxRun)).toEqual({ status: 'failed', passed: 1, total: 2, missing: 0 });
  });

  it('fails a run when a requested probe never reported', () => {
    const runs = toAdHocHistoryRuns(parseListResponse());
    const appRun = runs.find((run) => run.id === APP_ADHOC_RUN_ID)!;

    expect(getRunSummary(appRun)).toEqual({ status: 'failed', passed: 1, total: 2, missing: 1 });
  });

  it('is unknown when the result lines carry no success field', () => {
    const runs = toAdHocHistoryRuns(parseListResponse());
    const oldRun = runs.find((run) => run.id === OLD_ADHOC_RUN_ID)!;

    expect(getRunSummary(oldRun)).toEqual({ status: 'unknown', passed: 0, total: 1, missing: 0 });
  });
});
