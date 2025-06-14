import React, { useCallback, useState } from 'react';
import { Box, Stack, Text } from '@grafana/ui';

import { Check } from 'types';
import { formatDuration } from 'utils';
import { CenteredSpinner } from 'components/CenteredSpinner';
import { LOGS_VIEW_OPTIONS, LogsView, LogsViewSelect } from 'scenes/components/LogsRenderer/LogsViewSelect';
import {
  SelectedTimepoint,
  Timepoint,
  TimepointExplorerChild,
} from 'scenes/components/TimepointExplorer/TimepointExplorer.types';
import { useTimepointLogs } from 'scenes/components/TimepointExplorer/TimepointViewer.hooks';
import { TimepointViewerProbes } from 'scenes/components/TimepointExplorer/TimepointViewerProbes';

export const TimepointViewer = ({ handleTimepointSelection, selectedTimepoint, check }: TimepointExplorerChild) => {
  const [timepoint] = selectedTimepoint;

  return (
    <Box borderColor={'medium'} borderStyle={'solid'} padding={2} minHeight={30}>
      {timepoint ? (
        <TimepointViewerContent
          handleTimepointSelection={handleTimepointSelection}
          selectedTimepoint={selectedTimepoint}
          check={check}
        />
      ) : (
        <Stack justifyContent={'center'} alignItems={'center'} height={30} direction={'column'}>
          <Text variant="h2">No timepoint selected</Text>
          <Text>Select a timepoint to view logs.</Text>
        </Stack>
      )}
    </Box>
  );
};

const TimepointViewerContent = ({
  handleTimepointSelection,
  selectedTimepoint,
  check,
}: {
  handleTimepointSelection: (timepoint: Timepoint, probeToView: string) => void;
  selectedTimepoint: SelectedTimepoint;
  check: Check;
}) => {
  const [logsView, setLogsView] = useState<LogsView>(LOGS_VIEW_OPTIONS[0].value);
  const [timepoint] = selectedTimepoint;
  const { data, isLoading } = useTimepointLogs(timepoint, check.job, check.target);

  const onChangeLogsView = useCallback((view: LogsView) => {
    setLogsView(view);
  }, []);

  return (
    <Stack direction={`column`} gap={1}>
      <TimepointHeader timepoint={timepoint} onChangeLogsView={onChangeLogsView} />
      {isLoading ? (
        <CenteredSpinner />
      ) : (
        <TimepointViewerProbes
          handleTimepointSelection={handleTimepointSelection}
          selectedTimepoint={selectedTimepoint}
          timepointData={data}
          logsView={logsView}
        />
      )}
    </Stack>
  );
};

const TimepointHeader = ({
  timepoint,
  onChangeLogsView,
}: {
  timepoint: Timepoint;
  onChangeLogsView: (view: LogsView) => void;
}) => {
  return (
    <Stack direction={`column`} gap={1}>
      <Stack direction={`row`} gap={1} justifyContent={'space-between'} alignItems={'center'}>
        <Stack direction={`column`} gap={1}>
          <Text variant="h3">{new Date(timepoint.adjustedTime).toLocaleString()}</Text>
          <Stack direction={`row`} gap={1}>
            <Text color={'secondary'}>
              <strong>Configured frequency:</strong> {formatDuration(timepoint.frequency)}
            </Text>
          </Stack>
        </Stack>
        <LogsViewSelect onChange={onChangeLogsView} />
      </Stack>
    </Stack>
  );
};
