import React, { useCallback, useEffect, useState } from 'react';
import { Box, Stack, Text } from '@grafana/ui';

import { Check } from 'types';
import { formatDuration } from 'utils';
import { useProbes } from 'data/useProbes';
import { CenteredSpinner } from 'components/CenteredSpinner';
import { useSceneVarProbes } from 'scenes/Common/useSceneVarProbes';
import { LOGS_VIEW_OPTIONS, LogsView, LogsViewSelect } from 'scenes/components/LogsRenderer/LogsViewSelect';
import { useTimepointExplorerContext } from 'scenes/components/TimepointExplorer/TimepointExplorer.context';
import { useStatefulTimepoint } from 'scenes/components/TimepointExplorer/TimepointExplorer.hooks';
import { StatelessTimepoint } from 'scenes/components/TimepointExplorer/TimepointExplorer.types';
import { getPendingProbes } from 'scenes/components/TimepointExplorer/TimepointExplorer.utils';
import { useTimepointLogs } from 'scenes/components/TimepointExplorer/TimepointViewer.hooks';
import { TimepointViewerExecutions } from 'scenes/components/TimepointExplorer/TimepointViewerExecutions';

export const TimepointViewer = () => {
  const { check, selectedTimepoint } = useTimepointExplorerContext();
  const [timepoint] = selectedTimepoint;

  return (
    <Box borderColor={'medium'} borderStyle={'solid'} padding={2} minHeight={30}>
      {timepoint ? (
        <TimepointViewerContent timepoint={timepoint} check={check} />
      ) : (
        <Stack justifyContent={'center'} alignItems={'center'} height={30} direction={'column'}>
          <Text variant="h2">No timepoint selected</Text>
          <Text>Select a timepoint to view logs.</Text>
        </Stack>
      )}
    </Box>
  );
};

const TimepointViewerContent = ({ timepoint, check }: { timepoint: StatelessTimepoint; check: Check }) => {
  const [logsView, setLogsView] = useState<LogsView>(LOGS_VIEW_OPTIONS[0].value);
  const probe = useSceneVarProbes(check);
  const statefulTimepoint = useStatefulTimepoint(timepoint);
  const { data: probes = [] } = useProbes();

  const { data, isLoading, refetch } = useTimepointLogs({
    timepoint,
    job: check.job,
    instance: check.target,
    probe,
  });

  const pendingExecutions = getPendingProbes({
    entryProbeNames: statefulTimepoint.executions.map((e) => e.probe),
    selectedProbeNames: probe,
    probes,
  });

  useEffect(() => {
    let timeout: NodeJS.Timeout | null = null;

    if (pendingExecutions.length) {
      timeout = setTimeout(() => {
        refetch();
      }, 3000);
    } else {
      if (timeout) {
        clearTimeout(timeout);
      }
    }

    return () => {
      if (timeout) {
        clearTimeout(timeout);
      }
    };
  }, [refetch, pendingExecutions]);

  const onChangeLogsView = useCallback((view: LogsView) => {
    setLogsView(view);
  }, []);

  return (
    <Stack direction={`column`} gap={1}>
      <TimepointHeader timepoint={timepoint} onChangeLogsView={onChangeLogsView} />
      {isLoading ? (
        <CenteredSpinner />
      ) : (
        <TimepointViewerExecutions
          check={check}
          logsView={logsView}
          data={data}
          pendingExecutions={pendingExecutions}
        />
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
          <Text variant="h3">{new Date(timepoint.adjustedTime).toLocaleString()}</Text>
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
