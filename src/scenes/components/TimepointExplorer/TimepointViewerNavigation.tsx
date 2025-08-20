import React from 'react';
import { Button, Stack } from '@grafana/ui';

import { useSceneVarProbes } from 'scenes/Common/useSceneVarProbes';
import { useTimepointExplorerContext } from 'scenes/components/TimepointExplorer/TimepointExplorer.context';
import { getProbeNameToUse } from 'scenes/components/TimepointExplorer/TimepointViewerNavigation.utils';

export const TimepointViewerNavigation = () => {
  const { check, handleSelectedStateChange, listLogsMap, selectedState, timepoints } = useTimepointExplorerContext();
  const [selectedTimepoint] = selectedState;

  const prevIndex = selectedTimepoint ? selectedTimepoint.index - 1 : undefined;
  const prevTimepoint = prevIndex ? timepoints[prevIndex] : undefined;

  const nextIndex = selectedTimepoint ? selectedTimepoint.index + 1 : undefined;
  const nextTimepoint = nextIndex ? timepoints[nextIndex] : undefined;
  const probeVar = useSceneVarProbes(check);

  return (
    <Stack direction={`row`} gap={1} justifyContent={'space-between'}>
      <Button
        disabled={!prevTimepoint}
        onClick={() => {
          if (prevTimepoint) {
            const statefulPrevTimepoint = prevTimepoint ? listLogsMap[prevTimepoint.adjustedTime] : undefined;
            const probeName = getProbeNameToUse(probeVar, statefulPrevTimepoint);
            handleSelectedStateChange([prevTimepoint, probeName, 0]);
          }
        }}
      >
        Previous timepoint
      </Button>
      <Button
        disabled={!nextTimepoint}
        onClick={() => {
          if (nextTimepoint) {
            const statefulNextTimepoint = nextTimepoint ? listLogsMap[nextTimepoint.adjustedTime] : undefined;
            const probeName = getProbeNameToUse(probeVar, statefulNextTimepoint);
            handleSelectedStateChange([nextTimepoint, probeName, 0]);
          }
        }}
      >
        Next timepoint
      </Button>
    </Stack>
  );
};
