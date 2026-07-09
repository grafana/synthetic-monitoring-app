import React, { useMemo } from 'react';
import { LinkButton, Spinner, Tooltip, useStyles2 } from '@grafana/ui';
import { css } from '@emotion/css';
import { trackTimepointViewerActionClicked } from 'features/tracking/timepointExplorerEvents';

import { CheckType } from 'types';
import { getCheckType } from 'utils';
import { useLogsDS } from 'hooks/useLogsDS';
import { DocsLink } from 'components/DocsLink';
import { useTimepointExplorerContext } from 'scenes/components/TimepointExplorer/TimepointExplorer.context';
import { useStatefulTimepoint } from 'scenes/components/TimepointExplorer/TimepointExplorer.hooks';
import { StatelessTimepoint } from 'scenes/components/TimepointExplorer/TimepointExplorer.types';
import { useFaroSessionLink } from 'scenes/components/TimepointExplorer/TimepointViewerFaroSession.hooks';

type FaroActionStatus = 'no-session' | 'available';

interface FaroAction {
  status: FaroActionStatus;
  href?: string;
  tooltip: string;
  onClick?: () => void;
}

const FRONTEND_OBSERVABILITY_DOCS_LINK =
  'https://grafana.com/docs/grafana-cloud/monitor-applications/frontend-observability';

export const FrontendO11yButton = ({ timepoint }: { timepoint: StatelessTimepoint }) => {
  const styles = useStyles2(() => ({
    italic: css({ fontStyle: 'italic' }),
    muted: css({ fontStyle: 'italic', opacity: 0.7 }),
  }));
  const { check, checkType, viewerState, rumAvailability, markRumPresent } = useTimepointExplorerContext();
  const [, viewerProbeName, viewerExecutionIndex] = viewerState;
  const logsDS = useLogsDS();
  const isBrowserCheck = getCheckType(check.settings) === CheckType.Browser;
  const statefulTimepoint = useStatefulTimepoint(timepoint);

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

  const faroAction = useMemo<FaroAction | null>(() => {
    if (!executionId) {
      return null;
    }

    if (faroSession?.href) {
      return {
        status: 'available',
        href: faroSession.href,
        tooltip: 'View Frontend Observability session',
        onClick: () => {
          trackTimepointViewerActionClicked({
            checkType,
            action: 'view-frontend-observability-session',
          });
        },
      };
    }

    return {
      status: 'no-session',
      tooltip: 'No Frontend Observability session was found for this execution',
    };
  }, [executionId, faroSession?.href, checkType]);

  // Frontend Observability only applies to browser checks.
  if (!isBrowserCheck || !faroAction || isFaroError) {
    return null;
  }

  // Prefer a spinner over flashing empty/Add-RUM states, and over briefly
  // showing the previous execution's session while the new lookup is in flight.
  if (canQueryFaro && (isFaroLoading || isFaroFetching)) {
    return <Spinner />;
  }

  if (faroAction.status === 'no-session') {
    // Only treat a completed successful empty lookup as "no session".
    if (!isFaroSuccess) {
      return null;
    }

    if (rumAvailability === 'present') {
      return (
        <Tooltip content="No Frontend Observability session was found for this execution.">
          <div className={styles.muted}>No session for this run</div>
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
  }

  return (
    <LinkButton
      key="frontend-observability"
      icon="frontend-observability"
      href={faroAction.href}
      disabled={faroAction.status !== 'available'}
      tooltip={faroAction.tooltip}
      onClick={faroAction.onClick}
      variant="secondary"
      fill="outline"
    >
      View Frontend Session
    </LinkButton>
  );
};
