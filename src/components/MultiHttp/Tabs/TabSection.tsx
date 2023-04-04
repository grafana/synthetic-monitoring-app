import React, { useState } from 'react';
import { useStyles2, TabsBar, TabContent, Tab } from '@grafana/ui';
import { RequestTabs } from 'components/MultiHttp/Tabs/Tabs';
import { getMultiHttpFormStyles } from './../MultiHttpSettingsForm.styles';
import { useFormContext } from 'react-hook-form';
import { MultiHttpFormTabs } from 'types';

interface RequestTabsProps {
  label?: string;
  index: number;
}

export const TabSection = ({ index }: RequestTabsProps) => {
  const [activeTab, setActiveTab] = useState<MultiHttpFormTabs>('header');
  const styles = useStyles2(getMultiHttpFormStyles);

  const { formState } = useFormContext();

  return (
    <div className={styles.tabsContent}>
      <TabsBar className={styles.tabsBar}>
        <Tab
          label={'Headers'}
          active={activeTab === 'header'}
          onChangeTab={() => {
            if (formState.errors?.settings?.multihttp?.entries[index]?.request) {
              return;
            } else {
              setActiveTab('header');
            }
          }}
          default={true}
          className={styles.tabs}
        />
        <Tab
          className={styles.tabs}
          label={'Body'}
          active={activeTab === 'body'}
          onChangeTab={() => {
            if (formState.errors?.settings?.multihttp?.entries[index]?.request) {
              return;
            } else {
              setActiveTab('body');
            }
          }}
        />
        <Tab
          label={'Query Params'}
          active={activeTab === 'queryParams'}
          onChangeTab={() => {
            if (formState.errors?.settings?.multihttp?.entries[index]?.request) {
              return;
            } else {
              setActiveTab('queryParams');
            }
          }}
          className={styles.tabs}
        />
        <Tab
          label="Variables"
          active={activeTab === 'variables'}
          onChangeTab={() => {
            if (formState.errors?.settings?.multihttp?.entries[index]?.variables) {
              return;
            } else {
              setActiveTab('variables');
            }
          }}
          className={styles.tabs}
        />
      </TabsBar>
      <TabContent className={styles.tabsContent}>
        <RequestTabs index={index} activeTab={activeTab} />
      </TabContent>
    </div>
  );
};

export default TabSection;
