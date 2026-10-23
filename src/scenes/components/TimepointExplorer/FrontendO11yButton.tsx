import React from 'react';
import { LinkButton, Spinner, Tooltip, useStyles2 } from '@grafana/ui';
import { css } from '@emotion/css';
import { trackTimepointViewerActionClicked } from 'features/tracking/timepointExplorerEvents';

import { CheckType } from 'types';
import { AddRUMLink } from 'scenes/components/TimepointExplorer/AddRUMLink';
import { useFaroRunContext } from 'scenes/components/TimepointExplorer/FrontendContext.hooks';
import { FARO_APP_PLUGIN_ID } from 'scenes/components/TimepointExplorer/TimepointExplorer.constants';
import { useTimepointExplorerContext } from 'scenes/components/TimepointExplorer/TimepointExplorer.context';
import {
  useSelectedProbeNames,
  useStatefulTimepoint,
} from 'scenes/components/TimepointExplorer/TimepointExplorer.hooks';
import { StatelessTimepoint } from 'scenes/components/TimepointExplorer/TimepointExplorer.types';
import { getCouldBePending, getPendingProbeNames } from 'scenes/components/TimepointExplorer/TimepointExplorer.utils';
import { buildFaroSessionHref } from 'scenes/components/TimepointExplorer/TimepointViewerFaroSession.utils';

export const FrontendO11yButton = ({ timepoint }: { timepoint: StatelessTimepoint }) => {
  const styles = useStyles2(() => ({
    italic: css({ fontStyle: 'italic' }),
  }));
  const { checkType, viewerState, currentAdjustedTime } = useTimepointExplorerContext();
  const [, viewerProbeName, viewerExecutionIndex] = viewerState;
  const isBrowserCheck = checkType === CheckType.Browser;
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
  const {
    data: run,
    isLoading,
    isFetched,
    isError,
  } = useFaroRunContext({
    executionId: executionId ?? '',
    executionTime: selectedExecution?.timestamp ?? 0,
    from: timepoint.adjustedTime,
    to: timepoint.adjustedTime + timepoint.timepointDuration + timepoint.config.frequency,
    enabled: isBrowserCheck && Boolean(executionId) && !isSelectedProbePending,
  });

  // Frontend Observability only applies to browser checks.
  if (!isBrowserCheck || isSelectedProbePending || !executionId || isError) {
    return null;
  }

  if (isLoading) {
    return <Spinner />;
  }

  if (!isFetched) {
    return null;
  }

  if (!run) {
    return (
      <Tooltip content="Add Frontend Observability to your application to start monitoring frontend performance and get insights into user experience.">
        <div className={styles.italic}>
          <AddRUMLink />
        </div>
      </Tooltip>
    );
  }

  return (
    <LinkButton
      icon="frontend-observability"
      href={buildFaroSessionHref({ pluginId: FARO_APP_PLUGIN_ID, appId: run.appId, sessionId: run.sessionId })}
      tooltip="View Frontend Observability session"
      onClick={() => {
        trackTimepointViewerActionClicked({
          checkType,
          action: 'view-frontend-observability-session',
        });
      }}
      variant="secondary"
      fill="outline"
    >
      View frontend session
    </LinkButton>
  );
};
