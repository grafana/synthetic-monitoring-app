import React, { useState } from 'react';
import { Tab, TabContent, TabsBar, Text } from '@grafana/ui';

import { CheckLogs } from 'features/parseCheckLogs/checkLogs.types';
import { TimepointWithVis } from 'page/CheckDrilldown/components/TimepointExplorer.utils';

export const CheckLogsExplorer = ({ timePoint }: { timePoint: TimepointWithVis }) => {
  const { probeLogs } = timePoint;
  const tabs = Object.entries(probeLogs).map(([probe, logs]) => ({
    label: probe,
    logs,
  }));

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
  }>;
}) => {
  const [selectedTab, setSelectedTab] = useState(0);

  return (
    <div>
      <TabsBar>
        {tabs.map((tab, index) => (
          <Tab
            key={tab.label}
            label={tab.label}
            active={selectedTab === index}
            onChangeTab={() => setSelectedTab(index)}
          />
        ))}
      </TabsBar>
      <TabContent>
        {tabs[selectedTab].logs.map((log) => (
          <LogItem key={`${selectedTab}-${log.nanotime}`} log={log} />
        ))}
      </TabContent>
    </div>
  );
};

const LogItem = ({ log }: { log: CheckLogs[number] }) => {
  return (
    <div>
      <Text>{new Date(log.time).toLocaleString()}</Text>
    </div>
  );
};
