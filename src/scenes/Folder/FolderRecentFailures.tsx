import React from 'react';
import { dateTimeFormat, GrafanaTheme2 } from '@grafana/data';
import { TextLink, useStyles2 } from '@grafana/ui';
import { css } from '@emotion/css';

import { Check } from 'types';
import { getCheckCompositeKey } from 'data/useCheckAlertStates';

import { formatLatency, getCheckDashboardHrefAtTime } from './FolderDashboard.utils';
import { FolderExecutionLogs } from './FolderSwimlane.hooks';

interface FolderRecentFailuresProps {
  checks: Check[];
  executionLogs: FolderExecutionLogs;
}

const MAX_FAILURES_SHOWN = 10;

export const FolderRecentFailures = ({ checks, executionLogs }: FolderRecentFailuresProps) => {
  const styles = useStyles2(getStyles);
  const { failures, isLoading } = executionLogs;

  if (isLoading || failures.length === 0) {
    return null;
  }

  const checksByKey = new Map(checks.map((check) => [getCheckCompositeKey(check.job, check.target), check]));
  const shown = failures.slice(0, MAX_FAILURES_SHOWN);

  return (
    <div className={styles.container}>
      <h3 className={styles.heading}>Recent failures &middot; last 3h</h3>
      <table className={styles.table}>
        <thead>
          <tr>
            <th>when</th>
            <th>check</th>
            <th>probe</th>
            <th className={styles.num}>failed after</th>
          </tr>
        </thead>
        <tbody>
          {shown.map((failure, index) => {
            const check = checksByKey.get(getCheckCompositeKey(failure.job, failure.instance));

            return (
              <tr key={`${failure.timestamp}-${failure.probe}-${index}`}>
                <td className={styles.when}>{dateTimeFormat(failure.timestamp, { format: 'HH:mm:ss' })}</td>
                <td>
                  {check ? (
                    <TextLink href={getCheckDashboardHrefAtTime(check, failure.timestamp)} inline={false}>
                      {failure.job}
                    </TextLink>
                  ) : (
                    failure.job
                  )}
                </td>
                <td>{failure.probe}</td>
                <td className={styles.num}>{formatLatency(failure.durationSeconds)}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
      {failures.length > MAX_FAILURES_SHOWN && (
        <div className={styles.more}>+ {failures.length - MAX_FAILURES_SHOWN} more in this window</div>
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
  table: css({
    width: '100%',
    borderCollapse: 'collapse',

    'th, td': {
      padding: theme.spacing(0.75, 1.5, 0.75, 0),
      borderBottom: `1px solid ${theme.colors.border.weak}`,
      textAlign: 'left',
    },

    th: {
      color: theme.colors.text.secondary,
      fontSize: theme.typography.bodySmall.fontSize,
      fontWeight: theme.typography.fontWeightMedium,
    },

    'tbody tr:last-child td': {
      borderBottom: 'none',
    },
  }),
  num: css({
    textAlign: 'right !important' as 'right',
    fontVariantNumeric: 'tabular-nums',
  }),
  when: css({
    fontVariantNumeric: 'tabular-nums',
    whiteSpace: 'nowrap',
  }),
  more: css({
    fontSize: theme.typography.bodySmall.fontSize,
    color: theme.colors.text.disabled,
    paddingTop: theme.spacing(1),
  }),
});
