import React from 'react';
import { Stack } from '@grafana/ui';

import { Check } from '../../types';

import { getCheckType } from '../../utils';
import { DashboardContainer } from '../Common/DashboardContainer';
import pageInsights from './data/example-output.json';
import userJourneyTests from './data/user-journeys.json';
import { ExploredNodesGraph } from './ExploredNodesGraph';
import { GlobalScoreGaugePanel } from './globalScoreGauge';
import { PageInsightsTable } from './PageInsightsTable';
import { UserJourneysTable } from './UserJourneyTable';
import { GlobalScoreTimeseriesPanel } from './globalScoreTimeseries';

export const AgenticMonitoringDashboard = ({ check }: { check: Check }) => {
  const checkType = getCheckType(check.settings);
  const insights = pageInsights.nodes.map((node) => node.data);

  return (
    <DashboardContainer check={check} checkType={checkType}>
      <Stack direction={'row'} height={'200px'} justifyContent={'space-evenly'}>
        <GlobalScoreGaugePanel />
        <GlobalScoreTimeseriesPanel />
      </Stack>
      <ExploredNodesGraph checkId={check.id || 0} userJourneyTests={userJourneyTests} pageInsights={pageInsights} />
      <UserJourneysTable userJourneyTests={userJourneyTests} />
      <PageInsightsTable insights={insights} type={'accessibility'} />
      <PageInsightsTable insights={insights} type={'content'} />
      <PageInsightsTable insights={insights} type={'reliability'} />
    </DashboardContainer>
  );
};
