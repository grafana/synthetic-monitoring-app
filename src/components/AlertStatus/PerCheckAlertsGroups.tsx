import React from 'react';

import { PrometheusAlertsGroup } from 'types';

import { AlertGroups } from './AlertGroups';

interface PerCheckAlertGroupsProps {
  groups: PrometheusAlertsGroup[];
  loading: boolean;
  isError: boolean;
  refetch: () => void;
}

export const PerCheckAlertGroups = ({ groups, loading, isError, refetch }: PerCheckAlertGroupsProps) => {
  return (
    <AlertGroups
      groups={groups}
      metricsDSName={'grafana'}
      title="Per-check alerts"
      emptyState={<>No per-check alerts defined for this check</>}
      isError={isError}
      isLoading={loading}
      refetch={refetch}
    />
  );
};
