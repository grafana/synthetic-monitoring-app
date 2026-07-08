import React, { useMemo } from 'react';
import { LinkButton, Spinner, Tooltip, useStyles2 } from '@grafana/ui';
import { css } from '@emotion/css';
import { trackTimepointViewerActionClicked } from 'features/tracking/timepointExplorerEvents';

import { CheckType } from 'types';
import { getCheckType } from 'utils';
import { DocsLink } from 'components/DocsLink';
import { useTimepointExplorerContext } from 'scenes/components/TimepointExplorer/TimepointExplorer.context';
import { useSelectedProbeNames } from 'scenes/components/TimepointExplorer/TimepointExplorer.hooks';
import { StatelessTimepoint } from 'scenes/components/TimepointExplorer/TimepointExplorer.types';
import { getCouldBePending, getPendingProbeNames } from 'scenes/components/TimepointExplorer/TimepointExplorer.utils';
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
  }));
  const { check, checkType, listLogsMap, viewerState, currentAdjustedTime } = useTimepointExplorerContext();
  const [, viewerProbeName, viewerExecutionIndex] = viewerState;
  const isBrowserCheck = getCheckType(check.settings) === CheckType.Browser;
  const statefulTimepoint = listLogsMap[timepoint.adjustedTime];
  const selectedProbeNames = useSelectedProbeNames(statefulTimepoint);
  const couldBePending = getCouldBePending(timepoint, currentAdjustedTime);
  const pendingProbeNames = couldBePending
    ? getPendingProbeNames({ statefulTimepoint, selectedProbeNames })
    : [];
  const isSelectedProbePending =
    viewerProbeName !== undefined && pendingProbeNames.includes(viewerProbeName);

  const selectedExecution =
    viewerProbeName !== undefined && viewerExecutionIndex !== undefined
      ? listLogsMap[timepoint.adjustedTime]?.probeResults?.[viewerProbeName]?.[viewerExecutionIndex]
      : undefined;
  const executionId = selectedExecution?.labels.execution_id;

  const {
    data: faroSession,
    isLoading: isFaroLoading,
    isFetched: isFaroFetched,
  } = useFaroSessionLink({
    executionId: executionId ?? '',
    from: timepoint.adjustedTime,
    to: timepoint.adjustedTime + timepoint.timepointDuration + timepoint.config.frequency,
    enabled: isBrowserCheck && Boolean(executionId),
  });

  const faroAction = useMemo<FaroAction>(() => {
    // Browser check, but no execution selected yet. Keep the action visible so it
    // doesn't pop in/out of the header, just degrade it until there's something to check.
    if (!executionId) {
      return {
        status: 'no-session',
        tooltip: 'Select an execution to check for a Frontend Observability session',
      };
    }

    if (!faroSession?.href) {
      return {
        status: 'no-session',
        tooltip: 'No Frontend Observability session was found for this execution',
      };
    }

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
  }, [executionId, faroSession?.href, checkType]);

  // Frontend Observability only applies to browser checks.
  if (!isBrowserCheck) {
    return null;
  }

  if (executionId && (isFaroLoading || !isFaroFetched)) {
    return <Spinner />;
  }

  if (faroAction.status === 'no-session') {
    if (isSelectedProbePending) {
      return null;
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
