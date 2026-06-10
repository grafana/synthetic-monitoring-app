import React from 'react';
import { GrafanaTheme2 } from '@grafana/data';
import { Badge, BadgeColor, IconName, TextLink, useStyles2 } from '@grafana/ui';
import { css } from '@emotion/css';

import { CheckHealth, CheckHealthStatus } from '../Home.types';
import { getCheckType } from 'utils';
import { AppRoutes } from 'routing/types';
import { generateRoutePath } from 'routing/utils';
import { AlertStatus } from 'components/AlertStatus/AlertStatus';

const STATUS_CONFIG: Record<CheckHealthStatus, { text: string; color: BadgeColor; icon: IconName }> = {
  [CheckHealthStatus.Down]: { text: 'Down', color: 'red', icon: 'exclamation-circle' },
  [CheckHealthStatus.Firing]: { text: 'Alerting', color: 'red', icon: 'bell' },
  [CheckHealthStatus.Degraded]: { text: 'Degraded', color: 'orange', icon: 'exclamation-triangle' },
  [CheckHealthStatus.NoData]: { text: 'No data', color: 'blue', icon: 'question-circle' },
  [CheckHealthStatus.Healthy]: { text: 'Healthy', color: 'green', icon: 'check-circle' },
};

function formatRate(rate: number | null) {
  if (rate === null) {
    return '–';
  }

  return `${(rate * 100).toFixed(rate === 1 || rate === 0 ? 0 : 1)}%`;
}

export const AttentionListItem = ({ checkHealth }: { checkHealth: CheckHealth }) => {
  const styles = useStyles2(getStyles);
  const { check, status, recentSuccessRate, reachability, firingCount, firingAlertNames } = checkHealth;
  const statusConfig = STATUS_CONFIG[status];
  const checkType = getCheckType(check.settings);

  return (
    <div className={styles.row} data-testid="attention-list-item">
      <div className={styles.status}>
        <Badge text={statusConfig.text} color={statusConfig.color} icon={statusConfig.icon} />
      </div>
      <div className={styles.identity}>
        <div className={styles.titleRow}>
          <TextLink href={generateRoutePath(AppRoutes.CheckDashboard, { id: check.id! })} inline={false}>
            {check.job}
          </TextLink>
          <AlertStatus check={check} runtimeAlertState={{ firingCount, firingAlertNames }} />
        </div>
        <div className={styles.target}>{check.target}</div>
      </div>
      <div className={styles.type}>{checkType}</div>
      <div className={styles.metric}>
        <div className={styles.metricLabel}>Last 10m</div>
        <div>{formatRate(recentSuccessRate)}</div>
      </div>
      <div className={styles.metric}>
        <div className={styles.metricLabel}>Reachability (3h)</div>
        <div>{formatRate(reachability)}</div>
      </div>
    </div>
  );
};

const getStyles = (theme: GrafanaTheme2) => ({
  row: css({
    display: 'grid',
    gridTemplateColumns: '110px minmax(0, 1fr) 90px 110px 130px',
    gap: theme.spacing(2),
    alignItems: 'center',
    padding: theme.spacing(1.5, 2),
    backgroundColor: theme.colors.background.secondary,
    borderRadius: theme.shape.radius.default,
    [theme.breakpoints.down('md')]: {
      gridTemplateColumns: '110px minmax(0, 1fr)',
    },
  }),
  status: css({
    display: 'flex',
  }),
  identity: css({
    minWidth: 0,
  }),
  titleRow: css({
    display: 'flex',
    alignItems: 'center',
    gap: theme.spacing(1),
  }),
  target: css({
    fontSize: theme.typography.bodySmall.fontSize,
    color: theme.colors.text.secondary,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  }),
  type: css({
    textTransform: 'uppercase',
    fontSize: theme.typography.bodySmall.fontSize,
    color: theme.colors.text.secondary,
    [theme.breakpoints.down('md')]: {
      display: 'none',
    },
  }),
  metric: css({
    textAlign: 'right',
    [theme.breakpoints.down('md')]: {
      display: 'none',
    },
  }),
  metricLabel: css({
    fontSize: theme.typography.bodySmall.fontSize,
    color: theme.colors.text.secondary,
    whiteSpace: 'nowrap',
  }),
});
