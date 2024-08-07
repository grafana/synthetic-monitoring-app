import React from 'react';
import { GrafanaTheme2 } from '@grafana/data';
import { Tab, TabsBar, useStyles2 } from '@grafana/ui';
import { css } from '@emotion/css';

import { WelcomeTabContent } from './WelcomeTabContent';

export enum WelcomeTab {
  Protocol,
  K6,
  PrivateProbes,
  AsCode,
}

export function WelcomeTabs() {
  const styles = useStyles2(getStyles);
  const [activeTab, setActiveTab] = React.useState(WelcomeTab.Protocol);
  return (
    <>
      <TabsBar className={styles.tabBar}>
        <Tab
          key={WelcomeTab.Protocol}
          label="Protocol checks"
          onChangeTab={() => {
            setActiveTab(WelcomeTab.Protocol);
          }}
          active={activeTab === WelcomeTab.Protocol}
        />
        <Tab
          key={WelcomeTab.K6}
          label="Scripting with k6"
          onChangeTab={() => {
            setActiveTab(WelcomeTab.K6);
          }}
          active={activeTab === WelcomeTab.K6}
        />
        <Tab
          key={WelcomeTab.PrivateProbes}
          label="Private probes"
          onChangeTab={() => {
            setActiveTab(WelcomeTab.PrivateProbes);
          }}
          active={activeTab === WelcomeTab.PrivateProbes}
        />
        <Tab
          key={WelcomeTab.AsCode}
          label="Manage as code"
          onChangeTab={() => {
            setActiveTab(WelcomeTab.AsCode);
          }}
          active={activeTab === WelcomeTab.AsCode}
        />
      </TabsBar>
      <WelcomeTabContent activeTab={activeTab} />
    </>
  );
}

function getStyles(theme: GrafanaTheme2) {
  return {
    tabBar: css({ maxWidth: '560px', width: '100%', margin: `auto` }),
  };
}
