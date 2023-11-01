import React from 'react';
import { useStyles2, TabsBar, Tab, Icon, useTheme2 } from '@grafana/ui';
import { SelectableValue } from '@grafana/data';
import { useFormContext } from 'react-hook-form';

import { RequestTabs } from 'components/MultiHttp/Tabs/Tabs';
import { MultiHttpFormTabs, RequestMethods } from 'components/MultiHttp/MultiHttpTypes';
import { tabErrorMap } from 'components/MultiHttp/MultiHttpSettingsForm.utils';
import { getMultiHttpFormStyles } from './../MultiHttpSettingsForm.styles';

interface RequestTabsProps {
  activeTab: MultiHttpFormTabs;
  index: number;
  onTabClick: (tab: MultiHttpFormTabs) => void;
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
    case 'DELETE':
      return false;
    default:
      return true;
  }
}

export const TabSection = ({ activeTab, index, onTabClick }: RequestTabsProps) => {
  const styles = useStyles2(getMultiHttpFormStyles);
  const { formState, watch } = useFormContext();
  const requestMethod = watch(`settings.multihttp.entries.${index}.request.method`);
  const headers = watch(`settings.multihttp.entries.${index}.request.headers`);
  const queryParams = watch(`settings.multihttp.entries.${index}.request.queryFields`);
  const assertions = watch(`settings.multihttp.entries.${index}.checks`);
  const variables = watch(`settings.multihttp.entries.${index}.variables`);
  const errors = formState.errors?.settings?.multihttp?.entries[index];
  const isBodyDisabled = getIsBodyDisabled(requestMethod);

  return (
    <div className={styles.tabsContent}>
      <TabsBar className={styles.tabsBar}>
        <Tab
          label={'Headers'}
          active={activeTab === MultiHttpFormTabs.Headers}
          onChangeTab={() => {
            onTabClick(MultiHttpFormTabs.Headers);
          }}
          default={true}
          className={styles.tabs}
          counter={headers?.length ?? 0}
          suffix={tabErrorMap(errors, index, MultiHttpFormTabs.Headers) ? TabErrorWarning : undefined}
        />

        <Tab
          label={'Query Params'}
          active={activeTab === MultiHttpFormTabs.QueryParams}
          onChangeTab={() => {
            onTabClick(MultiHttpFormTabs.QueryParams);
          }}
          className={styles.tabs}
          counter={queryParams?.length ?? 0}
          suffix={tabErrorMap(errors, index, MultiHttpFormTabs.QueryParams) ? TabErrorWarning : undefined}
        />
        <Tab
          label={'Assertions'}
          active={activeTab === MultiHttpFormTabs.Assertions}
          onChangeTab={() => {
            onTabClick(MultiHttpFormTabs.Assertions);
          }}
          className={styles.tabs}
          counter={assertions?.length ?? 0}
          suffix={tabErrorMap(errors, index, MultiHttpFormTabs.Assertions) ? TabErrorWarning : undefined}
        />
        <Tab
          label="Variables"
          active={activeTab === MultiHttpFormTabs.Variables}
          onChangeTab={() => {
            onTabClick(MultiHttpFormTabs.Variables);
          }}
          className={styles.tabs}
          counter={variables?.length ?? 0}
          suffix={tabErrorMap(errors, index, MultiHttpFormTabs.Variables) ? TabErrorWarning : undefined}
        />
        {!isBodyDisabled && (
          <Tab
            className={styles.tabs}
            disabled={isBodyDisabled}
            label={'Body'}
            active={activeTab === MultiHttpFormTabs.Body}
            onChangeTab={() => {
              onTabClick(MultiHttpFormTabs.Body);
            }}
            suffix={tabErrorMap(errors, index, MultiHttpFormTabs.Body) ? TabErrorWarning : undefined}
          />
        )}
      </TabsBar>
      <RequestTabs index={index} activeTab={activeTab} />
    </div>
  );
};

export default TabSection;
