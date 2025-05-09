import React from 'react';
import { Tab, TabContent, TabsBar } from '@grafana/ui';

import { CheckLogs, ParsedCheckLog, PerCheckLogs } from 'features/parseCheckLogs/checkLogs.types';
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

          return (
            <Tab
              key={probe}
              label={probe}
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
