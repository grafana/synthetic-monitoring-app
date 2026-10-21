import { dateTime, TimeRange } from '@grafana/data';

import { CheckType } from 'types';

import { buildCheckNotebookSnapshot } from './checkNotebookContext';

const timeRange: TimeRange = {
  from: dateTime('2026-10-20T10:00:00Z'),
  to: dateTime('2026-10-20T11:00:00Z'),
  raw: { from: 'now-1h', to: 'now' },
};

const context = {
  check: { id: 42, job: 'Checkout health' },
  checkType: CheckType.Http,
  timeRange,
  timeZone: 'America/Los_Angeles',
  probeValues: ['London', 'New York'],
  resolvedProbeFilter: '(London|New York)',
  metricsDatasourceUid: 'selected-metrics-uid',
  appSubUrl: '/grafana',
  origin: 'https://grafana.example.com',
};

it('captures raw relative time, the absolute window, timezone, datasource UID and resolved probe filter', () => {
  const snapshot = buildCheckNotebookSnapshot(context);

  expect(snapshot.defaultTitle).toBe('Synthetic Monitoring: Checkout health');
  expect(snapshot.cells).toHaveLength(1);
  expect(snapshot.cells[0].kind).toBe('markdown');
  const text = snapshot.cells[0].text;
  expect(text).toContain('Selected window: now\\-1h → now');
  expect(text).toContain('2026\\-10\\-20T10:00:00\\.000Z → 2026\\-10\\-20T11:00:00\\.000Z');
  expect(text).toContain('Time zone: America/Los\\_Angeles');
  expect(text).toContain('Probe filter (resolved): \\(London\\|New York\\)');
  expect(text).toContain('Metrics datasource UID: selected\\-metrics\\-uid');
  expect(text).toContain('Context only — no chart');
});

it('builds a canonical check link with a frozen window and selected probes, including a Grafana subpath', () => {
  const { text } = buildCheckNotebookSnapshot(context).cells[0];
  const url = new URL(text.match(/\[Open check at captured window\]\(<([^>]+)>\)/)![1]);

  expect(url.origin).toBe(context.origin);
  expect(url.pathname).toBe('/grafana/a/grafana-synthetic-monitoring-app/checks/42');
  expect(Object.fromEntries(url.searchParams)).toMatchObject({
    from: '2026-10-20T10:00:00.000Z',
    to: '2026-10-20T11:00:00.000Z',
    timezone: 'America/Los_Angeles',
  });
  expect(url.searchParams.getAll('var-probe')).toEqual(['London', 'New York']);
  expect(Array.from(url.searchParams.keys())).toEqual(['from', 'to', 'timezone', 'var-probe', 'var-probe']);
});

it('serializes absolute raw selections as ISO strings rather than mutable DateTime objects', () => {
  const snapshot = buildCheckNotebookSnapshot({
    ...context,
    timeRange: { ...timeRange, raw: { from: timeRange.from, to: timeRange.to } },
  });

  expect(snapshot.cells[0].text).toContain(
    'Selected window: 2026\\-10\\-20T10:00:00\\.000Z → 2026\\-10\\-20T11:00:00\\.000Z'
  );
});

it.each([CheckType.Http, CheckType.MultiHttp, CheckType.Scripted, CheckType.Browser])(
  'allowlists context for %s without serializing targets, auth, headers, bodies, scripts, labels or raw payloads',
  (checkType) => {
    const check = {
      id: 42,
      job: 'Checkout health',
      target: 'https://fake-user:fake-password@example.com/private/fake-token?token=fake-query#fake-fragment',
      settings: {
        http: { basicAuth: { password: 'fake-auth' }, headers: ['fake-header'], body: 'fake-body' },
        multihttp: { entries: [{ request: { body: 'fake-multi-body' } }] },
        k6: { script: 'fake-script' },
        browser: { script: 'fake-browser-script' },
      },
      labels: [{ name: 'private', value: 'fake-label' }],
      rawRunPayload: 'fake-run-payload',
    };
    const output = JSON.stringify(buildCheckNotebookSnapshot({ ...context, check, checkType }));

    expect(output).not.toContain('fake-');
    expect(output).not.toContain('example.com/private');
    expect(output).toContain(`Type: ${checkType}`);
  }
);

it('escapes check names and filter values as text, preventing markdown links or HTML injection', () => {
  const { text } = buildCheckNotebookSnapshot({
    ...context,
    check: { id: 42, job: '[Click](javascript:alert(1))\n<script>bad</script>' },
    resolvedProbeFilter: '<img src=x> & [unsafe](https://evil.example)',
  }).cells[0];

  expect(text).toContain('\\[Click\\]\\(javascript:alert\\(1\\)\\) &lt;script&gt;bad&lt;/script&gt;');
  expect(text).toContain('&lt;img src=x&gt; &amp; \\[unsafe\\]');
  expect(text).not.toContain('<script>');
  expect(text).not.toContain('[Click](');
});
