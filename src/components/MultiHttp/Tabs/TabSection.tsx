import React from 'react';
import { FieldValues, UseFormRegister } from 'react-hook-form';
import { useStyles2, TabsBar, TabContent, Tab } from '@grafana/ui';
import { RequestTabs } from './../Tabs/Tabs';
import { getMultiHttpFormStyles } from './../MultiHttpSettingsForm.styles';

interface RequestTabsProps {
  isEditor?: boolean;
  register: UseFormRegister<FieldValues>;
  label?: string;
  errors?: any;
  index: number;
  control?: any;
  trigger?: any;
  unregister?: any;
  activeTab: 'header' | 'queryParams' | 'body';
  onChange: (tab: RequestTabsProps['activeTab']) => void;
}

export const TabSection = ({
  activeTab,
  isEditor,
  errors,
  register,
  unregister,
  index,
  onChange,
  control,
  trigger,
}: RequestTabsProps) => {
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
              onChange('header');
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
              onChange('body');
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
              onChange('queryParams');
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
          onChange={onChange}
        />
      </TabContent>
    </div>
  );
};

export default TabSection;
