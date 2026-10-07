import {
  buildFailureStream,
  buildFaroErrorHref,
  FaroRecord,
  getBuildActivity,
  getBuildChanges,
  getBuildCommit,
  getBuildInsight,
  getBuildSegments,
  getFailureTrend,
  getJourneySteps,
  LabelledSeries,
  parseFaroRunContext,
} from 'scenes/components/TimepointExplorer/FrontendContext.utils';

const HOUR = 60 * 60 * 1000;

let recordId = 0;

function record(labels: Record<string, string>, timestamp = 0): FaroRecord {
  recordId += 1;

  return {
    labels: { app_id: '5385', session_id: 'run-session', app_name: 'ecommerce', ...labels },
    timestamp,
    body: '',
    nanos: 0,
    labelTypes: {},
    id: `id-${recordId}`,
  };
}

const PRODUCTS_500 = "Response not ok. Status code: 500. Message: 'Failed to load products'. Url: <URL>";

describe('parseFaroRunContext', () => {
  it('reads failed requests reported with Faro 2.x (OpenTelemetry) field names', () => {
    const run = parseFaroRunContext([
      record({
        kind: 'event',
        event_name: 'faro.tracing.fetch',
        page_id: '/',
        event_data_http_request_method: 'GET',
        event_data_http_response_status_code: '500',
        event_data_url_full: 'https://shop.example/api/products?currencyCode=USD',
        event_data_url_template: 'https://shop.example/api/products',
        event_data_duration_ns: '120000000',
        action_name: 'view-products',
        traceID: 'abc',
      }),
      record({
        kind: 'event',
        event_name: 'faro.tracing.fetch',
        page_id: '/',
        event_data_http_request_method: 'GET',
        event_data_http_response_status_code: '200',
        event_data_url_full: 'https://shop.example/api/cart',
      }),
    ]);

    expect(run?.failedRequests).toEqual([
      expect.objectContaining({
        method: 'GET',
        statusCode: 500,
        urlTemplate: 'https://shop.example/api/products',
        durationMs: 120,
        actionName: 'view-products',
        traceId: 'abc',
      }),
    ]);
  });

  it('still reads Faro 1.x field names', () => {
    const run = parseFaroRunContext([
      record({
        kind: 'event',
        event_name: 'faro.tracing.xml-http-request',
        event_data_http_method: 'POST',
        event_data_http_status_code: '0',
        event_data_http_url: 'https://shop.example/api/checkout',
      }),
    ]);

    expect(run?.failedRequests).toEqual([expect.objectContaining({ method: 'POST', statusCode: 0 })]);
  });

  it('does not mistake a missing status code for a request that got no response', () => {
    const run = parseFaroRunContext([
      record({ kind: 'event', event_name: 'faro.tracing.fetch', event_data_http_response_status_code: '' }),
    ]);

    expect(run?.failedRequests).toEqual([]);
  });

  it('groups exceptions by their normalised template', () => {
    const run = parseFaroRunContext([
      record({
        kind: 'exception',
        type: 'Error',
        value: 'products failed for session a',
        value_template: PRODUCTS_500,
        page_id: '/',
        hash: '123',
      }),
      record({
        kind: 'exception',
        type: 'Error',
        value: 'products failed for session b',
        value_template: PRODUCTS_500,
        page_id: '/',
      }),
    ]);

    expect(run?.errors).toEqual([expect.objectContaining({ template: PRODUCTS_500, hash: '123', count: 2 })]);
  });

  it('reads the build and the page journey in visit order', () => {
    const run = parseFaroRunContext([
      record({ kind: 'measurement', page_id: '/cart', app_version: '1.0.0', app_bundle_id: '96a54767dfb2' }, 3),
      record({ kind: 'measurement', page_id: '/', app_version: '1.0.0', app_bundle_id: '96a54767dfb2' }, 1),
      record({ kind: 'event', event_name: 'faro.user.action', page_id: '/product/*' }, 2),
    ]);

    expect(run?.build).toEqual({ version: '1.0.0', bundleId: '96a54767dfb2' });
    expect(run?.pages).toEqual(['/', '/product/*', '/cart']);
  });

  it('ignores records from other sessions the run produced', () => {
    const run = parseFaroRunContext([
      record({ kind: 'measurement', page_id: '/' }),
      record({ kind: 'measurement', page_id: '/' }),
      record({ kind: 'exception', value: 'stub', session_id: 'stub-session' }),
    ]);

    expect(run?.errors).toEqual([]);
  });
});

function buildSeries(version: string, bundleId: string, points: Array<[number, number]>): LabelledSeries {
  return { labels: { app_version: version, app_bundle_id: bundleId }, points };
}

describe('build history', () => {
  const OLD = buildSeries('1.0.0', '406e90c0', [
    [1 * HOUR, 500],
    [2 * HOUR, 500],
    [3 * HOUR, 117],
  ]);
  const NEW = buildSeries('1.0.0', '3e1b62ec', [
    [3 * HOUR, 370],
    [4 * HOUR, 498],
  ]);

  it('dates a deploy that kept the same version string by its bundle id', () => {
    const changes = getBuildChanges(getBuildActivity([OLD, NEW]));

    expect(changes).toEqual([
      {
        time: 3 * HOUR,
        build: { version: '1.0.0', bundleId: '3e1b62ec' },
        previous: { version: '1.0.0', bundleId: '406e90c0' },
      },
    ]);
  });

  it('does not report a build that was already serving when the window starts', () => {
    expect(getBuildChanges(getBuildActivity([NEW]))).toEqual([]);
  });

  it('ignores a single stray page load on another build', () => {
    const stray = buildSeries('1.0.0', 'stale', [[4 * HOUR, 1]]);

    expect(getBuildChanges(getBuildActivity([OLD, stray]))).toEqual([]);
  });

  it('collapses buckets into segments of the build serving the most page loads', () => {
    const segments = getBuildSegments(getBuildActivity([OLD, NEW]), 0, 4 * HOUR, HOUR);

    expect(segments).toEqual([
      { from: 0, to: 2 * HOUR, key: '1.0.0|406e90c0' },
      { from: 2 * HOUR, to: 4 * HOUR, key: '1.0.0|3e1b62ec' },
    ]);
  });
});

describe('getBuildInsight', () => {
  const MINUTE = 60 * 1000;
  const STEP = 15 * MINUTE;
  // The run started 5 minutes before the 3h bucket ended; its results window
  // (and the real-user hour before it) ends 10 minutes after that.
  const RUN_TIME = 3 * HOUR - 5 * MINUTE;
  const REAL_USER_WINDOW_FROM = RUN_TIME + 10 * MINUTE - HOUR;

  const OLD_BUILD = { version: '1.0.0', bundleId: 'old' };
  const NEW_BUILD = { version: '1.0.0', bundleId: 'new' };
  const OLD = buildSeries('1.0.0', 'old', [
    [1 * HOUR, 500],
    [2 * HOUR, 500],
    [3 * HOUR, 400],
  ]);

  function realUsers(oldLoads: number, newLoads: number) {
    return [buildSeries('1.0.0', 'old', [[3 * HOUR, oldLoads]]), buildSeries('1.0.0', 'new', [[3 * HOUR, newLoads]])];
  }

  function insightFor(params: Partial<Parameters<typeof getBuildInsight>[0]> & { newSeries: LabelledSeries }) {
    const { newSeries, ...rest } = params;

    return getBuildInsight({
      runBuild: NEW_BUILD,
      runTime: RUN_TIME,
      activity: getBuildActivity([OLD, newSeries]),
      stepMs: STEP,
      realUserLoads: [],
      realUserWindowFrom: REAL_USER_WINDOW_FROM,
      ...rest,
    });
  }

  it('treats a build deployed just before the run as rolling out, not as the wrong build', () => {
    const insight = insightFor({
      // the run itself is the only page load on the new build so far
      newSeries: buildSeries('1.0.0', 'new', [[3 * HOUR, 1]]),
      realUserLoads: realUsers(980, 20),
      uploads: { new: RUN_TIME - 4 * MINUTE },
    });

    expect(insight.start).toEqual({ from: RUN_TIME - 4 * MINUTE, to: RUN_TIME - 4 * MINUTE, source: 'source-maps' });
    expect(insight.previous).toEqual(OLD_BUILD);
    expect(insight.realUsers).toEqual({
      loads: 1000,
      runBuildShare: 0.02,
      dominant: { build: OLD_BUILD, share: 0.98 },
      comparison: 'rolling-out',
    });
  });

  it('dates the deploy to its page-load bucket when no upload pins it down, never after the run', () => {
    const insight = insightFor({
      newSeries: buildSeries('1.0.0', 'new', [[3 * HOUR, 3]]),
      // uploaded long before the bucket: built then, deployed later
      uploads: { new: 1 * HOUR },
    });

    expect(insight.start).toEqual({ from: 3 * HOUR - STEP, to: RUN_TIME, source: 'page-loads' });
    expect(insight.uploadedAt).toBe(1 * HOUR);
  });

  it('flags a newer build that most users still do not get long after it went live', () => {
    const insight = insightFor({
      newSeries: buildSeries('1.0.0', 'new', [
        [2 * HOUR, 40],
        [3 * HOUR, 60],
      ]),
      realUserLoads: realUsers(900, 100),
    });

    expect(insight.realUsers?.comparison).toBe('newer');
  });

  it('flags a run served an older build than most real users', () => {
    const insight = insightFor({
      runBuild: OLD_BUILD,
      newSeries: buildSeries('1.0.0', 'new', [
        [2 * HOUR, 300],
        [3 * HOUR, 600],
      ]),
      realUserLoads: realUsers(100, 900),
    });

    expect(insight.start).toBeUndefined();
    expect(insight.realUsers?.comparison).toBe('older');
  });

  it('reports the same build when most real users were on it', () => {
    const insight = insightFor({
      newSeries: buildSeries('1.0.0', 'new', [[3 * HOUR, 600]]),
      realUserLoads: realUsers(400, 600),
    });

    expect(insight.realUsers?.comparison).toBe('same');
  });
});

describe('getBuildCommit', () => {
  const SHA = '96a54767dfb26d88c4984969b2cc874413f4bcac';

  it('prefers the git hash the app reports', () => {
    expect(getBuildCommit({ bundleId: '1759840000-abcde', gitHash: SHA })).toEqual({ sha: SHA, source: 'git-hash' });
  });

  it('recognises a bundle id that has the shape of a commit SHA', () => {
    expect(getBuildCommit({ bundleId: SHA })).toEqual({ sha: SHA, source: 'bundle-id' });
  });

  it('does not treat a generated bundle id as a commit', () => {
    expect(getBuildCommit({ version: '1.0.0', bundleId: '1759840000-abcde' })).toBeUndefined();
  });
});

describe('getFailureTrend', () => {
  it('zero-fills buckets and dates a failure that started inside the window', () => {
    const trend = getFailureTrend(
      [
        [3 * HOUR, 5],
        [4 * HOUR, 9],
      ],
      0,
      4 * HOUR,
      HOUR
    );

    expect(trend).toEqual({ buckets: [0, 0, 5, 9], firstSeen: 3 * HOUR });
  });

  it('does not date a failure already happening at the start of the window', () => {
    const trend = getFailureTrend(
      [
        [1 * HOUR, 2],
        [4 * HOUR, 9],
      ],
      0,
      4 * HOUR,
      HOUR
    );

    expect(trend.firstSeen).toBeUndefined();
  });
});

describe('buildFailureStream', () => {
  it('matches exceptions on the template and leaves k6 sessions out', () => {
    const stream = buildFailureStream('5385', { kind: 'exception', template: PRODUCTS_500, message: 'raw' });

    expect(stream).toContain(
      `value_template="Response not ok. Status code: 500. Message: 'Failed to load products'. Url: <URL>"`
    );
    expect(stream).toContain('k6_isK6Browser=~""');
  });

  it('matches failed requests on endpoint, method and status under either SDK naming', () => {
    const stream = buildFailureStream('5385', {
      kind: 'request',
      method: 'GET',
      url: 'https://shop.example/api/products?x=1',
      urlTemplate: 'https://shop.example/api/products',
      statusCode: 500,
    });

    expect(stream).toContain('event_data_url_template="https://shop.example/api/products"');
    expect(stream).toContain('(event_data_http_response_status_code="500" or event_data_http_status_code="500")');
    expect(stream).toContain('(event_data_http_request_method="GET" or event_data_http_method="GET")');
  });
});

describe('getJourneySteps', () => {
  it('marks where the run failed and ended, and never reports more error sessions than visits', () => {
    const steps = getJourneySteps({
      run: {
        pages: ['/', '/cart'],
        errors: [{ pageId: '/' } as never],
        failedRequests: [],
      },
      sessionsByPage: { '/': 10 },
      errorSessionsByPage: { '/': 12, '/cart': 3 },
    });

    expect(steps).toEqual([
      { pageId: '/', sessions: 10, errorSessions: 10, runFailedHere: true, runEndedHere: false },
      { pageId: '/cart', sessions: 0, errorSessions: 0, runFailedHere: false, runEndedHere: true },
    ]);
  });
});

describe('buildFaroErrorHref', () => {
  it('pins the error group page to the given window instead of its 30-minute default', () => {
    const to = Date.UTC(2026, 9, 7, 17, 21, 30);

    expect(
      buildFaroErrorHref({ pluginId: 'grafana-kowalski-app', appId: '5385', hash: '1531466', from: to - HOUR, to })
    ).toBe(`/a/grafana-kowalski-app/apps/5385/errors/1531466?from=${to - HOUR}&to=${to}`);
  });
});
