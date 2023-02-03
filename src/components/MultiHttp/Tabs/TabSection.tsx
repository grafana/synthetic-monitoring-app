import React, { useState } from 'react';
import { FieldValues, UseFormRegister } from 'react-hook-form';
import { useStyles2, TabsBar, TabContent, Tab } from '@grafana/ui';
import { RequestTabs } from './../Tabs/Tabs';
import { CheckFormValues } from 'types';
import { getMultiHttpFormStyles } from './../MultiHttpSettingsForm.styles';

type ActiveTabTypes = 'header' | 'queryParams' | 'body';
interface RequestTabsProps {
  isEditor?: boolean;
  register: UseFormRegister<CheckFormValues | FieldValues>;
  label?: string;
  errors?: any;
  index: number;
  control?: any;
  trigger?: any;
  unregister?: any;
}

export const TabSection = ({ isEditor, errors, register, unregister, index, control, trigger }: RequestTabsProps) => {
  const [activeTab, setActiveTab] = useState<ActiveTabTypes>('header');
  const styles = useStyles2(getMultiHttpFormStyles);

  return (
    <div className={styles.tabsContent}>
      <TabsBar className={styles.tabsBar}>
        <Tab
          label={'Headers'}
          active={activeTab === 'header'}
          onChangeTab={() => {
            if (errors?.settings?.multihttp?.entries[index]?.request) {
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
            if (errors?.settings?.multihttp?.entries[index]?.request) {
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
            if (errors?.settings?.multihttp?.entries[index]?.request) {
              return;
            } else {
              setActiveTab('queryParams');
            }
          }}
          className={styles.tabs}
        />
      </TabsBar>
      <TabContent className={styles.tabsContent}>
        <RequestTabs
          unregister={unregister}
          trigger={trigger}
          control={control}
          index={index}
          activeTab={activeTab}
          isEditor={isEditor}
          errors={errors}
          register={register}
        />
      </TabContent>
    </div>
  );
};

export default TabSection;
