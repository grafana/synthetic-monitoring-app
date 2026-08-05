import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { dateTimeFormat, GrafanaTheme2 } from '@grafana/data';
import { Badge, BadgeColor, Icon, LinkButton, Spinner, Stack, Text, TextLink, Tooltip, useStyles2 } from '@grafana/ui';
import { css } from '@emotion/css';

import { CheckType } from 'types';
import { getCheckType } from 'utils';
import { useTracesDS } from 'hooks/useTracesDS';
import { PlainButton } from 'components/PlainButton';
import { fetchTraceData } from 'scenes/components/LogsRenderer/LogLine.utils';
import { getExploreTraceUrl } from 'scenes/components/LogsRenderer/TraceLink.utils';
import { TracePanel } from 'scenes/components/LogsRenderer/TracePanel';
import {
  useAppVersionChange,
  useExceptionRealSessions,
  useFaroExecutionContext,
  useRealUserPageBaseline,
  useSimilarRealSessions,
} from 'scenes/components/TimepointExplorer/FrontendContext.hooks';
import {
  buildFaroPageHref,
  FaroExecutionContext,
  FaroHttpRequest,
  FaroPageVisit,
  formatWebVitalDelta,
  formatWebVitalValue,
  getPageComparisonVerdict,
  getRequestPath,
  rateWebVital,
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

  return <FrontendContextPanel context={context} from={timepoint.adjustedTime} to={to} />;
};

const FrontendContextPanel = ({ context, from, to }: { context: FaroExecutionContext; from: number; to: number }) => {
  const styles = useStyles2(getStyles);
  const sessionHref = buildFaroSessionHref({
    pluginId: FARO_APP_PLUGIN_ID,
    appId: context.appId,
    sessionId: context.sessionId,
  });

  return (
    <div className={styles.container}>
      <Stack direction="column" gap={2}>
        <Stack direction="row" gap={1} alignItems="center" justifyContent="space-between" wrap="wrap">
          <Stack direction="row" gap={1} alignItems="center">
            <Icon name="frontend-observability" />
            <Text variant="h5">Frontend Observability</Text>
            {context.appName && <Text color="secondary">{context.appName}</Text>}
            <Tooltip content="What your check's browser session looked like from inside your application, as recorded by the Faro SDK. Faro measures web vitals at a different point than k6 does, so these values can differ slightly from the k6-reported vitals elsewhere on this page.">
              <Icon name="info-circle" />
            </Tooltip>
          </Stack>
          <Stack direction="row" gap={1} alignItems="center">
            {context.hasSessionReplay ? (
              <LinkButton href={sessionHref} icon="play" size="sm" variant="secondary" fill="outline">
                Watch session replay
              </LinkButton>
            ) : (
              <Text color="secondary" italic variant="bodySmall">
                Session replay not available for this run
              </Text>
            )}
          </Stack>
        </Stack>

        <AppVersionLine context={context} from={from} to={to} />

        {context.exceptions.length > 0 && <ExceptionsList context={context} to={to} />}

        {context.requests.length > 0 && <NetworkRequestsList context={context} />}

        <Stack direction="column" gap={1}>
          <Text weight="medium">Pages visited</Text>
          {context.pages.map((page) => (
            <PageVisit key={page.pageId} appId={context.appId} page={page} to={to} />
          ))}
        </Stack>

        <SimilarSessions context={context} to={to} />
      </Stack>
    </div>
  );
};

const AppVersionLine = ({ context, from, to }: { context: FaroExecutionContext; from: number; to: number }) => {
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
      <Text color="secondary" variant="bodySmall">
        App version: {versionLabel} — no version change detected in the 6 hours before this run
      </Text>
    );
  }

  const minutesBeforeRun = Math.max(0, Math.round((from - versionChange.firstSeen) / 60_000));

  return (
    <Text color="warning" variant="bodySmall" weight="medium">
      App version: {versionLabel} — first seen {dateTimeFormat(versionChange.firstSeen, { format: 'HH:mm' })}
      {minutesBeforeRun > 0 && ` (${formatMinutes(minutesBeforeRun)} before this run)`} · previously{' '}
      {versionChange.previousVersion}
    </Text>
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
  const tracesDS = useTracesDS();
  const [showAll, setShowAll] = useState(false);
  // failures first, then chronological — the failing request is what you came for
  const sorted = [...context.requests].sort(
    (a, b) => Number(b.isError) - Number(a.isError) || a.timestamp - b.timestamp
  );
  const failedCount = context.requests.filter((request) => request.isError).length;
  const visible = showAll ? sorted : sorted.slice(0, COLLAPSED_REQUEST_COUNT);

  return (
    <Stack direction="column" gap={0.5}>
      <Text weight="medium">
        Network requests during this run ({context.requests.length}
        {failedCount > 0 ? ` · ${failedCount} failed` : ''})
      </Text>
      {visible.map((request, index) => (
        <RequestRow key={`${request.timestamp}-${request.url}-${index}`} request={request} tracesDS={tracesDS} />
      ))}
      {sorted.length > COLLAPSED_REQUEST_COUNT && (
        <PlainButton onClick={() => setShowAll(!showAll)}>
          <Text color="link" variant="bodySmall">
            {showAll ? 'Show fewer' : `Show all ${sorted.length} requests`}
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

const MAX_SIMILAR_SESSIONS = 3;

const SimilarSessions = ({ context, to }: { context: FaroExecutionContext; to: number }) => {
  const journeyPageIds = context.pages.map((page) => page.pageId);
  const { data: sessions } = useSimilarRealSessions({
    appId: context.appId,
    pageIds: journeyPageIds,
    to,
  });

  if (!sessions?.length) {
    return null;
  }

  return (
    <Stack direction="column" gap={0.5}>
      <Stack direction="row" gap={0.5} alignItems="center">
        <Text weight="medium">Real user sessions with a similar journey</Text>
        <Tooltip content="Real user sessions from the hour before this run that loaded the same pages as this check, ranked by how much of the check's journey they cover.">
          <Icon name="info-circle" size="sm" />
        </Tooltip>
      </Stack>
      {sessions.slice(0, MAX_SIMILAR_SESSIONS).map((session) => (
        <Stack key={session.sessionId} direction="row" gap={1} alignItems="center">
          <TextLink
            href={buildFaroSessionHref({
              pluginId: FARO_APP_PLUGIN_ID,
              appId: context.appId,
              sessionId: session.sessionId,
            })}
            inline={false}
            variant="bodySmall"
          >
            {session.sessionId}
          </TextLink>
          <Text color="secondary" variant="bodySmall">
            loaded {session.matchedPages.length} of {journeyPageIds.length} pages (
            {session.matchedPages.join(', ')}) · last seen {dateTimeFormat(session.lastSeen, { format: 'HH:mm:ss' })}
          </Text>
        </Stack>
      ))}
    </Stack>
  );
};

const PageVisit = ({ appId, page, to }: { appId: string; page: FaroPageVisit; to: number }) => {
  const styles = useStyles2(getStyles);
  const [isComparisonOpen, setIsComparisonOpen] = useState(false);
  const pageHref = buildFaroPageHref({ pluginId: FARO_APP_PLUGIN_ID, appId, pageId: page.pageId });
  const hasVitals = WEB_VITALS.some((vital) => page.vitals[vital] !== undefined);

  return (
    <div className={styles.page}>
      <Stack direction="column" gap={1}>
        <Stack direction="row" gap={2} alignItems="center" wrap="wrap">
          <TextLink href={pageHref} inline={false}>
            {page.pageId}
          </TextLink>
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
          {hasVitals && (
            <PlainButton onClick={() => setIsComparisonOpen(!isComparisonOpen)}>
              <Text color="link" variant="bodySmall">
                <Icon name={isComparisonOpen ? 'angle-up' : 'angle-down'} size="sm" /> Compare with real users
              </Text>
            </PlainButton>
          )}
        </Stack>
        {isComparisonOpen && <PageBaseline appId={appId} page={page} to={to} />}
      </Stack>
    </div>
  );
};

const PageBaseline = ({ appId, page, to }: { appId: string; page: FaroPageVisit; to: number }) => {
  const styles = useStyles2(getStyles);
  const { data: baseline, isLoading } = useRealUserPageBaseline({
    appId,
    pageId: page.pageId,
    to,
  });

  if (isLoading) {
    return <Spinner />;
  }

  if (!baseline || baseline.pageLoads === null || baseline.pageLoads === 0) {
    return (
      <Text color="secondary" italic variant="bodySmall">
        No real user traffic on {page.pageId} in the hour before this run.
      </Text>
    );
  }

  const verdict = getPageComparisonVerdict(page.vitals, baseline.vitals);

  return (
    <Stack direction="column" gap={0.5}>
      {verdict && (
        <Text color={verdict.tone} variant="bodySmall" weight="medium">
          {verdict.text}
        </Text>
      )}
      <Text color="secondary" variant="bodySmall">
        Real users on {page.pageId} in the hour before this run: {baseline.pageLoads} page{' '}
        {baseline.pageLoads === 1 ? 'load' : 'loads'}
        {baseline.exceptions !== null && `, ${baseline.exceptions} JS exceptions`}
        {baseline.httpErrors !== null && `, ${baseline.httpErrors} failed requests`}
      </Text>
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
                    <Text
                      variant="bodySmall"
                      color={runValue > baselineValue * 1.5 ? 'warning' : 'secondary'}
                    >
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
        </tbody>
      </table>
    </Stack>
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
    padding: ${theme.spacing(2)};
  `,
  page: css`
    border-left: 2px solid ${theme.colors.border.medium};
    padding-left: ${theme.spacing(1)};
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
