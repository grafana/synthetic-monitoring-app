import React from 'react';
import { Icon, IconName, Stack, Tab, TabContent, TabsBar } from '@grafana/ui';

import { ParsedExecutionLog, PerExecutionLogs } from 'features/parseCheckLogs/checkLogs.types';
import { LokiFieldNames } from 'features/parseLogs/parseLogs.types';
import { Check } from 'types';
import { LogsRenderer } from 'scenes/components/LogsRenderer/LogsRenderer';
import { LogsView } from 'scenes/components/LogsRenderer/LogsViewSelect';
import { useTimepointExplorerContext } from 'scenes/components/TimepointExplorer/TimepointExplorer.context';
import { getExecutionIdFromLogs } from 'scenes/components/TimepointExplorer/TimepointViewer.utils';
import { useTimepointViewerExecutions } from 'scenes/components/TimepointExplorer/TimepointViewerExecutions.hooks';

interface TimepointViewerExecutionsProps {
  check: Check;
  data: PerExecutionLogs[];
  logsView: LogsView;
  pendingExecutions: string[];
}

export const TimepointViewerExecutions = ({
  check,
  data,
  logsView,
  pendingExecutions,
}: TimepointViewerExecutionsProps) => {
  const { handleExecutionHover, handleSelectedTimepointChange, selectedTimepoint } = useTimepointExplorerContext();
  const [timepoint, executionToView] = selectedTimepoint;
  const tabsToRender = useTimepointViewerExecutions(data, pendingExecutions);

  return (
    <>
      <TabsBar>
        {tabsToRender.map(({ probeName, executions, status }) => {
          if (!executions.length) {
            return <ProbeNameTab active={false} key={probeName} probeName={probeName} status={status} />;
          }

          return executions.map((execution) => {
            const id = getExecutionIdFromLogs(execution);
            const active = id === executionToView;
            const probeStatus = execution[0]?.[LokiFieldNames.Labels]?.probe_success;
            const executionStatus = probeStatus === '1' ? 'success' : 'failure';

            return (
              <ProbeNameTab
                key={probeName}
                handleChangeTab={() => {
                  if (!active && timepoint) {
                    handleSelectedTimepointChange(timepoint, id);
                  }
                }}
                active={active}
                handleMouseEnter={() => handleExecutionHover(id)}
                handleMouseLeave={() => handleExecutionHover(null)}
                status={executionStatus}
                probeName={probeName}
              />
            );
          });
        })}
      </TabsBar>
      <TabContent>
        {tabsToRender.map(({ probeName, executions, status }) => {
          return executions.map((execution) => {
            const id = getExecutionIdFromLogs(execution);
            const active = id === executionToView;

            if (!active && status === 'pending') {
              return <div key={id}>Pending</div>;
            }

            if (!active) {
              return null;
            }

            return (
              <LogsRenderer<ParsedExecutionLog>
                check={check}
                key={probeName}
                logs={execution}
                logsView={logsView}
                mainKey="msg"
                selectedTimepoint={selectedTimepoint}
              />
            );
          });
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
  status: Status;
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
          <Stack direction="row">
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

type Status = 'pending' | 'success' | 'failure' | 'unknown';

const ICON_MAP: Record<Status, IconName> = {
  pending: 'fa fa-spinner',
  success: 'check',
  failure: 'times',
  unknown: 'question-circle',
};

const COLOR_MAP: Record<Status, string> = {
  pending: 'blue',
  success: 'green',
  failure: 'red',
  unknown: 'gray',
};

const ProbeNameIcon = ({ status }: { status: Status }) => {
  return <Icon name={ICON_MAP[status]} color={COLOR_MAP[status]} />;
};
