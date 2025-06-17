import React from 'react';
import { Icon, Stack, Tab, TabContent, TabsBar } from '@grafana/ui';

import { ParsedCheckLog, PerCheckLogs } from 'features/parseCheckLogs/checkLogs.types';
import { LokiFieldNames } from 'features/parseLogs/parseLogs.types';
import { LogsRenderer } from 'scenes/components/LogsRenderer/LogsRenderer';
import { LogsView } from 'scenes/components/LogsRenderer/LogsViewSelect';
import { SelectedTimepoint, Timepoint } from 'scenes/components/TimepointExplorer/TimepointExplorer.types';

interface TimepointViewerProbesProps {
  handleTimepointSelection: (timepoint: Timepoint, probeToView: string) => void;
  selectedTimepoint: SelectedTimepoint;
  timepointData: PerCheckLogs[];
  logsView: LogsView;
}

export const TimepointViewerProbes = ({
  handleTimepointSelection,
  selectedTimepoint,
  timepointData,
  logsView,
}: TimepointViewerProbesProps) => {
  const [timepoint, checkToView] = selectedTimepoint;

  return (
    <>
      <TabsBar>
        {timepointData.map(({ probe, checks }) => {
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
                  if (!active) {
                    handleTimepointSelection(timepoint, id);
                  }
                }}
              />
            );
          });
        })}
      </TabsBar>
      <TabContent>
        {timepointData.map(({ probe, checks }) => {
          return checks.map((check) => {
            const id = check[check.length - 1].id;
            const active = id === checkToView;

            if (!active) {
              return null;
            }

            return <LogsRenderer<ParsedCheckLog> key={probe} logs={check} logsView={logsView} mainKey="msg" />;
          });
        })}
      </TabContent>
    </>
  );
};
