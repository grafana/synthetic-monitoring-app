import React, { useState } from 'react';
import { Box, Icon, Stack, Tab, TabContent, TabsBar, Text } from '@grafana/ui';

import { CheckLogs } from 'features/parseCheckLogs/checkLogs.types';
import { ResultDuration } from 'page/CheckDrilldown/components/ResultDuration';
import { TimepointWithVis } from 'page/CheckDrilldown/components/TimepointExplorer.utils';
import { getColor } from 'page/CheckDrilldown/utils/colors';
import { LogLine } from 'scenes/Common/CheckLogs/LogLine';

export const CheckLogsExplorer = ({ timePoint }: { timePoint: TimepointWithVis }) => {
  const { probeLogs, probeSuccesses, probeDurations } = timePoint;
  const tabs = Object.entries(probeLogs)
    .map(([probe, logs]) => {
      return {
        label: probe,
        logs,
        success: probeSuccesses[probe],
        duration: probeDurations[probe],
      };
    })
    .sort((a, b) => a.label.localeCompare(b.label));

  if (tabs.length === 0) {
    return (
      <div>
        <Text>No logs found</Text>
      </div>
    );
  }

  return <CheckLogsExplorerContent tabs={tabs} key={timePoint.timestamp} />;
};

const CheckLogsExplorerContent = ({
  tabs,
}: {
  tabs: Array<{
    label: string;
    logs: CheckLogs;
    success: 0 | 1 | null;
    duration: number;
  }>;
}) => {
  const [selectedTab, setSelectedTab] = useState(0);
  const red = getColor('red');
  const green = getColor('green');

  return (
    <div>
      <TabsBar>
        {tabs.map((tab, index) => {
          const label = (
            <Stack alignItems={`center`}>
              <Text>{tab.label}</Text>
              {tab.success === 1 && <Icon name="check-circle" color={green} />}
              {tab.success === 0 && <Icon name="times-circle" color={red} />}
              {tab.success === null && <Icon name="question-circle" />}
            </Stack>
          ) as unknown as string; // will accept component despite type string

          return (
            <Tab
              key={tab.label}
              label={label}
              active={selectedTab === index}
              onChangeTab={() => setSelectedTab(index)}
            />
          );
        })}
      </TabsBar>
      <TabContent>
        <Box marginTop={2}>
          <Stack direction={`column`}>
            <Stack direction={`row`}>
              <Text>Probe result</Text>
              <ResultDuration
                state={tabs[selectedTab].success}
                duration={tabs[selectedTab].duration}
                type={`success_fail`}
              />
            </Stack>
            {tabs[selectedTab].logs.map((log) => (
              <LogItem key={`${selectedTab}-${log.nanotime}`} log={log} />
            ))}
          </Stack>
        </Box>
      </TabContent>
    </div>
  );
};

const LogItem = ({ log }: { log: CheckLogs[number] }) => {
  return <LogLine log={log} />;
};
