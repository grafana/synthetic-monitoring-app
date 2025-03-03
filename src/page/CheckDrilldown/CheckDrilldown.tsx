import React from 'react';
import { useParams } from 'react-router-dom-v5-compat';
import { PluginPage } from '@grafana/runtime';
import { LoadingPlaceholder } from '@grafana/ui';

import { Check, CheckPageParams } from 'types';
import { useCheck } from 'data/useChecks';
import { CheckCommon } from 'page/CheckDrilldown/components/CheckCommon';
import { CheckDrilldownControls } from 'page/CheckDrilldown/components/CheckDrilldownControls';
import { TimeRangeProvider } from 'page/CheckDrilldown/components/TimeRangeContext';
import { useCheckDrilldown } from 'page/CheckDrilldown/useCheckDrilldown';

export const CheckDrilldown = () => {
  const { id } = useParams<CheckPageParams>();
  const { data, isLoading, isError } = useCheck(Number(id));

  if (isLoading) {
    return <LoadingPlaceholder text="Loading..." />;
  }

  if (isError) {
    return <div>Error</div>;
  }

  if (!data) {
    return <div>Not found</div>;
  }

  return (
    <TimeRangeProvider>
      <PluginPage pageNav={{ text: data.job, subTitle: data.target }}>
        <CheckDrilldownContent check={data} />
      </PluginPage>
    </TimeRangeProvider>
  );
};

const CheckDrilldownContent = ({ check }: { check: Check }) => {
  const info = useCheckDrilldown(check);

  return (
    <div>
      <CheckDrilldownControls />
      <CheckCommon />
    </div>
  );
};
