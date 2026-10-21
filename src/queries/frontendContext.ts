import { stripQuery } from 'utils/url';

/*
 * Real users are Faro sessions without the k6 fields: k6 browser (SM checks,
 * load tests) stamps `k6_isK6Browser="true"` on every record it produces.
 * This is the same filter Frontend Observability uses to separate synthetic
 * traffic from real traffic.
 */
const REAL_USERS_FILTER = '| k6_isK6Browser=~""';

export interface FaroScope {
  appId: string;
  appEnvironment?: string;
}

export type FailureSignature =
  | { kind: 'exception'; template?: string; message: string }
  | { kind: 'request'; method: string; url: string; urlTemplate?: string; statusCode: number };

function environmentFilter(appEnvironment?: string): string {
  return appEnvironment ? `| app_environment="${escapeLogQLString(appEnvironment)}"` : '';
}

export function buildFaroRunLogQL(executionId: string): string {
  return `{kind=~"event|measurement|exception"} | logfmt | k6_isK6Browser="true" | k6_testRunId="sm:${escapeLogQLString(executionId)}"`;
}

/**
 * Page loads per build over time, synthetic traffic included: on low-traffic
 * apps the checks themselves are the best signal of when a build started
 * serving. Only hard navigations carry `ttfb`, so this counts page loads,
 * not every event.
 */
export function buildBuildActivityLogQL({ appId, appEnvironment, step }: FaroScope & { step: string }): string {
  return `sum by (app_version, app_bundle_id) (count_over_time({kind="measurement", app_id="${escapeLogQLString(appId)}"} |= " ttfb=" | logfmt ${environmentFilter(appEnvironment)} [${step}]))`;
}

/** Real-user page loads per build over `range`, to see which build users were actually on. */
export function buildRealUserBuildLoadsLogQL({ appId, appEnvironment, range }: FaroScope & { range: string }): string {
  return `sum by (app_version, app_bundle_id) (count_over_time({kind="measurement", app_id="${escapeLogQLString(appId)}"} |= " ttfb=" | logfmt ${environmentFilter(appEnvironment)} ${REAL_USERS_FILTER} [${range}]))`;
}

function eitherLabel(names: string[], matcher: string): string {
  return `| (${names.map((name) => `${name}${matcher}`).join(' or ')})`;
}

/** Log stream selecting real-user records that match the run's failure. */
export function buildFailureStream(appId: string, signature: FailureSignature, appEnvironment?: string): string {
  const app = escapeLogQLString(appId);

  if (signature.kind === 'exception') {
    const match = signature.template
      ? `| value_template="${escapeLogQLString(signature.template)}"`
      : `| value="${escapeLogQLString(signature.message)}"`;

    return `{kind="exception", app_id="${app}"} | logfmt ${environmentFilter(appEnvironment)} ${REAL_USERS_FILTER} ${match}`;
  }

  const urlMatch = signature.urlTemplate
    ? `| event_data_url_template="${escapeLogQLString(signature.urlTemplate)}"`
    : eitherLabel(
        ['event_data_url_full', 'event_data_http_url'],
        `=~"${escapeLogQLString(`^${escapeRegExp(stripQuery(signature.url))}(\\?.*)?$`)}"`
      );

  return [
    `{kind="event", app_id="${app}"} |~ "event_name=faro.tracing.(fetch|xml-http-request)" | logfmt ${environmentFilter(appEnvironment)} ${REAL_USERS_FILTER}`,
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
  appEnvironment,
  signature,
  range,
}: FaroScope & {
  signature: FailureSignature;
  range: string;
}): string {
  return `count(sum by (session_id) (count_over_time(${buildFailureStream(appId, signature, appEnvironment)} [${range}])))`;
}

export function buildFailureTrendLogQL({
  appId,
  appEnvironment,
  signature,
  step,
}: FaroScope & {
  signature: FailureSignature;
  step: string;
}): string {
  return `sum(count_over_time(${buildFailureStream(appId, signature, appEnvironment)} [${step}]))`;
}

function pagePattern(pageIds: string[]): string {
  return escapeLogQLString(`^(${pageIds.map(escapeRegExp).join('|')})$`);
}

/** Distinct real-user sessions per page, for the pages the run visited. */
export function buildJourneySessionsLogQL({
  appId,
  appEnvironment,
  pageIds,
  range,
}: FaroScope & {
  pageIds: string[];
  range: string;
}) {
  return `count by (page_id) (sum by (page_id, session_id) (count_over_time({kind=~"event|measurement|exception", app_id="${escapeLogQLString(appId)}"} | logfmt ${environmentFilter(appEnvironment)} ${REAL_USERS_FILTER} | page_id=~"${pagePattern(pageIds)}" [${range}])))`;
}

/** Distinct real-user sessions per page that threw at least one JS error there. */
export function buildJourneyErrorSessionsLogQL({
  appId,
  appEnvironment,
  pageIds,
  range,
}: FaroScope & {
  pageIds: string[];
  range: string;
}) {
  return `count by (page_id) (sum by (page_id, session_id) (count_over_time({kind="exception", app_id="${escapeLogQLString(appId)}"} | logfmt ${environmentFilter(appEnvironment)} ${REAL_USERS_FILTER} | page_id=~"${pagePattern(pageIds)}" [${range}])))`;
}

export function escapeLogQLString(value: string): string {
  return JSON.stringify(value).slice(1, -1);
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
