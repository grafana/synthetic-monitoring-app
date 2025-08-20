import { useCallback, useMemo } from 'react';
import { IconName } from '@grafana/data';

import { getExploreUrl } from 'data/utils';
import { useLogsDS } from 'hooks/useLogsDS';
import { useSceneVarProbes } from 'scenes/Common/useSceneVarProbes';
import { useTimepointExplorerContext } from 'scenes/components/TimepointExplorer/TimepointExplorer.context';
import { StatelessTimepoint } from 'scenes/components/TimepointExplorer/TimepointExplorer.types';
import { getProbeNameToUse } from 'scenes/components/TimepointExplorer/TimepointViewerNavigation.utils';

interface Action {
  icon: IconName;
  label: string;
  disabled?: boolean;
  onClick?: () => void;
  href?: string;
}

export function useTimepointViewerActions(timepoint: StatelessTimepoint) {
  const logsDS = useLogsDS();
  const { check, handleSelectedStateChange, listLogsMap, selectedState, timepoints } = useTimepointExplorerContext();
  const [_, probeName] = selectedState;
  const query = `{job="${check.job}", instance="${check.target}", probe="${probeName}"} | logfmt`;

  const prevTimepoint = timepoints[timepoint.index - 1];
  const nextTimepoint = timepoints[timepoint.index + 1];
  const probeVar = useSceneVarProbes(check);

  const exploreURL = getExploreUrl(logsDS?.uid!, [query], {
    from: timepoint.adjustedTime,
    to: timepoint.adjustedTime + timepoint.timepointDuration,
  });

  const handlePreviousTimepoint = useCallback(() => {
    if (prevTimepoint) {
      const statefulPrevTimepoint = prevTimepoint ? listLogsMap[prevTimepoint.adjustedTime] : undefined;
      const probeName = getProbeNameToUse(probeVar, statefulPrevTimepoint);
      handleSelectedStateChange([prevTimepoint, probeName, 0]);
    }
  }, [prevTimepoint, listLogsMap, probeVar, handleSelectedStateChange]);

  const handleNextTimepoint = useCallback(() => {
    if (nextTimepoint) {
      const statefulNextTimepoint = nextTimepoint ? listLogsMap[nextTimepoint.adjustedTime] : undefined;
      const probeName = getProbeNameToUse(probeVar, statefulNextTimepoint);
      handleSelectedStateChange([nextTimepoint, probeName, 0]);
    }
  }, [nextTimepoint, listLogsMap, probeVar, handleSelectedStateChange]);

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
        label: 'View in Explore',
        href: exploreURL,
      },
    ],
    [prevTimepoint, nextTimepoint, exploreURL, handleNextTimepoint, handlePreviousTimepoint]
  );
}
