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
  const [timepoint, probeToView] = selectedTimepoint;

  return (
    <>
      <TabsBar>
        {timepointData.map(({ probe, checks }) => {
          const active = probe === probeToView;
          const probeStatus = checks[0][0][LokiFieldNames.Labels].probe_success;
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
                  handleTimepointSelection(timepoint, probe);
                }
              }}
            />
          );
        })}
      </TabsBar>
      <TabContent>
        {timepointData.map(({ probe, checks }) => {
          const active = probe === probeToView;

          if (!active) {
            return null;
          }

          return <LogsRenderer<ParsedCheckLog> key={probe} logs={checks[0]} logsView={logsView} mainKey="msg" />;
        })}
      </TabContent>
    </>
  );
};
