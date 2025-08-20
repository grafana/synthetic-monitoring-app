import React, { useCallback, useState } from 'react';
import { GrafanaTheme2 } from '@grafana/data';
import { Stack, Text, useStyles2 } from '@grafana/ui';
import { css } from '@emotion/css';

import { formatDuration } from 'utils';
import { useSceneVarProbes } from 'scenes/Common/useSceneVarProbes';
import { LOGS_VIEW_OPTIONS, LogsView, LogsViewSelect } from 'scenes/components/LogsRenderer/LogsViewSelect';
import { useTimepointExplorerContext } from 'scenes/components/TimepointExplorer/TimepointExplorer.context';
import { useRefetchInterval } from 'scenes/components/TimepointExplorer/TimepointExplorer.hooks';
import { StatelessTimepoint } from 'scenes/components/TimepointExplorer/TimepointExplorer.types';
import { getCouldBePending, getPendingProbes } from 'scenes/components/TimepointExplorer/TimepointExplorer.utils';
import { useTimepointLogs } from 'scenes/components/TimepointExplorer/TimepointViewer.hooks';
import { TimepointViewerActions } from 'scenes/components/TimepointExplorer/TimepointViewerActions';
import { TimepointViewerExecutions } from 'scenes/components/TimepointExplorer/TimepointViewerExecutions';

export const TimepointViewer = () => {
  const { selectedState } = useTimepointExplorerContext();
  const [selectedTimepoint] = selectedState;
  const styles = useStyles2(getStyles);

  return (
    <div className={styles.container}>
      {selectedTimepoint ? (
        <TimepointViewerContent timepoint={selectedTimepoint} />
      ) : (
        <Stack justifyContent={'center'} alignItems={'center'} height={30} direction={'column'}>
          <Text variant="h2">No timepoint selected</Text>
          <Text>Select a timepoint to view logs.</Text>
        </Stack>
      )}
    </div>
  );
};

const getStyles = (theme: GrafanaTheme2) => ({
  container: css`
    border-radius: ${theme.shape.radius.default};
    border: 1px solid ${theme.colors.border.medium};
    padding: ${theme.spacing(2)};
    display: flex;
    flex-direction: column;
    gap: ${theme.spacing(2)};
  `,
});

const TimepointViewerContent = ({ timepoint }: { timepoint: StatelessTimepoint }) => {
  const { check, currentAdjustedTime } = useTimepointExplorerContext();
  const couldResultBePending = getCouldBePending(timepoint, currentAdjustedTime);
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
      <TimepointViewerExecutions
        isLoading={isLoading}
        logsView={logsView}
        probeExecutions={data}
        pendingProbeNames={pendingProbeNames}
      />
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
        <Stack direction={`row`} gap={3}>
          <TimepointViewerActions timepoint={timepoint} />
          <LogsViewSelect onChange={onChangeLogsView} />
        </Stack>
      </Stack>
    </Stack>
  );
};
