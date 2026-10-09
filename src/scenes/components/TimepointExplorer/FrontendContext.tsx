import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { dateTimeFormat, GrafanaTheme2 } from '@grafana/data';
import {
  Badge,
  Button,
  ClipboardButton,
  EmptyState,
  Icon,
  Spinner,
  Stack,
  Text,
  TextLink,
  Tooltip,
  useStyles2,
  useTheme2,
} from '@grafana/ui';
import { css, cx } from '@emotion/css';

import { CheckType } from 'types';
import { getCheckType } from 'utils';
import { useTracesDS } from 'hooks/useTracesDS';
import { Feedback } from 'components/Feedback';
import { fetchTraceData } from 'scenes/components/LogsRenderer/LogLine.utils';
import { getExploreTraceUrl } from 'scenes/components/LogsRenderer/TraceLink.utils';
import { TracePanel } from 'scenes/components/LogsRenderer/TracePanel';
import {
  BUILD_LOOKBACK_MS,
  FailureImpact,
  REAL_USER_WINDOW_MS,
  useFailureImpact,
  useFaroRunContext,
  useJourneySessions,
  useRealUserBuildLoads,
  useRunBuildHistory,
  useSourceMapUploads,
} from 'scenes/components/TimepointExplorer/FrontendContext.hooks';
import {
  AppBuild,
  BuildActivity,
  buildFaroAppHref,
  buildFaroErrorHref,
  BuildInsight,
  BuildStart,
  FailureSignature,
  FaroRunContext,
  formatBuild,
  formatDurationMs,
  formatRelativeDuration,
  formatShare,
  getBuildCommit,
  getBuildInsight,
  getBuildKey,
  getBuildSegments,
  getErrorSignature,
  getJourneySteps,
  getRequestPath,
  getRequestSignature,
  hasBuildIdentity,
  RealUserComparison,
  RunError,
  RunFailedRequest,
} from 'scenes/components/TimepointExplorer/FrontendContext.utils';
import { FARO_APP_PLUGIN_ID } from 'scenes/components/TimepointExplorer/TimepointExplorer.constants';
import { useTimepointExplorerContext } from 'scenes/components/TimepointExplorer/TimepointExplorer.context';
import { useStatefulTimepoint } from 'scenes/components/TimepointExplorer/TimepointExplorer.hooks';
import { StatelessTimepoint } from 'scenes/components/TimepointExplorer/TimepointExplorer.types';

const REAL_USERS_DEFINITION =
  "Real users are Frontend Observability sessions that weren't created by k6, so this check and any load tests are left out.";

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
  const timepointEnd = timepoint.adjustedTime + timepoint.timepointDuration;
  // Faro records can arrive after the timepoint closes, so look a little past it.
  const sessionSearchTo = timepointEnd + timepoint.config.frequency;

  const { data: run, isLoading } = useFaroRunContext({
    executionId: executionId ?? '',
    from: timepoint.adjustedTime,
    to: sessionSearchTo,
    enabled: isBrowserCheck && Boolean(executionId),
  });

  if (!isBrowserCheck) {
    return null;
  }

  if (!executionId || !selectedExecution) {
    return <EmptyState hideImage variant="not-found" message="No browser execution is selected for this timepoint." />;
  }

  if (isLoading) {
    return <Spinner size={24} />;
  }

  if (!run) {
    return (
      <EmptyState
        hideImage
        variant="not-found"
        message="Frontend Observability has no session for this execution, so it can't be compared with real users."
      />
    );
  }

  // The execution's final log line is stamped when the run ended. Date
  // "before this run" from when it started (the page loads then), and end the
  // real-user windows when it finished.
  const runEnd = selectedExecution.timestamp;
  const durationMs = Number(selectedExecution.labels.duration_seconds) * 1000;
  const runStart = Number.isFinite(durationMs) && durationMs > 0 ? runEnd - durationMs : runEnd;

  return (
    <RealUserContextPanel
      key={executionId}
      run={run}
      runTime={runStart}
      to={runEnd}
      probeSuccess={selectedExecution.labels.probe_success === '1'}
    />
  );
};

interface PanelProps {
  run: FaroRunContext;
  runTime: number;
  to: number;
  probeSuccess: boolean;
}

const RealUserContextPanel = ({ run, runTime, to, probeSuccess }: PanelProps) => {
  const styles = useStyles2(getStyles);
  const appName = run.appName || 'Frontend Observability app';

  // The viewer header's "View frontend session" button already links this
  // run's session, so the panel only links the app it compares against. The
  // "Real user context" tab names the surrounding tab panel, so the panel has
  // no heading of its own.
  return (
    <div className={styles.panel}>
      <header className={styles.header}>
        <Stack direction="row" gap={1} alignItems="center" wrap="wrap">
          <Text color="secondary" variant="bodySmall">
            From{' '}
            <TextLink
              href={buildFaroAppHref({ pluginId: FARO_APP_PLUGIN_ID, appId: run.appId })}
              external
              inline
              variant="bodySmall"
              aria-label={`Open ${appName} in Frontend Observability`}
            >
              {appName}
            </TextLink>
            {run.appEnvironment && ` · ${run.appEnvironment}`}
          </Text>
          <Tooltip content={REAL_USERS_DEFINITION}>
            <Icon name="info-circle" size="sm" tabIndex={0} aria-label="What counts as a real user" />
          </Tooltip>
        </Stack>
        <Feedback feature="real-user-context" about={{ text: 'Experimental' }} />
      </header>

      <div className={styles.facts}>
        <FactRow label="App build" detail="last 24 h">
          <BuildFact run={run} runTime={runTime} to={to} />
        </FactRow>
        <FactRow label="What failed in the browser" detail="real users, last hour">
          <FailuresFact run={run} to={to} probeSuccess={probeSuccess} />
        </FactRow>
        <FactRow label="Real users on these pages" detail="last hour">
          <JourneyFact run={run} to={to} />
        </FactRow>
      </div>
    </div>
  );
};

const FactRow = ({ label, detail, children }: { label: string; detail: string; children: React.ReactNode }) => {
  const styles = useStyles2(getStyles);

  return (
    <div className={styles.factRow}>
      <div className={styles.factLabel}>
        <Text element="h5" variant="bodySmall" weight="medium">
          {label}
        </Text>
        <Text color="secondary" variant="bodySmall">
          {detail}
        </Text>
      </div>
      <div className={styles.factBody}>{children}</div>
    </div>
  );
};

const Unavailable = ({ children }: { children: NonNullable<React.ReactNode> }) => (
  <Text color="secondary" italic variant="bodySmall">
    {children}
  </Text>
);

// ---------------------------------------------------------------------------
// App build
// ---------------------------------------------------------------------------

function formatClockTime(time: number, reference: number): string {
  const sameDay =
    dateTimeFormat(time, { format: 'YYYY-MM-DD' }) === dateTimeFormat(reference, { format: 'YYYY-MM-DD' });

  return dateTimeFormat(time, { format: sameDay ? 'HH:mm' : 'MMM D, HH:mm' });
}

// A deploy this close to the run is worth leading with.
const RECENT_BUILD_MS = 2 * 60 * 60 * 1000;
// Below this, "most real users" is a handful of page loads, not a pattern.
const MIN_REAL_USER_LOADS = 20;

const NEW_BUILD_TOOLTIP =
  "A new build means a new deploy, not necessarily a change to this app's code: some pipelines rebuild every app on every merge.";

type RealUsers = NonNullable<BuildInsight['realUsers']>;

// Only the comparisons that point at a problem get a badge; a build that is
// still rolling out right after its deploy is expected.
const COMPARISON_BADGES: Partial<Record<RealUserComparison, string>> = {
  newer: 'Most users on an older build',
  older: 'Older than most users get',
  different: 'Not the build most users get',
};

const BuildFact = ({ run, runTime, to }: { run: FaroRunContext; runTime: number; to: number }) => {
  const { data: history, isLoading: isHistoryLoading } = useRunBuildHistory({ appId: run.appId, to });
  const { data: realUserLoads, isLoading: isLoadsLoading } = useRealUserBuildLoads({ appId: run.appId, to });
  const { uploads } = useSourceMapUploads({ appId: run.appId, bundleIds: [run.build.bundleId] });

  if (!hasBuildIdentity(run.build)) {
    return (
      <Unavailable>
        This app doesn&apos;t report a version or bundle id to Faro, so builds can&apos;t be compared. Set{' '}
        <code>app.version</code> in the Faro SDK, or add the Faro bundler plugin.
      </Unavailable>
    );
  }

  const insight = getBuildInsight({
    runBuild: run.build,
    runTime,
    activity: history?.activity ?? [],
    // only used when there is history to date the build from
    stepMs: history?.stepMs ?? 0,
    realUserLoads: realUserLoads ?? [],
    realUserWindowFrom: to - REAL_USER_WINDOW_MS,
    uploads,
  });
  const { start } = insight;
  const isRecent = start !== undefined && runTime - start.from <= RECENT_BUILD_MS;
  const realUsers = insight.realUsers && insight.realUsers.loads >= MIN_REAL_USER_LOADS ? insight.realUsers : undefined;
  const comparisonBadge = realUsers ? COMPARISON_BADGES[realUsers.comparison] : undefined;

  return (
    <Stack direction="column" gap={1}>
      <Stack direction="row" gap={1} alignItems="center" wrap="wrap">
        <BuildName build={run.build} />
        {start && <Badge text="New build" color="orange" icon="rocket" tooltip={NEW_BUILD_TOOLTIP} />}
        {comparisonBadge && <Badge text={comparisonBadge} color="orange" icon="exclamation-triangle" />}
      </Stack>

      {isHistoryLoading ? (
        <Spinner size="sm" />
      ) : history === null ? (
        <Unavailable>Couldn&apos;t load build history.</Unavailable>
      ) : start ? (
        <BuildStartText start={start} previous={insight.previous} runTime={runTime} isRecent={isRecent} />
      ) : (
        <Text color="secondary" variant="bodySmall">
          Already serving at the start of the 24 h before this run.
          {insight.uploadedAt !== undefined &&
            ` Its source maps were uploaded ${formatClockTime(insight.uploadedAt, runTime)}.`}
        </Text>
      )}

      {isLoadsLoading ? null : realUsers ? (
        <RealUserBuildText realUsers={realUsers} />
      ) : (
        <Text variant="bodySmall" color="secondary">
          Not enough real-user page loads in the last hour to compare builds.
        </Text>
      )}

      {history && history.activity.length > 1 && (
        <BuildStrip
          activity={history.activity}
          from={history.from}
          to={history.to}
          stepMs={history.stepMs}
          runBuild={run.build}
          runTime={runTime}
        />
      )}
    </Stack>
  );
};

/** The build's short name, with its full identifiers on hover. */
const BuildName = ({ build }: { build: AppBuild }) => {
  const styles = useStyles2(getStyles);
  const commit = getBuildCommit(build);
  const details = [
    build.version && `Version: ${build.version}`,
    build.bundleId && `Bundle ID: ${build.bundleId}`,
    commit?.source === 'git-hash' && `Git commit: ${commit.sha}`,
    commit?.source === 'bundle-id' &&
      'The bundle ID has the shape of a git commit SHA, so it is probably the build commit.',
  ].filter((line): line is string => Boolean(line));

  return (
    <Stack direction="row" gap={0.5} alignItems="center">
      <Tooltip
        content={
          <div>
            {details.map((line) => (
              <div key={line}>{line}</div>
            ))}
          </div>
        }
      >
        {/* focusable so keyboard users can reach the tooltip */}
        <span className={styles.buildName} tabIndex={0}>
          {formatBuild(build)}
        </span>
      </Tooltip>
      {commit?.source === 'git-hash' && commit.sha !== build.bundleId && (
        <Text variant="bodySmall" color="secondary">
          commit {commit.sha.slice(0, 7)}
        </Text>
      )}
      {commit && (
        <ClipboardButton
          icon="copy"
          size="sm"
          variant="secondary"
          fill="text"
          getText={() => commit.sha}
          tooltip={commit.source === 'git-hash' ? 'Copy commit SHA' : 'Copy bundle ID'}
          aria-label={commit.source === 'git-hash' ? 'Copy commit SHA' : 'Copy bundle ID'}
        />
      )}
    </Stack>
  );
};

const BuildStartText = ({
  start,
  previous,
  runTime,
  isRecent,
}: {
  start: BuildStart;
  previous?: AppBuild;
  runTime: number;
  isRecent: boolean;
}) => {
  const replacing = previous ? `, replacing ${formatBuild(previous)}` : '';

  return (
    <Stack direction="row" gap={0.5} alignItems="center" wrap="wrap">
      <Text variant="body" color={isRecent ? 'warning' : undefined} weight={isRecent ? 'medium' : undefined}>
        {start.source === 'source-maps'
          ? `Deployed at ${formatClockTime(start.from, runTime)}, ${formatRelativeDuration(
              runTime - start.from
            )} before this run${replacing}.`
          : `First served between ${formatClockTime(start.from, runTime)} and ${formatClockTime(
              start.to,
              runTime
            )}, at most ${formatRelativeDuration(runTime - start.from)} before this run${replacing}.`}
      </Text>
      <Tooltip
        content={
          start.source === 'source-maps'
            ? "Dated by when this build's source maps were uploaded to Frontend Observability."
            : "From Faro page loads, counted in 15-minute buckets. Upload the build's source maps at deploy time to get an exact time."
        }
      >
        <Icon name="info-circle" size="sm" tabIndex={0} aria-label="Where this time comes from" />
      </Tooltip>
    </Stack>
  );
};

const RealUserBuildText = ({ realUsers }: { realUsers: RealUsers }) => {
  const share = formatShare(realUsers.runBuildShare);
  const dominantShare = formatShare(realUsers.dominant.share);
  const dominant = formatBuild(realUsers.dominant.build);

  switch (realUsers.comparison) {
    case 'same':
      return (
        <Text variant="bodySmall" color="secondary">
          {share} of real-user page loads in the last hour were on this build.
        </Text>
      );
    case 'rolling-out':
      return (
        <Text variant="bodySmall" color="secondary">
          {share} of real-user page loads in the last hour were on this build and {dominantShare} on {dominant}.
          That&apos;s expected right after a deploy.
        </Text>
      );
    case 'newer':
      return (
        <Text variant="bodySmall" color="warning">
          Only {share} of real-user page loads in the last hour were on this build; {dominantShare} were on the older{' '}
          {dominant}. Is this a partial rollout or a canary?
        </Text>
      );
    case 'older':
      return (
        <Text variant="bodySmall" color="warning">
          {dominantShare} of real-user page loads in the last hour were on the newer {dominant}; only {share} on this
          one. A stale cache, CDN or instance may have served this check.
        </Text>
      );
    case 'different':
      return (
        <Text variant="bodySmall" color="warning">
          Only {share} of real-user page loads in the last hour were on this build; {dominantShare} were on {dominant}.
        </Text>
      );
  }
};

const BUILD_COLORS = ['blue', 'purple', 'orange', 'yellow', 'green'];

const BuildStrip = ({
  activity,
  from,
  to,
  stepMs,
  runBuild,
  runTime,
}: {
  activity: BuildActivity[];
  from: number;
  to: number;
  stepMs: number;
  runBuild: AppBuild;
  runTime: number;
}) => {
  const styles = useStyles2(getStyles);
  const theme = useTheme2();
  const colorFor = (key: string | null) => {
    if (key === null) {
      return theme.colors.background.secondary;
    }

    const index = activity.findIndex((entry) => entry.key === key);

    return theme.visualization.getColorByName(BUILD_COLORS[index % BUILD_COLORS.length]);
  };
  const segments = getBuildSegments(activity, from, to, stepMs);
  const span = to - from;
  const runOffset = Math.min(100, Math.max(0, ((runTime - from) / span) * 100));
  const runKey = getBuildKey(runBuild);
  const summary = activity
    .map((entry) => `${formatBuild(entry.build)} from ${formatClockTime(entry.firstSeen, runTime)}`)
    .join(', ');

  return (
    <div className={styles.strip}>
      <div
        className={styles.stripTrack}
        role="img"
        aria-label={`Builds serving in the 24 hours before this run: ${summary}`}
      >
        {segments.map((segment) => (
          <div
            key={segment.from}
            className={styles.stripSegment}
            style={{ width: `${((segment.to - segment.from) / span) * 100}%`, background: colorFor(segment.key) }}
          />
        ))}
        <div className={styles.stripRunMarker} style={{ left: `${runOffset}%` }} />
      </div>
      <div className={styles.stripAxis}>
        <Text color="secondary" variant="bodySmall">
          {formatRelativeDuration(BUILD_LOOKBACK_MS)} before
        </Text>
        <Text color="secondary" variant="bodySmall">
          this run
        </Text>
      </div>
      <Stack direction="row" gap={2} wrap="wrap">
        {activity.map((entry) => (
          <Stack key={entry.key} direction="row" gap={0.5} alignItems="center">
            <span className={styles.swatch} style={{ background: colorFor(entry.key) }} />
            <Text variant="bodySmall" weight={entry.key === runKey ? 'medium' : undefined}>
              {formatBuild(entry.build)}
              {entry.key === runKey ? ' (this run)' : ''}
            </Text>
          </Stack>
        ))}
      </Stack>
    </div>
  );
};

// ---------------------------------------------------------------------------
// What failed in the browser
// ---------------------------------------------------------------------------

const COLLAPSED_FAILURE_COUNT = 3;

type FailureItem = { kind: 'error'; error: RunError } | { kind: 'request'; request: RunFailedRequest };

const FailuresFact = ({ run, to, probeSuccess }: { run: FaroRunContext; to: number; probeSuccess: boolean }) => {
  const [showAll, setShowAll] = useState(false);
  const items: FailureItem[] = [
    ...run.errors.map((error) => ({ kind: 'error' as const, error })),
    ...run.failedRequests.map((request) => ({ kind: 'request' as const, request })),
  ];

  if (!items.length) {
    return probeSuccess ? (
      <Text color="secondary" variant="bodySmall">
        No JS errors or failed requests during this run.
      </Text>
    ) : (
      <Text variant="bodySmall">
        The browser reported no JS errors or failed requests during this run, so this failure isn&apos;t visible in
        real-user monitoring. It&apos;s more likely the script&apos;s expectations than the app. To see what the page
        showed, open the replay with <strong>View frontend session</strong>.
      </Text>
    );
  }

  const visible = showAll ? items : items.slice(0, COLLAPSED_FAILURE_COUNT);

  return (
    <Stack direction="column" gap={1.5}>
      {visible.map((item) =>
        item.kind === 'error' ? (
          <ErrorRow key={item.error.key} appId={run.appId} error={item.error} to={to} />
        ) : (
          <RequestRow key={item.request.key} appId={run.appId} request={item.request} to={to} />
        )
      )}
      {items.length > COLLAPSED_FAILURE_COUNT && (
        <div>
          <Button size="sm" variant="secondary" fill="text" onClick={() => setShowAll(!showAll)}>
            {showAll ? 'Show fewer' : `Show ${items.length - COLLAPSED_FAILURE_COUNT} more`}
          </Button>
        </div>
      )}
    </Stack>
  );
};

function getWhereText({ pageId, actionName, count }: { pageId: string; actionName?: string; count: number }) {
  return [
    pageId ? `on ${pageId}` : undefined,
    actionName ? `during ${actionName}` : undefined,
    count > 1 ? `${count}× in this run` : undefined,
  ]
    .filter(Boolean)
    .join(' · ');
}

const ErrorRow = ({ appId, error, to }: { appId: string; error: RunError; to: number }) => {
  const styles = useStyles2(getStyles);
  const signature = getErrorSignature(error);

  return (
    <div className={styles.failureRow}>
      <Icon name="times-circle" className={styles.failureIcon} />
      <div className={styles.failureMain}>
        <Tooltip content={error.message}>
          <span className={styles.failureMessage} tabIndex={0}>
            {error.template ?? error.message}
          </span>
        </Tooltip>
        <Text color="secondary" variant="bodySmall">
          {[error.type, getWhereText(error)].filter(Boolean).join(' · ')}
        </Text>
      </div>
      <FailureImpactCell appId={appId} signature={signature} to={to} />
      <div className={styles.failureLinks}>
        {error.hash && (
          <TextLink
            href={buildFaroErrorHref({
              pluginId: FARO_APP_PLUGIN_ID,
              appId,
              hash: error.hash,
              from: to - REAL_USER_WINDOW_MS,
              to,
            })}
            external
            variant="bodySmall"
          >
            Error details
          </TextLink>
        )}
      </div>
    </div>
  );
};

const RequestRow = ({ appId, request, to }: { appId: string; request: RunFailedRequest; to: number }) => {
  const styles = useStyles2(getStyles);
  const tracesDS = useTracesDS();
  const [isTraceOpen, setIsTraceOpen] = useState(false);
  const signature = getRequestSignature(request);
  const status = request.statusCode === 0 ? 'no response' : request.statusCode;

  return (
    <Stack direction="column" gap={1}>
      <div className={styles.failureRow}>
        <Icon name="times-circle" className={styles.failureIcon} />
        <div className={styles.failureMain}>
          <Tooltip content={request.url}>
            <span className={cx(styles.failureMessage, styles.mono)} tabIndex={0}>
              {request.method} {getRequestPath(request.urlTemplate ?? request.url)} → {status}
            </span>
          </Tooltip>
          <Text color="secondary" variant="bodySmall">
            {[
              'Failed request',
              request.durationMs !== undefined ? formatDurationMs(request.durationMs) : undefined,
              getWhereText(request),
            ]
              .filter(Boolean)
              .join(' · ')}
          </Text>
        </div>
        <FailureImpactCell appId={appId} signature={signature} to={to} />
        <div className={styles.failureLinks}>
          {tracesDS && request.traceId && (
            <Button
              size="sm"
              variant="secondary"
              fill="text"
              onClick={() => setIsTraceOpen(!isTraceOpen)}
              aria-expanded={isTraceOpen}
            >
              {isTraceOpen ? 'Hide trace' : 'Trace'}
            </Button>
          )}
        </div>
      </div>
      {isTraceOpen && tracesDS && request.traceId && (
        <RequestTrace
          traceId={request.traceId}
          timestamp={request.timestamp}
          tracesDS={tracesDS}
          onClose={() => setIsTraceOpen(false)}
        />
      )}
    </Stack>
  );
};

const FailureImpactCell = ({ appId, signature, to }: { appId: string; signature: FailureSignature; to: number }) => {
  const styles = useStyles2(getStyles);
  const { data: impact, isLoading } = useFailureImpact({ appId, signature, to });

  if (isLoading) {
    return (
      <div className={styles.failureImpact}>
        <Spinner size="sm" />
      </div>
    );
  }

  if (!impact) {
    return (
      <div className={styles.failureImpact}>
        <Unavailable>Couldn&apos;t check real users</Unavailable>
      </div>
    );
  }

  if (impact.sessions === 0) {
    return (
      <div className={styles.failureImpact}>
        <Text color="secondary" variant="bodySmall">
          No real-user sessions
        </Text>
        <Text color="secondary" variant="bodySmall">
          likely specific to this run
        </Text>
      </div>
    );
  }

  return (
    <div className={styles.failureImpact}>
      <Stack direction="row" gap={1} alignItems="center">
        <Text color="error" weight="medium">
          {impact.sessions.toLocaleString()} {impact.sessions === 1 ? 'session' : 'sessions'}
        </Text>
        <Sparkline impact={impact} />
      </Stack>
      <Text color="secondary" variant="bodySmall">
        {impact.trend.firstSeen !== undefined
          ? `started ${formatClockTime(impact.trend.firstSeen, to)}`
          : 'ongoing for 24 h or more'}
      </Text>
    </div>
  );
};

const Sparkline = ({ impact }: { impact: FailureImpact }) => {
  const styles = useStyles2(getStyles);
  const max = Math.max(1, ...impact.trend.buckets);

  return (
    <div className={styles.sparkline} aria-hidden>
      {impact.trend.buckets.map((value, index) => (
        <span
          key={index}
          className={cx(styles.sparkBar, value === 0 && styles.sparkBarEmpty)}
          style={{ height: value === 0 ? undefined : `${Math.max(12, (value / max) * 100)}%` }}
        />
      ))}
    </div>
  );
};

const RequestTrace = ({
  traceId,
  timestamp,
  tracesDS,
  onClose,
}: {
  traceId: string;
  timestamp: number;
  tracesDS: NonNullable<ReturnType<typeof useTracesDS>>;
  onClose: () => void;
}) => {
  const { data: traceData, isLoading } = useQuery({
    // eslint-disable-next-line @tanstack/query/exhaustive-deps -- tracesDS.uid is a stable identifier
    queryKey: ['faro-request-trace', traceId, tracesDS.uid],
    queryFn: () => fetchTraceData(traceId, tracesDS),
    staleTime: Infinity,
    retry: false,
  });

  if (isLoading) {
    return <Spinner />;
  }

  if (!traceData || traceData.series.length === 0) {
    return (
      <Text color="secondary" italic variant="bodySmall">
        No trace found for this request. The backend may not have sampled it.{' '}
        <TextLink href={getExploreTraceUrl(tracesDS.uid, traceId)} inline={false} variant="bodySmall">
          Try in Explore
        </TextLink>
      </Text>
    );
  }

  return (
    <TracePanel
      traceId={traceId}
      tracesDS={tracesDS}
      traceData={traceData}
      logTimestamp={timestamp}
      arrowOffset={null}
      onClose={onClose}
    />
  );
};

// ---------------------------------------------------------------------------
// Real users on these pages
// ---------------------------------------------------------------------------

const JourneyFact = ({ run, to }: { run: FaroRunContext; to: number }) => {
  const styles = useStyles2(getStyles);
  const { data, isLoading } = useJourneySessions({ appId: run.appId, pageIds: run.pages, to });

  if (!run.pages.length) {
    return <Unavailable>This run didn&apos;t report any pages.</Unavailable>;
  }

  if (isLoading) {
    return <Spinner size="sm" />;
  }

  if (!data) {
    return <Unavailable>Couldn&apos;t load real-user sessions.</Unavailable>;
  }

  const steps = getJourneySteps({ run, ...data });
  const maxSessions = Math.max(0, ...steps.map((step) => step.sessions));

  if (maxSessions === 0) {
    return (
      <Text color="secondary" variant="bodySmall">
        No real-user sessions on these pages in the hour before this run.
      </Text>
    );
  }

  return (
    <div className={styles.journey} role="table" aria-label="Real-user sessions on the pages this run visited">
      {steps.map((step) => {
        const errorShare = step.sessions ? step.errorSessions / step.sessions : 0;

        return (
          <div key={step.pageId} className={styles.journeyRow} role="row">
            <span className={cx(styles.mono, styles.journeyPage)} role="rowheader" title={step.pageId}>
              {step.pageId}
            </span>
            <div className={styles.journeyBarTrack} role="cell" aria-hidden>
              <div className={styles.journeyBar} style={{ width: `${(step.sessions / maxSessions) * 100}%` }}>
                <div className={styles.journeyBarErrors} style={{ width: `${errorShare * 100}%` }} />
              </div>
            </div>
            <Text variant="bodySmall" role="cell">
              {step.sessions.toLocaleString()} {step.sessions === 1 ? 'session' : 'sessions'}
            </Text>
            <Text variant="bodySmall" role="cell" color={step.errorSessions ? 'error' : 'secondary'}>
              {step.sessions ? `${formatShare(errorShare)} with JS errors` : '–'}
            </Text>
            <span role="cell">
              {step.runFailedHere ? (
                <Text variant="bodySmall" color="error">
                  this run failed here
                </Text>
              ) : step.runEndedHere ? (
                <Text variant="bodySmall" color="secondary">
                  this run ended here
                </Text>
              ) : null}
            </span>
          </div>
        );
      })}
    </div>
  );
};

// ---------------------------------------------------------------------------

const PANEL_CONTAINER = 'real-user-context';

const getStyles = (theme: GrafanaTheme2) => {
  const narrow = `@container ${PANEL_CONTAINER} (max-width: ${theme.breakpoints.values.md}px)`;

  return {
    panel: css({
      containerName: PANEL_CONTAINER,
      containerType: 'inline-size',
      marginBottom: theme.spacing(2),
    }),
    header: css({
      alignItems: 'center',
      display: 'flex',
      flexWrap: 'wrap',
      gap: theme.spacing(1),
      justifyContent: 'space-between',
      paddingBottom: theme.spacing(2),
    }),
    facts: css({
      display: 'flex',
      flexDirection: 'column',
      gap: theme.spacing(2),
    }),
    factRow: css({
      display: 'grid',
      gap: theme.spacing(1, 3),
      gridTemplateColumns: '180px minmax(0, 1fr)',

      [narrow]: {
        gridTemplateColumns: 'minmax(0, 1fr)',
      },
    }),
    factLabel: css({
      display: 'flex',
      flexDirection: 'column',
      gap: theme.spacing(0.25),
    }),
    factBody: css({
      minWidth: 0,
    }),
    mono: css({
      fontFamily: theme.typography.fontFamilyMonospace,
    }),
    buildName: css({
      fontFamily: theme.typography.fontFamilyMonospace,
      fontSize: theme.typography.h5.fontSize,
      fontWeight: theme.typography.fontWeightMedium,
    }),
    strip: css({
      display: 'flex',
      flexDirection: 'column',
      gap: theme.spacing(0.5),
      marginTop: theme.spacing(0.5),
      maxWidth: 640,
    }),
    stripTrack: css({
      borderRadius: theme.shape.radius.default,
      display: 'flex',
      height: theme.spacing(1),
      overflow: 'visible',
      position: 'relative',
    }),
    stripSegment: css({
      height: '100%',
      '&:first-child': {
        borderBottomLeftRadius: theme.shape.radius.default,
        borderTopLeftRadius: theme.shape.radius.default,
      },
    }),
    stripRunMarker: css({
      background: theme.colors.text.primary,
      bottom: `-${theme.spacing(0.5)}`,
      position: 'absolute',
      top: `-${theme.spacing(0.5)}`,
      transform: 'translateX(-1px)',
      width: 2,
    }),
    stripAxis: css({
      display: 'flex',
      justifyContent: 'space-between',
    }),
    swatch: css({
      borderRadius: theme.shape.radius.default,
      display: 'inline-block',
      height: theme.spacing(1),
      width: theme.spacing(1.5),
    }),
    failureRow: css({
      alignItems: 'start',
      display: 'grid',
      gap: theme.spacing(0.5, 2),
      gridTemplateColumns: 'auto minmax(0, 1fr) 200px 96px',

      [narrow]: {
        gridTemplateColumns: 'auto minmax(0, 1fr)',
      },
    }),
    failureIcon: css({
      color: theme.colors.error.text,
      marginTop: 2,
    }),
    failureMain: css({
      display: 'flex',
      flexDirection: 'column',
      gap: theme.spacing(0.25),
      minWidth: 0,
    }),
    failureMessage: css({
      display: '-webkit-box',
      overflow: 'hidden',
      WebkitBoxOrient: 'vertical',
      WebkitLineClamp: 2,
      wordBreak: 'break-word',
    }),
    failureImpact: css({
      display: 'flex',
      flexDirection: 'column',
      gap: theme.spacing(0.25),

      [narrow]: {
        gridColumn: 2,
      },
    }),
    failureLinks: css({
      display: 'flex',
      justifyContent: 'flex-end',

      [narrow]: {
        gridColumn: 2,
        justifyContent: 'flex-start',
      },
    }),
    sparkline: css({
      alignItems: 'flex-end',
      display: 'flex',
      gap: 1,
      height: theme.spacing(2),
      width: 72,
    }),
    sparkBar: css({
      background: theme.colors.error.main,
      flex: 1,
      minWidth: 1,
    }),
    sparkBarEmpty: css({
      background: theme.colors.border.weak,
      height: 1,
    }),
    journey: css({
      alignItems: 'center',
      display: 'grid',
      gap: theme.spacing(1, 2),
      gridTemplateColumns: 'minmax(80px, max-content) minmax(80px, 240px) max-content max-content 1fr',

      [narrow]: {
        gridTemplateColumns: 'minmax(80px, max-content) minmax(60px, 1fr) max-content',
      },
    }),
    journeyRow: css({
      display: 'contents',
    }),
    journeyPage: css({
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      whiteSpace: 'nowrap',
    }),
    journeyBarTrack: css({
      background: theme.colors.background.secondary,
      borderRadius: theme.shape.radius.default,
      height: theme.spacing(1),
      overflow: 'hidden',
    }),
    journeyBar: css({
      background: theme.colors.border.strong,
      height: '100%',
    }),
    journeyBarErrors: css({
      background: theme.colors.error.main,
      height: '100%',
    }),
  };
};
