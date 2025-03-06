import React from 'react';
import { PluginPage } from '@grafana/runtime';

import { CheckCommon } from 'page/CheckDrilldown/components/CheckCommon';
import { CheckDrilldownProvider, useCheckDrilldown } from 'page/CheckDrilldown/components/CheckDrilldownContext';
import { CheckDrilldownControls } from 'page/CheckDrilldown/components/CheckDrilldownControls';
import { TimeRangeProvider } from 'page/CheckDrilldown/components/TimeRangeContext';

export const CheckDrilldown = () => {
  return (
    <CheckDrilldownProvider>
      <TimeRangeProvider>
        <CheckDrilldownContent />
      </TimeRangeProvider>
    </CheckDrilldownProvider>
  );
};

const CheckDrilldownContent = () => {
  const { check } = useCheckDrilldown();

  return (
    <PluginPage pageNav={{ text: check?.job || ``, subTitle: check?.target || `` }}>
      <CheckDrilldownControls />
      <CheckCommon />
    </PluginPage>
  );
};
