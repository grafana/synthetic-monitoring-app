import React from 'react';
import { Stack, useStyles2 } from '@grafana/ui';

import { Check, PrometheusAlertsGroup } from 'types';

import { getStyles } from './AlertStatus';
import { NamespaceAlertRuleDisplay } from './NamespaceAlertRuleDisplay';
import { ZeroStateAlerts } from './ZeroStateAlerts';

interface LegacyAlertGroupsProps {
  check: Check;
  groups: PrometheusAlertsGroup[];
  metricsDSName: string;
}

export const LegacyAlertGroups = ({ check, groups, metricsDSName }: LegacyAlertGroupsProps) => {
  const hasGroups = groups.length > 0;
  const styles = useStyles2(getStyles);

  return (
    <Stack direction="column" gap={2}>
      <h3 className={styles.title}>Legacy alert rules</h3>
      {hasGroups ? (
        groups.map((group) => {
          const id = `${group.file}-${group.name}`;
          return <NamespaceAlertRuleDisplay key={id} group={group} metricsDSName={metricsDSName} />;
        })
      ) : (
        <ZeroStateAlerts alertSensitivity={check.alertSensitivity} />
      )}
    </Stack>
  );
};
