import React from 'react';
import { Tab, TabsBar } from '@grafana/ui';
import { css } from '@emotion/css';
import { CHECKSTER_TEST_ID } from 'test/dataTestIds';

import { useFeatureTabsContext } from '../contexts/FeatureTabsContext';

export function FeatureTabs() {
  const { tabs, activeTab, setActive } = useFeatureTabsContext();

  const [activeLabel] = activeTab;

  return (
    <div data-testid={CHECKSTER_TEST_ID.ui.formTabs.header}>
      <TabsBar
        className={css`
          flex-grow: 1;
          align-self: flex-end;
          margin-left: -7px; // Need to hug the splitter
        `}
      >
        {tabs.map(([label], index) => {
          return (
            <Tab
              key={`${label}.${index}`}
              label={label}
              active={label === activeLabel}
              onChangeTab={() => {
                setActive(label);
              }}
            />
          );
        })}
      </TabsBar>
    </div>
  );
}
