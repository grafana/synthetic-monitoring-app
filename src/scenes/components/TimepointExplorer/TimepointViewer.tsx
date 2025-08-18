import React, { useCallback, useState } from 'react';
import { Box, Stack, Text } from '@grafana/ui';

import { formatDuration } from 'utils';
import { CenteredSpinner } from 'components/CenteredSpinner';
import { useSceneVarProbes } from 'scenes/Common/useSceneVarProbes';
import { LOGS_VIEW_OPTIONS, LogsView, LogsViewSelect } from 'scenes/components/LogsRenderer/LogsViewSelect';
import { useTimepointExplorerContext } from 'scenes/components/TimepointExplorer/TimepointExplorer.context';
import { useRefetchInterval } from 'scenes/components/TimepointExplorer/TimepointExplorer.hooks';
import { StatelessTimepoint } from 'scenes/components/TimepointExplorer/TimepointExplorer.types';
import { getPendingProbes } from 'scenes/components/TimepointExplorer/TimepointExplorer.utils';
import { useTimepointLogs } from 'scenes/components/TimepointExplorer/TimepointViewer.hooks';
import { TimepointViewerExecutions } from 'scenes/components/TimepointExplorer/TimepointViewerExecutions';

export const TimepointViewer = () => {
  const { selectedState } = useTimepointExplorerContext();
  const [selectedTimepoint] = selectedState;

  return (
    <Box borderColor={'medium'} borderStyle={'solid'} padding={2} minHeight={30}>
      {selectedTimepoint ? (
        <TimepointViewerContent timepoint={selectedTimepoint} />
      ) : (
        <Stack justifyContent={'center'} alignItems={'center'} height={30} direction={'column'}>
          <Text variant="h2">No timepoint selected</Text>
          <Text>Select a timepoint to view logs.</Text>
        </Stack>
      )}
    </Box>
  );
};

const TimepointViewerContent = ({ timepoint }: { timepoint: StatelessTimepoint }) => {
  const { check, currentAdjustedTime } = useTimepointExplorerContext();
  const lastAdjustedTime = currentAdjustedTime - check.frequency;
  const couldResultBePending = [lastAdjustedTime, currentAdjustedTime].includes(timepoint.adjustedTime);

  const [logsView, setLogsView] = useState<LogsView>(LOGS_VIEW_OPTIONS[0].value);
  const probe = useSceneVarProbes(check);

  const { data, isLoading, refetch } = useTimepointLogs({
    timepoint,
    job: check.job,
    instance: check.target,
    probe,
    staleTime: 0, // refetch to ensure we get the latest logs
  });

  const pendingProbeNames = couldResultBePending
    ? getPendingProbes({
        entryProbeNames: data.filter((d) => d.executions.length).map((d) => d.probeName),
        selectedProbeNames: probe,
      })
    : [];

  const enableRefetch = !!pendingProbeNames.length;

  useRefetchInterval(enableRefetch, refetch);

  const onChangeLogsView = useCallback((view: LogsView) => {
    setLogsView(view);
  }, []);

  return (
    <Stack direction={`column`} gap={1}>
      <TimepointHeader timepoint={timepoint} onChangeLogsView={onChangeLogsView} />
      {isLoading ? (
        <CenteredSpinner />
      ) : (
        <TimepointViewerExecutions logsView={logsView} data={data} pendingProbeNames={pendingProbeNames} />
      )}
    </Stack>
  );
};

const TimepointHeader = ({
  timepoint,
  onChangeLogsView,
}: {
  timepoint: StatelessTimepoint;
  onChangeLogsView: (view: LogsView) => void;
}) => {
  return (
    <Stack direction={`column`} gap={1}>
      <Stack direction={`row`} gap={1} justifyContent={'space-between'} alignItems={'center'}>
        <Stack direction={`column`} gap={1}>
          <Text variant="h3">{new Date(timepoint?.adjustedTime).toLocaleString()}</Text>
          <Stack direction={`row`} gap={1}>
            <Text color={'secondary'}>
              <strong>Configured frequency:</strong> {formatDuration(timepoint.config.frequency)}
            </Text>
          </Stack>
        </Stack>
        <LogsViewSelect onChange={onChangeLogsView} />
      </Stack>
    </Stack>
  );
};
