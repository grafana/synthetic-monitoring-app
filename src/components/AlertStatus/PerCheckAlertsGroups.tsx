import React from 'react';
import { Stack, useStyles2 } from '@grafana/ui';

import { Check, PrometheusAlertsGroup } from 'types';

import { AlertGroupStates } from './AlertGroupStates';
import { getStyles } from './AlertStatus';
import { GrafanaNamespaceAlertRuleDisplay } from './GrafanaNamespaceAlertRuleDisplay';

interface PerCheckAlertGroupsProps {
  groups: PrometheusAlertsGroup[];
  loading: boolean;
  isError: boolean;
  refetch: () => void;
  alerts: Check['Alerts'];
}

export const PerCheckAlertGroups = ({ groups, loading, isError, refetch, alerts }: PerCheckAlertGroupsProps) => {
  const styles = useStyles2(getStyles);

  return (
    <Stack direction="column" gap={2}>
      <Stack direction="row" gap={1} alignItems="center">
        <h3 className={styles.title}>Per-check alerts</h3>
        <AlertGroupStates isLoading={loading} isError={isError} refetch={refetch} />
      </Stack>
      {!loading &&
        !isError &&
        groups.length > 0 &&
        groups.map((group) => {
          const id = `${group.file}-${group.name}`;
          return <GrafanaNamespaceAlertRuleDisplay key={id} group={group} alerts={alerts} />;
        })}
      {!loading && !isError && groups.length === 0 && <>No per-check alerts defined for this check</>}
    </Stack>
  );
};
