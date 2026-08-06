import React, { useMemo } from 'react';
import { GrafanaTheme2 } from '@grafana/data';
import { Badge, Column, InteractiveTable, TextLink, useStyles2 } from '@grafana/ui';
import { css } from '@emotion/css';

import { Check } from 'types';
import { getCheckType } from 'utils';
import { AppRoutes } from 'routing/types';
import { generateRoutePath } from 'routing/utils';
import { CheckRuntimeAlertStates, getCheckRuntimeAlertState } from 'data/useCheckAlertStates';

import { VISIBLE_CHECKS_LIMIT } from './FolderDashboard.constants';
import { FolderCheckMetrics } from './FolderDashboard.hooks';
import { formatLatency, formatPercent, getCheckKey } from './FolderDashboard.utils';
import { FolderSection } from './FolderSection';
import { Sparkline } from './Sparkline';

interface FolderCheckTableProps {
  checks: Check[];
  metrics: FolderCheckMetrics;
  alertStates?: CheckRuntimeAlertStates;
}

interface CheckTableRow {
  id: string;
  check: Check;
  isUp?: boolean;
  reachability?: number;
  latency?: number;
  latencyTrend?: Array<[number, number]>;
  firingCount: number;
  firingAlertNames: string[];
}

type CellArgs = { row: { original: CheckTableRow } };

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

  // Row order comes from the page-level attention ordering, shared with the
  // swimlane so both sections tell the same top-down story — which is also
  // why the columns are deliberately not sortable. Large folders paginate:
  // the first page always holds the checks that most need attention.
  const data = useMemo<CheckTableRow[]>(
    () =>
      checks.map((check) => {
        const summary = metrics.getSummary(check);
        const alertState = alertStates ? getCheckRuntimeAlertState(alertStates, check) : undefined;

        return {
          id: getCheckKey(check),
          check,
          isUp: summary.isUp,
          reachability: summary.reachability,
          latency: summary.latency,
          latencyTrend: summary.latencyTrend,
          firingCount: alertState?.firingCount ?? 0,
          firingAlertNames: alertState ? [...alertState.firingAlertNames] : [],
        };
      }),
    [checks, metrics, alertStates]
  );

  const columns = useMemo<Array<Column<CheckTableRow>>>(
    () => [
      {
        id: 'check',
        header: 'Check',
        cell: ({ row }: CellArgs) => (
          <div className={styles.nameCell}>
            <TextLink
              href={generateRoutePath(AppRoutes.CheckDashboard, { id: row.original.check.id! })}
              color="primary"
              inline={false}
            >
              {row.original.check.job}
            </TextLink>
            <div className={styles.target} title={row.original.check.target}>
              {row.original.check.target}
            </div>
          </div>
        ),
      },
      {
        id: 'type',
        header: 'Type',
        cell: ({ row }: CellArgs) => (
          <Badge text={getCheckType(row.original.check.settings).toUpperCase()} color="darkgrey" />
        ),
      },
      {
        id: 'state',
        header: 'State',
        cell: ({ row }: CellArgs) => (
          <>
            <StateCell isUp={row.original.isUp} />
            {row.original.firingCount > 0 && (
              <Badge
                className={styles.alertBadge}
                text={`${row.original.firingCount} firing`}
                color="red"
                icon="bell"
                tooltip={row.original.firingAlertNames.join(', ')}
              />
            )}
          </>
        ),
      },
      {
        id: 'reachability',
        header: 'Reachability · 3h',
        cell: ({ row }: CellArgs) => (
          <span className={styles.num}>
            {row.original.reachability !== undefined ? formatPercent(row.original.reachability) : '—'}
          </span>
        ),
      },
      {
        id: 'latency',
        header: 'Latency · 3h',
        cell: ({ row }: CellArgs) => (
          <span className={styles.num}>
            {row.original.latency !== undefined ? formatLatency(row.original.latency) : '—'}
          </span>
        ),
      },
      {
        id: 'trend',
        header: 'Trend',
        cell: ({ row }: CellArgs) =>
          row.original.latencyTrend ? <Sparkline points={row.original.latencyTrend} /> : null,
      },
      {
        id: 'actions',
        header: '',
        disableGrow: true,
        cell: ({ row }: CellArgs) => (
          <TextLink href={generateRoutePath(AppRoutes.CheckDashboard, { id: row.original.check.id! })} inline={false}>
            View dashboard
          </TextLink>
        ),
      },
    ],
    [styles]
  );

  return (
    <FolderSection>
      <InteractiveTable columns={columns} data={data} getRowId={(row) => row.id} pageSize={VISIBLE_CHECKS_LIMIT} />
    </FolderSection>
  );
};

const getStyles = (theme: GrafanaTheme2) => ({
  // Left-aligned like the headers (InteractiveTable has no per-column
  // alignment); tabular numerals keep digits lined up across rows.
  num: css({
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
});
