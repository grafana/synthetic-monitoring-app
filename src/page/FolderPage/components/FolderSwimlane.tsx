import React, { useState } from 'react';
import { dateTimeFormat, GrafanaTheme2 } from '@grafana/data';
import { Alert, Button, LoadingPlaceholder, TextLink, useStyles2 } from '@grafana/ui';
import { css } from '@emotion/css';

import { Check } from 'types';
import { getCheckCompositeKey } from 'data/useCheckAlertStates';

import { VISIBLE_CHECKS_LIMIT } from './FolderDashboard.constants';
import { formatLatency, getCheckDashboardHref, getCheckKey } from './FolderDashboard.utils';
import { FolderSection } from './FolderSection';
import { ExecutionRecord, FolderExecutionLogs } from './FolderSwimlane.hooks';

interface FolderSwimlaneProps {
  checks: Check[];
  executionLogs: FolderExecutionLogs;
}

const AXIS_TICK_COUNT = 7;

// Native `title` (like the success marks) rather than a floating Tooltip
// component: the live window advances every refresh interval, remounting the
// marks — a floating tooltip whose anchor unmounts mid-hover is orphaned and
// sticks to the screen until the next hover.
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
    <a
      href={getCheckDashboardHref(check)}
      className={styles.markFailed}
      style={{ left: `${positionPct}%` }}
      title={`${dateTimeFormat(record.timestamp, { format: 'HH:mm:ss' })} · ${record.probe} · failed after ${formatLatency(
        record.durationSeconds
      )} · click to open check`}
      aria-label={`Open ${check.job} for the window containing the failed execution at ${dateTimeFormat(
        record.timestamp,
        { format: 'HH:mm:ss' }
      )} from ${record.probe}`}
    />
  );
};

export const FolderSwimlane = ({ checks, executionLogs }: FolderSwimlaneProps) => {
  const styles = useStyles2(getStyles);
  const [showAll, setShowAll] = useState(false);
  const { timeRange, executionsByCheck, isLoading, isError } = executionLogs;
  const windowMs = timeRange.to - timeRange.from;
  const visibleChecks = showAll ? checks : checks.slice(0, VISIBLE_CHECKS_LIMIT);

  if (isLoading) {
    return (
      <FolderSection title="Executions · last 3h">
        <LoadingPlaceholder text="Loading execution history..." />
      </FolderSection>
    );
  }

  // Very large folders can exceed the log query size limits — say so instead
  // of rendering every lane as a misleading "no executions in window".
  if (isError) {
    return (
      <FolderSection title="Executions · last 3h">
        <Alert severity="error" title="Failed to load execution history">
          The execution history query failed. This can happen in folders with a very large number of checks.
        </Alert>
      </FolderSection>
    );
  }

  const toPct = (timestamp: number) => Math.min(100, Math.max(0, ((timestamp - timeRange.from) / windowMs) * 100));

  return (
    <FolderSection title="Executions · last 3h">
      {visibleChecks.map((check) => {
        const records = executionsByCheck.get(getCheckCompositeKey(check.job, check.target)) ?? [];
        const failureCount = records.filter((record) => !record.success).length;

        return (
          <div key={getCheckKey(check)} className={styles.lane}>
            <div className={styles.laneLabel} title={check.job}>
              <TextLink href={getCheckDashboardHref(check)} color="primary" inline={false}>
                {check.job}
              </TextLink>
              {/* The marks are hover/mouse targets; give screen readers a per-lane summary instead. */}
              {records.length > 0 && (
                <span className={styles.srOnly}>
                  {records.length} executions, {failureCount} failed in window
                </span>
              )}
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
    </FolderSection>
  );
};

const getStyles = (theme: GrafanaTheme2) => ({
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
  // Standard visually-hidden pattern (@grafana/ui doesn't ship one in this
  // version): present to screen readers, removed from the visual layout.
  srOnly: css({
    position: 'absolute',
    width: '1px',
    height: '1px',
    padding: 0,
    margin: '-1px',
    overflow: 'hidden',
    clip: 'rect(0, 0, 0, 0)',
    whiteSpace: 'nowrap',
    border: 0,
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
