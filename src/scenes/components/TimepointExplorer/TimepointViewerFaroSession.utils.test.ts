import { ParsedLokiRecord } from 'features/parseLokiLogs/parseLokiLogs.types';
import { StatefulTimepoint } from 'scenes/components/TimepointExplorer/TimepointExplorer.types';
import {
  buildFaroSessionByExecutionIdLogQL,
  buildFaroSessionHref,
  buildFaroSessionProbeLogQL,
  collectExecutionIdsFromListLogsMap,
  getFaroSessionFromLogs,
  reduceRumAvailability,
} from 'scenes/components/TimepointExplorer/TimepointViewerFaroSession.utils';

describe('buildFaroSessionByExecutionIdLogQL', () => {
  it('builds an exact-match query keyed on the run execution id', () => {
    const expr = buildFaroSessionByExecutionIdLogQL('181470e3-502b-40d3-ba9b-a2035037e7d8');

    expect(expr).toBe(
      '{kind=~"event|measurement"} | logfmt | k6_isK6Browser="true"' +
        ' | k6_testRunId="sm:181470e3-502b-40d3-ba9b-a2035037e7d8"'
    );
  });

  it('uses an exact label match', () => {
    const expr = buildFaroSessionByExecutionIdLogQL('exec-1');

    expect(expr).toContain('k6_testRunId="sm:exec-1"');
    expect(expr).not.toContain('k6_testRunId=~');
  });
});

describe('getFaroSessionFromLogs', () => {
  const makeRecord = (
    labels: Record<string, string>
  ): ParsedLokiRecord<Record<string, string>, Record<string, string>> => ({
    labels,
    timestamp: 0,
    body: '',
    nanos: 0,
    labelTypes: {},
    id: 'id-1',
  });

  it('ignores records missing app_id or session_id and returns a usable one', () => {
    const result = getFaroSessionFromLogs([
      makeRecord({ app_id: '', session_id: 'ignored' }),
      makeRecord({ app_id: '2', session_id: 'abc123' }),
      makeRecord({ app_id: '2', session_id: 'def456' }),
    ]);

    // Single record each, no rotation -> deterministic tie-break on first seen.
    expect(result).toEqual({ appId: '2', sessionId: 'abc123' });
  });

  it('returns null when no record has both ids', () => {
    expect(getFaroSessionFromLogs([])).toBeNull();
    expect(getFaroSessionFromLogs([makeRecord({ app_id: '2' })])).toBeNull();
    expect(getFaroSessionFromLogs([makeRecord({ session_id: 'abc' })])).toBeNull();
  });

  it('skips the rotated-away stub session even though it appears first', () => {
    // Mirrors the real Faro behaviour: a short-lived landing session
    // (session_start + recording.started) that is rotated away from, then the
    // real journey session referencing it via previousSession.
    const result = getFaroSessionFromLogs([
      makeRecord({ app_id: '3', session_id: 'stub1', event_name: 'session_start' }),
      makeRecord({ app_id: '3', session_id: 'stub1', event_name: 'faro.session_recording.started' }),
      makeRecord({ app_id: '3', session_id: 'real1', session_attr_previousSession: 'stub1' }),
      makeRecord({ app_id: '3', session_id: 'real1', page_id: '/signup' }),
      makeRecord({ app_id: '3', session_id: 'real1', page_id: '/dashboard' }),
    ]);

    expect(result).toEqual({ appId: '3', sessionId: 'real1' });
  });

  it('picks the session with the most matching records', () => {
    const result = getFaroSessionFromLogs([
      makeRecord({ app_id: '3', session_id: 'sparse' }),
      makeRecord({ app_id: '3', session_id: 'rich' }),
      makeRecord({ app_id: '3', session_id: 'rich' }),
      makeRecord({ app_id: '3', session_id: 'rich' }),
    ]);

    expect(result).toEqual({ appId: '3', sessionId: 'rich' });
  });

  it('settles on the terminal session across a rotation chain (older -> a -> b)', () => {
    const result = getFaroSessionFromLogs([
      makeRecord({ app_id: '3', session_id: 'a', session_attr_previousSession: 'older' }),
      makeRecord({ app_id: '3', session_id: 'b', session_attr_previousSession: 'a' }),
      makeRecord({ app_id: '3', session_id: 'b', session_attr_previousSession: 'a' }),
    ]);

    // 'older' and 'a' were rotated away from; 'b' is the terminal session.
    expect(result).toEqual({ appId: '3', sessionId: 'b' });
  });
});

describe('buildFaroSessionHref', () => {
  it('builds a URL that points at the Frontend Observability app session page', () => {
    expect(
      buildFaroSessionHref({
        pluginId: 'grafana-kowalski-app',
        appId: '2',
        sessionId: 'abc123',
      })
    ).toBe('/a/grafana-kowalski-app/apps/2/sessions/abc123');
  });

  it('URL-encodes dynamic segments', () => {
    expect(
      buildFaroSessionHref({
        pluginId: 'grafana-kowalski-app',
        appId: 'with space',
        sessionId: 'a/b',
      })
    ).toBe('/a/grafana-kowalski-app/apps/with%20space/sessions/a%2Fb');
  });
});

describe('buildFaroSessionProbeLogQL', () => {
  it('returns an empty string when there are no execution ids', () => {
    expect(buildFaroSessionProbeLogQL([])).toBe('');
  });

  it('ORs unique execution ids into a single regex match', () => {
    expect(buildFaroSessionProbeLogQL(['exec-1', 'exec-2', 'exec-1'])).toBe(
      '{kind=~"event|measurement"} | logfmt | k6_isK6Browser="true" | k6_testRunId=~"sm:(exec-1|exec-2)"'
    );
  });

  it('escapes regex metacharacters in execution ids', () => {
    expect(buildFaroSessionProbeLogQL(['exec.1+2'])).toContain('sm:(exec\\.1\\+2)');
  });
});

describe('collectExecutionIdsFromListLogsMap', () => {
  const makeTimepoint = (
    adjustedTime: number,
    executionIds: string[]
  ): StatefulTimepoint => ({
    adjustedTime,
    timepointDuration: 1000,
    status: 'success',
    index: 0,
    config: { frequency: 60000, from: adjustedTime, to: adjustedTime + 60000 },
    maxProbeDuration: 1000,
    probeResults: {
      probeA: executionIds.map((execution_id) => ({
        labels: { execution_id },
      })) as StatefulTimepoint['probeResults'][string],
    },
  });

  it('collects unique execution ids newest-first and returns a time window', () => {
    const listLogsMap = {
      3000: makeTimepoint(3000, ['exec-new']),
      1000: makeTimepoint(1000, ['exec-old', 'exec-new']),
    };

    expect(collectExecutionIdsFromListLogsMap(listLogsMap)).toEqual({
      executionIds: ['exec-new', 'exec-old'],
      from: 1000,
      to: 3000 + 1000 + 60000,
    });
  });

  it('respects the execution id cap', () => {
    const listLogsMap = {
      1000: makeTimepoint(
        1000,
        Array.from({ length: 5 }, (_, i) => `exec-${i}`)
      ),
    };

    expect(collectExecutionIdsFromListLogsMap(listLogsMap, 2).executionIds).toEqual(['exec-0', 'exec-1']);
  });
});

describe('reduceRumAvailability', () => {
  it('promotes to present on passive success', () => {
    expect(reduceRumAvailability('unknown', { type: 'passive-success' })).toBe('present');
    expect(reduceRumAvailability('absent', { type: 'passive-success' })).toBe('present');
  });

  it('applies probe present/absent when not already present', () => {
    expect(reduceRumAvailability('unknown', { type: 'probe-result', result: 'present' })).toBe('present');
    expect(reduceRumAvailability('unknown', { type: 'probe-result', result: 'absent' })).toBe('absent');
  });

  it('never demotes present', () => {
    expect(reduceRumAvailability('present', { type: 'probe-result', result: 'absent' })).toBe('present');
    expect(reduceRumAvailability('present', { type: 'probe-error' })).toBe('present');
  });

  it('leaves availability unchanged on probe error', () => {
    expect(reduceRumAvailability('unknown', { type: 'probe-error' })).toBe('unknown');
    expect(reduceRumAvailability('absent', { type: 'probe-error' })).toBe('absent');
  });
});
