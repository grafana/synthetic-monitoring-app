import React, { useState } from 'react';
import { GrafanaTheme2 } from '@grafana/data';
import { Button, Icon, LoadingPlaceholder, Text, useStyles2 } from '@grafana/ui';
import { css } from '@emotion/css';

import { CheckHealth, CheckHealthStatus } from '../Home.types';

import { AttentionListItem } from './AttentionListItem';

const DEFAULT_VISIBLE_ROWS = 5;

interface AttentionListProps {
  checkHealth: CheckHealth[];
  isMetricsLoading: boolean;
}

export const AttentionList = ({ checkHealth, isMetricsLoading }: AttentionListProps) => {
  const styles = useStyles2(getStyles);
  const [showAll, setShowAll] = useState(false);

  const needsAttention = checkHealth.filter(({ status }) => status !== CheckHealthStatus.Healthy);
  const healthyCount = checkHealth.length - needsAttention.length;
  const visibleItems = showAll ? needsAttention : needsAttention.slice(0, DEFAULT_VISIBLE_ROWS);
  const hiddenCount = needsAttention.length - visibleItems.length;

  if (isMetricsLoading) {
    return <LoadingPlaceholder text="Checking the status of your checks..." />;
  }

  return (
    <div className={styles.container} data-testid="attention-list">
      {needsAttention.length === 0 ? (
        <div className={styles.allClear}>
          <Icon name="check-circle" size="xl" className={styles.allClearIcon} />
          <Text element="h3">All checks are passing</Text>
          <Text color="secondary">Nothing needs your attention right now.</Text>
        </div>
      ) : (
        <div className={styles.list}>
          {visibleItems.map((item) => (
            <AttentionListItem key={`${item.check.job}-${item.check.target}`} checkHealth={item} />
          ))}
        </div>
      )}

      {hiddenCount > 0 && (
        <Button variant="secondary" fill="text" onClick={() => setShowAll(true)}>
          Show all {needsAttention.length} checks needing attention
        </Button>
      )}

      {healthyCount > 0 && needsAttention.length > 0 && (
        <div className={styles.healthySummary}>
          <Icon name="check-circle" className={styles.allClearIcon} />
          <Text color="secondary">
            {healthyCount} {healthyCount === 1 ? 'check is' : 'checks are'} healthy
          </Text>
        </div>
      )}
    </div>
  );
};

const getStyles = (theme: GrafanaTheme2) => ({
  container: css({
    display: 'flex',
    flexDirection: 'column',
    gap: theme.spacing(1),
  }),
  list: css({
    display: 'flex',
    flexDirection: 'column',
    gap: theme.spacing(0.5),
  }),
  allClear: css({
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: theme.spacing(1),
    padding: theme.spacing(4),
    backgroundColor: theme.colors.background.secondary,
    borderRadius: theme.shape.radius.default,
  }),
  allClearIcon: css({
    color: theme.colors.success.text,
  }),
  healthySummary: css({
    display: 'flex',
    alignItems: 'center',
    gap: theme.spacing(1),
    padding: theme.spacing(1, 2),
  }),
});
