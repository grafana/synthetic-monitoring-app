import React from 'react';
import { GrafanaTheme2 } from '@grafana/data';
import { Alert, Box, Icon, IconName, Spinner, Stack, Tab, TabContent, TabsBar, useStyles2 } from '@grafana/ui';
import { css } from '@emotion/css';

import { ExecutionLogs, ProbeExecutionLogs, UnknownExecutionLog } from 'features/parseCheckLogs/checkLogs.types';
import { LokiFieldNames } from 'features/parseLokiLogs/parseLokiLogs.types';
import { LogsRenderer } from 'scenes/components/LogsRenderer/LogsRenderer';
import { LogsView } from 'scenes/components/LogsRenderer/LogsViewSelect';
import { CheckResultMissing } from 'scenes/components/TimepointExplorer/CheckResultMissing';
import { ProbeResultMissing } from 'scenes/components/TimepointExplorer/ProbeResultMissing';
import { ProbeResultPending } from 'scenes/components/TimepointExplorer/ProbeResultPending';
import { useTimepointExplorerContext } from 'scenes/components/TimepointExplorer/TimepointExplorer.context';
import { useTimepointVizOptions } from 'scenes/components/TimepointExplorer/TimepointExplorer.hooks';
import {
  HoveredState,
  StatelessTimepoint,
  TimepointStatus,
} from 'scenes/components/TimepointExplorer/TimepointExplorer.types';
import { useTimepointViewerExecutions } from 'scenes/components/TimepointExplorer/TimepointViewerExecutions.hooks';

interface TimepointViewerExecutionsProps {
  isLoading: boolean;
  logsView: LogsView;
  pendingProbeNames: string[];
  probeExecutions: ProbeExecutionLogs[];
  probeNameToView?: string;
  timepoint: StatelessTimepoint;
}

export const TimepointViewerExecutions = ({
  isLoading,
  logsView,
  pendingProbeNames,
  probeExecutions = [],
  probeNameToView,
  timepoint,
}: TimepointViewerExecutionsProps) => {
  const { handleHoverStateChange, handleViewerStateChange } = useTimepointExplorerContext();
  const tabsToRender = useTimepointViewerExecutions({
    isLoading,
    pendingProbeNames,
    probeExecutions,
    timepoint,
  });

  return (
    <>
      <TabsBar>
        {tabsToRender.map(({ probeName, status, executions }) => {
          const active = probeNameToView === probeName;
          const hoveredState: HoveredState = timepoint ? [timepoint, probeName, 0] : [];
          const label = executions.length > 1 ? `${probeName} (${executions.length})` : probeName;

          return (
            <ProbeNameTab
              key={probeName}
              handleChangeTab={() => {
                if (!active && timepoint) {
                  handleViewerStateChange([timepoint, probeName, 0]);
                }
              }}
              active={active}
              handleMouseEnter={() => handleHoverStateChange(hoveredState)}
              handleMouseLeave={() => handleHoverStateChange([])}
              status={status}
              probeName={label}
            />
          );
        })}
      </TabsBar>
      <TabContent>
        <Box paddingY={2}>
          {tabsToRender.map(({ probeName, executions, status }) => {
            const active = probeNameToView === probeName;

            if (!active) {
              return null;
            }

            if (isLoading) {
              return (
                <Box key={probeName} minHeight={30} alignItems={'center'} justifyContent={'center'} display={'flex'}>
                  <Spinner size={32} />
                </Box>
              );
            }

            if (status === 'pending') {
              return <ProbeResultPending key={probeName} probeName={probeName} timepoint={timepoint} />;
            }

            if (status === 'missing') {
              return <ProbeResultMissing key={probeName} probeName={probeName} timepoint={timepoint} />;
            }

            if (executions.length > 1) {
              return <MultipleExecutions key={probeName} executions={executions} logsView={logsView} />;
            }

            return (
              <Stack direction="column" gap={8} key={probeName}>
                {executions.map((execution) => {
                  return (
                    <LogsRenderer<UnknownExecutionLog>
                      key={execution[0][LokiFieldNames.ID]}
                      logs={execution}
                      logsView={logsView}
                      mainKey="msg"
                    />
                  );
                })}
              </Stack>
            );
          })}
          {!tabsToRender.length && timepoint && <CheckResultMissing />}
        </Box>
      </TabContent>
    </>
  );
};

interface ProbeNameTabProps {
  active: boolean;
  probeName: string;
  handleChangeTab?: () => void;
  handleMouseEnter?: () => void;
  handleMouseLeave?: () => void;
  status: TimepointStatus;
}

const ProbeNameTab = ({
  active,
  probeName,
  handleChangeTab,
  handleMouseEnter,
  handleMouseLeave,
  status,
}: ProbeNameTabProps) => {
  return (
    <Tab
      key={probeName}
      // @ts-expect-error - it accepts components despite its type
      label={
        <div onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}>
          <Stack direction="row" alignItems="center">
            <div>{probeName}</div>
            <ProbeNameIcon status={status} />
          </Stack>
        </div>
      }
      active={active}
      onChangeTab={handleChangeTab}
    />
  );
};

const ICON_MAP: Record<TimepointStatus, IconName> = {
  pending: 'fa fa-spinner',
  success: 'check',
  failure: 'times',
  missing: 'question-circle',
};

const ProbeNameIcon = ({ status }: { status: TimepointStatus }) => {
  const vizOption = useTimepointVizOptions(status);

  return <Icon name={ICON_MAP[status]} color={vizOption.statusColor} />;
};

const MultipleExecutions = ({ executions, logsView }: { executions: ExecutionLogs[]; logsView: LogsView }) => {
  const styles = useStyles2(getStyles);
  const success = useTimepointVizOptions('success');
  const failure = useTimepointVizOptions('failure');

  return (
    <Stack direction="column" gap={2}>
      <Alert title="Multiple executions" severity="info">
        {/* TODO: Add a list of reasons why this happened */}
        <div>This timepoint had multiple executions for this probe.</div>
      </Alert>
      <Stack direction="column" gap={4}>
        {executions.map((execution, index) => {
          const { probe_success } = execution[0].labels;
          const id = execution[0][LokiFieldNames.ID];

          return (
            <>
              <div className={styles.multipleExecutions} key={id}>
                <Stack direction="column" gap={2} alignItems="center">
                  <div className={styles.executionIndex}>{index + 1}</div>
                  <Icon
                    name={probe_success === '1' ? 'check' : 'times'}
                    color={`${probe_success === '1' ? success.statusColor : failure.statusColor}`}
                  />
                </Stack>
                <LogsRenderer<UnknownExecutionLog> logs={execution} logsView={logsView} mainKey="msg" />
              </div>
              {index !== executions.length - 1 && <div className={styles.divider} />}
            </>
          );
        })}
      </Stack>
    </Stack>
  );
};

const getStyles = (theme: GrafanaTheme2) => {
  return {
    multipleExecutions: css`
      display: grid;
      grid-template-columns: 50px 1fr;
      gap: ${theme.spacing(2)};
    `,
    executionIndex: css`
      font-size: ${theme.typography.bodySmall.fontSize};
      color: ${theme.colors.text.secondary};
      border: 1px solid ${theme.colors.border.medium};
      border-radius: 50%;
      width: 24px;
      height: 24px;
      display: flex;
      align-items: center;
      justify-content: center;
      margin-left: auto;
      margin-right: auto;
    `,
    divider: css`
      border-bottom: 2px solid ${theme.colors.warning.border};
    `,
  };
};
