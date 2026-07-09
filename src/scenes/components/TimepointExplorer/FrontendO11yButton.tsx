import React from 'react';
import { GrafanaTheme2 } from '@grafana/data';
import { LinkButton, Spinner, Text, Tooltip, useStyles2 } from '@grafana/ui';
import { css } from '@emotion/css';
import { trackTimepointViewerActionClicked } from 'features/tracking/timepointExplorerEvents';

import { CheckType } from 'types';
import { getCheckType } from 'utils';
import { useLogsDS } from 'hooks/useLogsDS';
import { DocsLink } from 'components/DocsLink';
import { useTimepointExplorerContext } from 'scenes/components/TimepointExplorer/TimepointExplorer.context';
import {
  useSelectedProbeNames,
  useStatefulTimepoint,
} from 'scenes/components/TimepointExplorer/TimepointExplorer.hooks';
import { StatelessTimepoint } from 'scenes/components/TimepointExplorer/TimepointExplorer.types';
import { getCouldBePending, getPendingProbeNames } from 'scenes/components/TimepointExplorer/TimepointExplorer.utils';
import { useFaroSessionLink } from 'scenes/components/TimepointExplorer/TimepointViewerFaroSession.hooks';

const FRONTEND_OBSERVABILITY_DOCS_LINK =
  'https://grafana.com/docs/grafana-cloud/monitor-applications/frontend-observability';

export const FrontendO11yButton = ({ timepoint }: { timepoint: StatelessTimepoint }) => {
  const styles = useStyles2(getStyles);
  const { check, checkType, viewerState, rumAvailability, markRumPresent, currentAdjustedTime } =
    useTimepointExplorerContext();
  const [, viewerProbeName, viewerExecutionIndex] = viewerState;
  const logsDS = useLogsDS();
  const isBrowserCheck = getCheckType(check.settings) === CheckType.Browser;
  const statefulTimepoint = useStatefulTimepoint(timepoint);
  const selectedProbeNames = useSelectedProbeNames(statefulTimepoint);
  const couldBePending = getCouldBePending(timepoint, currentAdjustedTime);
  const pendingProbeNames = couldBePending ? getPendingProbeNames({ statefulTimepoint, selectedProbeNames }) : [];
  const isSelectedProbePending = viewerProbeName !== undefined && pendingProbeNames.includes(viewerProbeName);

  const selectedExecution =
    viewerProbeName !== undefined && viewerExecutionIndex !== undefined
      ? statefulTimepoint.probeResults?.[viewerProbeName]?.[viewerExecutionIndex]
      : undefined;
  const executionId = selectedExecution?.labels.execution_id;
  const canQueryFaro = isBrowserCheck && Boolean(executionId) && Boolean(logsDS);

  const {
    data: faroSession,
    isLoading: isFaroLoading,
    isFetching: isFaroFetching,
    isError: isFaroError,
    isSuccess: isFaroSuccess,
  } = useFaroSessionLink({
    executionId: executionId ?? '',
    from: timepoint.adjustedTime,
    to: timepoint.adjustedTime + timepoint.timepointDuration + timepoint.config.frequency,
    enabled: canQueryFaro,
    onSuccess: (session) => {
      if (session?.href) {
        markRumPresent();
      }
    },
  });

  const isFaroInFlight = canQueryFaro && (isFaroLoading || isFaroFetching);
  const showWaitingForSession =
    rumAvailability === 'present' && (isSelectedProbePending || isFaroInFlight);

  // Frontend Observability only applies to browser checks.
  if (!isBrowserCheck || isFaroError) {
    return null;
  }

  if (showWaitingForSession) {
    return (
      <div className={styles.italic}>
        <Text variant="body" color="secondary">
          Waiting for session
        </Text>
      </div>
    );
  }

  if (!executionId) {
    return null;
  }

  // Prefer a spinner over flashing empty/Add-RUM states, and over briefly
  // showing the previous execution's session while the new lookup is in flight.
  if (isFaroInFlight) {
    return <Tooltip content="Looking for Frontend Observability session..."><Spinner /></Tooltip>;
  }

  if (faroSession?.href) {
    return (
      <LinkButton
        key="frontend-observability"
        icon="frontend-observability"
        href={faroSession.href}
        onClick={() => {
          trackTimepointViewerActionClicked({
            checkType,
            action: 'view-frontend-observability-session',
          });
        }}
        variant="secondary"
        fill="outline"
      >
        View Frontend Session
      </LinkButton>
    );
  }

  // Only treat a completed successful empty lookup as "no session".
  if (!isFaroSuccess) {
    return null;
  }

  if (rumAvailability === 'present') {
    return (
      <Tooltip content="No Frontend Observability session was found for this execution.">
        <div className={styles.italic}>
          <Text variant="body" color="secondary">
            No session for this run
          </Text>
        </div>
      </Tooltip>
    );
  }

  return (
    <Tooltip content="Add Frontend Observability to your application to start monitoring frontend performance and get insights into user experience.">
      <div className={styles.italic}>
        <DocsLink
          key="frontend-observability"
          href={FRONTEND_OBSERVABILITY_DOCS_LINK}
          source="timepoint_explorer_frontend_observability"
        >
          Add RUM to your app
        </DocsLink>
      </div>
    </Tooltip>
  );
};

const getStyles = (_theme: GrafanaTheme2) => ({
  italic: css`
    font-style: italic;
  `,
});
