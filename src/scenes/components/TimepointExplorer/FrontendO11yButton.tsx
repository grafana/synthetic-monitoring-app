import React, { useMemo } from 'react';
import { LinkButton, Spinner } from '@grafana/ui';
import { trackTimepointViewerActionClicked } from 'features/tracking/timepointExplorerEvents';

import { CheckType } from 'types';
import { getCheckType } from 'utils';
import { useTimepointExplorerContext } from 'scenes/components/TimepointExplorer/TimepointExplorer.context';
import { StatelessTimepoint } from 'scenes/components/TimepointExplorer/TimepointExplorer.types';
import { useFaroSessionLink } from 'scenes/components/TimepointExplorer/TimepointViewerFaroSession.hooks';

type FaroActionStatus = 'no-session' | 'available';

interface FaroAction {
  status: FaroActionStatus;
  href?: string;
  tooltip: string;
  onClick?: () => void;
}

export const FrontendO11yButton = ({ timepoint }: { timepoint: StatelessTimepoint }) => {
  const { check, checkType, listLogsMap, viewerState } = useTimepointExplorerContext();
  const [, viewerProbeName, viewerExecutionIndex] = viewerState;
  const isBrowserCheck = getCheckType(check.settings) === CheckType.Browser;

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

  return (
    <LinkButton
      key="frontend-observability"
      icon="frontend-observability"
      href={faroAction.href}
      disabled={faroAction.status !== 'available'}
      tooltip={faroAction.tooltip}
      onClick={faroAction.onClick}
    >
      Frontend Observability
    </LinkButton>
  );
};
