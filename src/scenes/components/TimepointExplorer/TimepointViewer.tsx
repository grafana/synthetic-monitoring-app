import React, { useCallback, useRef, useState } from 'react';
import { dateTimeFormat, GrafanaTheme2 } from '@grafana/data';
import { Box, LoadingBar, Stack, Text, useStyles2 } from '@grafana/ui';
import { css } from '@emotion/css';
import { useResizeObserver } from 'usehooks-ts';

import { formatDuration } from 'utils';
import { QueryErrorBoundary } from 'components/QueryErrorBoundary';
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
  const { isInitialised, viewerState } = useTimepointExplorerContext();
  const [logsView, setLogsView] = useState<LogsView>(LOGS_VIEW_OPTIONS[0].value);
  const [viewerTimepoint, viewerProbeName] = viewerState;
  const styles = useStyles2(getStyles);

  const handleChangeLogsView = useCallback((view: LogsView) => {
    setLogsView(view);
  }, []);

  return (
    <div className={styles.container}>
      {viewerTimepoint && viewerProbeName ? (
        <div>
          <Box padding={2} gap={1} direction="column" position="relative">
            <TimepointHeader timepoint={viewerTimepoint} onChangeLogsView={handleChangeLogsView} />
            <QueryErrorBoundary key={viewerTimepoint.adjustedTime}>
              <TimepointViewerContent
                logsView={logsView}
                probeNameToView={viewerProbeName}
                timepoint={viewerTimepoint}
              />
            </QueryErrorBoundary>
          </Box>
        </div>
      ) : (
        <Stack justifyContent={'center'} alignItems={'center'} height={30} direction={'column'}>
          <Text variant="h2">{isInitialised ? 'No timepoint selected' : 'Loading...'}</Text>
          {isInitialised && <Text>Select a timepoint to view logs.</Text>}
        </Stack>
      )}
    </div>
  );
};

interface TimepointViewerContentProps {
  logsView: LogsView;
  probeNameToView: string;
  timepoint: StatelessTimepoint;
}

const TimepointViewerContent = ({ logsView, probeNameToView, timepoint }: TimepointViewerContentProps) => {
  const elRef = useRef<HTMLDivElement>(null);
  const [viewerWidth, setViewerWidth] = useState<number>(0);
  const { check, currentAdjustedTime } = useTimepointExplorerContext();
  const couldResultBePending = getCouldBePending(timepoint, currentAdjustedTime);
  const probe = useSceneVarProbes(check);
  const styles = useStyles2(getStyles);

  const { data, isFetching, isLoading, refetch } = useTimepointLogs({
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

  useResizeObserver({
    // @ts-expect-error https://github.com/juliencrn/usehooks-ts/issues/663
    ref: elRef,
    onResize: (element) => {
      setViewerWidth(element.width ?? 0);
    },
  });

  return (
    <>
      <div className={styles.loadingBarContainer} ref={elRef}>
        {isFetching && <LoadingBar width={viewerWidth} />}
      </div>

      <TimepointViewerExecutions
        isLoading={isLoading}
        logsView={logsView}
        probeExecutions={data}
        pendingProbeNames={pendingProbeNames}
        probeNameToView={probeNameToView}
        timepoint={timepoint}
      />
    </>
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
          <Text variant="h3">{dateTimeFormat(timepoint.adjustedTime)}</Text>
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

const getStyles = (theme: GrafanaTheme2) => ({
  container: css`
    border-radius: ${theme.shape.radius.default};
    border: 1px solid ${theme.colors.border.medium};
    display: flex;
    flex-direction: column;
    gap: ${theme.spacing(2)};
  `,
  loadingBarContainer: css`
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 1px;
  `,
});
