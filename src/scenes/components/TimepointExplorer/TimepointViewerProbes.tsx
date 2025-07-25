import React from 'react';
import { Icon, Stack, Tab, TabContent, TabsBar } from '@grafana/ui';

import { ParsedCheckLog, PerCheckLogs } from 'features/parseCheckLogs/checkLogs.types';
import { LokiFieldNames } from 'features/parseLogs/parseLogs.types';
import { Check } from 'types';
import { LogsRenderer } from 'scenes/components/LogsRenderer/LogsRenderer';
import { LogsView } from 'scenes/components/LogsRenderer/LogsViewSelect';
import { useTimepointExplorerContext } from 'scenes/components/TimepointExplorer/TimepointExplorer.context';

interface TimepointViewerProbesProps {
  check: Check;
  logsView: LogsView;
  data: PerCheckLogs[];
}

export const TimepointViewerProbes = ({ check, data, logsView }: TimepointViewerProbesProps) => {
  const { handleSelectedTimepointChange, selectedTimepoint } = useTimepointExplorerContext();
  const [timepoint, checkToView] = selectedTimepoint;

  return (
    <>
      <TabsBar>
        {data.map(({ probe, checks }) => {
          return checks.map((check) => {
            const id = check[check.length - 1].id;
            const active = id === checkToView;
            const probeStatus = check[0]?.[LokiFieldNames.Labels]?.probe_success;
            const isSuccess = probeStatus === '1';

            return (
              <Tab
                key={probe}
                // @ts-expect-error - it accepts components despite its type
                label={
                  <Stack direction="row">
                    <div>{probe}</div>
                    <Icon name={isSuccess ? 'check' : 'times'} color={isSuccess ? 'green' : 'red'} />
                  </Stack>
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
        {data.map(({ probe, checks }) => {
          return checks.map((execution) => {
            const id = execution[execution.length - 1].id;
            const active = id === checkToView;

            if (!active) {
              return null;
            }

            return (
              <LogsRenderer<ParsedCheckLog>
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
