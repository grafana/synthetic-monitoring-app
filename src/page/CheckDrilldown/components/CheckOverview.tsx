import React from 'react';
import { GrafanaTheme2 } from '@grafana/data';
import { Stack, Tab, TabContent, TabsBar, Text, useStyles2 } from '@grafana/ui';
import { css } from '@emotion/css';

import { CheckCompare } from 'page/CheckDrilldown/components/CheckCompare';
import { useCheckDrilldown } from 'page/CheckDrilldown/components/CheckDrilldownContext';
import { CheckInsights } from 'page/CheckDrilldown/components/CheckInsights';
import { CheckMetrics } from 'page/CheckDrilldown/components/CheckMetrics';

const TABS = [
  {
    label: `Insights`,
    component: CheckInsights,
  },
  {
    label: `Metrics`,
    component: CheckMetrics,
  },
  {
    label: `Compare`,
    component: CheckCompare,
  },
];

export const CheckOverview = () => {
  const { viewState, changeTab } = useCheckDrilldown();
  const Component = TABS[viewState.activeTab].component;
  const styles = useStyles2(getStyles);

  return (
    <div className={styles.container}>
      <Stack direction={`column`} gap={2}>
        <Text element={`h2`}>Check Overview</Text>
        <TabsBar>
          {TABS.map((tab, index) => (
            <Tab
              key={index}
              label={tab.label}
              active={viewState.activeTab === index}
              onChangeTab={() => changeTab(index)}
            />
          ))}
        </TabsBar>
        <TabContent>
          <Component />
        </TabContent>
      </Stack>
    </div>
  );
};

const getStyles = (theme: GrafanaTheme2) => {
  return {
    container: css`
      min-height: 500px;
    `,
  };
};
