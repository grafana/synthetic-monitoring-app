import React from 'react';

import { Check } from '../../types';

import { getCheckType } from '../../utils';
import { DashboardContainer } from '../Common/DashboardContainer';
import { ErrorLogs } from '../Common/ErrorLogsPanel';

export const AgenticMonitoringDashboard = ({ check }: { check: Check }) => {
  const checkType = getCheckType(check.settings);

  return (
    <DashboardContainer check={check} checkType={checkType}>
      <ErrorLogs startingUnsuccessfulOnly />
    </DashboardContainer>
  );
};
