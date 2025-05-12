import React from 'react';
import { Icon, IconButton, Stack, Tooltip, useStyles2 } from '@grafana/ui';

import { PrometheusAlertsGroup } from 'types';

import { getStyles } from './AlertStatus';
import { NamespaceAlertRuleDisplay } from './NamespaceAlertRuleDisplay';

interface AlertGroupsProps {
  groups: PrometheusAlertsGroup[];
  metricsDSName: string;
  title: string;
  emptyState?: React.ReactNode;
  isLoading: boolean;
  isError: boolean;
  refetch: () => void;
}

export const AlertGroups = ({
  groups,
  metricsDSName,
  title,
  emptyState,
  isLoading,
  isError,
  refetch,
}: AlertGroupsProps) => {
  const styles = useStyles2(getStyles);

  return (
    <Stack direction="column" gap={2}>
      <h3 className={styles.title}>{title}</h3>
      {isLoading && (
        <Tooltip content={`Loading alert rules`}>
          <Icon name="fa fa-spinner" />
        </Tooltip>
      )}
      {isError && (
        <IconButton
          tooltip="Unable to fetch alerting rules. Retry?"
          name="exclamation-triangle"
          onClick={() => refetch()}
        />
      )}
      {!isLoading && !isError && groups.length > 0
        ? groups.map((group) => {
            const id = `${group.file}-${group.name}`;
            return <NamespaceAlertRuleDisplay key={id} group={group} metricsDSName={metricsDSName} />;
          })
        : emptyState}
    </Stack>
  );
};
