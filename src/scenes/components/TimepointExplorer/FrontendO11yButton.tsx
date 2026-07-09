import React, { useMemo } from 'react';
import { LinkButton, Spinner, Tooltip, useStyles2 } from '@grafana/ui';
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
  const { check, checkType, viewerState, currentAdjustedTime } = useTimepointExplorerContext();
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
    isFetched: isFaroFetched,
  } = useFaroSessionLink({
    executionId: executionId ?? '',
    from: timepoint.adjustedTime,
    to: timepoint.adjustedTime + timepoint.timepointDuration + timepoint.config.frequency,
    enabled: canQueryFaro,
  });

  const faroAction = useMemo<FaroAction | null>(() => {
    if (!selectedExecution?.labels.execution_id) {
      return null;
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
  }, [selectedExecution, faroSession?.href, checkType]);

  // Frontend Observability only applies to browser checks.
  if (
    !isBrowserCheck ||
    isSelectedProbePending ||
    !faroAction ||
    (faroAction.status === 'no-session' && !isFaroFetched)
  ) {
    return null;
  }

  if (canQueryFaro && (isFaroLoading || !isFaroFetched)) {
    return <Spinner />;
  }

  if (faroAction.status === 'no-session') {
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
