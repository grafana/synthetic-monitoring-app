import React, { useState } from 'react';
import { GrafanaTheme2 } from '@grafana/data';
import { Badge, Button, TextLink, useStyles2 } from '@grafana/ui';
import { css } from '@emotion/css';

import { Check } from 'types';
import { getCheckType } from 'utils';
import { AppRoutes } from 'routing/types';
import { generateRoutePath } from 'routing/utils';
import { CheckRuntimeAlertStates, getCheckRuntimeAlertState } from 'data/useCheckAlertStates';

import { FolderCheckMetrics } from './FolderDashboard.hooks';
import { formatLatency, formatPercent } from './FolderDashboard.utils';
import { VISIBLE_CHECKS_LIMIT } from './FolderSwimlane';
import { Sparkline } from './Sparkline';

interface FolderCheckTableProps {
  checks: Check[];
  metrics: FolderCheckMetrics;
  alertStates?: CheckRuntimeAlertStates;
}

const StateCell = ({ isUp }: { isUp?: boolean }) => {
  const styles = useStyles2(getStyles);

  if (isUp === undefined) {
    return <span className={styles.stateUnknown}>No data</span>;
  }

  return isUp ? (
    <span className={styles.stateUp}>
      <span className={styles.dot} /> Up
    </span>
  ) : (
    <span className={styles.stateDown}>
      <span className={styles.dot} /> Down
    </span>
  );
};

export const FolderCheckTable = ({ checks, metrics, alertStates }: FolderCheckTableProps) => {
  const styles = useStyles2(getStyles);
  const [showAll, setShowAll] = useState(false);
  const visibleChecks = showAll ? checks : checks.slice(0, VISIBLE_CHECKS_LIMIT);

  // Row order comes from the page-level attention ordering, shared with the
  // swimlane so both sections tell the same top-down story.
  return (
    <table className={styles.table}>
      <thead>
        <tr>
          <th>check</th>
          <th>type</th>
          <th>state</th>
          <th className={styles.num}>reachability &middot; 3h</th>
          <th className={styles.num}>latency &middot; 3h</th>
          <th>trend</th>
          <th></th>
        </tr>
      </thead>
      <tbody>
        {visibleChecks.map((check) => {
          const summary = metrics.getSummary(check);
          const alertState = alertStates ? getCheckRuntimeAlertState(alertStates, check) : undefined;

          return (
            <tr key={check.id ?? `${check.job}-${check.target}`}>
              <td className={styles.nameCell}>
                <TextLink
                  href={generateRoutePath(AppRoutes.CheckDashboard, { id: check.id! })}
                  color="primary"
                  inline={false}
                >
                  {check.job}
                </TextLink>
                <div className={styles.target}>{check.target}</div>
              </td>
              <td>
                <Badge text={getCheckType(check.settings).toUpperCase()} color="darkgrey" />
              </td>
              <td>
                <StateCell isUp={summary.isUp} />
                {alertState && alertState.firingCount > 0 && (
                  <Badge
                    className={styles.alertBadge}
                    text={`${alertState.firingCount} firing`}
                    color="red"
                    icon="bell"
                    tooltip={[...alertState.firingAlertNames].join(', ')}
                  />
                )}
              </td>
              <td className={styles.num}>{summary.reachability !== undefined ? formatPercent(summary.reachability) : '—'}</td>
              <td className={styles.num}>{summary.latency !== undefined ? formatLatency(summary.latency) : '—'}</td>
              <td>{summary.latencyTrend ? <Sparkline points={summary.latencyTrend} /> : null}</td>
              <td className={styles.actions}>
                <TextLink href={generateRoutePath(AppRoutes.CheckDashboard, { id: check.id! })} inline={false}>
                  View check dashboard
                </TextLink>
              </td>
            </tr>
          );
        })}
      </tbody>
      {!showAll && checks.length > VISIBLE_CHECKS_LIMIT && (
        <tfoot>
          <tr>
            <td colSpan={7}>
              <Button fill="text" size="sm" icon="angle-down" onClick={() => setShowAll(true)}>
                Show all {checks.length} checks
              </Button>
            </td>
          </tr>
        </tfoot>
      )}
    </table>
  );
};

const getStyles = (theme: GrafanaTheme2) => ({
  table: css({
    width: '100%',
    borderCollapse: 'collapse',
    background: theme.colors.background.secondary,
    border: `1px solid ${theme.colors.border.weak}`,
    borderRadius: theme.shape.radius.default,

    'th, td': {
      padding: theme.spacing(1, 1.5),
      borderBottom: `1px solid ${theme.colors.border.weak}`,
      textAlign: 'left',
      verticalAlign: 'middle',
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
  nameCell: css({
    maxWidth: '340px',
  }),
  target: css({
    fontSize: theme.typography.bodySmall.fontSize,
    color: theme.colors.text.disabled,
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  }),
  stateUp: css({ color: theme.colors.success.text, whiteSpace: 'nowrap' }),
  stateDown: css({ color: theme.colors.error.text, whiteSpace: 'nowrap' }),
  stateUnknown: css({ color: theme.colors.text.disabled, whiteSpace: 'nowrap' }),
  dot: css({
    display: 'inline-block',
    width: '8px',
    height: '8px',
    borderRadius: theme.shape.radius.circle,
    background: 'currentcolor',
    marginRight: theme.spacing(0.5),
  }),
  alertBadge: css({
    marginLeft: theme.spacing(1),
  }),
  actions: css({
    whiteSpace: 'nowrap',
    textAlign: 'right',
  }),
});
