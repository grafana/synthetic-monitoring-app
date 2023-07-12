import React, { useState } from 'react';
import { useStyles2, TabsBar, Tab, Icon, useTheme2 } from '@grafana/ui';
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

function TabErrorWarning() {
  const theme = useTheme2();
  return <Icon name="exclamation-triangle" style={{ color: theme.colors.error.text, marginLeft: theme.spacing(1) }} />;
}

export function getIsBodyDisabled(method: SelectableValue<RequestMethods>) {
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
  const headers = watch(`settings.multihttp.entries.${index}.request.headers`);
  const queryParams = watch(`settings.multihttp.entries.${index}.request.queryString`);
  const assertions = watch(`settings.multihttp.entries.${index}.checks`);
  const variables = watch(`settings.multihttp.entries.${index}.variables`);
  const errors = formState.errors?.settings?.multihttp?.entries[index];

  const isBodyDisabled = getIsBodyDisabled(requestMethod);

  return (
    <div className={styles.tabsContent}>
      <TabsBar className={styles.tabsBar}>
        <Tab
          label={'Headers'}
          active={activeTab === 'header'}
          onChangeTab={() => {
            setActiveTab('header');
          }}
          default={true}
          className={styles.tabs}
          counter={headers?.length ?? 0}
          suffix={errors?.request?.headers?.length ? TabErrorWarning : undefined}
        />

        <Tab
          label={'Query Params'}
          active={activeTab === 'queryParams'}
          onChangeTab={() => {
            setActiveTab('queryParams');
          }}
          className={styles.tabs}
          counter={queryParams?.length ?? 0}
          suffix={errors?.request?.queryString?.length ? TabErrorWarning : undefined}
        />
        <Tab
          label={'Assertions'}
          active={activeTab === 'assertions'}
          onChangeTab={() => {
            setActiveTab('assertions');
          }}
          className={styles.tabs}
          counter={assertions?.length ?? 0}
          suffix={errors?.checks?.length ? TabErrorWarning : undefined}
        />
        <Tab
          label="Variables"
          active={activeTab === 'variables'}
          onChangeTab={() => {
            setActiveTab('variables');
          }}
          className={styles.tabs}
          counter={variables?.length ?? 0}
          suffix={errors?.variables?.length ? TabErrorWarning : undefined}
        />
        {!isBodyDisabled && (
          <Tab
            className={styles.tabs}
            disabled={isBodyDisabled}
            label={'Body'}
            active={activeTab === 'body'}
            onChangeTab={() => {
              setActiveTab('body');
            }}
            suffix={errors?.body ? TabErrorWarning : undefined}
          />
        )}
      </TabsBar>
      <RequestTabs index={index} activeTab={activeTab} />
    </div>
  );
};

export default TabSection;
