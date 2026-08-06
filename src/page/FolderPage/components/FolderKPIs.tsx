import React, { ReactNode, useMemo } from 'react';
import { GrafanaTheme2 } from '@grafana/data';
import { Box, Icon, Text, TextLink, useStyles2 } from '@grafana/ui';
import { css } from '@emotion/css';
import pluralize from 'pluralize';

import { Check } from 'types';
import { DEFAULT_FOLDER_TITLE } from 'data/folders.constants';
import { CheckRuntimeAlertStates, getCheckCompositeKey, getCheckRuntimeAlertState } from 'data/useCheckAlertStates';

import { FolderCheckMetrics } from './FolderDashboard.hooks';
import { formatPercent, getExecutionsPerMonth } from './FolderDashboard.utils';
import { FolderExecutionLogs } from './FolderSwimlane.hooks';

// Grafana's unified alerting list, pre-filtered to firing synthetic
// monitoring rules — same link pattern the per-check alert statuses use.
// The search `namespace:` matches the rule folder's title (SM creates its
// per-check rules in the default SM folder), not the metric namespace label.
const FIRING_SM_ALERTS_URL = `/alerting/list?${new URLSearchParams({
  search: `state:firing namespace:"${DEFAULT_FOLDER_TITLE}"`,
})}`;

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
      <Tile
        label="Checks"
        detail={
          metrics.isLoading
            ? 'loading check states'
            : downCount > 0
              ? formatDownDetail(downChecks, knownCount)
              : knownCount > 0
                ? 'all checks passing'
                : 'no state data yet'
        }
        detailTitle={downCount > 0 ? `down: ${downChecks.map((check) => check.job).join(', ')}` : undefined}
      >
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
      </Tile>
      <Tile
        label="Lowest reachability · 3h"
        detail={worstReachability !== undefined ? worstReachability.check.job : 'no reachability data'}
        detailTitle={worstReachability?.check.job}
      >
        {worstReachability !== undefined ? formatPercent(worstReachability.reachability) : '—'}
      </Tile>
      <Tile
        label="Firing alerts"
        detail={
          firingAlerts.count > 0 ? (
            <>
              {firingAlerts.checkCount} {pluralize('check', firingAlerts.checkCount)} alerting ·{' '}
              {/* The link text names the destination (the alerting rule list, not the
                  checks) and never breaks mid-link when the tile wraps. */}
              <span className={styles.noWrap}>
                <TextLink href={FIRING_SM_ALERTS_URL}>view rules</TextLink>
              </span>
            </>
          ) : (
            'none firing'
          )
        }
      >
        {firingAlerts.count > 0 && <Icon name="bell" className={styles.down} size="lg" />}{' '}
        {alertStates ? firingAlerts.count : '—'}
      </Tile>
      <Tile
        label="Failed executions · 3h"
        detail={
          executionLogs.isLoading
            ? 'loading execution history'
            : executionLogs.isError
              ? 'execution history unavailable'
              : failureCount > 0 && worstOffender
                ? `most from ${worstOffender}`
                : 'no failures in window'
        }
        detailTitle={worstOffender ? `most from ${worstOffender}` : undefined}
      >
        {executionLogs.isLoading || executionLogs.isError ? '—' : failureCount}
      </Tile>
      <Tile label="Executions / month" detail="estimated from frequency × probes">
        {executionsPerMonth.toLocaleString()}
      </Tile>
    </div>
  );
};

interface TileProps {
  label: string;
  detail: ReactNode;
  /** Full detail text, surfaced on hover when the visible detail is summarized or clamped. */
  detailTitle?: string;
  children: ReactNode;
}

// The KPI value + detail layout has no @grafana/ui equivalent (BigValue only
// carries a title and a value, at fixed pixel sizes), so the card chrome
// comes from the Box primitive and the text stays bespoke.
const Tile = ({ label, detail, detailTitle, children }: TileProps) => {
  const styles = useStyles2(getStyles);

  return (
    <Box
      backgroundColor="secondary"
      borderStyle="solid"
      borderColor="weak"
      borderRadius="default"
      paddingX={2}
      paddingY={1.5}
      minWidth={0}
    >
      <Text variant="bodySmall" color="secondary">
        {label}
      </Text>
      <div className={styles.value}>{children}</div>
      <div className={styles.detail} title={detailTitle}>
        {detail}
      </div>
    </Box>
  );
};

const MAX_DOWN_JOBS_LISTED = 2;

// A tile can't fit an arbitrary list of job names: name the first couple and
// summarize the rest. The full list is on the tile's hover title, and the
// check table below leads with the down checks anyway (attention ordering).
function formatDownDetail(downChecks: Check[], knownCount: number): string {
  if (downChecks.length === knownCount && knownCount > 1) {
    return 'all checks down';
  }

  const jobs = downChecks.map((check) => check.job);

  if (jobs.length <= MAX_DOWN_JOBS_LISTED) {
    return `down: ${jobs.join(', ')}`;
  }

  return `down: ${jobs.slice(0, MAX_DOWN_JOBS_LISTED).join(', ')} +${jobs.length - MAX_DOWN_JOBS_LISTED} more`;
}

// Aggregate by the job + instance pair (a check's identity everywhere on this
// page) so reused job names across checks stay distinct; display the job.
function getWorstOffender(executionLogs: FolderExecutionLogs): string | undefined {
  const counts = new Map<string, { job: string; count: number }>();
  executionLogs.failures.forEach((failure) => {
    const key = getCheckCompositeKey(failure.job, failure.instance);
    const existing = counts.get(key);
    counts.set(key, { job: failure.job, count: (existing?.count ?? 0) + 1 });
  });
  return [...counts.values()].sort((a, b) => b.count - a.count)[0]?.job;
}

const getStyles = (theme: GrafanaTheme2) => ({
  row: css({
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
    gap: theme.spacing(1),
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
  // Wrap up to two lines instead of single-line ellipsis: tile details carry
  // check names, which truncate to noise at narrow widths. The title
  // attribute exposes the full text when two lines still aren't enough.
  detail: css({
    fontSize: theme.typography.bodySmall.fontSize,
    color: theme.colors.text.disabled,
    display: '-webkit-box',
    WebkitLineClamp: 2,
    WebkitBoxOrient: 'vertical',
    overflow: 'hidden',
    overflowWrap: 'anywhere',
  }),
  up: css({ color: theme.colors.success.text }),
  down: css({ color: theme.colors.error.text }),
  noWrap: css({ whiteSpace: 'nowrap' }),
});
