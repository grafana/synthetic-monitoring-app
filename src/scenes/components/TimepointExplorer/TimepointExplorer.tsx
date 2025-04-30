import React, { useMemo } from 'react';
import { useTimeRange } from '@grafana/scenes-react';
import { RadioButtonGroup, Stack } from '@grafana/ui';

import { Check } from 'types';
import { VIEW_OPTIONS } from 'scenes/components/TimepointExplorer/TimepointExplorer.constants';
import {
  useMaxProbeDuration,
  useTimepointExplorerView,
  useTimepoints,
} from 'scenes/components/TimepointExplorer/TimepointExplorer.hooks';
import { TimepointExplorerChild, UnixTimestamp } from 'scenes/components/TimepointExplorer/TimepointExplorer.types';
import { timeshiftedTimepoint } from 'scenes/components/TimepointExplorer/TimepointExplorer.utils';
import { TimepointList } from 'scenes/components/TimepointExplorer/TimepointList';
import { TimepointMinimap } from 'scenes/components/TimepointExplorer/TimepointMinimap';

interface TimepointExplorerProps {
  check: Check;
}

export function TimepointExplorer({ check }: TimepointExplorerProps) {
  const [timeRange] = useTimeRange();
  const { data: maxProbeDurationData, isLoading: maxProbeDurationIsLoading } = useMaxProbeDuration(timeRange, check);

  const timeRangeTo: UnixTimestamp = timeRange.to.toDate().valueOf();
  const initialTimeRangeToInView = timeshiftedTimepoint(timeRangeTo, check.frequency);

  const timepoints = useTimepoints({ timeRange, check });
  const { ref, ...rest } = useTimepointExplorerView(timepoints, initialTimeRangeToInView);
  // console.log(timepoints);

  const drillProps: TimepointExplorerChild = useMemo(() => {
    return {
      ...rest,
      timepoints,
      timeRange,
      maxProbeDurationData,
      isLoading: maxProbeDurationIsLoading,
    };
  }, [rest, timeRange, timepoints, maxProbeDurationData, maxProbeDurationIsLoading]);

  return (
    <div ref={ref}>
      <Stack direction="row" gap={2}>
        <RadioButtonGroup options={VIEW_OPTIONS} value={VIEW_OPTIONS[0].value} />
      </Stack>

      <Stack direction="column" gap={2}>
        <TimepointList {...drillProps} />
        <TimepointMinimap {...drillProps} />
      </Stack>
    </div>
  );
}
