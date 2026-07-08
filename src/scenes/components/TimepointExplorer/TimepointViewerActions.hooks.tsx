import { useCallback, useMemo } from 'react';
import { IconName } from '@grafana/data';
import { trackTimepointViewerActionClicked } from 'features/tracking/timepointExplorerEvents';

import { CheckType } from 'types';
import { getCheckType, getExploreUrl } from 'utils';
import { useLogsDS } from 'hooks/useLogsDS';
import { useMetricsDS } from 'hooks/useMetricsDS';
import { useSceneVarProbes } from 'scenes/Common/useSceneVarProbes';
import { useTimepointExplorerContext } from 'scenes/components/TimepointExplorer/TimepointExplorer.context';
import { StatelessTimepoint } from 'scenes/components/TimepointExplorer/TimepointExplorer.types';
import { getIsInTheFuture } from 'scenes/components/TimepointExplorer/TimepointExplorer.utils';
import { getProbeNameToUse } from 'scenes/components/TimepointExplorer/TimepointViewerActions.utils';
import { useFaroSessionLink } from 'scenes/components/TimepointExplorer/TimepointViewerFaroSession.hooks';

interface Action {
  icon: IconName;
  label: string;
  disabled?: boolean;
  onClick?: () => void;
  href?: string;
}

export type FaroActionStatus = 'loading' | 'no-session' | 'available';

export interface FaroAction {
  status: FaroActionStatus;
  href?: string;
  tooltip: string;
  onClick?: () => void;
}

export function useTimepointViewerActions(timepoint: StatelessTimepoint) {
  const logsDS = useLogsDS();
  const metricsDS = useMetricsDS();
  const { check, checkType, currentAdjustedTime, handleViewerStateChange, listLogsMap, viewerState, timepoints } =
    useTimepointExplorerContext();
  const [_, viewerProbeName, viewerExecutionIndex] = viewerState;
  const logsQuery = { expr: `{job="${check.job}", instance="${check.target}", probe="${viewerProbeName}"} | logfmt` };
  const metricsQuery = {
    expr: `{job="${check.job}", instance="${check.target}", probe="${viewerProbeName}"}[$__range]`,
    format: 'heatmap',
    instant: true,
  } as const;

  const futureLessTimepoints = timepoints.filter((t) => !getIsInTheFuture(t, currentAdjustedTime));
  const prevTimepoint = timepoints[timepoint.index - 1];
  const nextTimepoint = futureLessTimepoints[timepoint.index + 1];
  const probeVar = useSceneVarProbes(check);

  const exploreLogsURL = getExploreUrl(logsDS?.uid!, [logsQuery], {
    from: timepoint.adjustedTime,
    to: timepoint.adjustedTime + timepoint.timepointDuration,
  });

  const exploreMetricsURL = getExploreUrl(metricsDS?.uid!, [metricsQuery], {
    from: timepoint.adjustedTime,
    to: timepoint.adjustedTime + timepoint.timepointDuration,
  });

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

  const handlePreviousTimepoint = useCallback(() => {
    if (prevTimepoint) {
      const statefulPrevTimepoint = prevTimepoint ? listLogsMap[prevTimepoint.adjustedTime] : undefined;
      const probeName = getProbeNameToUse(probeVar, statefulPrevTimepoint);
      handleViewerStateChange([prevTimepoint, probeName, 0]);
      trackTimepointViewerActionClicked({
        checkType,
        action: 'previous-timepoint',
      });
    }
  }, [checkType, prevTimepoint, listLogsMap, probeVar, handleViewerStateChange]);

  const handleNextTimepoint = useCallback(() => {
    if (nextTimepoint) {
      const statefulNextTimepoint = nextTimepoint ? listLogsMap[nextTimepoint.adjustedTime] : undefined;
      const probeName = getProbeNameToUse(probeVar, statefulNextTimepoint);
      handleViewerStateChange([nextTimepoint, probeName, 0]);
      trackTimepointViewerActionClicked({
        checkType,
        action: 'next-timepoint',
      });
    }
  }, [checkType, nextTimepoint, listLogsMap, probeVar, handleViewerStateChange]);

  const faroAction = useMemo<FaroAction | null>(() => {
    if (!isBrowserCheck) {
      // Not a browser check — Frontend Observability doesn't apply here.
      return null;
    }

    if (!executionId) {
      // Browser check, but no execution selected yet. Keep the action visible so it
      // doesn't pop in/out of the header, just degrade it until there's something to check.
      return {
        status: 'no-session',
        tooltip: 'Select an execution to check for a Frontend Observability session',
      };
    }

    if (isFaroLoading || !isFaroFetched) {
      return {
        status: 'loading',
        tooltip: 'Checking for a Frontend Observability session…',
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
  }, [isBrowserCheck, executionId, isFaroLoading, isFaroFetched, faroSession?.href, checkType]);

  const actions = useMemo<Action[]>(() => {
    const actions: Action[] = [
      {
        icon: 'arrow-left',
        label: 'Previous timepoint',
        disabled: !prevTimepoint,
        onClick: handlePreviousTimepoint,
      },
      {
        icon: 'arrow-right',
        label: 'Next timepoint',
        disabled: !nextTimepoint,
        onClick: handleNextTimepoint,
      },
      {
        icon: 'gf-logs',
        label: 'View Logs in Explore',
        href: exploreLogsURL,
        onClick: () => {
          trackTimepointViewerActionClicked({
            checkType,
            action: 'view-explore-logs',
          });
        },
      },
      {
        icon: `gf-prometheus`,
        label: 'View Metrics in Explore',
        href: exploreMetricsURL,
        onClick: () => {
          trackTimepointViewerActionClicked({
            checkType,
            action: 'view-explore-metrics',
          });
        },
      },
    ];

    return actions;
  }, [
    checkType,
    prevTimepoint,
    nextTimepoint,
    exploreLogsURL,
    exploreMetricsURL,
    handleNextTimepoint,
    handlePreviousTimepoint,
  ]);

  return { actions, faroAction };
}
