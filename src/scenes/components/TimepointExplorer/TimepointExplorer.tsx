import React, { useMemo } from 'react';
import { useTimeRange } from '@grafana/scenes-react';
import { RadioButtonGroup, Stack } from '@grafana/ui';

import { Check } from 'types';
import { AGGREGATION_OPTIONS, VIEW_OPTIONS } from 'scenes/components/TimepointExplorer/TimepointExplorer.constants';
import {
  useAggregation,
  useTimepointExplorerView,
  useTimepoints,
} from 'scenes/components/TimepointExplorer/TimepointExplorer.hooks';
import { TimepointExplorerChild } from 'scenes/components/TimepointExplorer/TimepointExplorer.types';
import { timeshiftedTimepoint } from 'scenes/components/TimepointExplorer/TimepointExplorer.utils';
import { TimepointList } from 'scenes/components/TimepointExplorer/TimepointList';
import { TimepointMinimap } from 'scenes/components/TimepointExplorer/TimepointMinimap';

interface TimepointExplorerProps {
  check: Check;
}

export function TimepointExplorer({ check }: TimepointExplorerProps) {
  const [timeRange] = useTimeRange();
  const { aggregation, changeAggregation, aggregationData, isLoading } = useAggregation(timeRange, check);
  const timeRangeTo = timeRange.to.toDate().valueOf();
  const initialTimeRangeToInView = timeshiftedTimepoint(timeRangeTo, check.frequency);

  const timepoints = useTimepoints({ timeRange, check });
  const { ref, ...rest } = useTimepointExplorerView(timepoints, initialTimeRangeToInView);
  console.log(timepoints);

  const drillProps: TimepointExplorerChild = useMemo(() => {
    return {
      ...rest,
      timepoints,
      timeRange,
      aggregation,
    };
  }, [rest, timeRange, timepoints, aggregation]);

  return (
    <div ref={ref}>
      <Stack direction="row" gap={2}>
        <RadioButtonGroup options={AGGREGATION_OPTIONS} onChange={changeAggregation} value={aggregation} />
        <RadioButtonGroup options={VIEW_OPTIONS} value={VIEW_OPTIONS[0].value} />
      </Stack>

      <Stack direction="column" gap={2}>
        <TimepointList {...drillProps} />
        <TimepointMinimap {...drillProps} />
      </Stack>
    </div>
  );
}
