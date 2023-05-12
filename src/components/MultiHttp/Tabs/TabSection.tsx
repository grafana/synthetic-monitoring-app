import React, { useState } from 'react';
import { useStyles2, TabsBar, TabContent, Tab } from '@grafana/ui';
import { RequestTabs } from 'components/MultiHttp/Tabs/Tabs';
import { getMultiHttpFormStyles } from './../MultiHttpSettingsForm.styles';
import { useFormContext } from 'react-hook-form';
import { MultiHttpFormTabs } from 'types';
import { SelectableValue } from '@grafana/data';
import { RequestMethods } from '../MultiHttpTypes';

interface RequestTabsProps {
  label?: string;
  index: number;
}

function getIsBodyDisabled(method: SelectableValue<RequestMethods>) {
  switch (method?.value) {
    case 'POST':
    case 'PUT':
    case 'PATCH':
      return false;
    default:
      return true;
  }
}

export const TabSection = ({ index }: RequestTabsProps) => {
  const [activeTab, setActiveTab] = useState<MultiHttpFormTabs>('header');
  const styles = useStyles2(getMultiHttpFormStyles);

  const { formState, watch } = useFormContext();
  const requestMethod = watch(`settings.multihttp.entries.${index}.request.method`);
  const isBodyDisabled = getIsBodyDisabled(requestMethod);

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
          label={'Assertions'}
          active={activeTab === 'assertions'}
          onChangeTab={() => {
            if (formState.errors?.settings?.multihttp?.entries[index]?.request) {
              return;
            } else {
              setActiveTab('assertions');
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
        <Tab
          className={styles.tabs}
          disabled={isBodyDisabled}
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
      </TabsBar>
      <TabContent className={styles.tabsContent}>
        <RequestTabs index={index} activeTab={activeTab} />
      </TabContent>
    </div>
  );
};

export default TabSection;
