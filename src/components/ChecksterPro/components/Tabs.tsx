import React from 'react';
import { Tab, TabsBar } from '@grafana/ui';

interface TabItem {
  label: string;
  counter?: number;
}

interface TabsProps {
  activeTab: TabItem['label'];
  tabs: TabItem[];
  onChangeTab: (label: TabItem['label']) => void;
}

export function Tabs({ tabs, onChangeTab, activeTab }: TabsProps) {
  const handleOnChangeTab = (label: TabItem['label']) => {
    onChangeTab(label);
  };

  return (
    <TabsBar>
      {tabs.map((tab, index) => (
        <Tab
          active={tab.label === activeTab}
          key={tab.label}
          label={tab.label}
          counter={tab.counter}
          onChangeTab={() => handleOnChangeTab(tab.label)}
        />
      ))}
    </TabsBar>
  );
}
