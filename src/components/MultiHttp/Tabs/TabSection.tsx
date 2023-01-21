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
  activeTab: string;
  onChange: (tab: string) => void;
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
          onChangeTab={() => onChange('header')}
          default={true}
          className={styles.tabs}
        />
        <Tab
          className={styles.tabs}
          label={'Body'}
          active={activeTab === 'body'}
          onChangeTab={() => onChange('body')}
        />
        <Tab
          label={'Query Params'}
          active={activeTab === 'queryParams'}
          onChangeTab={() => onChange('queryParams')}
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
