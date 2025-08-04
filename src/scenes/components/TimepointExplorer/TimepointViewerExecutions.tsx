import React from 'react';
import { Icon, Stack, Tab, TabContent, TabsBar } from '@grafana/ui';

import { ParsedExecutionLog, PerExecutionLogs } from 'features/parseCheckLogs/checkLogs.types';
import { LokiFieldNames } from 'features/parseLogs/parseLogs.types';
import { Check } from 'types';
import { LogsRenderer } from 'scenes/components/LogsRenderer/LogsRenderer';
import { LogsView } from 'scenes/components/LogsRenderer/LogsViewSelect';
import { useTimepointExplorerContext } from 'scenes/components/TimepointExplorer/TimepointExplorer.context';
import { getExecutionIdFromLogs } from 'scenes/components/TimepointExplorer/TimepointViewer.utils';

interface TimepointViewerExecutionsProps {
  check: Check;
  logsView: LogsView;
  data: PerExecutionLogs[];
}

export const TimepointViewerExecutions = ({ check, data, logsView }: TimepointViewerExecutionsProps) => {
  const { handleExecutionHover, handleSelectedTimepointChange, selectedTimepoint } = useTimepointExplorerContext();
  const [timepoint, executionToView] = selectedTimepoint;

  return (
    <>
      <TabsBar>
        {data.map(({ probe, executions }) => {
          return executions.map((execution) => {
            const id = getExecutionIdFromLogs(execution);
            const active = id === executionToView;
            const probeStatus = execution[0]?.[LokiFieldNames.Labels]?.probe_success;
            const isSuccess = probeStatus === '1';

            return (
              <Tab
                key={probe}
                // @ts-expect-error - it accepts components despite its type
                label={
                  <div onMouseEnter={() => handleExecutionHover(id)} onMouseLeave={() => handleExecutionHover(null)}>
                    <Stack direction="row">
                      <div>{probe}</div>
                      <Icon name={isSuccess ? 'check' : 'times'} color={isSuccess ? 'green' : 'red'} />
                    </Stack>
                  </div>
                }
                active={active}
                onChangeTab={() => {
                  if (!active && timepoint) {
                    handleSelectedTimepointChange(timepoint, id);
                  }
                }}
              />
            );
          });
        })}
      </TabsBar>
      <TabContent>
        {data.map(({ probe, executions }) => {
          return executions.map((execution) => {
            const id = getExecutionIdFromLogs(execution);
            const active = id === executionToView;

            if (!active) {
              return null;
            }

            return (
              <LogsRenderer<ParsedExecutionLog>
                check={check}
                key={probe}
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
