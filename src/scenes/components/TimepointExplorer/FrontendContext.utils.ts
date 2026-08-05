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

export interface FaroHttpError {
  method: string;
  url: string;
  // 0 means the request got no response at all (network failure, CORS, aborted)
  statusCode: number;
  pageId: string;
  traceId?: string;
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
  httpErrors: FaroHttpError[];
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
  const httpErrors: FaroHttpError[] = [];
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

    if (labels.kind === 'event' && HTTP_EVENT_NAMES.includes(labels.event_name ?? '')) {
      // `| logfmt` folds `event_data_http.status_code` into underscores
      const statusCode = Number(labels.event_data_http_status_code);

      if (!Number.isNaN(statusCode) && isHttpErrorStatus(statusCode)) {
        httpErrors.push({
          method: labels.event_data_http_method ?? 'GET',
          url: labels.event_data_http_url ?? '',
          statusCode,
          pageId,
          traceId: labels.traceID,
          timestamp: record.timestamp,
        });
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
    httpErrors,
    hasSessionReplay,
  };
}

function escapeLogQLString(value: string): string {
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

export type ComparisonTone = 'success' | 'warning' | 'error' | 'secondary';

export interface PageComparisonVerdict {
  text: string;
  tone: ComparisonTone;
}

// A vital has to be this much bigger than its counterpart before we call the
// difference out — small deltas between one synthetic run and a p75 are noise.
const VERDICT_RATIO = 1.5;

/**
 * Turns the vitals comparison into a one-line, plain-English verdict so users
 * don't have to interpret the table themselves. The most valuable outcome for
 * a failed check is "real users are degraded too" (site problem) vs "real
 * users are fine" (probably the script or the probe's vantage point).
 */
export function getPageComparisonVerdict(
  runVitals: Partial<Record<WebVitalName, number>>,
  baselineVitals: Partial<Record<WebVitalName, number>>
): PageComparisonVerdict | null {
  let worstRunOffender: { vital: WebVitalName; ratio: number } | null = null;
  let worstUserOffender: { vital: WebVitalName; ratio: number } | null = null;
  let compared = 0;

  WEB_VITALS.forEach((vital) => {
    const runValue = runVitals[vital];
    const baselineValue = baselineVitals[vital];

    if (runValue === undefined || baselineValue === undefined) {
      return;
    }

    compared++;

    if (runValue > baselineValue * VERDICT_RATIO && rateWebVital(vital, runValue) !== 'good') {
      const ratio = baselineValue > 0 ? runValue / baselineValue : Infinity;

      if (!worstRunOffender || ratio > worstRunOffender.ratio) {
        worstRunOffender = { vital, ratio };
      }
    }

    if (baselineValue > runValue * VERDICT_RATIO && rateWebVital(vital, baselineValue) !== 'good') {
      const ratio = runValue > 0 ? baselineValue / runValue : Infinity;

      if (!worstUserOffender || ratio > worstUserOffender.ratio) {
        worstUserOffender = { vital, ratio };
      }
    }
  });

  if (compared === 0) {
    return null;
  }

  if (worstRunOffender !== null) {
    const { vital } = worstRunOffender as { vital: WebVitalName; ratio: number };
    const rating = rateWebVital(vital, runVitals[vital]!);

    return {
      text: `This run was slower than real users: ${WEB_VITAL_LABELS[vital]} ${formatWebVitalValue(vital, runVitals[vital]!)} vs ${formatWebVitalValue(vital, baselineVitals[vital]!)} p75`,
      tone: rating === 'poor' ? 'error' : 'warning',
    };
  }

  if (worstUserOffender !== null) {
    const { vital } = worstUserOffender as { vital: WebVitalName; ratio: number };

    return {
      text: `Real users are having a worse experience than this run: ${WEB_VITAL_LABELS[vital]} p75 ${formatWebVitalValue(vital, baselineVitals[vital]!)} vs ${formatWebVitalValue(vital, runVitals[vital]!)} for this run`,
      tone: 'warning',
    };
  }

  return { text: `In line with what real users experienced`, tone: 'success' };
}

function escapeRegExp(value: string): string {
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

export interface SimilarSession {
  sessionId: string;
  // pages from the synthetic journey this session also loaded
  matchedPages: string[];
  lastSeen: number;
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
    .map(([sessionId, { pages, lastSeen }]) => ({
      sessionId,
      matchedPages: journeyPageIds.filter((pageId) => pages.has(pageId)),
      lastSeen,
    }))
    .sort((a, b) => b.matchedPages.length - a.matchedPages.length || b.lastSeen - a.lastSeen);
}
