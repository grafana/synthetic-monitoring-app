import React, { useMemo } from 'react';
import { GrafanaTheme2 } from '@grafana/data';
import { Icon, TextLink, useStyles2 } from '@grafana/ui';
import { css } from '@emotion/css';
import pluralize from 'pluralize';

import { Check } from 'types';
import { AppRoutes } from 'routing/types';
import { getRoute } from 'routing/utils';
import { CheckRuntimeAlertStates, getCheckRuntimeAlertState } from 'data/useCheckAlertStates';

import { FolderCheckMetrics, getExecutionsPerMonth } from './FolderDashboard.hooks';
import { formatPercent } from './FolderDashboard.utils';
import { FolderExecutionLogs } from './FolderSwimlane.hooks';

interface FolderKPIsProps {
  checks: Check[];
  metrics: FolderCheckMetrics;
  executionLogs: FolderExecutionLogs;
  alertStates?: CheckRuntimeAlertStates;
}

export const FolderKPIs = ({ checks, metrics, executionLogs, alertStates }: FolderKPIsProps) => {
  const styles = useStyles2(getStyles);
  const { upCount, downCount, downChecks, worstReachability } = metrics;
  const knownCount = upCount + downCount;
  const executionsPerMonth = getExecutionsPerMonth(checks);
  const failureCount = executionLogs.failures.length;
  const worstOffender = getWorstOffender(executionLogs);

  const firingAlerts = useMemo(() => {
    let count = 0;
    let checkCount = 0;
    if (alertStates) {
      checks.forEach((check) => {
        const { firingCount } = getCheckRuntimeAlertState(alertStates, check);
        count += firingCount;
        if (firingCount > 0) {
          checkCount++;
        }
      });
    }
    return { count, checkCount };
  }, [checks, alertStates]);

  return (
    <div className={styles.row}>
      <div className={styles.tile}>
        <div className={styles.label}>Checks</div>
        <div className={styles.value}>
          {metrics.isLoading ? (
            '—'
          ) : (
            <>
              {knownCount > 0 &&
                (downCount > 0 ? (
                  <Icon name="exclamation-triangle" className={styles.down} size="lg" />
                ) : (
                  <Icon name="check-circle" className={styles.up} size="lg" />
                ))}{' '}
              {knownCount > 0 ? `${upCount} / ${knownCount} up` : `${checks.length} checks`}
            </>
          )}
        </div>
        <div className={styles.detail}>
          {metrics.isLoading
            ? 'loading check states'
            : downCount > 0
              ? `down: ${downChecks.map((check) => check.job).join(', ')}`
              : knownCount > 0
                ? 'all checks passing'
                : 'no state data yet'}
        </div>
      </div>
      <div className={styles.tile}>
        <div className={styles.label}>Lowest reachability &middot; 3h</div>
        <div className={styles.value}>
          {worstReachability !== undefined ? formatPercent(worstReachability.reachability) : '—'}
        </div>
        <div className={styles.detail}>
          {worstReachability !== undefined ? worstReachability.check.job : 'no reachability data'}
        </div>
      </div>
      <div className={styles.tile}>
        <div className={styles.label}>Firing alerts</div>
        <div className={styles.value}>
          {firingAlerts.count > 0 && <Icon name="bell" className={styles.down} size="lg" />}{' '}
          {alertStates ? firingAlerts.count : '—'}
        </div>
        <div className={styles.detail}>
          {firingAlerts.count > 0 ? (
            <TextLink href={getRoute(AppRoutes.Alerts)} inline={false}>
              {firingAlerts.checkCount} {pluralize('check', firingAlerts.checkCount)} alerting — view alerts
            </TextLink>
          ) : (
            'none firing'
          )}
        </div>
      </div>
      <div className={styles.tile}>
        <div className={styles.label}>Failed executions &middot; 3h</div>
        <div className={styles.value}>{executionLogs.isLoading ? '—' : failureCount}</div>
        <div className={styles.detail}>
          {failureCount > 0 && worstOffender ? `most from ${worstOffender}` : 'no failures in window'}
        </div>
      </div>
      <div className={styles.tile}>
        <div className={styles.label}>Executions / month</div>
        <div className={styles.value}>{executionsPerMonth.toLocaleString()}</div>
        <div className={styles.detail}>estimated from frequency &times; probes</div>
      </div>
    </div>
  );
};

function getWorstOffender(executionLogs: FolderExecutionLogs): string | undefined {
  const counts = new Map<string, number>();
  executionLogs.failures.forEach((failure) => {
    counts.set(failure.job, (counts.get(failure.job) ?? 0) + 1);
  });
  return [...counts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0];
}

const getStyles = (theme: GrafanaTheme2) => ({
  row: css({
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
    gap: theme.spacing(1),
  }),
  tile: css({
    background: theme.colors.background.secondary,
    border: `1px solid ${theme.colors.border.weak}`,
    borderRadius: theme.shape.radius.default,
    padding: theme.spacing(1.5, 2),
    minWidth: 0,
  }),
  label: css({
    fontSize: theme.typography.bodySmall.fontSize,
    color: theme.colors.text.secondary,
  }),
  value: css({
    fontSize: theme.typography.h2.fontSize,
    fontWeight: theme.typography.fontWeightMedium,
    fontVariantNumeric: 'tabular-nums',
    margin: theme.spacing(0.5, 0),
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  }),
  detail: css({
    fontSize: theme.typography.bodySmall.fontSize,
    color: theme.colors.text.disabled,
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  }),
  up: css({ color: theme.colors.success.text }),
  down: css({ color: theme.colors.error.text }),
});
