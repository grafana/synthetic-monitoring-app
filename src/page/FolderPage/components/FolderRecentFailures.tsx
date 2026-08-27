import React, { useMemo } from 'react';
import { dateTimeFormat, GrafanaTheme2 } from '@grafana/data';
import { Column, InteractiveTable, TextLink, useStyles2 } from '@grafana/ui';
import { css } from '@emotion/css';

import { Check } from 'types';
import { getCheckCompositeKey } from 'data/useCheckAlertStates';

import { formatLatency, getCheckDashboardHref } from './FolderDashboard.utils';
import { FolderSection } from './FolderSection';
import { FolderExecutionLogs } from './FolderSwimlane.hooks';

interface FolderRecentFailuresProps {
  checks: Check[];
  executionLogs: FolderExecutionLogs;
}

interface FailureRow {
  id: string;
  timestamp: number;
  job: string;
  probe: string;
  durationSeconds: number;
  check?: Check;
}

type CellArgs = { row: { original: FailureRow } };

const MAX_FAILURES_SHOWN = 10;

export const FolderRecentFailures = ({ checks, executionLogs }: FolderRecentFailuresProps) => {
  const styles = useStyles2(getStyles);
  const { failures, isLoading } = executionLogs;

  // All failures in the window, newest first, paginated — the first page is
  // what "recent failures" means; older pages stay reachable.
  const data = useMemo<FailureRow[]>(() => {
    const checksByKey = new Map(checks.map((check) => [getCheckCompositeKey(check.job, check.target), check]));

    return failures.map((failure, index) => ({
      id: `${failure.timestamp}-${failure.probe}-${index}`,
      timestamp: failure.timestamp,
      job: failure.job,
      probe: failure.probe,
      durationSeconds: failure.durationSeconds,
      check: checksByKey.get(getCheckCompositeKey(failure.job, failure.instance)),
    }));
  }, [failures, checks]);

  const columns = useMemo<Array<Column<FailureRow>>>(
    () => [
      {
        id: 'timestamp',
        header: 'When',
        cell: ({ row }: CellArgs) => (
          <span className={styles.num}>{dateTimeFormat(row.original.timestamp, { format: 'HH:mm:ss' })}</span>
        ),
      },
      {
        id: 'job',
        header: 'Check',
        cell: ({ row }: CellArgs) =>
          row.original.check ? (
            <TextLink href={getCheckDashboardHref(row.original.check)} inline={false}>
              {row.original.job}
            </TextLink>
          ) : (
            row.original.job
          ),
      },
      {
        id: 'probe',
        header: 'Probe',
        cell: ({ row }: CellArgs) => row.original.probe,
      },
      {
        id: 'durationSeconds',
        header: 'Failed after',
        cell: ({ row }: CellArgs) => <span className={styles.num}>{formatLatency(row.original.durationSeconds)}</span>,
      },
    ],
    [styles]
  );

  if (isLoading || failures.length === 0) {
    return null;
  }

  return (
    <FolderSection title="Recent failures · last 3h">
      <InteractiveTable columns={columns} data={data} getRowId={(row) => row.id} pageSize={MAX_FAILURES_SHOWN} />
    </FolderSection>
  );
};

const getStyles = (theme: GrafanaTheme2) => ({
  num: css({
    fontVariantNumeric: 'tabular-nums',
  }),
});
