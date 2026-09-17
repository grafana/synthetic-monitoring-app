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

    // The marker event for one action instance. Its own page_id is
    // authoritative (it reflects wherever the action actually settled — the
    // ecommerce order-complete example landed on `/cart/checkout/*`, not a
    // stale page_id from the last hard navigation), so it always overwrites;
    // child request events below only seed pageId as a fallback in case this
    // marker line didn't make it into the query result.
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

/**
 * Real-user baseline queries. These mirror the exact LogQL the Frontend
 * Observability app runs for its per-route panels, including its default
 * `k6_isK6Browser=~""` filter which restricts results to records where the k6
 * field is absent — i.e. real users only, no synthetic traffic.
 */
export function buildRealUserVitalP75LogQL({ appId, pageId, range, vital }: RealUserQueryParams & { vital: WebVitalName }): string {
  const page = escapeLogQLString(pageId);

  return `quantile_over_time(0.75, {kind="measurement", app_id="${appId}"} |= " ${vital}=" | logfmt | k6_isK6Browser=~"" | page_id="${page}" | unwrap ${vital} [${range}])`;
}

export function buildRealUserPageLoadsLogQL({ appId, pageId, range }: RealUserQueryParams): string {
  const page = escapeLogQLString(pageId);

  return `sum(count_over_time({kind="measurement", app_id="${appId}"} |= " ttfb=" | logfmt | k6_isK6Browser=~"" | page_id="${page}" [${range}]))`;
}

export function buildRealUserExceptionsLogQL({ appId, pageId, range }: RealUserQueryParams): string {
  const page = escapeLogQLString(pageId);

  return `sum(count_over_time({kind="exception", app_id="${appId}"} | logfmt | k6_isK6Browser=~"" | page_id="${page}" [${range}]))`;
}

export function buildRealUserHttpErrorsLogQL({ appId, pageId, range }: RealUserQueryParams): string {
  const page = escapeLogQLString(pageId);

  return `sum(count_over_time({kind="event", app_id="${appId}"} |~ "event_name=faro.tracing.fetch|event_name=faro.tracing.xml-http-request" |= "event_data_http.status_code=" | logfmt | k6_isK6Browser=~"" | page_id="${page}" | (event_data_http_status_code >= 400 and event_data_http_status_code < 600) or event_data_http_status_code = 0 [${range}]))`;
}

/**
 * Real-user p75 request latency on a page, in nanoseconds (matching
 * event_data_duration_ns's own unit — convert to ms when consuming).
 *
 * Fallback for pages where web vitals don't exist: LCP/FCP/TTFB are tied to
 * the initial document lifecycle, and confirmed live that soft-navigated
 * pages on at least one app never get a fresh FCP/TTFB measurement (LCP
 * occasionally re-fires on soft nav, FCP/TTFB structurally can't). Request
 * latency has no such restriction — every fetch/XHR call reports it
 * regardless of navigation type — so it's the next best "how did this page
 * perform" signal once vitals are empty.
 */
export function buildRealUserRequestLatencyLogQL({ appId, pageId, range }: RealUserQueryParams): string {
  const page = escapeLogQLString(pageId);

  return `quantile_over_time(0.75, {kind="event", app_id="${appId}"} |~ "event_name=faro.tracing.fetch|event_name=faro.tracing.xml-http-request" | logfmt | k6_isK6Browser=~"" | page_id="${page}" | unwrap event_data_duration_ns [${range}])`;
}

interface RealUserActionQueryParams {
  appId: string;
  actionName: string;
  range: string;
}

/**
 * Real-user p75 duration for a named action, straight from the SDK's own
 * `event_data_userActionDuration` on the faro.user.action marker — confirmed
 * live (order-complete: 360.4ms, matching userActionEndTime - userActionStartTime).
 * Directly comparable to this run's own FaroAction.durationMs.
 */
export function buildRealUserActionDurationLogQL({ appId, actionName, range }: RealUserActionQueryParams): string {
  const name = escapeLogQLString(actionName);

  return `quantile_over_time(0.75, {kind="event", app_id="${appId}"} |= "event_name=faro.user.action" | logfmt | k6_isK6Browser=~"" | action_name="${name}" | unwrap event_data_userActionDuration [${range}])`;
}

export function buildRealUserActionCountLogQL({ appId, actionName, range }: RealUserActionQueryParams): string {
  const name = escapeLogQLString(actionName);

  return `sum(count_over_time({kind="event", app_id="${appId}"} |= "event_name=faro.user.action" | logfmt | k6_isK6Browser=~"" | action_name="${name}" [${range}]))`;
}

/**
 * Real-user failed requests during a named action. Not a join — the same
 * fetch/XHR event line carries both `action_name` and the HTTP status code
 * (confirmed live: the view-products sample had both on one record), so this
 * is exactly buildRealUserHttpErrorsLogQL with the filter swapped from
 * page_id to action_name.
 */
export function buildRealUserActionHttpErrorsLogQL({ appId, actionName, range }: RealUserActionQueryParams): string {
  const name = escapeLogQLString(actionName);

  return `sum(count_over_time({kind="event", app_id="${appId}"} |~ "event_name=faro.tracing.fetch|event_name=faro.tracing.xml-http-request" |= "event_data_http.status_code=" | logfmt | k6_isK6Browser=~"" | action_name="${name}" | (event_data_http_status_code >= 400 and event_data_http_status_code < 600) or event_data_http_status_code = 0 [${range}]))`;
}

/**
 * Real-user JS exceptions during a named action — unverified whether Faro
 * actually attaches action_name to exception records (every confirmed
 * example so far has been on fetch/resource/user.action events, not
 * exceptions). Low-risk to ship anyway: if the label isn't there, this
 * matches zero lines and the UI shows nothing, same as any other
 * fail-silently query here — a nonzero result is its own confirmation.
 */
export function buildRealUserActionExceptionsLogQL({ appId, actionName, range }: RealUserActionQueryParams): string {
  const name = escapeLogQLString(actionName);

  return `sum(count_over_time({kind="exception", app_id="${appId}"} | logfmt | k6_isK6Browser=~"" | action_name="${name}" [${range}]))`;
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
 * Fidelity is a separate axis from check pass/fail, not a rename of it.
 * Divergence in either direction means the check isn't representative, and
 * "optimistic" is the more dangerous direction: a check running faster than
 * real users will keep passing straight through a real degradation, while a
 * "pessimistic" check just produces a false alarm someone investigates and
 * dismisses. Render this on its own hue — never reuse success/error, which
 * are reserved for check pass/fail.
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
    const { vital } = worstOptimistic as { vital: WebVitalName; ratio: number };

    return {
      text: `Real users are having a worse time than this run suggests: ${WEB_VITAL_LABELS[vital]} p75 ${formatWebVitalValue(vital, baselineVitals[vital]!)} vs ${formatWebVitalValue(vital, runVitals[vital]!)} for this run — this check could pass straight through a real degradation`,
      rating: 'optimistic',
    };
  }

  if (worstPessimistic !== null) {
    const { vital } = worstPessimistic as { vital: WebVitalName; ratio: number };

    return {
      text: `This run was slower than real users: ${WEB_VITAL_LABELS[vital]} ${formatWebVitalValue(vital, runVitals[vital]!)} vs ${formatWebVitalValue(vital, baselineVitals[vital]!)} p75`,
      rating: 'pessimistic',
    };
  }

  return { text: 'In line with what real users experienced', rating: 'representative' };
}

export function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Finds real-user page loads on any of the pages the synthetic run visited.
 * Every page load emits a web-vitals measurement carrying `session_id` +
 * `page_id`, so grouping the result by session tells us which real sessions
 * walked (part of) the same journey as the check.
 *
 * This is a log-stream query (no `[range]` selector — that's only valid on
 * metric queries); the time window comes from the request's start/end params.
 */
export function buildSimilarSessionsLogQL({ appId, pageIds }: { appId: string; pageIds: string[] }): string {
  const pagePattern = escapeLogQLString(`^(${pageIds.map(escapeRegExp).join('|')})$`);

  return `{kind="measurement", app_id="${appId}"} |= " ttfb=" | logfmt | k6_isK6Browser=~"" | page_id=~"${pagePattern}"`;
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
  const sessions = new Map<string, { pages: Set<string>; lastSeen: number }>();

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
      sessions.set(sessionId, { pages: new Set([pageId]), lastSeen: record.timestamp });
    }
  });

  return [...sessions.entries()]
    .map(([sessionId, { pages, lastSeen }]) => {
      const matchedPages = journeyPageIds.filter((pageId) => pages.has(pageId));
      const isPrefix = matchedPages.every((pageId, index) => pageId === journeyPageIds[index]);
      const outcome: SimilarSessionOutcome | undefined = isPrefix
        ? matchedPages.length === journeyPageIds.length
          ? { kind: 'completed' }
          : { kind: 'stopped-at', pageId: matchedPages[matchedPages.length - 1] }
        : undefined;

      return { sessionId, matchedPages, lastSeen, outcome };
    })
    .sort((a, b) => b.matchedPages.length - a.matchedPages.length || b.lastSeen - a.lastSeen);
}
