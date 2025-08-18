import React from 'react';
import { GrafanaTheme2 } from '@grafana/data';
import { Alert, Icon, IconName, Stack, Tab, TabContent, TabsBar, useStyles2 } from '@grafana/ui';
import { css } from '@emotion/css';

import { ExecutionLogs, ProbeExecutionLogs, UnknownExecutionLog } from 'features/parseCheckLogs/checkLogs.types';
import { LokiFieldNames } from 'features/parseLogs/parseLogs.types';
import { Check } from 'types';
import { LogsRenderer } from 'scenes/components/LogsRenderer/LogsRenderer';
import { LogsView } from 'scenes/components/LogsRenderer/LogsViewSelect';
import { useTimepointExplorerContext } from 'scenes/components/TimepointExplorer/TimepointExplorer.context';
import { useTimepointVizOptions } from 'scenes/components/TimepointExplorer/TimepointExplorer.hooks';
import {
  SelectedState,
  StatelessTimepoint,
  TimepointStatus,
} from 'scenes/components/TimepointExplorer/TimepointExplorer.types';
import { useTimepointViewerExecutions } from 'scenes/components/TimepointExplorer/TimepointViewerExecutions.hooks';

interface TimepointViewerExecutionsProps {
  data: ProbeExecutionLogs[];
  logsView: LogsView;
  pendingProbeNames: string[];
}

export const TimepointViewerExecutions = ({ data, logsView, pendingProbeNames }: TimepointViewerExecutionsProps) => {
  const { check, handleHoverStateChange, handleSelectedStateChange, selectedState } = useTimepointExplorerContext();
  const [timepoint, probeNameToView] = selectedState;
  const tabsToRender = useTimepointViewerExecutions(data, pendingProbeNames, timepoint);

  return (
    <>
      <TabsBar>
        {tabsToRender.map(({ probeName, status }) => {
          const active = probeNameToView === probeName;
          const hoveredState: SelectedState = timepoint ? [timepoint, probeName, 0] : [null, null, null];

          return (
            <ProbeNameTab
              key={probeName}
              handleChangeTab={() => {
                if (!active && timepoint) {
                  handleSelectedStateChange([timepoint, probeName, 0]);
                }
              }}
              active={active}
              handleMouseEnter={() => handleHoverStateChange(hoveredState)}
              handleMouseLeave={() => handleHoverStateChange([null, null, null])}
              status={status}
              probeName={probeName}
            />
          );
        })}
      </TabsBar>
      <TabContent>
        {tabsToRender.map(({ probeName, executions, status }) => {
          const active = probeNameToView === probeName;

          if (!active) {
            return null;
          }

          if (status === 'pending') {
            return <div key={probeName}>Results will be here soon!</div>;
          }

          if (status === 'missing') {
            return <div key={probeName}>This probe didn&apos;t run for this timepoint.</div>;
          }

          if (executions.length > 1) {
            return (
              <MultipleExecutions
                key={probeName}
                executions={executions}
                check={check}
                logsView={logsView}
                timepoint={timepoint}
              />
            );
          }

          return (
            <Stack direction="column" gap={8} key={probeName}>
              {executions.map((execution) => {
                return (
                  <LogsRenderer<UnknownExecutionLog>
                    check={check}
                    key={execution[0][LokiFieldNames.ID]}
                    logs={execution}
                    logsView={logsView}
                    mainKey="msg"
                    startTime={timepoint.adjustedTime}
                    endTime={timepoint.adjustedTime + timepoint.timepointDuration * 2}
                  />
                );
              })}
            </Stack>
          );
        })}
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

const MultipleExecutions = ({
  executions,
  check,
  logsView,
  timepoint,
}: {
  executions: ExecutionLogs[];
  check: Check;
  logsView: LogsView;
  timepoint: StatelessTimepoint;
}) => {
  const styles = useStyles2(getStyles);

  return (
    <Stack direction="column" gap={4}>
      <Alert title="Multiple executions" severity="info">
        {/* TODO: Add a list of reasons why this happened */}
        <div>This timepoint had multiple executions for this probe.</div>
      </Alert>
      <Stack direction="column" gap={4}>
        {executions.map((execution, index) => {
          return (
            <>
              <div className={styles.multipleExecutions} key={execution[0][LokiFieldNames.ID]}>
                <div className={styles.executionIndex}>{index + 1}</div>
                <LogsRenderer<UnknownExecutionLog>
                  check={check}
                  logs={execution}
                  logsView={logsView}
                  mainKey="msg"
                  startTime={timepoint.adjustedTime}
                  endTime={timepoint.adjustedTime + timepoint.timepointDuration * 2}
                />
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
