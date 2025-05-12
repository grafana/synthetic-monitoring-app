import React from 'react';

import { Check, PrometheusAlertsGroup } from 'types';

import { AlertGroups } from './AlertGroups';
import { ZeroStateAlerts } from './ZeroStateAlerts';

interface LegacyAlertGroupsProps {
  check: Check;
  metricsDSName: string;
  isLoading: boolean;
  groups: PrometheusAlertsGroup[];
  isError: boolean;
  refetch: () => void;
}

export const LegacyAlertGroups = ({
  check,
  metricsDSName,
  isLoading,
  groups,
  isError,
  refetch,
}: LegacyAlertGroupsProps) => {
  return (
    <AlertGroups
      groups={groups}
      metricsDSName={metricsDSName}
      title="Legacy alert rules"
      emptyState={<ZeroStateAlerts alertSensitivity={check.alertSensitivity} />}
      isError={isError}
      refetch={refetch}
      isLoading={isLoading}
    />
  );
};
