import React from 'react';
import { useFormContext } from 'react-hook-form';
import { Icon, Tab, TabsBar, useStyles2, useTheme2 } from '@grafana/ui';

import { CheckFormValuesMultiHttp, HttpMethod } from 'types';
import { tabErrorMap } from 'components/MultiHttp/MultiHttpSettingsForm.utils';
import { MultiHttpFormTabs, RequestMethods } from 'components/MultiHttp/MultiHttpTypes';
import { RequestTabs } from 'components/MultiHttp/Tabs/Tabs';

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

export function getIsBodyDisabled(method: RequestMethods) {
  switch (method) {
    case HttpMethod.POST:
    case HttpMethod.PUT:
    case HttpMethod.PATCH:
    case HttpMethod.DELETE:
      return false;
    default:
      return true;
  }
}

export const TabSection = ({ activeTab, index, onTabClick }: RequestTabsProps) => {
  const styles = useStyles2(getMultiHttpFormStyles);
  const { formState, watch } = useFormContext<CheckFormValuesMultiHttp>();
  const requestMethod = watch(`settings.multihttp.entries.${index}.request.method`);
  const headers = watch(`settings.multihttp.entries.${index}.request.headers`);
  const queryParams = watch(`settings.multihttp.entries.${index}.request.queryFields`);
  const assertions = watch(`settings.multihttp.entries.${index}.checks`);
  const variables = watch(`settings.multihttp.entries.${index}.variables`);
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
          suffix={tabErrorMap(formState.errors, index, MultiHttpFormTabs.Headers) ? TabErrorWarning : undefined}
          data-fs-element="Headers tab"
        />

        <Tab
          label={'Query Params'}
          active={activeTab === MultiHttpFormTabs.QueryParams}
          onChangeTab={() => {
            onTabClick(MultiHttpFormTabs.QueryParams);
          }}
          className={styles.tabs}
          counter={queryParams?.length ?? 0}
          suffix={tabErrorMap(formState.errors, index, MultiHttpFormTabs.QueryParams) ? TabErrorWarning : undefined}
          data-fs-element="Query params tab"
        />
        <Tab
          label={'Assertions'}
          active={activeTab === MultiHttpFormTabs.Assertions}
          onChangeTab={() => {
            onTabClick(MultiHttpFormTabs.Assertions);
          }}
          className={styles.tabs}
          counter={assertions?.length ?? 0}
          suffix={tabErrorMap(formState.errors, index, MultiHttpFormTabs.Assertions) ? TabErrorWarning : undefined}
          data-fs-element="Assertions tab"
        />
        <Tab
          label="Variables"
          active={activeTab === MultiHttpFormTabs.Variables}
          onChangeTab={() => {
            onTabClick(MultiHttpFormTabs.Variables);
          }}
          className={styles.tabs}
          counter={variables?.length ?? 0}
          suffix={tabErrorMap(formState.errors, index, MultiHttpFormTabs.Variables) ? TabErrorWarning : undefined}
          data-fs-element="Variables tab"
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
            suffix={tabErrorMap(formState.errors, index, MultiHttpFormTabs.Body) ? TabErrorWarning : undefined}
            data-fs-element="Body tab"
          />
        )}
      </TabsBar>
      <RequestTabs index={index} activeTab={activeTab} />
    </div>
  );
};
