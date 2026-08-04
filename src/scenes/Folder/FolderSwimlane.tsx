import React, { useState } from 'react';
import { dateTimeFormat, GrafanaTheme2 } from '@grafana/data';
import { Button, LoadingPlaceholder, TextLink, Tooltip, useStyles2 } from '@grafana/ui';
import { css } from '@emotion/css';

import { Check } from 'types';
import { getCheckCompositeKey } from 'data/useCheckAlertStates';

import { formatLatency, getCheckDashboardHref } from './FolderDashboard.utils';
import { ExecutionRecord, FolderExecutionLogs } from './FolderSwimlane.hooks';

interface FolderSwimlaneProps {
  checks: Check[];
  executionLogs: FolderExecutionLogs;
}

const AXIS_TICK_COUNT = 7;

// Checks are attention-ordered, so truncating large folders is safe: anything
// hidden below the fold is healthy.
export const VISIBLE_CHECKS_LIMIT = 25;

const FailureMark = ({
  record,
  positionPct,
  check,
}: {
  record: ExecutionRecord;
  positionPct: number;
  check: Check;
}) => {
  const styles = useStyles2(getStyles);

  return (
    <Tooltip
      content={`${dateTimeFormat(record.timestamp, { format: 'HH:mm:ss' })} · ${record.probe} · failed after ${formatLatency(
        record.durationSeconds
      )} · click to open check`}
    >
      <a
        href={getCheckDashboardHref(check)}
        className={styles.markFailed}
        style={{ left: `${positionPct}%` }}
        aria-label={`Open ${check.job} for the window containing the failed execution at ${dateTimeFormat(
          record.timestamp,
          { format: 'HH:mm:ss' }
        )} from ${record.probe}`}
      />
    </Tooltip>
  );
};

export const FolderSwimlane = ({ checks, executionLogs }: FolderSwimlaneProps) => {
  const styles = useStyles2(getStyles);
  const [showAll, setShowAll] = useState(false);
  const { timeRange, executionsByCheck, isLoading } = executionLogs;
  const windowMs = timeRange.to - timeRange.from;
  const visibleChecks = showAll ? checks : checks.slice(0, VISIBLE_CHECKS_LIMIT);

  if (isLoading) {
    return (
      <div className={styles.container}>
        <h3 className={styles.heading}>Executions &middot; last 3h</h3>
        <LoadingPlaceholder text="Loading execution history..." />
      </div>
    );
  }

  const toPct = (timestamp: number) => Math.min(100, Math.max(0, ((timestamp - timeRange.from) / windowMs) * 100));

  return (
    <div className={styles.container}>
      <h3 className={styles.heading}>Executions &middot; last 3h</h3>
      {visibleChecks.map((check) => {
        const records = executionsByCheck.get(getCheckCompositeKey(check.job, check.target)) ?? [];

        return (
          <div key={check.id ?? `${check.job}-${check.target}`} className={styles.lane}>
            <div className={styles.laneLabel} title={check.job}>
              <TextLink href={getCheckDashboardHref(check)} color="primary" inline={false}>
                {check.job}
              </TextLink>
            </div>
            <div className={styles.track}>
              {records.map((record, index) =>
                record.success ? (
                  <span
                    key={`${record.timestamp}-${record.probe}-${index}`}
                    className={styles.markSuccess}
                    style={{ left: `${toPct(record.timestamp)}%` }}
                    title={`${dateTimeFormat(record.timestamp, { format: 'HH:mm:ss' })} · ${record.probe} · ${formatLatency(
                      record.durationSeconds
                    )}`}
                  />
                ) : (
                  <FailureMark
                    key={`${record.timestamp}-${record.probe}-${index}`}
                    record={record}
                    positionPct={toPct(record.timestamp)}
                    check={check}
                  />
                )
              )}
              {records.length === 0 && <span className={styles.noData}>no executions in window</span>}
            </div>
          </div>
        );
      })}
      <div className={styles.axis}>
        <div />
        <div className={styles.axisTicks}>
          {Array.from({ length: AXIS_TICK_COUNT }, (_, index) => {
            const timestamp = timeRange.from + (index / (AXIS_TICK_COUNT - 1)) * windowMs;
            return <span key={index}>{dateTimeFormat(timestamp, { format: 'HH:mm' })}</span>;
          })}
        </div>
      </div>
      {!showAll && checks.length > VISIBLE_CHECKS_LIMIT && (
        <Button fill="text" size="sm" icon="angle-down" onClick={() => setShowAll(true)}>
          Show all {checks.length} checks
        </Button>
      )}
    </div>
  );
};

const getStyles = (theme: GrafanaTheme2) => ({
  container: css({
    background: theme.colors.background.secondary,
    border: `1px solid ${theme.colors.border.weak}`,
    borderRadius: theme.shape.radius.default,
    padding: theme.spacing(1.5, 2),
  }),
  heading: css({
    fontSize: theme.typography.bodySmall.fontSize,
    fontWeight: theme.typography.fontWeightMedium,
    color: theme.colors.text.secondary,
    margin: theme.spacing(0, 0, 1),
  }),
  lane: css({
    display: 'grid',
    gridTemplateColumns: '300px 1fr',
    alignItems: 'center',

    '& + &': {
      borderTop: `1px solid ${theme.colors.border.weak}`,
    },
  }),
  laneLabel: css({
    fontSize: theme.typography.bodySmall.fontSize,
    padding: theme.spacing(1, 1, 1, 0),
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  }),
  track: css({
    position: 'relative',
    height: '34px',
  }),
  markSuccess: css({
    position: 'absolute',
    top: '13px',
    width: '4px',
    height: '8px',
    borderRadius: theme.shape.radius.default,
    background: theme.colors.success.main,
    opacity: 0.5,
  }),
  markFailed: css({
    position: 'absolute',
    top: '10px',
    width: '6px',
    height: '14px',
    borderRadius: theme.shape.radius.default,
    background: theme.colors.error.main,
    cursor: 'pointer',
  }),
  noData: css({
    fontSize: theme.typography.bodySmall.fontSize,
    color: theme.colors.text.disabled,
    lineHeight: '34px',
  }),
  axis: css({
    display: 'grid',
    gridTemplateColumns: '300px 1fr',
  }),
  axisTicks: css({
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: theme.typography.bodySmall.fontSize,
    color: theme.colors.text.disabled,
    paddingTop: theme.spacing(0.5),
  }),
});
