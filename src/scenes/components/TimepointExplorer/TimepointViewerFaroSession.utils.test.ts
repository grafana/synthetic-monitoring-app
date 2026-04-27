import { ParsedLokiRecord } from 'features/parseLokiLogs/parseLokiLogs.types';
import {
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

  it('returns the first record with both app_id and session_id', () => {
    const result = getFaroSessionFromLogs([
      makeRecord({ app_id: '', session_id: 'ignored' }),
      makeRecord({ app_id: '2', session_id: 'abc123' }),
      makeRecord({ app_id: '2', session_id: 'def456' }),
    ]);

    expect(result).toEqual({ appId: '2', sessionId: 'abc123' });
  });

  it('returns null when no record has both ids', () => {
    expect(getFaroSessionFromLogs([])).toBeNull();
    expect(getFaroSessionFromLogs([makeRecord({ app_id: '2' })])).toBeNull();
    expect(getFaroSessionFromLogs([makeRecord({ session_id: 'abc' })])).toBeNull();
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
