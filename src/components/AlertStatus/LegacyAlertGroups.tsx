import React from 'react';
import { Stack, useStyles2 } from '@grafana/ui';

import { Check, PrometheusAlertsGroup } from 'types';

import { AlertGroupStates } from './AlertGroupStates';
import { getStyles } from './AlertStatus';
import { LegacyNamespaceAlertRuleDisplay } from './LegacyNamespaceAlertRuleDisplay';
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
  const styles = useStyles2(getStyles);

  return (
    <Stack direction="column" gap={2}>
      <Stack direction="row" gap={1} alignItems="center">
        <h3 className={styles.title}>Legacy alert rules</h3>
        <AlertGroupStates isLoading={isLoading} isError={isError} refetch={refetch} />
      </Stack>
      {!isLoading && !isError && groups.length > 0 ? (
        groups.map((group) => {
          const id = `${group.file}-${group.name}`;
          return <LegacyNamespaceAlertRuleDisplay key={id} group={group} metricsDSName={metricsDSName} />;
        })
      ) : (
        <ZeroStateAlerts alertSensitivity={check.alertSensitivity} />
      )}
    </Stack>
  );
};
