import { useCallback, useMemo } from 'react';
import { IconName } from '@grafana/data';
import { trackTimepointViewerActionClicked } from 'features/tracking/timepointExplorerEvents';

import { getExploreUrl } from 'utils';
import { useLogsDS } from 'hooks/useLogsDS';
import { useMetricsDS } from 'hooks/useMetricsDS';
import { useSceneVarProbes } from 'scenes/Common/useSceneVarProbes';
import { useTimepointExplorerContext } from 'scenes/components/TimepointExplorer/TimepointExplorer.context';
import { StatelessTimepoint } from 'scenes/components/TimepointExplorer/TimepointExplorer.types';
import { getIsInTheFuture } from 'scenes/components/TimepointExplorer/TimepointExplorer.utils';
import { getProbeNameToUse } from 'scenes/components/TimepointExplorer/TimepointViewerActions.utils';

interface Action {
  icon: IconName;
  label: string;
  disabled?: boolean;
  onClick?: () => void;
  href?: string;
}

export function useTimepointViewerActions(timepoint: StatelessTimepoint) {
  const logsDS = useLogsDS();
  const metricsDS = useMetricsDS();
  const { check, currentAdjustedTime, handleViewerStateChange, listLogsMap, viewerState, timepoints } =
    useTimepointExplorerContext();
  const [_, viewerProbeName] = viewerState;
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

  const handlePreviousTimepoint = useCallback(() => {
    if (prevTimepoint) {
      const statefulPrevTimepoint = prevTimepoint ? listLogsMap[prevTimepoint.adjustedTime] : undefined;
      const probeName = getProbeNameToUse(probeVar, statefulPrevTimepoint);
      handleViewerStateChange([prevTimepoint, probeName, 0]);
      trackTimepointViewerActionClicked({
        action: 'previous-timepoint',
      });
    }
  }, [prevTimepoint, listLogsMap, probeVar, handleViewerStateChange]);

  const handleNextTimepoint = useCallback(() => {
    if (nextTimepoint) {
      const statefulNextTimepoint = nextTimepoint ? listLogsMap[nextTimepoint.adjustedTime] : undefined;
      const probeName = getProbeNameToUse(probeVar, statefulNextTimepoint);
      handleViewerStateChange([nextTimepoint, probeName, 0]);
      trackTimepointViewerActionClicked({
        action: 'next-timepoint',
      });
    }
  }, [nextTimepoint, listLogsMap, probeVar, handleViewerStateChange]);

  return useMemo<Action[]>(
    () => [
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
        icon: 'compass',
        label: 'View Logs in Explore',
        href: exploreLogsURL,
        onClick: () => {
          trackTimepointViewerActionClicked({
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
            action: 'view-explore-metrics',
          });
        },
      },
    ],
    [prevTimepoint, nextTimepoint, exploreLogsURL, exploreMetricsURL, handleNextTimepoint, handlePreviousTimepoint]
  );
}
