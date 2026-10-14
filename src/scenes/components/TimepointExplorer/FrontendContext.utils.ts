import { FailureSignature } from 'queries/frontendContext';

import { ParsedLokiRecord } from 'features/parseLokiLogs/parseLokiLogs.types';
import { stripQuery } from 'utils/url';
import { getFaroSessionFromLogs } from 'scenes/components/TimepointExplorer/TimepointViewerFaroSession.utils';

export type FaroRecord = ParsedLokiRecord<Record<string, string>, Record<string, string>>;

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

export interface FailureLocation {
  pageId: string;
  actionName?: string;
}

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
  count: number;
  locations: FailureLocation[];
}

export interface RunFailedRequest {
  key: string;
  method: string;
  url: string;
  urlTemplate?: string;
  // 0 means the request got no response at all (network failure, CORS, aborted)
  statusCode: number;
  durationMs?: number;
  traceId?: string;
  count: number;
  timestamp: number;
  locations: FailureLocation[];
}

export interface FaroRunContext {
  appId: string;
  appName?: string;
  appEnvironment?: string;
  build: AppBuild;
  sessionId: string;
  // page ids in the order the run first visited them
  pages: string[];
  lastPageId?: string;
  isTruncated?: boolean;
  errors: RunError[];
  failedRequests: RunFailedRequest[];
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

function addLocation(locations: FailureLocation[], pageId: string, actionName?: string) {
  if (!locations.some((location) => location.pageId === pageId && location.actionName === actionName)) {
    locations.push({ pageId, actionName });
  }
}

/**
 * Distils one check run's Faro records into what matters when the run
 * failed: which build it was served, which pages it visited, and the errors
 * and failed requests the browser reported.
 *
 * Records are scoped to the session the "View frontend session" button links
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
  let lastPageId: string | undefined;
  let build: AppBuild = {};

  records.forEach((record) => {
    const labels = record.labels ?? {};
    const pageId = labels.page_id ?? '';

    appName = appName ?? nonEmpty(labels.app_name);
    appEnvironment = appEnvironment ?? nonEmpty(labels.app_environment);

    if (!hasBuildIdentity(build)) {
      build = readBuild(labels);
    }

    if (pageId) {
      lastPageId = pageId;
      if (!pages.includes(pageId)) {
        pages.push(pageId);
      }
    }

    if (labels.kind === 'exception') {
      const message = labels.value ?? record.body ?? '';
      const template = nonEmpty(labels.value_template);
      const key = template ?? message;
      const existing = errors.get(key);

      if (existing) {
        existing.count += 1;
        addLocation(existing.locations, pageId, nonEmpty(labels.action_name));
        return;
      }

      errors.set(key, {
        key,
        type: labels.type || 'Error',
        message,
        template,
        hash: nonEmpty(labels.hash),
        count: 1,
        locations: [{ pageId, actionName: nonEmpty(labels.action_name) }],
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
        addLocation(existing.locations, pageId, nonEmpty(labels.action_name));
        const traceId = nonEmpty(labels.traceID) ?? nonEmpty(labels.trace_id);
        if (!existing.traceId && traceId) {
          existing.traceId = traceId;
          existing.timestamp = record.timestamp;
        }
        return;
      }

      failedRequests.set(key, {
        key,
        ...request,
        traceId: nonEmpty(labels.traceID) ?? nonEmpty(labels.trace_id),
        count: 1,
        timestamp: record.timestamp,
        locations: [{ pageId, actionName: nonEmpty(labels.action_name) }],
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
    lastPageId,
    errors: [...errors.values()],
    failedRequests: [...failedRequests.values()],
  };
}

// ---------------------------------------------------------------------------
// Build history
// ---------------------------------------------------------------------------

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

    byKey.set(key, entry);
  });

  const activity = [...byKey.values()].sort((a, b) => a.firstSeen - b.firstSeen);
  activity.forEach((entry) => entry.points.sort((a, b) => a[0] - b[0]));
  return activity;
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
 * Builds first observed after the window's first bucket. These are observations,
 * not a deployment log: an older build may reappear or have sparse traffic.
 */
export function getBuildChanges(activity: BuildActivity[], from: number, stepMs: number): BuildChange[] {
  return activity
    .filter((entry) => entry.firstSeen > from + stepMs && entry.loads >= MIN_LOADS_FOR_BUILD_CHANGE)
    .map((entry) => ({ time: entry.firstSeen, build: entry.build, previous: findPreviousBuild(activity, entry) }));
}

// ---------------------------------------------------------------------------
// When a build was observed
// ---------------------------------------------------------------------------

export interface BuildStart {
  from: number;
  to: number;
}

/**
 * Page-load buckets only place a build's first appearance somewhere in
 * `(firstSeen - step, firstSeen]`, not at an exact deployment time.
 */
export function getBuildStart({ firstSeen, stepMs }: { firstSeen: number; stepMs: number }): BuildStart {
  return { from: firstSeen - stepMs, to: firstSeen };
}

// ---------------------------------------------------------------------------
// The run's build compared with real users
// ---------------------------------------------------------------------------

export interface BuildShare {
  build: AppBuild;
  share: number;
}

/**
 * Comparisons describe observed traffic, not version or deployment order.
 * `rolling-out` means the run's build was observed later, inside the comparison
 * window. `newer` / `older` mean observed later / earlier. These observations
 * alone cannot identify a canary, rollback, or stale cache.
 */
export type RealUserComparison = 'same' | 'rolling-out' | 'newer' | 'older' | 'different';

export interface BuildInsight {
  observedInFirstBucket: boolean;
  // set when the run's build was first observed after the initial bucket
  start?: BuildStart;
  previous?: AppBuild;
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
  activity,
  historyFrom,
  stepMs,
  realUserLoads,
  realUserWindowFrom,
}: {
  runBuild: AppBuild;
  activity: BuildActivity[];
  historyFrom: number;
  stepMs: number;
  realUserLoads: LabelledSeries[];
  realUserWindowFrom: number;
}): BuildInsight {
  const runKey = getBuildKey(runBuild);
  const runEntry = activity.find((entry) => entry.key === runKey);

  // One page load is enough to describe the run's build. Missing observations
  // remain unknown rather than evidence that a build predates this window.
  const observedInFirstBucket = runEntry !== undefined && runEntry.firstSeen <= historyFrom + stepMs;
  const isNew = runEntry !== undefined && !observedInFirstBucket;
  const start = isNew ? getBuildStart({ firstSeen: runEntry.firstSeen, stepMs }) : undefined;

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
    observedInFirstBucket,
    start,
    previous: isNew ? findPreviousBuild(activity, runEntry) : undefined,
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

    for (const entry of activity) {
      // a point at time t covers [t - step, t]
      const loads = entry.points
        .filter(([time]) => time > bucketStart && time <= bucketEnd)
        .reduce((sum, [, value]) => sum + value, 0);

      if (loads > 0 && (!winner || loads > winner.loads)) {
        winner = { key: entry.key, loads };
      }
    }

    const key = winner?.key ?? null;
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

export interface FailureTrend {
  // one value per bucket across the whole window, zero-filled
  buckets: number[];
  // when the failure first appeared, if that was inside the window
  firstSeen?: number;
  firstSeenTo?: number;
}

/**
 * Loki omits empty buckets from range results; fill them so the sparkline
 * has a constant width, and work out whether the failure started inside the
 * window or was already happening at its start.
 */
export function getFailureTrend(points: SeriesPoint[], from: number, to: number, stepMs: number): FailureTrend {
  const bucketCount = Math.max(1, Math.ceil((to - from) / stepMs));
  const buckets = new Array<number>(bucketCount).fill(0);
  const active = points.filter(([time, value]) => value > 0 && time > from && time <= to).sort((a, b) => a[0] - b[0]);

  active.forEach(([time, value]) => {
    const index = Math.min(bucketCount - 1, Math.max(0, Math.ceil((time - from) / stepMs) - 1));
    buckets[index] += value;
  });

  const firstIndex = buckets.findIndex((value) => value > 0);

  return {
    buckets,
    firstSeen: firstIndex > 0 ? Math.max(from, active[0][0] - stepMs) : undefined,
    firstSeenTo: firstIndex > 0 ? active[0][0] : undefined,
  };
}

// ---------------------------------------------------------------------------
// Real users on the run's journey
// ---------------------------------------------------------------------------

export interface JourneyStep {
  pageId: string;
  sessions: number;
  errorSessions: number;
  runHadErrorHere: boolean;
  runEndedHere: boolean;
}

export function getJourneySteps({
  run,
  sessionsByPage,
  errorSessionsByPage,
}: {
  run: Pick<FaroRunContext, 'pages' | 'lastPageId' | 'errors' | 'failedRequests'>;
  sessionsByPage: Record<string, number>;
  errorSessionsByPage: Record<string, number>;
}): JourneyStep[] {
  const failedPages = new Set([
    ...run.errors.flatMap((error) => error.locations.map((location) => location.pageId)),
    ...run.failedRequests.flatMap((request) => request.locations.map((location) => location.pageId)),
  ]);

  return run.pages.map((pageId) => ({
    pageId,
    sessions: sessionsByPage[pageId] ?? 0,
    // error sessions are a subset of visiting sessions; clamp in case the two
    // instant queries saw slightly different data
    errorSessions: Math.min(errorSessionsByPage[pageId] ?? 0, sessionsByPage[pageId] ?? 0),
    runHadErrorHere: failedPages.has(pageId),
    runEndedHere: pageId === run.lastPageId,
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
