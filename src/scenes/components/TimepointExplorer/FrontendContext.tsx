import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { dateTimeFormat, GrafanaTheme2 } from '@grafana/data';
import {
  Badge,
  BadgeColor,
  Icon,
  Input,
  LinkButton,
  Spinner,
  Stack,
  Text,
  TextLink,
  Tooltip,
  useStyles2,
} from '@grafana/ui';
import { css, cx } from '@emotion/css';

import { CheckType } from 'types';
import { getCheckType } from 'utils';
import { useTracesDS } from 'hooks/useTracesDS';
import { PlainButton } from 'components/PlainButton';
import { fetchTraceData } from 'scenes/components/LogsRenderer/LogLine.utils';
import { getExploreTraceUrl } from 'scenes/components/LogsRenderer/TraceLink.utils';
import { TracePanel } from 'scenes/components/LogsRenderer/TracePanel';
import {
  RealUserActionBaseline,
  RealUserPageBaseline,
  useAppVersionChange,
  useExceptionRealSessions,
  useFaroExecutionContext,
  useRealUserActionBaselines,
  useRealUserPageBaseline,
  useSimilarRealSessions,
} from 'scenes/components/TimepointExplorer/FrontendContext.hooks';
import {
  buildFaroPageHref,
  FaroAction,
  FaroExecutionContext,
  FaroHttpRequest,
  FaroPageVisit,
  FidelityRating,
  formatDurationMs,
  formatWebVitalDelta,
  formatWebVitalValue,
  getMedianRequestDuration,
  getPageComparisonVerdict,
  getRequestPath,
  getSummaryVerdict,
  rateWebVital,
  SummaryTone,
  WEB_VITAL_LABELS,
  WEB_VITALS,
  WebVitalName,
  WebVitalRating,
} from 'scenes/components/TimepointExplorer/FrontendContext.utils';
import { FARO_APP_PLUGIN_ID } from 'scenes/components/TimepointExplorer/TimepointExplorer.constants';
import { useTimepointExplorerContext } from 'scenes/components/TimepointExplorer/TimepointExplorer.context';
import { useStatefulTimepoint } from 'scenes/components/TimepointExplorer/TimepointExplorer.hooks';
import { StatelessTimepoint } from 'scenes/components/TimepointExplorer/TimepointExplorer.types';
import { buildFaroSessionHref } from 'scenes/components/TimepointExplorer/TimepointViewerFaroSession.utils';

const RATING_COLOR: Record<WebVitalRating, BadgeColor> = {
  good: 'green',
  'needs-improvement': 'orange',
  poor: 'red',
};

export const FrontendContext = ({ timepoint }: { timepoint: StatelessTimepoint }) => {
  const { check, viewerState } = useTimepointExplorerContext();
  const [, viewerProbeName, viewerExecutionIndex] = viewerState;
  const isBrowserCheck = getCheckType(check.settings) === CheckType.Browser;
  const statefulTimepoint = useStatefulTimepoint(timepoint);

  const selectedExecution =
    viewerProbeName !== undefined && viewerExecutionIndex !== undefined
      ? statefulTimepoint.probeResults?.[viewerProbeName]?.[viewerExecutionIndex]
      : undefined;
  const executionId = selectedExecution?.labels.execution_id;
  const to = timepoint.adjustedTime + timepoint.timepointDuration + timepoint.config.frequency;

  const { data: context } = useFaroExecutionContext({
    executionId: executionId ?? '',
    from: timepoint.adjustedTime,
    to,
    enabled: isBrowserCheck && Boolean(executionId),
  });

  if (!isBrowserCheck || !context) {
    return null;
  }

  const probeSuccess = selectedExecution?.labels.probe_success === '1';

  return <FrontendContextPanel context={context} from={timepoint.adjustedTime} to={to} probeSuccess={probeSuccess} />;
};

const FrontendContextPanel = ({
  context,
  from,
  to,
  probeSuccess,
}: {
  context: FaroExecutionContext;
  from: number;
  to: number;
  probeSuccess: boolean;
}) => {
  const styles = useStyles2(getStyles);
  const [expanded, setExpanded] = useState(false);
  const sessionHref = buildFaroSessionHref({
    pluginId: FARO_APP_PLUGIN_ID,
    appId: context.appId,
    sessionId: context.sessionId,
  });

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <Stack direction="row" gap={1} alignItems="center">
          <Icon name="frontend-observability" />
          <Text variant="h6">Real user context</Text>
          {context.appName && (
            <Text color="secondary" variant="bodySmall">
              <span className={styles.mono}>{context.appName}</span>
            </Text>
          )}
        </Stack>
        <Stack direction="row" gap={1} alignItems="center">
          {context.hasSessionReplay ? (
            <LinkButton href={sessionHref} icon="play" size="sm" variant="secondary" fill="outline" target="_blank">
              Watch session replay
            </LinkButton>
          ) : (
            <Text color="secondary" italic variant="bodySmall">
              Session replay not available for this run
            </Text>
          )}
        </Stack>
      </div>

      <div className={styles.provenance}>
        <Text color="secondary" variant="bodySmall" italic>
          Read from the Faro session this check created — including the check&apos;s own actions, requests and
          exceptions. Action names come from the app, not from your check configuration.
        </Text>
      </div>

      <SummaryBand
        context={context}
        to={to}
        probeSuccess={probeSuccess}
        expanded={expanded}
        onToggle={() => setExpanded(!expanded)}
      />

      {expanded && (
        <div className={styles.body}>
          <AppVersionLine context={context} from={from} to={to} />

        {context.exceptions.length > 0 && (
          <div className={styles.section}>
            <ExceptionsList context={context} to={to} />
          </div>
        )}

        {context.actions.length > 0 && (
          <div className={styles.section}>
            <ActionsList context={context} to={to} />
          </div>
        )}

        {context.requests.length > 0 && (
          <div className={styles.section}>
            <NetworkRequestsList context={context} />
          </div>
        )}

        <div className={styles.section}>
          <Stack direction="column" gap={1}>
            <Text weight="medium">Pages visited</Text>
            {context.pages.map((page) => (
              <PageVisit key={page.pageId} appId={context.appId} page={page} to={to} requests={context.requests} />
            ))}
          </Stack>
        </div>

          <SimilarSessions context={context} to={to} />
        </div>
      )}
    </div>
  );
};

const CHIP_COLOR: Record<SummaryTone, BadgeColor> = {
  error: 'red',
  warning: 'orange',
  info: 'blue',
  success: 'green',
  secondary: 'blue',
};

const SummaryBand = ({
  context,
  to,
  probeSuccess,
  expanded,
  onToggle,
}: {
  context: FaroExecutionContext;
  to: number;
  probeSuccess: boolean;
  expanded: boolean;
  onToggle: () => void;
}) => {
  const styles = useStyles2(getStyles);
  const { data: versionChange } = useAppVersionChange({
    appId: context.appId,
    runVersion: context.appVersion ?? '',
    to,
    enabled: Boolean(context.appVersion),
  });
  const { data: exceptionRealSessionCounts } = useExceptionRealSessions({
    appId: context.appId,
    messages: context.exceptions.map((exception) => exception.message),
    to,
  });
  const { data: actionBaselines } = useRealUserActionBaselines({
    appId: context.appId,
    actionNames: context.actions.map((action) => action.actionName),
    to,
  });

  const verdict = getSummaryVerdict({
    probeSuccess,
    versionChange,
    exceptions: context.exceptions,
    exceptionRealSessionCounts,
    actions: context.actions,
    actionBaselines,
  });

  return (
    <div className={styles.summaryBand}>
      <Text variant="h5" color={verdict.tone === 'secondary' ? undefined : verdict.tone}>
        {verdict.text}
      </Text>
      {verdict.chips.length > 0 && (
        <Stack direction="row" gap={1} wrap="wrap">
          {verdict.chips.map((chip, index) => (
            <Badge key={index} text={chip.text} color={CHIP_COLOR[chip.tone]} />
          ))}
        </Stack>
      )}
      <PlainButton onClick={onToggle}>
        <Text color="link" variant="bodySmall">
          <Icon name={expanded ? 'angle-up' : 'angle-down'} size="sm" /> {expanded ? 'Hide detail' : 'Show detail'}
        </Text>
      </PlainButton>
    </div>
  );
};

const ActionsList = ({ context, to }: { context: FaroExecutionContext; to: number }) => {
  const styles = useStyles2(getStyles);
  const actionNames = context.actions.map((action) => action.actionName);
  const { data: baselines } = useRealUserActionBaselines({ appId: context.appId, actionNames, to });

  // One shared scale across every action's bars — lets "which action is
  // slowest" and "where do run and p75 disagree most" both read at a
  // glance, without anyone parsing a number. Per-row scaling would show
  // divergence but destroy cross-action comparison.
  const maxDurationMs = Math.max(
    1,
    ...context.actions.flatMap((action) => {
      const baseline = baselines[action.actionName];
      return [action.durationMs, baseline?.durationMs].filter((value): value is number => value != null);
    })
  );

  return (
    <Stack direction="column" gap={1}>
      <Stack direction="row" gap={0.5} alignItems="center">
        <Text weight="medium">Named actions during this run ({context.actions.length})</Text>
        <Tooltip content="Business-level actions this app tags via Faro's User Actions feature. Each one auto-correlates every network call that happened while it was in progress — a more precise unit than the page it occurred on, and it works the same whether the app uses hard or soft navigation. Duration comes from the SDK's own userActionDuration measurement.">
          <Icon name="info-circle" size="sm" />
        </Tooltip>
      </Stack>
      <Stack direction="column" gap={1}>
        {context.actions.map((action) => (
          <div key={action.actionId} className={styles.indent}>
            <ActionRow action={action} baseline={baselines[action.actionName]} maxDurationMs={maxDurationMs} />
          </div>
        ))}
      </Stack>
    </Stack>
  );
};

const ActionRow = ({
  action,
  baseline,
  maxDurationMs,
}: {
  action: FaroAction;
  baseline: RealUserActionBaseline | null | undefined;
  maxDurationMs: number;
}) => {
  const styles = useStyles2(getStyles);
  const failureRate =
    baseline?.httpErrors && baseline?.occurrences ? (baseline.httpErrors / baseline.occurrences) * 100 : null;

  return (
    <Stack direction="column" gap={0.5}>
      <Text variant="bodySmall">
        <span className={cx(styles.mono, styles.actionName)}>{action.actionName}</span>{' '}
        <Text color="secondary" variant="bodySmall">
          on {action.pageId || 'unknown page'}
        </Text>
      </Text>

      {(action.durationMs !== undefined || baseline?.durationMs != null) && (
        <Stack direction="column" gap={0.25}>
          {action.durationMs !== undefined && (
            <BarRow label="this run" valueMs={action.durationMs} maxMs={maxDurationMs} tone="run" />
          )}
          {baseline?.durationMs != null && (
            <BarRow label="users p75" valueMs={baseline.durationMs} maxMs={maxDurationMs} tone="p75" />
          )}
        </Stack>
      )}

      <Text color={action.errorCount > 0 || failureRate !== null ? 'error' : 'secondary'} variant="bodySmall">
        {action.requestCount} request{action.requestCount === 1 ? '' : 's'}
        {action.errorCount > 0 && `, ${action.errorCount} failed this run`}
        {baseline?.occurrences != null &&
          ` · ${baseline.occurrences} real-user occurrence${baseline.occurrences === 1 ? '' : 's'}/hr`}
        {failureRate !== null && ` · ${failureRate.toFixed(1)}% real-user failure rate`}
        {baseline?.exceptions ? ` · ${baseline.exceptions} JS exceptions` : ''}
      </Text>
    </Stack>
  );
};

const BarRow = ({
  label,
  valueMs,
  maxMs,
  tone,
}: {
  label: string;
  valueMs: number;
  maxMs: number;
  tone: 'run' | 'p75';
}) => {
  const styles = useStyles2(getStyles);
  const widthPct = Math.min(100, (valueMs / maxMs) * 100);

  return (
    <div className={styles.barRow}>
      <span className={cx(styles.mono, styles.barLabel)}>{label}</span>
      <div className={styles.barTrack}>
        <div
          className={cx(styles.barFill, tone === 'run' ? styles.barFillRun : styles.barFillP75)}
          style={{ width: `${widthPct}%` }}
        />
      </div>
      <Text variant="bodySmall">{formatDurationMs(valueMs)}</Text>
    </div>
  );
};

const AppVersionLine = ({ context, from, to }: { context: FaroExecutionContext; from: number; to: number }) => {
  const styles = useStyles2(getStyles);
  const { data: versionChange } = useAppVersionChange({
    appId: context.appId,
    runVersion: context.appVersion ?? '',
    to,
    enabled: Boolean(context.appVersion),
  });

  if (!context.appVersion) {
    return null;
  }

  const versionLabel = `${context.appVersion}${context.appEnvironment ? ` (${context.appEnvironment})` : ''}`;

  if (!versionChange?.previousVersion || !versionChange.firstSeen) {
    return (
      <div className={styles.section}>
        <Text color="secondary" variant="bodySmall">
          App version: <span className={styles.mono}>{versionLabel}</span> — no version change detected in the 6
          hours before this run
        </Text>
      </div>
    );
  }

  const minutesBeforeRun = Math.max(0, Math.round((from - versionChange.firstSeen) / 60_000));

  return (
    <div className={cx(styles.section, styles.calloutAccent)}>
      <Text color="warning" variant="bodySmall" weight="medium">
        App version: <span className={styles.mono}>{versionLabel}</span> — first seen{' '}
        {dateTimeFormat(versionChange.firstSeen, { format: 'HH:mm' })}
        {minutesBeforeRun > 0 && ` (${formatMinutes(minutesBeforeRun)} before this run)`} · previously{' '}
        <span className={styles.mono}>{versionChange.previousVersion}</span>
      </Text>
    </div>
  );
};

function formatMinutes(minutes: number): string {
  if (minutes >= 60) {
    const hours = Math.floor(minutes / 60);
    const rest = minutes % 60;
    return rest > 0 ? `${hours} h ${rest} min` : `${hours} h`;
  }

  return `${minutes} min`;
}

const ExceptionsList = ({ context, to }: { context: FaroExecutionContext; to: number }) => {
  const { data: realSessionCounts } = useExceptionRealSessions({
    appId: context.appId,
    messages: context.exceptions.map((exception) => exception.message),
    to,
  });

  return (
    <Stack direction="column" gap={0.5}>
      <Text weight="medium">JS exceptions during this run ({context.exceptions.length})</Text>
      {context.exceptions.slice(0, 5).map((exception, index) => {
        const realSessions = realSessionCounts?.[exception.message];

        return (
          <Text key={index} variant="bodySmall">
            <Text color="error" variant="bodySmall">
              {exception.type}: {exception.message} {exception.pageId && <em>on {exception.pageId}</em>}
            </Text>
            {realSessions !== undefined && (
              <Text color={realSessions > 0 ? 'warning' : 'secondary'} variant="bodySmall">
                {' '}
                —{' '}
                {realSessions > 0
                  ? `also hit ${realSessions} real user ${realSessions === 1 ? 'session' : 'sessions'} in the past hour`
                  : 'not seen in any real user session in the past hour (likely specific to this run)'}
              </Text>
            )}
          </Text>
        );
      })}
    </Stack>
  );
};

const COLLAPSED_REQUEST_COUNT = 5;

const NetworkRequestsList = ({ context }: { context: FaroExecutionContext }) => {
  const styles = useStyles2(getStyles);
  const tracesDS = useTracesDS();
  const [showAll, setShowAll] = useState(false);
  const failedCount = context.requests.filter((request) => request.isError).length;

  // Failures get priority for the collapsed view — the failing request is what
  // you came for — but rendering below is grouped by page, chronological within.
  const prioritized = [...context.requests].sort(
    (a, b) => Number(b.isError) - Number(a.isError) || a.timestamp - b.timestamp
  );
  const visibleSet = new Set(showAll ? prioritized : prioritized.slice(0, COLLAPSED_REQUEST_COUNT));

  // Pages in journey order; any request with an unrecognized page lands at the end.
  const journeyPageIds = context.pages.map((page) => page.pageId);
  const pageIds = [...new Set([...journeyPageIds, ...context.requests.map((request) => request.pageId)])];

  return (
    <Stack direction="column" gap={0.5}>
      <Text weight="medium">
        Network requests during this run ({context.requests.length}
        {failedCount > 0 ? ` · ${failedCount} failed` : ''})
      </Text>
      {pageIds.map((pageId) => {
        const pageRequests = context.requests
          .filter((request) => request.pageId === pageId && visibleSet.has(request))
          .sort((a, b) => a.timestamp - b.timestamp);

        if (!pageRequests.length) {
          return null;
        }

        return (
          <Stack key={pageId || 'unknown-page'} direction="column" gap={0.5}>
            <Text color="secondary" variant="bodySmall" weight="medium">
              on {pageId || 'unknown page'}
            </Text>
            <div className={styles.indent}>
              <Stack direction="column" gap={0.5}>
                {pageRequests.map((request, index) => (
                  <RequestRow
                    key={`${request.timestamp}-${request.url}-${index}`}
                    request={request}
                    tracesDS={tracesDS}
                  />
                ))}
              </Stack>
            </div>
          </Stack>
        );
      })}
      {context.requests.length > COLLAPSED_REQUEST_COUNT && (
        <PlainButton onClick={() => setShowAll(!showAll)}>
          <Text color="link" variant="bodySmall">
            {showAll ? 'Show fewer' : `Show all ${context.requests.length} requests`}
          </Text>
        </PlainButton>
      )}
    </Stack>
  );
};

const RequestRow = ({
  request,
  tracesDS,
}: {
  request: FaroHttpRequest;
  tracesDS: ReturnType<typeof useTracesDS>;
}) => {
  const [traceExpanded, setTraceExpanded] = useState(false);
  const canShowTrace = Boolean(tracesDS && request.traceId);

  return (
    <Stack direction="column" gap={0.5}>
      <Text variant="bodySmall">
        <Text color={request.isError ? 'error' : 'secondary'} variant="bodySmall">
          {request.method}{' '}
          <Tooltip content={request.url}>
            <span>{getRequestPath(request.url)}</span>
          </Tooltip>{' '}
          → {request.statusCode === 0 ? 'no response' : request.statusCode}
          {request.durationMs !== undefined && ` · ${Math.round(request.durationMs)} ms`}
        </Text>
        {canShowTrace && (
          <>
            {' '}
            ·{' '}
            <PlainButton onClick={() => setTraceExpanded(!traceExpanded)}>
              <Text color="link" variant="bodySmall">
                {traceExpanded ? 'hide trace' : 'view trace'}
              </Text>
            </PlainButton>
          </>
        )}
      </Text>
      {traceExpanded && tracesDS && request.traceId && (
        <RequestTrace request={request} tracesDS={tracesDS} onClose={() => setTraceExpanded(false)} />
      )}
    </Stack>
  );
};

const RequestTrace = ({
  request,
  tracesDS,
  onClose,
}: {
  request: FaroHttpRequest;
  tracesDS: NonNullable<ReturnType<typeof useTracesDS>>;
  onClose: () => void;
}) => {
  const { data: traceData, isLoading } = useQuery({
    // eslint-disable-next-line @tanstack/query/exhaustive-deps -- tracesDS.uid is a stable identifier
    queryKey: ['faro-request-trace', request.traceId, tracesDS.uid],
    queryFn: () => fetchTraceData(request.traceId!, tracesDS),
    enabled: Boolean(request.traceId),
    staleTime: Infinity,
    retry: false,
  });

  if (isLoading) {
    return <Spinner />;
  }

  if (!traceData || traceData.series.length === 0) {
    return (
      <Text color="secondary" italic variant="bodySmall">
        No trace found for this request — the backend may not have sampled it.{' '}
        <TextLink href={getExploreTraceUrl(tracesDS.uid, request.traceId!)} inline={false} variant="bodySmall">
          Try in Explore
        </TextLink>
      </Text>
    );
  }

  return (
    <TracePanel
      traceId={request.traceId!}
      tracesDS={tracesDS}
      traceData={traceData}
      logTimestamp={request.timestamp}
      arrowOffset={null}
      onClose={onClose}
    />
  );
};

const COLLAPSED_SIMILAR_SESSION_COUNT = 5;

const SimilarSessions = ({ context, to }: { context: FaroExecutionContext; to: number }) => {
  const styles = useStyles2(getStyles);
  const [showAll, setShowAll] = useState(false);
  const [filter, setFilter] = useState('');
  const journeyPageIds = context.pages.map((page) => page.pageId);
  const { data: sessions } = useSimilarRealSessions({
    appId: context.appId,
    pageIds: journeyPageIds,
    to,
  });

  if (!sessions?.length) {
    return null;
  }

  const filtered = filter
    ? sessions.filter((session) => session.sessionId.toLowerCase().includes(filter.toLowerCase()))
    : sessions;
  const visibleSessions = showAll ? filtered : filtered.slice(0, COLLAPSED_SIMILAR_SESSION_COUNT);

  return (
    <div className={styles.section}>
      <Stack direction="column" gap={1}>
        <Stack direction="row" gap={1} alignItems="center" wrap="wrap">
          <Text weight="medium">Real user sessions with a similar journey ({sessions.length})</Text>
          <Tooltip content="Real user sessions from the hour before this run that loaded the same pages as this check, ranked by how much of the check's journey they cover.">
            <Icon name="info-circle" size="sm" />
          </Tooltip>
          {sessions.length > COLLAPSED_SIMILAR_SESSION_COUNT && (
            <Input
              placeholder="Filter by session ID"
              value={filter}
              onChange={(event) => setFilter(event.currentTarget.value)}
              width={24}
            />
          )}
        </Stack>
        <Stack direction="column" gap={1}>
          {visibleSessions.map((session) => {
            const location = [session.city, session.countryIso].filter(Boolean).join(', ');
            const outcomeText =
              session.outcome?.kind === 'completed'
                ? 'Completed the journey'
                : session.outcome?.kind === 'stopped-at'
                  ? `Stopped at ${session.outcome.pageId}`
                  : `${session.matchedPages.length} of ${journeyPageIds.length} pages in common, not in journey order`;

            return (
              <div key={session.sessionId} className={styles.indent}>
                <Stack direction="column" gap={0.25}>
                  <Stack direction="row" gap={1} alignItems="center" wrap="wrap">
                    <TextLink
                      href={buildFaroSessionHref({
                        pluginId: FARO_APP_PLUGIN_ID,
                        appId: context.appId,
                        sessionId: session.sessionId,
                      })}
                      inline={false}
                      variant="bodySmall"
                    >
                      <span className={styles.mono}>{session.sessionId}</span>
                    </TextLink>
                    <Text color="secondary" variant="bodySmall">
                      {outcomeText}
                      {location && ` · ${location}`} · last seen{' '}
                      {dateTimeFormat(session.lastSeen, { format: 'HH:mm:ss' })}
                    </Text>
                  </Stack>
                  <Text variant="bodySmall">
                    <span className={styles.mono}>
                      {session.matchedPages.length > 0 ? session.matchedPages.join(' → ') : '(no matched pages)'}
                    </span>
                  </Text>
                </Stack>
              </div>
            );
          })}
        </Stack>
        {filtered.length > COLLAPSED_SIMILAR_SESSION_COUNT && (
          <PlainButton onClick={() => setShowAll(!showAll)}>
            <Text color="link" variant="bodySmall">
              {showAll ? 'Show fewer' : `Show all ${filtered.length} sessions`}
            </Text>
          </PlainButton>
        )}
        {filter && filtered.length === 0 && (
          <Text color="secondary" italic variant="bodySmall">
            No session ID matches &quot;{filter}&quot;.
          </Text>
        )}
      </Stack>
    </div>
  );
};

const FIDELITY_COLOR: Record<FidelityRating, 'info' | 'secondary'> = {
  representative: 'secondary',
  optimistic: 'info',
  pessimistic: 'info',
  'insufficient-data': 'secondary',
};

const PageVisit = ({
  appId,
  page,
  to,
  requests,
}: {
  appId: string;
  page: FaroPageVisit;
  to: number;
  requests: FaroHttpRequest[];
}) => {
  const styles = useStyles2(getStyles);
  const [isComparisonOpen, setIsComparisonOpen] = useState(false);
  const pageHref = buildFaroPageHref({ pluginId: FARO_APP_PLUGIN_ID, appId, pageId: page.pageId });
  const hasVitals = WEB_VITALS.some((vital) => page.vitals[vital] !== undefined);
  const hasOwnRequests = requests.some((request) => request.pageId === page.pageId);

  return (
    <div className={styles.indent}>
      <Stack direction="column" gap={1}>
        <Stack direction="row" gap={2} alignItems="center" wrap="wrap">
          <TextLink href={pageHref} inline={false}>
            {page.pageId}
          </TextLink>
          {page.pageLoadTimeMs !== undefined && (
            <Tooltip content="Total page load time from faro.performance.navigation — the headline outcome; the vitals alongside it are the diagnostic breakdown. Not a Core Web Vital, no good/poor threshold.">
              <Text weight="medium">{formatDurationMs(page.pageLoadTimeMs)} page load</Text>
            </Tooltip>
          )}
          <Stack direction="row" gap={0.5} alignItems="center">
            {WEB_VITALS.map((vital) => {
              const value = page.vitals[vital];

              if (value === undefined) {
                return null;
              }

              return (
                <Badge
                  key={vital}
                  text={`${WEB_VITAL_LABELS[vital]} ${formatWebVitalValue(vital, value)}`}
                  color={RATING_COLOR[rateWebVital(vital, value)]}
                  tooltip="As measured by Frontend Observability during this run"
                />
              );
            })}
          </Stack>
          {(hasVitals || hasOwnRequests) && (
            <PlainButton onClick={() => setIsComparisonOpen(!isComparisonOpen)}>
              <Text color="link" variant="bodySmall">
                <Icon name={isComparisonOpen ? 'angle-up' : 'angle-down'} size="sm" /> Compare with real users
              </Text>
            </PlainButton>
          )}
        </Stack>
        {isComparisonOpen && <PageBaseline appId={appId} page={page} to={to} requests={requests} />}
      </Stack>
    </div>
  );
};

const RealUserSummaryLine = ({ pageId, baseline }: { pageId: string; baseline: RealUserPageBaseline }) => (
  <Text color="secondary" variant="bodySmall">
    Real users on {pageId} in the hour before this run
    {baseline.pageLoads !== null && `: ${baseline.pageLoads} page ${baseline.pageLoads === 1 ? 'load' : 'loads'}`}
    {baseline.exceptions !== null && `, ${baseline.exceptions} JS exceptions`}
    {baseline.httpErrors !== null && `, ${baseline.httpErrors} failed requests`}
  </Text>
);

const PageBaseline = ({
  appId,
  page,
  to,
  requests,
}: {
  appId: string;
  page: FaroPageVisit;
  to: number;
  requests: FaroHttpRequest[];
}) => {
  const styles = useStyles2(getStyles);
  const { data: baseline, isLoading } = useRealUserPageBaseline({
    appId,
    pageId: page.pageId,
    to,
  });
  const hasVitals = WEB_VITALS.some((vital) => page.vitals[vital] !== undefined);
  const runLatencyMs = getMedianRequestDuration(requests, page.pageId);

  if (isLoading) {
    return <Spinner />;
  }

  const hasRealUserVitals = Boolean(baseline?.pageLoads);
  const hasRealUserLatency = baseline?.requestLatencyMs !== null && baseline?.requestLatencyMs !== undefined;

  if (!baseline || (!hasRealUserVitals && !hasRealUserLatency)) {
    return (
      <Text color="secondary" italic variant="bodySmall">
        No real user traffic on {page.pageId} in the hour before this run.
      </Text>
    );
  }

  if (hasVitals) {
    const verdict = getPageComparisonVerdict(page.vitals, baseline.vitals);
    const isFidelityFlagged = verdict.rating === 'optimistic' || verdict.rating === 'pessimistic';

    return (
      <div className={cx(styles.resultCard, isFidelityFlagged && styles.resultCardFidelity)}>
        <Text
          color={FIDELITY_COLOR[verdict.rating]}
          variant={verdict.rating === 'optimistic' ? 'body' : 'bodySmall'}
          weight={verdict.rating === 'optimistic' ? 'medium' : undefined}
          italic={verdict.rating === 'insufficient-data'}
        >
          {verdict.text}
        </Text>
        <RealUserSummaryLine pageId={page.pageId} baseline={baseline} />
        <table className={styles.comparisonTable}>
          <thead>
            <tr>
              <th>
                <Text variant="bodySmall" color="secondary">
                  Web vital
                </Text>
              </th>
              <th>
                <Text variant="bodySmall" color="secondary">
                  This run
                </Text>
              </th>
              <th>
                <Text variant="bodySmall" color="secondary">
                  Real users (p75)
                </Text>
              </th>
              <th>
                <Text variant="bodySmall" color="secondary">
                  Difference
                </Text>
              </th>
            </tr>
          </thead>
          <tbody>
            {WEB_VITALS.map((vital) => {
              const runValue = page.vitals[vital];
              const baselineValue = baseline.vitals[vital];

              if (runValue === undefined && baselineValue === undefined) {
                return null;
              }

              return (
                <tr key={vital}>
                  <td>
                    <Text variant="bodySmall">{WEB_VITAL_LABELS[vital]}</Text>
                  </td>
                  <td>
                    <ComparisonValue vital={vital} value={runValue} />
                  </td>
                  <td>
                    <ComparisonValue vital={vital} value={baselineValue} />
                  </td>
                  <td>
                    {runValue !== undefined && baselineValue !== undefined ? (
                      <Text variant="bodySmall" color={runValue > baselineValue * 1.5 ? 'warning' : 'secondary'}>
                        {formatWebVitalDelta(vital, runValue, baselineValue)}
                      </Text>
                    ) : (
                      <Text variant="bodySmall" color="secondary">
                        -
                      </Text>
                    )}
                  </td>
                </tr>
              );
            })}
            {(page.pageLoadTimeMs !== undefined || baseline.pageLoadTimeMs !== null) && (
              <tr>
                <td>
                  <Text variant="bodySmall">Page load</Text>
                </td>
                <td>
                  <Text variant="bodySmall">
                    {page.pageLoadTimeMs !== undefined ? formatDurationMs(page.pageLoadTimeMs) : '-'}
                  </Text>
                </td>
                <td>
                  <Text variant="bodySmall">
                    {baseline.pageLoadTimeMs !== null ? formatDurationMs(baseline.pageLoadTimeMs) : '-'}
                  </Text>
                </td>
                <td>
                  {page.pageLoadTimeMs !== undefined && baseline.pageLoadTimeMs !== null ? (
                    <Text
                      variant="bodySmall"
                      color={page.pageLoadTimeMs > baseline.pageLoadTimeMs * 1.5 ? 'warning' : 'secondary'}
                    >
                      {page.pageLoadTimeMs > baseline.pageLoadTimeMs ? '+' : ''}
                      {formatDurationMs(page.pageLoadTimeMs - baseline.pageLoadTimeMs)}
                    </Text>
                  ) : (
                    <Text variant="bodySmall" color="secondary">
                      -
                    </Text>
                  )}
                </td>
              </tr>
            )}
          </tbody>
        </table>
        <Text variant="bodySmall" color="secondary" italic>
          Page load isn&apos;t a Core Web Vital — no good/poor rating, shown for reference alongside the vitals
          above.
        </Text>
      </div>
    );
  }

  if (runLatencyMs !== null || hasRealUserLatency) {
    return (
      <div className={styles.resultCard}>
        <Text color="secondary" variant="bodySmall" italic>
          No web vitals recorded for {page.pageId} — comparing request latency instead. TTFB/FCP/LCP are tied to
          the initial document load; this app doesn&apos;t re-measure them on this page&apos;s navigation.
        </Text>
        <RealUserSummaryLine pageId={page.pageId} baseline={baseline} />
        <table className={styles.comparisonTable}>
          <thead>
            <tr>
              <th>
                <Text variant="bodySmall" color="secondary">
                  Metric
                </Text>
              </th>
              <th>
                <Text variant="bodySmall" color="secondary">
                  This run
                </Text>
              </th>
              <th>
                <Text variant="bodySmall" color="secondary">
                  Real users (p75)
                </Text>
              </th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>
                <Text variant="bodySmall">Request latency</Text>
              </td>
              <td>
                <Text variant="bodySmall">{runLatencyMs !== null ? `${Math.round(runLatencyMs)} ms` : '-'}</Text>
              </td>
              <td>
                <Text variant="bodySmall">
                  {baseline.requestLatencyMs !== null ? `${Math.round(baseline.requestLatencyMs)} ms` : '-'}
                </Text>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    );
  }

  return (
    <Text color="secondary" italic variant="bodySmall">
      No comparable real-user data for {page.pageId}.
    </Text>
  );
};

const ComparisonValue = ({ vital, value }: { vital: WebVitalName; value?: number }) => {
  if (value === undefined) {
    return (
      <Text variant="bodySmall" color="secondary">
        -
      </Text>
    );
  }

  const rating = rateWebVital(vital, value);
  const color = rating === 'good' ? 'success' : rating === 'needs-improvement' ? 'warning' : 'error';

  return (
    <Text variant="bodySmall" color={color}>
      {formatWebVitalValue(vital, value)}
    </Text>
  );
};

const getStyles = (theme: GrafanaTheme2) => ({
  container: css`
    border: 1px solid ${theme.colors.border.medium};
    border-radius: ${theme.shape.radius.default};
    overflow: hidden;
  `,
  header: css`
    display: flex;
    align-items: center;
    justify-content: space-between;
    flex-wrap: wrap;
    gap: ${theme.spacing(1)};
    padding: ${theme.spacing(1.5, 2)};
    background: ${theme.colors.background.secondary};
    border-bottom: 1px solid ${theme.colors.border.medium};
  `,
  provenance: css`
    padding: ${theme.spacing(1, 2)};
    background: ${theme.colors.background.secondary};
    border-bottom: 1px solid ${theme.colors.border.medium};
  `,
  summaryBand: css`
    display: flex;
    flex-direction: column;
    gap: ${theme.spacing(1)};
    padding: ${theme.spacing(2)};
    border-bottom: 1px solid ${theme.colors.border.medium};
  `,
  body: css`
    display: flex;
    flex-direction: column;
    gap: ${theme.spacing(2)};
    padding: ${theme.spacing(2)};
  `,
  // A section is a direct child of .body; the CSS-only "no border on the
  // first one" rule works regardless of which optional sections rendered,
  // since removed ones simply aren't in the DOM to be :first-child.
  section: css`
    display: flex;
    flex-direction: column;
    gap: ${theme.spacing(1)};
    padding-top: ${theme.spacing(2)};
    border-top: 1px solid ${theme.colors.border.weak};

    &:first-child {
      padding-top: 0;
      border-top: none;
    }
  `,
  calloutAccent: css`
    border-left: 3px solid ${theme.colors.warning.border};
    padding-left: ${theme.spacing(1.5)};
    margin-left: -${theme.spacing(1.5)};
  `,
  mono: css`
    font-family: ${theme.typography.fontFamilyMonospace};
  `,
  actionName: css`
    color: ${theme.colors.text.primary};
    font-weight: ${theme.typography.fontWeightMedium};
  `,
  indent: css`
    border-left: 2px solid ${theme.colors.border.medium};
    padding-left: ${theme.spacing(1.5)};
  `,
  resultCard: css`
    background: ${theme.colors.background.secondary};
    border-radius: ${theme.shape.radius.default};
    border-left: 3px solid ${theme.colors.border.medium};
    padding: ${theme.spacing(1.5)};
    display: flex;
    flex-direction: column;
    gap: ${theme.spacing(1)};
  `,
  resultCardFidelity: css`
    border-left-color: ${theme.colors.info.border};
  `,
  barRow: css`
    display: grid;
    grid-template-columns: 64px 1fr 64px;
    gap: ${theme.spacing(1)};
    align-items: center;
  `,
  barLabel: css`
    font-size: ${theme.typography.bodySmall.fontSize};
    color: ${theme.colors.text.secondary};
  `,
  barTrack: css`
    height: 8px;
    background: ${theme.colors.background.secondary};
    border-radius: 2px;
    overflow: hidden;
  `,
  barFill: css`
    display: block;
    height: 100%;
  `,
  barFillRun: css`
    background: ${theme.colors.info.border};
  `,
  barFillP75: css`
    background: ${theme.colors.border.strong};
  `,
  comparisonTable: css`
    border-collapse: collapse;
    width: max-content;

    th,
    td {
      text-align: left;
      padding: ${theme.spacing(0.25, 4, 0.25, 0)};
      white-space: nowrap;
    }
  `,
});
