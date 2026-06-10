import { ParsedLokiRecord } from 'features/parseLokiLogs/parseLokiLogs.types';
import {
  buildFaroSessionByExecutionIdLogQL,
  buildFaroSessionHref,
  buildFaroSessionLogQL,
  escapeRegex,
  getFaroSessionFromLogs,
} from 'scenes/components/TimepointExplorer/TimepointViewerFaroSession.utils';

describe('escapeRegex', () => {
  it('escapes regex special characters', () => {
    expect(escapeRegex('hello.world+foo*bar')).toBe('hello\\.world\\+foo\\*bar');
    expect(escapeRegex('a(b)c[d]e{f}')).toBe('a\\(b\\)c\\[d\\]e\\{f\\}');
  });

  it('leaves plain strings alone', () => {
    expect(escapeRegex('Daily Focus Studio Homepage')).toBe('Daily Focus Studio Homepage');
    expect(escapeRegex('probe-1')).toBe('probe-1');
  });
});

describe('buildFaroSessionLogQL', () => {
  it('builds a LogQL query that filters by job, instance and probe with independent label filters', () => {
    const expr = buildFaroSessionLogQL({
      job: 'Daily Focus Studio Homepage',
      instance: 'daily-focus-studio',
      probe: 'probe-1',
    });

    expect(expr).toBe(
      '{kind=~"event|measurement"} | logfmt | k6_isK6Browser="true"' +
        ' | k6_testRunId=~`.*"job":"Daily Focus Studio Homepage".*`' +
        ' | k6_testRunId=~`.*"instance":"daily-focus-studio".*`' +
        ' | k6_testRunId=~`.*"probe":"probe-1".*`'
    );
  });

  it('uses one label filter per key so the upstream JSON key order does not matter', () => {
    const expr = buildFaroSessionLogQL({
      job: 'j',
      instance: 'i',
      probe: 'p',
    });

    const filterCount = (expr.match(/k6_testRunId=~/g) ?? []).length;
    expect(filterCount).toBe(3);
  });

  it('escapes regex special characters in the dynamic fragments', () => {
    const expr = buildFaroSessionLogQL({
      job: 'foo.bar+baz',
      instance: 'weird(instance)',
      probe: 'p{1}',
    });

    expect(expr).toContain('"job":"foo\\.bar\\+baz"');
    expect(expr).toContain('"instance":"weird\\(instance\\)"');
    expect(expr).toContain('"probe":"p\\{1\\}"');
  });
});

describe('buildFaroSessionByExecutionIdLogQL', () => {
  it('builds an exact-match query keyed on the run execution id', () => {
    const expr = buildFaroSessionByExecutionIdLogQL('181470e3-502b-40d3-ba9b-a2035037e7d8');

    expect(expr).toBe(
      '{kind=~"event|measurement"} | logfmt | k6_isK6Browser="true"' +
        ' | k6_testRunId="sm:181470e3-502b-40d3-ba9b-a2035037e7d8"'
    );
  });

  it('uses an exact label match rather than the legacy regex filters', () => {
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
