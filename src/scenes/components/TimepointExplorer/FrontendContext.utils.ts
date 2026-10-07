import { ParsedLokiRecord } from 'features/parseLokiLogs/parseLokiLogs.types';
import { getFaroSessionFromLogs } from 'scenes/components/TimepointExplorer/TimepointViewerFaroSession.utils';

export type FaroRecord = ParsedLokiRecord<Record<string, string>, Record<string, string>>;

/*
 * Real users are Faro sessions without the k6 fields: k6 browser (SM checks,
 * load tests) stamps `k6_isK6Browser="true"` on every record it produces.
 * This is the same filter Frontend Observability uses to separate synthetic
 * traffic from real traffic.
 */
const REAL_USERS_FILTER = '| k6_isK6Browser=~""';

// ---------------------------------------------------------------------------
// App build
// ---------------------------------------------------------------------------

/**
 * A build is the app version plus the bundle id. The bundle id comes from the
 * Faro bundler plugin and changes on every build, so it catches deploys that
 * don't bump the version string (common for apps that ship `1.0.0` forever).
 */
export interface AppBuild {
  version?: string;
  bundleId?: string;
  // `meta.app.gitHash`, which newer Faro bundler plugins inject from
  // `git rev-parse HEAD`. Display only: builds are told apart by version and
  // bundle id, which is what the build-history queries group by.
  gitHash?: string;
}

export function getBuildKey({ version, bundleId }: AppBuild): string {
  return `${version ?? ''}|${bundleId ?? ''}`;
}

export function hasBuildIdentity(build: AppBuild): boolean {
  return Boolean(build.version || build.bundleId);
}

export function formatBuild({ version, bundleId }: AppBuild): string {
  const shortBundle = bundleId?.slice(0, 7);

  if (version && shortBundle) {
    return `${version} · ${shortBundle}`;
  }

  if (version) {
    return version;
  }

  return shortBundle ? `build ${shortBundle}` : 'unknown build';
}

const COMMIT_SHA = /^[0-9a-f]{40}$/;

export interface BuildCommit {
  sha: string;
  // `git-hash`: the app reports it. `bundle-id`: the bundle id has the shape
  // of a commit SHA, which pipelines that set the bundle id to the build
  // commit produce, but nothing guarantees it.
  source: 'git-hash' | 'bundle-id';
}

export function getBuildCommit({ gitHash, bundleId }: AppBuild): BuildCommit | undefined {
  if (gitHash && COMMIT_SHA.test(gitHash)) {
    return { sha: gitHash, source: 'git-hash' };
  }

  if (bundleId && COMMIT_SHA.test(bundleId)) {
    return { sha: bundleId, source: 'bundle-id' };
  }

  return undefined;
}

function readBuild(labels: Record<string, string>): AppBuild {
  return {
    version: labels.app_version || undefined,
    bundleId: labels.app_bundle_id || undefined,
    gitHash: labels.app_git_hash || undefined,
  };
}

// ---------------------------------------------------------------------------
// The check run's own Faro session
// ---------------------------------------------------------------------------

export interface RunError {
  key: string;
  type: string;
  message: string;
  // Faro's normalised message (URLs and ids replaced). Matching on it finds
  // the same error across sessions; the raw message usually embeds
  // per-session values that never match exactly.
  template?: string;
  // Frontend Observability's error group id
  hash?: string;
  pageId: string;
  actionName?: string;
  count: number;
  timestamp: number;
}

export interface RunFailedRequest {
  key: string;
  method: string;
  url: string;
  urlTemplate?: string;
  // 0 means the request got no response at all (network failure, CORS, aborted)
  statusCode: number;
  durationMs?: number;
  pageId: string;
  actionName?: string;
  traceId?: string;
  count: number;
  timestamp: number;
}

export interface FaroRunContext {
  appId: string;
  appName?: string;
  appEnvironment?: string;
  build: AppBuild;
  sessionId: string;
  // page ids in the order the run first visited them
  pages: string[];
  errors: RunError[];
  failedRequests: RunFailedRequest[];
}

export function buildFaroRunLogQL(executionId: string): string {
  return `{kind=~"event|measurement|exception"} | logfmt | k6_isK6Browser="true" | k6_testRunId="sm:${escapeLogQLString(executionId)}"`;
}

const HTTP_EVENT_NAMES = ['faro.tracing.fetch', 'faro.tracing.xml-http-request'];

function nonEmpty(value?: string): string | undefined {
  return value === undefined || value === '' ? undefined : value;
}

/*
 * Faro web SDK 2.x reports requests with OpenTelemetry semantic-convention
 * names (`http.request.method`, `http.response.status_code`, `url.full`,
 * `url.template`); 1.x used `http.method`, `http.status_code`, `http.url`.
 * `| logfmt` folds the dots into underscores. Read both.
 */
function readHttpEvent(labels: Record<string, string>) {
  const rawStatus =
    nonEmpty(labels.event_data_http_response_status_code) ?? nonEmpty(labels.event_data_http_status_code);
  const statusCode = rawStatus === undefined ? NaN : Number(rawStatus);
  const durationNs = Number(labels.event_data_duration_ns);

  return {
    method: nonEmpty(labels.event_data_http_request_method) ?? nonEmpty(labels.event_data_http_method) ?? 'GET',
    url: nonEmpty(labels.event_data_url_full) ?? nonEmpty(labels.event_data_http_url) ?? '',
    urlTemplate: nonEmpty(labels.event_data_url_template),
    statusCode,
    durationMs: Number.isNaN(durationNs) ? undefined : durationNs / 1_000_000,
  };
}

export function isFailedStatus(statusCode: number): boolean {
  return statusCode === 0 || (statusCode >= 400 && statusCode < 600);
}

/**
 * Distils one check run's Faro records into what matters when the run
 * failed: which build it was served, which pages it visited, and the errors
 * and failed requests the browser reported.
 *
 * Records are scoped to the session the "View Frontend Session" button links
 * to, so both always describe the same session.
 */
export function parseFaroRunContext(logs: FaroRecord[]): FaroRunContext | null {
  const session = getFaroSessionFromLogs(logs);

  if (!session) {
    return null;
  }

  const records = logs
    .filter((record) => record.labels?.session_id === session.sessionId)
    .sort((a, b) => a.timestamp - b.timestamp);

  const pages: string[] = [];
  const errors = new Map<string, RunError>();
  const failedRequests = new Map<string, RunFailedRequest>();
  let appName: string | undefined;
  let appEnvironment: string | undefined;
  let build: AppBuild = {};

  records.forEach((record) => {
    const labels = record.labels ?? {};
    const pageId = labels.page_id ?? '';

    appName = appName ?? nonEmpty(labels.app_name);
    appEnvironment = appEnvironment ?? nonEmpty(labels.app_environment);

    if (!hasBuildIdentity(build)) {
      build = readBuild(labels);
    }

    if (pageId && !pages.includes(pageId)) {
      pages.push(pageId);
    }

    if (labels.kind === 'exception') {
      const message = labels.value ?? record.body ?? '';
      const template = nonEmpty(labels.value_template);
      const key = template ?? message;
      const existing = errors.get(key);

      if (existing) {
        existing.count += 1;
        return;
      }

      errors.set(key, {
        key,
        type: labels.type || 'Error',
        message,
        template,
        hash: nonEmpty(labels.hash),
        pageId,
        actionName: nonEmpty(labels.action_name),
        count: 1,
        timestamp: record.timestamp,
      });

      return;
    }

    if (labels.kind === 'event' && HTTP_EVENT_NAMES.includes(labels.event_name ?? '')) {
      const request = readHttpEvent(labels);

      if (Number.isNaN(request.statusCode) || !isFailedStatus(request.statusCode)) {
        return;
      }

      const key = `${request.method} ${request.urlTemplate ?? stripQuery(request.url)} ${request.statusCode}`;
      const existing = failedRequests.get(key);

      if (existing) {
        existing.count += 1;
        return;
      }

      failedRequests.set(key, {
        key,
        ...request,
        pageId,
        actionName: nonEmpty(labels.action_name),
        traceId: nonEmpty(labels.traceID) ?? nonEmpty(labels.trace_id),
        count: 1,
        timestamp: record.timestamp,
      });
    }
  });

  return {
    appId: session.appId,
    appName,
    appEnvironment,
    build,
    sessionId: session.sessionId,
    pages,
    errors: [...errors.values()],
    failedRequests: [...failedRequests.values()],
  };
}

// ---------------------------------------------------------------------------
// Build history
// ---------------------------------------------------------------------------

/**
 * Page loads per build over time, synthetic traffic included: on low-traffic
 * apps the checks themselves are the best signal of when a build started
 * serving. Only hard navigations carry `ttfb`, so this counts page loads,
 * not every event.
 */
export function buildBuildActivityLogQL({ appId, step }: { appId: string; step: string }): string {
  return `sum by (app_version, app_bundle_id) (count_over_time({kind="measurement", app_id="${escapeLogQLString(appId)}"} |= " ttfb=" | logfmt [${step}]))`;
}

/** Real-user page loads per build over `range`, to see which build users were actually on. */
export function buildRealUserBuildLoadsLogQL({ appId, range }: { appId: string; range: string }): string {
  return `sum by (app_version, app_bundle_id) (count_over_time({kind="measurement", app_id="${escapeLogQLString(appId)}"} |= " ttfb=" | logfmt ${REAL_USERS_FILTER} [${range}]))`;
}

export type SeriesPoint = [time: number, value: number];

export interface LabelledSeries {
  labels: Record<string, string>;
  points: SeriesPoint[];
}

export interface BuildActivity {
  key: string;
  build: AppBuild;
  firstSeen: number;
  lastSeen: number;
  loads: number;
  points: SeriesPoint[];
}

export function getBuildActivity(series: LabelledSeries[]): BuildActivity[] {
  const byKey = new Map<string, BuildActivity>();

  series.forEach(({ labels, points }) => {
    const build = readBuild(labels);
    const active = points.filter(([, value]) => value > 0);

    if (!hasBuildIdentity(build) || !active.length) {
      return;
    }

    const key = getBuildKey(build);
    const existing = byKey.get(key);
    const entry = existing ?? { key, build, firstSeen: Infinity, lastSeen: -Infinity, loads: 0, points: [] };

    active.forEach(([time, value]) => {
      entry.firstSeen = Math.min(entry.firstSeen, time);
      entry.lastSeen = Math.max(entry.lastSeen, time);
      entry.loads += value;
      entry.points.push([time, value]);
    });

    entry.points.sort((a, b) => a[0] - b[0]);
    byKey.set(key, entry);
  });

  return [...byKey.values()].sort((a, b) => a.firstSeen - b.firstSeen);
}

function findPreviousBuild(activity: BuildActivity[], current: BuildActivity): AppBuild | undefined {
  const candidates = activity
    .filter((entry) => entry.key !== current.key && entry.firstSeen < current.firstSeen)
    .sort((a, b) => b.lastSeen - a.lastSeen);

  return candidates[0]?.build;
}

export interface BuildChange {
  time: number;
  build: AppBuild;
  previous?: AppBuild;
}

// One-off page loads on a build are usually a stale tab or a cached bundle,
// not a deploy.
const MIN_LOADS_FOR_BUILD_CHANGE = 2;

/**
 * Builds that started serving inside the window. A build already serving in
 * the window's first bucket predates the window, so it isn't a change we can
 * date.
 */
export function getBuildChanges(activity: BuildActivity[]): BuildChange[] {
  if (activity.length < 2) {
    return [];
  }

  const windowStart = Math.min(...activity.map((entry) => entry.firstSeen));

  return activity
    .filter((entry) => entry.firstSeen > windowStart && entry.loads >= MIN_LOADS_FOR_BUILD_CHANGE)
    .map((entry) => ({ time: entry.firstSeen, build: entry.build, previous: findPreviousBuild(activity, entry) }));
}

// ---------------------------------------------------------------------------
// When a build went live
// ---------------------------------------------------------------------------

/** Source-map upload time per bundle id, from Frontend Observability. */
export type SourceMapUploads = Record<string, number>;

export interface BuildStart {
  from: number;
  to: number;
  // `source-maps`: dated by the upload of the build's source maps, so `from`
  // and `to` are the same moment. `page-loads`: the bucket in which Faro first
  // saw a page load on the build.
  source: 'source-maps' | 'page-loads';
}

/**
 * Page-load buckets only place a build's first appearance somewhere in
 * `(firstSeen - step, firstSeen]`. A source-map upload in or just before that
 * bucket pins it down: pipelines that upload at deploy time land there. An
 * upload well before the bucket was for a build deployed later, so its time
 * says nothing about the deploy.
 */
export function getBuildStart({
  firstSeen,
  stepMs,
  uploadedAt,
  notAfter = Infinity,
}: {
  firstSeen: number;
  stepMs: number;
  uploadedAt?: number;
  // the run was served this build, so it was live by then
  notAfter?: number;
}): BuildStart {
  const bucketStart = firstSeen - stepMs;
  const latest = Math.min(firstSeen, notAfter);

  if (uploadedAt !== undefined && uploadedAt > bucketStart - stepMs && uploadedAt <= latest) {
    return { from: uploadedAt, to: uploadedAt, source: 'source-maps' };
  }

  return { from: bucketStart, to: Math.max(bucketStart, latest), source: 'page-loads' };
}

// ---------------------------------------------------------------------------
// The run's build compared with real users
// ---------------------------------------------------------------------------

export interface BuildShare {
  build: AppBuild;
  share: number;
}

/**
 * - `same`: most real users were on the run's build.
 * - `rolling-out`: the run got a newer build that went live inside the
 *   comparison window, so most of that window's users loaded the page before
 *   the deploy. Expected, not a problem.
 * - `newer`: the run got a newer build that has been live for longer than the
 *   window and most users still don't get it: a partial rollout or canary.
 * - `older`: most real users were on a newer build than the run got: a stale
 *   cache, CDN or instance served the check.
 * - `different`: most users were on another build and the order is unknown.
 */
export type RealUserComparison = 'same' | 'rolling-out' | 'newer' | 'older' | 'different';

export interface BuildInsight {
  runBuild: AppBuild;
  // set when the run's build started serving inside the lookback window
  start?: BuildStart;
  previous?: AppBuild;
  // when the run's build's source maps were uploaded, however long ago
  uploadedAt?: number;
  realUsers?: {
    loads: number;
    runBuildShare: number;
    dominant: BuildShare;
    comparison: RealUserComparison;
  };
}

function compareWithRealUsers({
  runEntry,
  dominantEntry,
  isRunBuildDominant,
  start,
  realUserWindowFrom,
}: {
  runEntry?: BuildActivity;
  dominantEntry?: BuildActivity;
  isRunBuildDominant: boolean;
  start?: BuildStart;
  realUserWindowFrom: number;
}): RealUserComparison {
  if (isRunBuildDominant) {
    return 'same';
  }

  if (!runEntry || !dominantEntry || runEntry.firstSeen === dominantEntry.firstSeen) {
    return 'different';
  }

  if (runEntry.firstSeen < dominantEntry.firstSeen) {
    return 'older';
  }

  return start && start.from >= realUserWindowFrom ? 'rolling-out' : 'newer';
}

export function getBuildInsight({
  runBuild,
  runTime,
  activity,
  stepMs,
  realUserLoads,
  realUserWindowFrom,
  uploads = {},
}: {
  runBuild: AppBuild;
  runTime: number;
  activity: BuildActivity[];
  stepMs: number;
  realUserLoads: LabelledSeries[];
  realUserWindowFrom: number;
  uploads?: SourceMapUploads;
}): BuildInsight {
  const runKey = getBuildKey(runBuild);
  const runEntry = activity.find((entry) => entry.key === runKey);
  const windowStart = activity.length ? Math.min(...activity.map((entry) => entry.firstSeen)) : undefined;
  const uploadedAt = runBuild.bundleId ? uploads[runBuild.bundleId] : undefined;

  // Unlike getBuildChanges, one page load is enough: the run itself proves
  // the build was serving, and right after a deploy it may be the only one.
  const isNew = runEntry !== undefined && windowStart !== undefined && runEntry.firstSeen > windowStart;
  const start = isNew
    ? getBuildStart({ firstSeen: runEntry.firstSeen, stepMs, uploadedAt, notAfter: runTime })
    : undefined;

  const loadsByBuild = new Map<string, { build: AppBuild; loads: number }>();

  realUserLoads.forEach(({ labels, points }) => {
    const build = readBuild(labels);
    const loads = points.at(-1)?.[1] ?? 0;

    if (!hasBuildIdentity(build) || loads <= 0) {
      return;
    }

    const key = getBuildKey(build);
    loadsByBuild.set(key, { build, loads: (loadsByBuild.get(key)?.loads ?? 0) + loads });
  });

  const total = [...loadsByBuild.values()].reduce((sum, entry) => sum + entry.loads, 0);
  let realUsers: BuildInsight['realUsers'];

  if (total > 0) {
    const dominant = [...loadsByBuild.values()].sort((a, b) => b.loads - a.loads)[0];
    const dominantKey = getBuildKey(dominant.build);
    const runBuildShare = (loadsByBuild.get(runKey)?.loads ?? 0) / total;

    realUsers = {
      loads: total,
      runBuildShare,
      dominant: { build: dominant.build, share: dominant.loads / total },
      comparison: compareWithRealUsers({
        runEntry,
        dominantEntry: activity.find((entry) => entry.key === dominantKey),
        isRunBuildDominant: dominantKey === runKey || runBuildShare >= 0.5,
        start,
        realUserWindowFrom,
      }),
    };
  }

  return {
    runBuild,
    start,
    previous: isNew ? findPreviousBuild(activity, runEntry) : undefined,
    uploadedAt,
    realUsers,
  };
}

export interface BuildSegment {
  from: number;
  to: number;
  key: string | null;
}

/**
 * Collapses per-bucket activity into contiguous segments of the build that
 * served the most page loads in each bucket, for the build strip. `null`
 * segments had no page loads at all.
 */
export function getBuildSegments(activity: BuildActivity[], from: number, to: number, stepMs: number): BuildSegment[] {
  const segments: BuildSegment[] = [];

  for (let bucketStart = from; bucketStart < to; bucketStart += stepMs) {
    const bucketEnd = Math.min(to, bucketStart + stepMs);
    let winner: { key: string; loads: number } | null = null;

    activity.forEach((entry) => {
      // a point at time t covers [t - step, t]
      const loads = entry.points
        .filter(([time]) => time > bucketStart && time <= bucketEnd)
        .reduce((sum, [, value]) => sum + value, 0);

      if (loads > 0 && (!winner || loads > winner.loads)) {
        winner = { key: entry.key, loads };
      }
    });

    const key = winner ? (winner as { key: string }).key : null;
    const last = segments.at(-1);

    if (last && last.key === key) {
      last.to = bucketEnd;
    } else {
      segments.push({ from: bucketStart, to: bucketEnd, key });
    }
  }

  return segments;
}

// ---------------------------------------------------------------------------
// Blast radius: is this run's failure also hitting real users?
// ---------------------------------------------------------------------------

export type FailureSignature =
  | { kind: 'exception'; template?: string; message: string }
  | { kind: 'request'; method: string; url: string; urlTemplate?: string; statusCode: number };

export function getErrorSignature(error: RunError): FailureSignature {
  return { kind: 'exception', template: error.template, message: error.message };
}

export function getRequestSignature(request: RunFailedRequest): FailureSignature {
  return {
    kind: 'request',
    method: request.method,
    url: request.url,
    urlTemplate: request.urlTemplate,
    statusCode: request.statusCode,
  };
}

function eitherLabel(names: string[], matcher: string): string {
  return `| (${names.map((name) => `${name}${matcher}`).join(' or ')})`;
}

/** Log stream selecting real-user records that match the run's failure. */
export function buildFailureStream(appId: string, signature: FailureSignature): string {
  const app = escapeLogQLString(appId);

  if (signature.kind === 'exception') {
    const match = signature.template
      ? `| value_template="${escapeLogQLString(signature.template)}"`
      : `| value="${escapeLogQLString(signature.message)}"`;

    return `{kind="exception", app_id="${app}"} | logfmt ${REAL_USERS_FILTER} ${match}`;
  }

  const urlMatch = signature.urlTemplate
    ? `| event_data_url_template="${escapeLogQLString(signature.urlTemplate)}"`
    : eitherLabel(
        ['event_data_url_full', 'event_data_http_url'],
        `=~"${escapeLogQLString(`^${escapeRegExp(stripQuery(signature.url))}(\\?.*)?$`)}"`
      );

  return [
    `{kind="event", app_id="${app}"} |~ "event_name=faro.tracing.(fetch|xml-http-request)" | logfmt ${REAL_USERS_FILTER}`,
    urlMatch,
    eitherLabel(
      ['event_data_http_request_method', 'event_data_http_method'],
      `="${escapeLogQLString(signature.method)}"`
    ),
    eitherLabel(['event_data_http_response_status_code', 'event_data_http_status_code'], `="${signature.statusCode}"`),
  ].join(' ');
}

export function buildFailureSessionsLogQL({
  appId,
  signature,
  range,
}: {
  appId: string;
  signature: FailureSignature;
  range: string;
}): string {
  return `count(sum by (session_id) (count_over_time(${buildFailureStream(appId, signature)} [${range}])))`;
}

export function buildFailureTrendLogQL({
  appId,
  signature,
  step,
}: {
  appId: string;
  signature: FailureSignature;
  step: string;
}): string {
  return `sum(count_over_time(${buildFailureStream(appId, signature)} [${step}]))`;
}

export interface FailureTrend {
  // one value per bucket across the whole window, zero-filled
  buckets: number[];
  // when the failure first appeared, if that was inside the window
  firstSeen?: number;
}

/**
 * Loki omits empty buckets from range results; fill them so the sparkline
 * has a constant width, and work out whether the failure started inside the
 * window or was already happening at its start.
 */
export function getFailureTrend(points: SeriesPoint[], from: number, to: number, stepMs: number): FailureTrend {
  const bucketCount = Math.max(1, Math.ceil((to - from) / stepMs));
  const buckets = new Array<number>(bucketCount).fill(0);
  const active = points.filter(([, value]) => value > 0).sort((a, b) => a[0] - b[0]);

  active.forEach(([time, value]) => {
    const index = Math.min(bucketCount - 1, Math.max(0, Math.ceil((time - from) / stepMs) - 1));
    buckets[index] += value;
  });

  const firstIndex = buckets.findIndex((value) => value > 0);

  return {
    buckets,
    firstSeen: firstIndex > 0 ? active[0]?.[0] : undefined,
  };
}

// ---------------------------------------------------------------------------
// Real users on the run's journey
// ---------------------------------------------------------------------------

function pagePattern(pageIds: string[]): string {
  return escapeLogQLString(`^(${pageIds.map(escapeRegExp).join('|')})$`);
}

/** Distinct real-user sessions per page, for the pages the run visited. */
export function buildJourneySessionsLogQL({
  appId,
  pageIds,
  range,
}: {
  appId: string;
  pageIds: string[];
  range: string;
}) {
  return `count by (page_id) (sum by (page_id, session_id) (count_over_time({kind=~"event|measurement", app_id="${escapeLogQLString(appId)}"} | logfmt ${REAL_USERS_FILTER} | page_id=~"${pagePattern(pageIds)}" [${range}])))`;
}

/** Distinct real-user sessions per page that threw at least one JS error there. */
export function buildJourneyErrorSessionsLogQL({
  appId,
  pageIds,
  range,
}: {
  appId: string;
  pageIds: string[];
  range: string;
}) {
  return `count by (page_id) (sum by (page_id, session_id) (count_over_time({kind="exception", app_id="${escapeLogQLString(appId)}"} | logfmt ${REAL_USERS_FILTER} | page_id=~"${pagePattern(pageIds)}" [${range}])))`;
}

export interface JourneyStep {
  pageId: string;
  sessions: number;
  errorSessions: number;
  runFailedHere: boolean;
  runEndedHere: boolean;
}

export function getJourneySteps({
  run,
  sessionsByPage,
  errorSessionsByPage,
}: {
  run: Pick<FaroRunContext, 'pages' | 'errors' | 'failedRequests'>;
  sessionsByPage: Record<string, number>;
  errorSessionsByPage: Record<string, number>;
}): JourneyStep[] {
  const failedPages = new Set([
    ...run.errors.map((error) => error.pageId),
    ...run.failedRequests.map((request) => request.pageId),
  ]);

  return run.pages.map((pageId, index) => ({
    pageId,
    sessions: sessionsByPage[pageId] ?? 0,
    // error sessions are a subset of visiting sessions; clamp in case the two
    // instant queries saw slightly different data
    errorSessions: Math.min(errorSessionsByPage[pageId] ?? 0, sessionsByPage[pageId] ?? 0),
    runFailedHere: failedPages.has(pageId),
    runEndedHere: index === run.pages.length - 1,
  }));
}

// ---------------------------------------------------------------------------
// Links and formatting
// ---------------------------------------------------------------------------

export function buildFaroAppHref({ pluginId, appId }: { pluginId: string; appId: string }): string {
  return `/a/${encodeURIComponent(pluginId)}/apps/${encodeURIComponent(appId)}`;
}

/**
 * The error group page defaults to the last 30 minutes, which is empty once an
 * error has stopped, so the link pins the window the panel's counts cover.
 */
export function buildFaroErrorHref({
  pluginId,
  appId,
  hash,
  from,
  to,
}: {
  pluginId: string;
  appId: string;
  hash: string;
  from: number;
  to: number;
}): string {
  const params = new URLSearchParams({ from: String(Math.round(from)), to: String(Math.round(to)) });

  return `${buildFaroAppHref({ pluginId, appId })}/errors/${encodeURIComponent(hash)}?${params}`;
}

export function stripQuery(url: string): string {
  const index = url.search(/[?#]/);

  return index === -1 ? url : url.slice(0, index);
}

/** Compact display form for a request URL: path only. */
export function getRequestPath(url: string): string {
  try {
    return new URL(url).pathname;
  } catch {
    return stripQuery(url);
  }
}

export function formatDurationMs(ms: number): string {
  if (ms >= 1000) {
    return `${(ms / 1000).toFixed(2)} s`;
  }

  return `${Math.round(ms)} ms`;
}

export function formatRelativeDuration(ms: number): string {
  const minutes = Math.max(0, Math.round(ms / 60_000));

  if (minutes < 1) {
    return 'less than a minute';
  }

  if (minutes < 60) {
    return `${minutes} min`;
  }

  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;

  return rest > 0 && hours < 6 ? `${hours} h ${rest} min` : `${hours} h`;
}

export function formatShare(share: number): string {
  if (share > 0 && share < 0.01) {
    return '<1%';
  }

  if (share < 1 && share > 0.99) {
    return '>99%';
  }

  return `${Math.round(share * 100)}%`;
}

export function escapeLogQLString(value: string): string {
  return value.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
}

export function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
