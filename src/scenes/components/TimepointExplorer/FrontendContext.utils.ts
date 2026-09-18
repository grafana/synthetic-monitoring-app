import { ParsedLokiRecord } from 'features/parseLokiLogs/parseLokiLogs.types';
import { getFaroSessionFromLogs } from 'scenes/components/TimepointExplorer/TimepointViewerFaroSession.utils';

export type FaroRecord = ParsedLokiRecord<Record<string, string>, Record<string, string>>;

export const WEB_VITALS = ['ttfb', 'fcp', 'lcp', 'cls', 'inp'] as const;
export type WebVitalName = (typeof WEB_VITALS)[number];

export const WEB_VITAL_LABELS: Record<WebVitalName, string> = {
  ttfb: 'TTFB',
  fcp: 'FCP',
  lcp: 'LCP',
  cls: 'CLS',
  inp: 'INP',
};

// Thresholds match the ones Frontend Observability displays (web.dev standard).
// Time-based vitals are in milliseconds, CLS is unitless.
const WEB_VITAL_THRESHOLDS: Record<WebVitalName, { good: number; poor: number }> = {
  ttfb: { good: 800, poor: 1800 },
  fcp: { good: 1800, poor: 3000 },
  lcp: { good: 2500, poor: 4000 },
  cls: { good: 0.1, poor: 0.25 },
  inp: { good: 200, poor: 500 },
};

export type WebVitalRating = 'good' | 'needs-improvement' | 'poor';

export function rateWebVital(name: WebVitalName, value: number): WebVitalRating {
  const { good, poor } = WEB_VITAL_THRESHOLDS[name];

  if (value <= good) {
    return 'good';
  }

  if (value <= poor) {
    return 'needs-improvement';
  }

  return 'poor';
}

export function formatWebVitalValue(name: WebVitalName, value: number): string {
  if (name === 'cls') {
    return value.toFixed(2);
  }

  if (value >= 1000) {
    return `${(value / 1000).toFixed(2)} s`;
  }

  return `${Math.round(value)} ms`;
}

export interface FaroPageVisit {
  pageId: string;
  vitals: Partial<Record<WebVitalName, number>>;
  // From faro.performance.navigation's event_data_pageLoadTime — a
  // PerformanceNavigationTiming entry, so (like TTFB/FCP) this only exists
  // for a hard document navigation, never a soft one. Richer than the Core
  // Web Vitals set: closes the "k6-browser dropped page-load-timing
  // metrics" gap without needing a k6 change, since Faro already reports it.
  pageLoadTimeMs?: number;
}

export interface FaroException {
  type: string;
  message: string;
  pageId: string;
  timestamp: number;
}

export interface FaroHttpRequest {
  method: string;
  url: string;
  // 0 means the request got no response at all (network failure, CORS, aborted)
  statusCode: number;
  isError: boolean;
  durationMs?: number;
  pageId: string;
  traceId?: string;
  timestamp: number;
}

export interface FaroAction {
  // Correlation id: the faro.user.action marker carries it as `action_id`,
  // every request that happened while the action was in progress carries the
  // same value as `action_parent_id`. Grouping by name alone would silently
  // merge separate instances of the same named action within one run.
  actionId: string;
  actionName: string;
  pageId: string;
  requestCount: number;
  errorCount: number;
  // From the SDK's own `event_data_userActionDuration` on the marker event —
  // authoritative (start-to-settle), not a derived approximation. Undefined
  // if the marker record didn't make it into this query's result.
  durationMs?: number;
  timestamp: number;
}

export interface FaroExecutionContext {
  appId: string;
  appName?: string;
  appVersion?: string;
  appEnvironment?: string;
  sessionId: string;
  pages: FaroPageVisit[];
  exceptions: FaroException[];
  requests: FaroHttpRequest[];
  actions: FaroAction[];
  hasSessionReplay: boolean;
}

/**
 * Superset of the CTA-button query: also pulls `exception` records so a single
 * request can power the whole frontend context panel for one execution.
 */
export function buildFaroExecutionContextLogQL(executionId: string): string {
  return `{kind=~"event|measurement|exception"} | logfmt | k6_isK6Browser="true" | k6_testRunId="sm:${executionId}"`;
}

const HTTP_EVENT_NAMES = ['faro.tracing.fetch', 'faro.tracing.xml-http-request'];
const USER_ACTION_EVENT_NAME = 'faro.user.action';

function isHttpErrorStatus(statusCode: number): boolean {
  return statusCode === 0 || (statusCode >= 400 && statusCode < 600);
}

/**
 * Distills the raw Faro records of a single check execution into the pieces we
 * surface in SM: the page journey, the run's own web vitals (as Faro measured
 * them — these can legitimately disagree with the k6-reported vitals since the
 * two tools measure at different points), JS exceptions, and failed HTTP calls.
 *
 * Records are scoped to the same session the "View Frontend Session" CTA picks
 * so both features always tell the same story.
 */
export function parseFaroExecutionContext(logs: FaroRecord[]): FaroExecutionContext | null {
  const session = getFaroSessionFromLogs(logs);

  if (!session) {
    return null;
  }

  const records = logs.filter((record) => record.labels?.session_id === session.sessionId);

  const pages = new Map<string, FaroPageVisit>();
  const exceptions: FaroException[] = [];
  const requests: FaroHttpRequest[] = [];
  const actions = new Map<string, FaroAction>();
  let appName: string | undefined;
  let appVersion: string | undefined;
  let appEnvironment: string | undefined;
  let hasSessionReplay = false;

  records.forEach((record) => {
    const labels = record.labels ?? {};
    const pageId = labels.page_id ?? '';

    appName = appName ?? labels.app_name;
    appVersion = appVersion ?? labels.app_version;
    appEnvironment = appEnvironment ?? labels.app_environment;

    if (pageId && !pages.has(pageId)) {
      pages.set(pageId, { pageId, vitals: {} });
    }

    if (labels.kind === 'measurement' && pageId) {
      const visit = pages.get(pageId)!;

      WEB_VITALS.forEach((vital) => {
        const value = Number(labels[vital]);

        if (labels[vital] !== undefined && !Number.isNaN(value)) {
          // records are sorted oldest-first so later reports (e.g. LCP updates) win
          visit.vitals[vital] = value;
        }
      });
    }

    if (labels.kind === 'exception') {
      exceptions.push({
        type: labels.type ?? 'Error',
        message: labels.value ?? record.body ?? '',
        pageId,
        timestamp: record.timestamp,
      });
    }

    if (labels.kind === 'event' && labels.event_name?.includes('session_recording')) {
      hasSessionReplay = true;
    }

    if (labels.kind === 'event' && labels.event_name === 'faro.performance.navigation' && pageId) {
      const pageLoadTime = Number(labels.event_data_pageLoadTime);

      if (!Number.isNaN(pageLoadTime)) {
        pages.get(pageId)!.pageLoadTimeMs = pageLoadTime;
      }
    }

    // The marker event for one action instance. Its own page_id is
    // authoritative — it reflects wherever the action actually settled, not
    // a stale page_id from the last hard navigation — so it always
    // overwrites; child request events below only seed pageId as a fallback
    // in case this marker line didn't make it into the query result.
    if (labels.kind === 'event' && labels.event_name === USER_ACTION_EVENT_NAME) {
      const actionId = labels.action_id;
      const actionName = labels.action_name;
      const durationMs = Number(labels.event_data_userActionDuration);

      if (actionId && actionName) {
        const entry = actions.get(actionId) ?? {
          actionId,
          actionName,
          pageId,
          requestCount: 0,
          errorCount: 0,
          timestamp: record.timestamp,
        };

        entry.pageId = pageId;

        if (!Number.isNaN(durationMs)) {
          entry.durationMs = durationMs;
        }

        entry.timestamp = Math.min(entry.timestamp, record.timestamp);
        actions.set(actionId, entry);
      }
    }

    if (labels.kind === 'event' && HTTP_EVENT_NAMES.includes(labels.event_name ?? '')) {
      // `| logfmt` folds `event_data_http.status_code` into underscores
      const statusCode = Number(labels.event_data_http_status_code);
      const durationNs = Number(labels.event_data_duration_ns);
      const isError = !Number.isNaN(statusCode) && isHttpErrorStatus(statusCode);

      if (!Number.isNaN(statusCode)) {
        requests.push({
          method: labels.event_data_http_method ?? 'GET',
          url: labels.event_data_http_url ?? '',
          statusCode,
          isError,
          durationMs: !Number.isNaN(durationNs) ? durationNs / 1_000_000 : undefined,
          pageId,
          traceId: labels.traceID,
          timestamp: record.timestamp,
        });
      }

      // Faro's User Actions feature: every request that happened while a
      // named, business-level action was in progress carries the action's
      // id back as `action_parent_id` — the same value the marker event
      // above carries as its own `action_id`. Correlating on that id (not
      // action_name, which repeats across separate instances of the same
      // named action) auto-groups a much better unit than page_id for
      // step-level detail on apps with soft navigation.
      const actionId = labels.action_parent_id;
      const actionName = labels.action_name;

      if (actionId && actionName) {
        const entry = actions.get(actionId) ?? {
          actionId,
          actionName,
          pageId, // fallback only — overwritten if the marker event is seen
          requestCount: 0,
          errorCount: 0,
          timestamp: record.timestamp,
        };

        entry.requestCount += 1;
        entry.errorCount += isError ? 1 : 0;
        entry.timestamp = Math.min(entry.timestamp, record.timestamp);
        actions.set(actionId, entry);
      }
    }
  });

  return {
    appId: session.appId,
    appName,
    appVersion,
    appEnvironment,
    sessionId: session.sessionId,
    pages: [...pages.values()],
    exceptions,
    requests,
    actions: [...actions.values()].sort((a, b) => a.timestamp - b.timestamp),
    hasSessionReplay,
  };
}

export function formatDurationMs(ms: number): string {
  if (ms >= 1000) {
    return `${(ms / 1000).toFixed(2)} s`;
  }

  return `${Math.round(ms)} ms`;
}

/** Median request duration (ms) for a page, from this run's own requests. */
export function getMedianRequestDuration(requests: FaroHttpRequest[], pageId: string): number | null {
  const durations = requests
    .filter((request) => request.pageId === pageId && request.durationMs !== undefined)
    .map((request) => request.durationMs!)
    .sort((a, b) => a - b);

  if (!durations.length) {
    return null;
  }

  const mid = Math.floor(durations.length / 2);

  return durations.length % 2 === 0 ? (durations[mid - 1] + durations[mid]) / 2 : durations[mid];
}

/** Compact display form for a request URL: path only, full URL on hover. */
export function getRequestPath(url: string): string {
  try {
    const parsed = new URL(url);
    return `${parsed.pathname}${parsed.search}`;
  } catch {
    return url;
  }
}

export function escapeLogQLString(value: string): string {
  return value.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
}

interface RealUserQueryParams {
  appId: string;
  pageId: string;
  range: string;
}

interface RealUserActionQueryParams {
  appId: string;
  actionName: string;
  range: string;
}

/**
 * Shared scaffold for every real-user baseline query below: a Faro log
 * stream for one `kind`, an optional line filter to narrow to a specific
 * event type, and the scope filter (page or action) — always preceded by
 * `k6_isK6Browser=~""`, the same filter Frontend Observability's own
 * per-route panels use to restrict results to records where the k6 field is
 * absent, i.e. real users only, no synthetic traffic.
 */
function buildRealUserLogStream({
  kind,
  appId,
  lineFilter,
  scopeFilter,
}: {
  kind: string;
  appId: string;
  lineFilter?: string;
  scopeFilter: string;
}): string {
  const parts = [`{kind="${kind}", app_id="${appId}"}`];

  if (lineFilter) {
    parts.push(lineFilter);
  }

  parts.push('| logfmt', '| k6_isK6Browser=~""', `| ${scopeFilter}`);

  return parts.join(' ');
}

function pageScopeFilter(pageId: string): string {
  return `page_id="${escapeLogQLString(pageId)}"`;
}

function actionScopeFilter(actionName: string): string {
  return `action_name="${escapeLogQLString(actionName)}"`;
}

function quantileOverTimeP75(stream: string, unwrapField: string, range: string): string {
  return `quantile_over_time(0.75, ${stream} | unwrap ${unwrapField} [${range}])`;
}

function sumCountOverTime(stream: string, range: string): string {
  return `sum(count_over_time(${stream} [${range}]))`;
}

// Faro's fetch/XHR event line carries the HTTP status code as
// `event_data_http.status_code`, folded to underscores by `| logfmt`.
const HTTP_EVENT_LINE_FILTER =
  '|~ "event_name=faro.tracing.fetch|event_name=faro.tracing.xml-http-request" |= "event_data_http.status_code="';
const HTTP_ERROR_STATUS_FILTER =
  '| (event_data_http_status_code >= 400 and event_data_http_status_code < 600) or event_data_http_status_code = 0';

export function buildRealUserVitalP75LogQL({ appId, pageId, range, vital }: RealUserQueryParams & { vital: WebVitalName }): string {
  const stream = buildRealUserLogStream({ kind: 'measurement', appId, lineFilter: `|= " ${vital}="`, scopeFilter: pageScopeFilter(pageId) });

  return quantileOverTimeP75(stream, vital, range);
}

/**
 * Real-user p75 page load time — from faro.performance.navigation's
 * event_data_pageLoadTime, a PerformanceNavigationTiming entry alongside a
 * full DNS/TCP/TLS/request/response breakdown. Same restriction as TTFB/FCP:
 * only exists for a hard document navigation, never a soft one.
 */
export function buildRealUserPageLoadTimeLogQL({ appId, pageId, range }: RealUserQueryParams): string {
  const stream = buildRealUserLogStream({
    kind: 'event',
    appId,
    lineFilter: '|= "event_name=faro.performance.navigation"',
    scopeFilter: pageScopeFilter(pageId),
  });

  return quantileOverTimeP75(stream, 'event_data_pageLoadTime', range);
}

export function buildRealUserPageLoadsLogQL({ appId, pageId, range }: RealUserQueryParams): string {
  const stream = buildRealUserLogStream({ kind: 'measurement', appId, lineFilter: '|= " ttfb="', scopeFilter: pageScopeFilter(pageId) });

  return sumCountOverTime(stream, range);
}

export function buildRealUserExceptionsLogQL({ appId, pageId, range }: RealUserQueryParams): string {
  const stream = buildRealUserLogStream({ kind: 'exception', appId, scopeFilter: pageScopeFilter(pageId) });

  return sumCountOverTime(stream, range);
}

export function buildRealUserHttpErrorsLogQL({ appId, pageId, range }: RealUserQueryParams): string {
  const stream = buildRealUserLogStream({ kind: 'event', appId, lineFilter: HTTP_EVENT_LINE_FILTER, scopeFilter: pageScopeFilter(pageId) });

  return sumCountOverTime(`${stream} ${HTTP_ERROR_STATUS_FILTER}`, range);
}

/**
 * Real-user p75 request latency on a page, in nanoseconds (matching
 * event_data_duration_ns's own unit — convert to ms when consuming).
 *
 * Fallback for pages where web vitals don't exist: LCP/FCP/TTFB are tied to
 * the initial document lifecycle, so a soft-navigated page never gets a
 * fresh FCP/TTFB measurement (LCP occasionally re-fires on soft nav,
 * FCP/TTFB structurally can't). Request latency has no such restriction —
 * every fetch/XHR call reports it regardless of navigation type — so it's
 * the next best "how did this page perform" signal once vitals are empty.
 */
export function buildRealUserRequestLatencyLogQL({ appId, pageId, range }: RealUserQueryParams): string {
  const stream = buildRealUserLogStream({
    kind: 'event',
    appId,
    lineFilter: '|~ "event_name=faro.tracing.fetch|event_name=faro.tracing.xml-http-request"',
    scopeFilter: pageScopeFilter(pageId),
  });

  return quantileOverTimeP75(stream, 'event_data_duration_ns', range);
}

/**
 * Real-user p75 duration for a named action, straight from the SDK's own
 * `event_data_userActionDuration` on the faro.user.action marker (matches
 * userActionEndTime - userActionStartTime). Directly comparable to this
 * run's own FaroAction.durationMs.
 */
export function buildRealUserActionDurationLogQL({ appId, actionName, range }: RealUserActionQueryParams): string {
  const stream = buildRealUserLogStream({
    kind: 'event',
    appId,
    lineFilter: '|= "event_name=faro.user.action"',
    scopeFilter: actionScopeFilter(actionName),
  });

  return quantileOverTimeP75(stream, 'event_data_userActionDuration', range);
}

export function buildRealUserActionCountLogQL({ appId, actionName, range }: RealUserActionQueryParams): string {
  const stream = buildRealUserLogStream({
    kind: 'event',
    appId,
    lineFilter: '|= "event_name=faro.user.action"',
    scopeFilter: actionScopeFilter(actionName),
  });

  return sumCountOverTime(stream, range);
}

/**
 * Real-user failed requests during a named action. Not a join — the same
 * fetch/XHR event line carries both `action_name` and the HTTP status code,
 * so this is exactly buildRealUserHttpErrorsLogQL with the filter swapped
 * from page_id to action_name.
 */
export function buildRealUserActionHttpErrorsLogQL({ appId, actionName, range }: RealUserActionQueryParams): string {
  const stream = buildRealUserLogStream({ kind: 'event', appId, lineFilter: HTTP_EVENT_LINE_FILTER, scopeFilter: actionScopeFilter(actionName) });

  return sumCountOverTime(`${stream} ${HTTP_ERROR_STATUS_FILTER}`, range);
}

/**
 * Real-user JS exceptions during a named action — unverified whether Faro
 * actually attaches action_name to exception records (only fetch/resource/
 * user.action events are confirmed to carry it). Low-risk to ship anyway:
 * if the label isn't there, this matches zero lines and the UI shows
 * nothing, same as any other fail-silently query here — a nonzero result is
 * its own confirmation.
 */
export function buildRealUserActionExceptionsLogQL({ appId, actionName, range }: RealUserActionQueryParams): string {
  const stream = buildRealUserLogStream({ kind: 'exception', appId, scopeFilter: actionScopeFilter(actionName) });

  return sumCountOverTime(stream, range);
}

export function buildFaroPageHref({ pluginId, appId, pageId }: { pluginId: string; appId: string; pageId: string }): string {
  return `/a/${encodeURIComponent(pluginId)}/apps/${encodeURIComponent(appId)}/route?var-page_performance_page_id=${encodeURIComponent(pageId)}`;
}

/**
 * Formats the difference between this run's value and the real-user p75 as a
 * signed delta, e.g. `+31 ms` (slower than real users) or `-0.04` for CLS.
 */
export function formatWebVitalDelta(name: WebVitalName, runValue: number, baselineValue: number): string {
  const delta = runValue - baselineValue;
  const sign = delta > 0 ? '+' : '';

  if (name === 'cls') {
    return `${sign}${delta.toFixed(2)}`;
  }

  if (Math.abs(delta) >= 1000) {
    return `${sign}${(delta / 1000).toFixed(2)} s`;
  }

  return `${sign}${Math.round(delta)} ms`;
}

/**
 * Fidelity is a separate axis from check pass/fail, not a rename of it — and
 * it isn't conditioned on pass/fail depending on speed at all. The claim is
 * about representativeness, not about the check "catching" a slowdown:
 * divergence in either direction means the check's result doesn't tell you
 * much about what real users experience, whatever that result is.
 * "Optimistic" is still the more useful direction to flag, because a check
 * that's unrepresentatively fast lets its own pass read as reassurance about
 * real users when it isn't — a "pessimistic" check just produces a false
 * alarm someone investigates and dismisses. Render this on its own hue —
 * never reuse success/error, which are reserved for check pass/fail.
 */
export type FidelityRating = 'representative' | 'optimistic' | 'pessimistic' | 'insufficient-data';

export interface PageComparisonVerdict {
  text: string;
  rating: FidelityRating;
}

// A vital has to be this much bigger than its counterpart before we call the
// difference out — small deltas between one synthetic run and a p75 are noise.
const VERDICT_RATIO = 1.5;

/**
 * Turns the vitals comparison into a one-line, plain-English verdict so users
 * don't have to interpret the table themselves.
 */
export function getPageComparisonVerdict(
  runVitals: Partial<Record<WebVitalName, number>>,
  baselineVitals: Partial<Record<WebVitalName, number>>
): PageComparisonVerdict {
  // Real users worse off than this run suggests — the dangerous direction.
  let worstOptimistic: { vital: WebVitalName; ratio: number } | null = null;
  // This run worse off than real users — a false alarm, self-correcting.
  let worstPessimistic: { vital: WebVitalName; ratio: number } | null = null;
  let compared = 0;

  WEB_VITALS.forEach((vital) => {
    const runValue = runVitals[vital];
    const baselineValue = baselineVitals[vital];

    if (runValue === undefined || baselineValue === undefined) {
      return;
    }

    compared++;

    if (baselineValue > runValue * VERDICT_RATIO && rateWebVital(vital, baselineValue) !== 'good') {
      const ratio = runValue > 0 ? baselineValue / runValue : Infinity;

      if (!worstOptimistic || ratio > worstOptimistic.ratio) {
        worstOptimistic = { vital, ratio };
      }
    }

    if (runValue > baselineValue * VERDICT_RATIO && rateWebVital(vital, runValue) !== 'good') {
      const ratio = baselineValue > 0 ? runValue / baselineValue : Infinity;

      if (!worstPessimistic || ratio > worstPessimistic.ratio) {
        worstPessimistic = { vital, ratio };
      }
    }
  });

  if (compared === 0) {
    return { text: 'Not enough comparable web vitals to judge this page', rating: 'insufficient-data' };
  }

  if (worstOptimistic !== null) {
    const { vital, ratio } = worstOptimistic as { vital: WebVitalName; ratio: number };

    return {
      text: `${WEB_VITAL_LABELS[vital]}: this run ${formatWebVitalValue(vital, runVitals[vital]!)} vs real users' p75 ${formatWebVitalValue(vital, baselineVitals[vital]!)} (${ratio.toFixed(1)}x faster).`,
      rating: 'optimistic',
    };
  }

  if (worstPessimistic !== null) {
    const { vital, ratio } = worstPessimistic as { vital: WebVitalName; ratio: number };

    return {
      text: `${WEB_VITAL_LABELS[vital]}: this run ${formatWebVitalValue(vital, runVitals[vital]!)} vs real users' p75 ${formatWebVitalValue(vital, baselineVitals[vital]!)} (${ratio.toFixed(1)}x slower).`,
      rating: 'pessimistic',
    };
  }

  return { text: 'In line with what real users experienced', rating: 'representative' };
}

export function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Finds real-user activity on any of the pages the synthetic run visited.
 *
 * Deliberately NOT gated on `kind="measurement" |= " ttfb="`: a hard-loaded
 * page always gets a ttfb-bearing measurement line, but a soft-navigated
 * page often gets *no* measurement line at all — only occasional LCP-only
 * ones, action-marker events, or fetch/resource events. Matching any
 * event/measurement record with a page_id in the journey, regardless of
 * what else is on the line, catches those too; gating on ttfb would make a
 * session that only soft-navigated past the first page look like it never
 * went further.
 *
 * This is a log-stream query (no `[range]` selector — that's only valid on
 * metric queries); the time window comes from the request's start/end params.
 */
export function buildSimilarSessionsLogQL({ appId, pageIds }: { appId: string; pageIds: string[] }): string {
  const pagePattern = escapeLogQLString(`^(${pageIds.map(escapeRegExp).join('|')})$`);

  return `{kind=~"event|measurement", app_id="${appId}"} | logfmt | k6_isK6Browser=~"" | page_id=~"${pagePattern}"`;
}

export type SimilarSessionOutcome = { kind: 'completed' } | { kind: 'stopped-at'; pageId: string };

export interface SimilarSession {
  sessionId: string;
  // pages from the synthetic journey this session also loaded, in journey order
  matchedPages: string[];
  lastSeen: number;
  // Only set when matchedPages is an exact, in-order prefix of the journey —
  // real users aren't guaranteed to follow the check's exact page sequence
  // (they can revisit pages or skip around), so this stays undefined rather
  // than claim a "stopped at X" story the data doesn't actually support.
  outcome?: SimilarSessionOutcome;
  // IP-derived (MaxMind GeoLite2 reverse lookup per FEO's own docs), so
  // reliable regardless of which browser check type produced the session.
  city?: string;
  countryIso?: string;
}

/**
 * Version activity over time, bucketed so we can spot a deploy: page-load
 * counts per `app_version`. Includes synthetic traffic on purpose — on
 * low-traffic apps the checks themselves give the best resolution on when a
 * new version started serving.
 */
export function buildAppVersionHistoryLogQL({ appId, bucket }: { appId: string; bucket: string }): string {
  return `sum by (app_version) (count_over_time({kind="measurement", app_id="${appId}"} |= " ttfb=" | logfmt | app_version!="" [${bucket}]))`;
}

export interface AppVersionChange {
  currentVersion: string;
  // undefined when no other version was seen before currentVersion in the window
  previousVersion?: string;
  // when currentVersion first appeared in the window
  firstSeen?: number;
}

interface VersionActivity {
  version: string;
  firstSeen: number;
  lastSeen: number;
}

/**
 * Works out whether the version the check ran against replaced another version
 * recently. `series` is one entry per app_version with the timestamps where it
 * had page loads. If nothing but the run's version appears in the lookback
 * window, we report "no change" (the version may well predate the window —
 * we can only speak to what we looked at).
 */
export function getAppVersionChange(series: VersionActivity[], runVersion: string): AppVersionChange {
  const current = series.find((s) => s.version === runVersion);

  if (!current) {
    return { currentVersion: runVersion };
  }

  const candidates = series.filter((s) => s.version !== runVersion && s.firstSeen < current.firstSeen);

  if (candidates.length === 0) {
    return { currentVersion: runVersion };
  }

  candidates.sort((a, b) => b.lastSeen - a.lastSeen);

  return {
    currentVersion: runVersion,
    previousVersion: candidates[0].version,
    firstSeen: current.firstSeen,
  };
}

/**
 * Counts distinct real-user sessions that threw the exact same exception
 * message. Answers "is my script's error a real error users are hitting, or
 * an artifact of this run?"
 */
export function buildExceptionRealSessionsLogQL({
  appId,
  message,
  range,
}: {
  appId: string;
  message: string;
  range: string;
}): string {
  const value = escapeLogQLString(message);

  return `count(sum by (session_id) (count_over_time({kind="exception", app_id="${appId}"} | logfmt | k6_isK6Browser=~"" | value="${value}" [${range}])))`;
}

export function parseSimilarSessions(logs: FaroRecord[], journeyPageIds: string[]): SimilarSession[] {
  const journey = new Set(journeyPageIds);
  const sessions = new Map<
    string,
    { pages: Set<string>; lastSeen: number; city?: string; countryIso?: string }
  >();

  logs.forEach((record) => {
    const labels = record.labels ?? {};
    const sessionId = labels.session_id;
    const pageId = labels.page_id;

    if (!sessionId || !pageId || !journey.has(pageId)) {
      return;
    }

    const existing = sessions.get(sessionId);

    if (existing) {
      existing.pages.add(pageId);
      existing.lastSeen = Math.max(existing.lastSeen, record.timestamp);
    } else {
      // Geo is stable for the life of a session — take it from whichever
      // record we see first, no need to reconcile across records.
      sessions.set(sessionId, {
        pages: new Set([pageId]),
        lastSeen: record.timestamp,
        city: labels.geo_city,
        countryIso: labels.geo_country_iso,
      });
    }
  });

  return [...sessions.entries()]
    .map(([sessionId, { pages, lastSeen, city, countryIso }]) => {
      const matchedPages = journeyPageIds.filter((pageId) => pages.has(pageId));
      const isPrefix = matchedPages.every((pageId, index) => pageId === journeyPageIds[index]);
      const outcome: SimilarSessionOutcome | undefined = isPrefix
        ? matchedPages.length === journeyPageIds.length
          ? { kind: 'completed' }
          : { kind: 'stopped-at', pageId: matchedPages[matchedPages.length - 1] }
        : undefined;

      return { sessionId, matchedPages, lastSeen, outcome, city, countryIso };
    })
    .sort((a, b) => b.matchedPages.length - a.matchedPages.length || b.lastSeen - a.lastSeen);
}

export type SummaryTone = 'error' | 'warning' | 'info' | 'success' | 'secondary';

export interface SummaryChip {
  text: string;
  tone: SummaryTone;
}

export interface SummaryVerdict {
  text: string;
  tone: SummaryTone;
  chips: SummaryChip[];
}

// Structural shape rather than importing RealUserActionBaseline from hooks —
// utils shouldn't depend on hooks (wrong direction; hooks already imports
// from here).
interface ActionBaselineLike {
  durationMs: number | null;
  occurrences: number | null;
  httpErrors: number | null;
  exceptions: number | null;
}

// A real-user failure rate above this on a named action is worth leading
// the summary with — below it, it's noise a rules pass shouldn't surface.
const ACTION_FAILURE_RATE_THRESHOLD = 0.02;
// Same 1.5x asymmetry threshold as the per-page fidelity verdict, applied to
// one metric (duration) instead of five (vitals).
const ACTION_FIDELITY_RATIO = 1.5;

/**
 * One-sentence, rules-based synthesis over data the panel already fetched —
 * cowork's "summary band" proposal. Priority order: is a real user hitting
 * the same failure as this run (only asked when the check itself failed);
 * otherwise, does anything about this run diverge from what real users
 * experience (deploy, fidelity) worth a passing check knowing about.
 */
export function getSummaryVerdict({
  probeSuccess,
  versionChange,
  exceptions,
  exceptionRealSessionCounts,
  actions,
  actionBaselines,
  pages,
}: {
  probeSuccess?: boolean;
  versionChange?: AppVersionChange | null;
  exceptions: FaroException[];
  exceptionRealSessionCounts: Record<string, number> | null | undefined;
  actions: FaroAction[];
  actionBaselines: Record<string, ActionBaselineLike | null | undefined>;
  pages: FaroPageVisit[];
}): SummaryVerdict {
  const chips: SummaryChip[] = [];
  const deployedRecently = Boolean(versionChange?.previousVersion && versionChange.firstSeen);

  if (versionChange) {
    chips.push(
      deployedRecently
        ? { text: 'Deploy landed before this run', tone: 'warning' }
        : { text: 'No deploy in the last 6h', tone: 'success' }
    );
  }

  // Worst named action by real-user failure rate, above threshold.
  //
  // The faro.user.action marker has no native success/failure field at all —
  // it's purely a timing capture: start/end/duration/trigger/importance plus
  // whatever custom business attributes the app attached. "Failure" is
  // something we infer by correlating whatever else happened during the
  // action's window via action_parent_id — so it has to combine every
  // failure-shaped signal available, not just HTTP errors: an action that
  // fails via a thrown JS exception with no failed network call at all
  // would otherwise never trip this.
  let worstFailingAction: { name: string; rate: number; failed: number; occurrences: number } | null = null;

  actions.forEach((action) => {
    const baseline = actionBaselines[action.actionName];

    if (!baseline?.occurrences) {
      return;
    }

    const failed = (baseline.httpErrors ?? 0) + (baseline.exceptions ?? 0);

    if (!failed) {
      return;
    }

    const rate = failed / baseline.occurrences;

    if (rate > ACTION_FAILURE_RATE_THRESHOLD && (!worstFailingAction || rate > worstFailingAction.rate)) {
      worstFailingAction = { name: action.actionName, rate, failed, occurrences: baseline.occurrences };
    }
  });

  // Any of this run's exceptions also hitting real users?
  const sharedException = exceptions.find((exception) => (exceptionRealSessionCounts?.[exception.message] ?? 0) > 0);
  const sharedExceptionCount = sharedException ? exceptionRealSessionCounts![sharedException.message] : 0;

  // Worst action where the check ran meaningfully faster than real users —
  // the dangerous fidelity direction, same asymmetry as the page verdict.
  let worstOptimisticAction: {
    name: string;
    ratio: number;
    durationMs: number;
    baselineDurationMs: number;
  } | null = null;

  actions.forEach((action) => {
    const baseline = actionBaselines[action.actionName];

    if (action.durationMs === undefined || baseline?.durationMs == null) {
      return;
    }

    if (baseline.durationMs > action.durationMs * ACTION_FIDELITY_RATIO) {
      const ratio = baseline.durationMs / action.durationMs;

      if (!worstOptimisticAction || ratio > worstOptimisticAction.ratio) {
        worstOptimisticAction = {
          name: action.actionName,
          ratio,
          durationMs: action.durationMs,
          baselineDurationMs: baseline.durationMs,
        };
      }
    }
  });

  if (probeSuccess === false) {
    if (worstFailingAction !== null) {
      const { name, failed, occurrences } = worstFailingAction as { name: string; failed: number; occurrences: number; rate: number };

      return {
        text: `Real users are also failing on ${name}: ${failed} of ${occurrences} occurrences in the past hour.`,
        tone: 'error',
        chips,
      };
    }

    if (sharedException) {
      return {
        text: `This run's error is also hitting real users — seen in ${sharedExceptionCount} real session${sharedExceptionCount === 1 ? '' : 's'} in the past hour.`,
        tone: 'error',
        chips,
      };
    }

    // "No evidence of harm" is only worth stating as "users are fine" if we
    // actually had a channel capable of finding harm. A check can fail with
    // no in-page JS exception at all (a k6/Playwright assertion timeout
    // throws outside the browser, invisible to Faro) and an app with no
    // named actions gives the action-failure-rate check nothing to compare
    // against either. Say so plainly rather than imply a clean bill of
    // health we didn't earn — and name the page the run was on, since
    // that's the closest thing to "where it failed" we have without action
    // instrumentation.
    if (actions.length === 0 && exceptions.length === 0) {
      const lastPageId = pages[pages.length - 1]?.pageId;
      const pageClause = lastPageId ? ` on ${lastPageId}` : '';

      return {
        text: `Couldn't tell whether real users are affected — this run produced no JS exception${pageClause}, and this app has no named action there to check a real-user failure rate against.`,
        tone: 'secondary',
        chips,
      };
    }

    return {
      text: "Real users don't appear to be seeing this failure. Start with the check, not the app.",
      tone: 'success',
      chips,
    };
  }

  // Real failures outrank a pure fidelity observation, always — a check
  // that's technically passing while real users fail on the matching action
  // is a more urgent thing to say than "this check runs fast."
  if (worstFailingAction !== null) {
    const { name, rate } = worstFailingAction as { name: string; rate: number; failed: number; occurrences: number };
    chips.push({ text: `${name}: ${(rate * 100).toFixed(1)}% real-user failure rate`, tone: 'error' });

    return {
      text: `This run passed, but real users are failing on ${name}.`,
      tone: 'error',
      chips,
    };
  }

  if (deployedRecently) {
    return {
      text: 'A new version shipped before this run. No other divergence from real users detected.',
      tone: 'warning',
      chips,
    };
  }

  // Fidelity comes last among the "passed" branches — only worth leading
  // with when nothing more concrete is going on. Kept purely factual on
  // purpose (the numbers, no interpretation of what they mean or don't) —
  // whether a speed gap matters is an eng call to make per-check, not
  // something to argue for or against here.
  if (worstOptimisticAction !== null) {
    const { name, ratio, durationMs, baselineDurationMs } = worstOptimisticAction as {
      name: string;
      ratio: number;
      durationMs: number;
      baselineDurationMs: number;
    };

    return {
      text: `${name}: this run ${formatDurationMs(durationMs)} vs real users' p75 ${formatDurationMs(baselineDurationMs)} (${ratio.toFixed(1)}x faster).`,
      tone: 'info',
      chips,
    };
  }

  return {
    text: 'Nothing notable diverges from real users.',
    tone: 'secondary',
    chips,
  };
}
