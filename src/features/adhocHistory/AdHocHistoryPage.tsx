import React, { useMemo, useState } from 'react';
import { ExpanderComponentProps, TableColumn } from 'react-data-table-component';
import { dateTimeFormat, GrafanaTheme2 } from '@grafana/data';
import { PluginPage } from '@grafana/runtime';
import { Alert, Badge, Button, EmptyState, Input, RadioButtonGroup, Stack, Text, useStyles2 } from '@grafana/ui';
import { css } from '@emotion/css';

import { AdHocHistoryRun, AdHocRunStatus } from './adhocHistory.types';
import { useCanReadLogs } from 'hooks/useDSPermission';
import { CenteredSpinner } from 'components/CenteredSpinner';
import { INSUFFICIENT_LOG_ACCESS_MESSAGE } from 'components/Checkster/feature/adhoc-check/constants';
import { LogsPanel } from 'components/Checkster/feature/adhoc-check/LogsPanel';
import { ProbeStateStatus } from 'components/Checkster/feature/adhoc-check/types.adhoc-check';
import { Table } from 'components/Table';

import {
  ADHOC_HISTORY_PAGE_NAV,
  ADHOC_HISTORY_TIME_RANGES,
  ADHOC_RUN_WINDOW_PADDING_MS,
  DEFAULT_ADHOC_HISTORY_TIME_RANGE,
} from './adhocHistory.constants';
import { useAdHocHistory, useAdHocRun } from './adhocHistory.hooks';
import { getRunSummary } from './adhocHistory.utils';

const ALL = 'all';

const CLIENT_NAMES: Record<string, string> = {
  'grafana-synthetic-monitoring-app': 'Synthetic Monitoring app',
  gcx: 'gcx',
  terraform: 'Terraform',
  'sm-go-client': 'Go client',
  unknown: 'Other client',
};

const STATUS_BADGES: Record<AdHocRunStatus, { text: string; color: 'green' | 'red' | 'darkgrey' }> = {
  passed: { text: 'Passed', color: 'green' },
  failed: { text: 'Failed', color: 'red' },
  unknown: { text: 'Unknown', color: 'darkgrey' },
};

const STATUS_OPTIONS = [
  { label: 'All', value: ALL },
  { label: 'Passed', value: 'passed' },
  { label: 'Failed', value: 'failed' },
  { label: 'Unknown', value: 'unknown' },
];

function getClientName(clientType?: string) {
  return clientType ? (CLIENT_NAMES[clientType] ?? clientType) : undefined;
}

function pluralizeProbes(count: number) {
  return `${count} probe${count === 1 ? '' : 's'}`;
}

export function AdHocHistoryPage() {
  const canReadLogs = useCanReadLogs();

  return (
    <PluginPage pageNav={ADHOC_HISTORY_PAGE_NAV}>
      {canReadLogs ? (
        <AdHocHistory />
      ) : (
        <EmptyState variant="not-found" message="Test run history unavailable">
          {`${INSUFFICIENT_LOG_ACCESS_MESSAGE}.`}
        </EmptyState>
      )}
    </PluginPage>
  );
}

function AdHocHistory() {
  const styles = useStyles2(getStyles);
  const [rangeMs, setRangeMs] = useState(DEFAULT_ADHOC_HISTORY_TIME_RANGE);
  const [end, setEnd] = useState(() => Date.now());
  const [search, setSearch] = useState('');
  const [client, setClient] = useState(ALL);
  const [checkType, setCheckType] = useState(ALL);
  const [status, setStatus] = useState(ALL);

  const { runs, isLoading, isError, hasNextPage, fetchNextPage, isFetchingNextPage, isClampedToRetention } =
    useAdHocHistory({ rangeMs, end });

  const clientOptions = useMemo(() => {
    const clients = [...new Set(runs.map((run) => run.clientType).filter((value): value is string => !!value))];

    return [{ label: 'All clients', value: ALL }, ...clients.map((value) => ({ label: getClientName(value)!, value }))];
  }, [runs]);

  const checkTypeOptions = useMemo(() => {
    const types = [...new Set(runs.map((run) => run.checkType).filter(Boolean))];

    return [{ label: 'All types', value: ALL }, ...types.map((value) => ({ label: value.toUpperCase(), value }))];
  }, [runs]);

  const filteredRuns = useMemo(() => {
    const searchTerm = search.trim().toLowerCase();

    return runs.filter((run) => {
      if (client !== ALL && run.clientType !== client) {
        return false;
      }

      if (checkType !== ALL && run.checkType !== checkType) {
        return false;
      }

      if (status !== ALL && getRunSummary(run).status !== status) {
        return false;
      }

      if (searchTerm && ![run.job, run.target].some((value) => value?.toLowerCase().includes(searchTerm))) {
        return false;
      }

      return true;
    });
  }, [runs, search, client, checkType, status]);

  const columns: Array<TableColumn<AdHocHistoryRun>> = [
    {
      name: 'Started',
      selector: (run) => run.time,
      format: (run) => dateTimeFormat(run.time),
      sortable: true,
    },
    {
      name: 'Check',
      grow: 3,
      cell: (run) => (
        <Stack direction="column" gap={0}>
          {run.job && <Text weight="medium">{run.job}</Text>}
          <Text color={run.job ? 'secondary' : undefined} variant={run.job ? 'bodySmall' : undefined}>
            {run.target}
          </Text>
        </Stack>
      ),
    },
    {
      name: 'Type',
      cell: (run) => run.checkType.toUpperCase(),
    },
    {
      name: 'Client',
      cell: (run) => getClientName(run.clientType) ?? <Text color="secondary">Not recorded</Text>,
    },
    {
      name: 'Status',
      cell: (run) => {
        const badge = STATUS_BADGES[getRunSummary(run).status];
        return <Badge text={badge.text} color={badge.color} />;
      },
    },
    {
      name: 'Probes',
      cell: (run) => {
        const summary = getRunSummary(run);

        return summary.status === 'unknown'
          ? `${pluralizeProbes(run.probes.length)} reported`
          : `${summary.passed}/${pluralizeProbes(summary.total)} passed`;
      },
    },
  ];

  return (
    <Stack direction="column" gap={2}>
      <Text color="secondary">
        Every test run of a check in this stack, whether it was started from the check editor, gcx or the API.
      </Text>

      <div className={styles.filters}>
        <RadioButtonGroup
          options={ADHOC_HISTORY_TIME_RANGES}
          value={rangeMs}
          onChange={(value) => {
            setRangeMs(value);
            setEnd(Date.now());
          }}
        />
        <Button variant="secondary" icon="sync" onClick={() => setEnd(Date.now())}>
          Refresh
        </Button>
      </div>

      <div className={styles.filters}>
        <Input
          className={styles.search}
          prefix={<span aria-hidden>🔍</span>}
          placeholder="Search by job or target"
          value={search}
          onChange={(event) => setSearch(event.currentTarget.value)}
        />
        <RadioButtonGroup options={clientOptions} value={client} onChange={setClient} />
        <RadioButtonGroup options={checkTypeOptions} value={checkType} onChange={setCheckType} />
        <RadioButtonGroup options={STATUS_OPTIONS} value={status} onChange={setStatus} />
      </div>

      {isClampedToRetention && (
        <Text color="secondary" variant="bodySmall">
          Test runs older than the logs retention period are no longer available.
        </Text>
      )}

      {isLoading && <CenteredSpinner />}

      {isError && (
        <Alert severity="error" title="Failed to load test runs">
          Refresh the page to try again.
        </Alert>
      )}

      {!isLoading && !isError && runs.length === 0 && (
        <EmptyState variant="not-found" message="No test runs found in this time range.">
          Test a check from the check editor or with gcx to see its results here.
        </EmptyState>
      )}

      {!isLoading && !isError && runs.length > 0 && (
        <>
          <Table<AdHocHistoryRun>
            id="adhoc-history-list"
            name="adhoc-history-list"
            data={filteredRuns}
            columns={columns}
            noDataText="No test runs match your filters."
            pagination
            paginationPerPage={25}
            pointerOnHover={false}
            expandableRows
            expandableComponent={AdHocRunDetails}
            expandTooltipText="Show probe results"
            dataTableProps={{ keyField: 'id' }}
          />

          {hasNextPage && (
            <div>
              <Button variant="secondary" size="sm" onClick={() => fetchNextPage()} disabled={isFetchingNextPage}>
                Load older test runs
              </Button>
            </div>
          )}
        </>
      )}
    </Stack>
  );
}

function AdHocRunDetails({ data: run }: ExpanderComponentProps<AdHocHistoryRun>) {
  const styles = useStyles2(getStyles);
  const { data: results, isLoading, isError } = useAdHocRun(run);
  const { missing, total } = getRunSummary(run);
  const labels = results?.find(({ line }) => line.labels?.length)?.line.labels ?? [];

  return (
    <div className={styles.details}>
      {isLoading && <CenteredSpinner />}

      {isError && (
        <Alert severity="error" title="Failed to load the probe results">
          Refresh the page to try again.
        </Alert>
      )}

      {labels.length > 0 && (
        <Stack gap={1} wrap="wrap">
          {labels.map(({ name, value }) => (
            <Badge key={name} text={`${name}=${value}`} color="blue" />
          ))}
        </Stack>
      )}

      {missing > 0 && (
        <Text color="warning" variant="bodySmall">
          {`${missing} of ${total} requested probes did not report a result.`}
        </Text>
      )}

      {results?.map(({ line }) => (
        <LogsPanel
          key={line.probe}
          logs={line.logs}
          probe={line.probe}
          state={ProbeStateStatus.Success}
          timeseries={line.timeseries}
          from={run.time - ADHOC_RUN_WINDOW_PADDING_MS}
          to={run.lastTime + ADHOC_RUN_WINDOW_PADDING_MS}
        />
      ))}
    </div>
  );
}

function getStyles(theme: GrafanaTheme2) {
  return {
    filters: css`
      display: flex;
      flex-wrap: wrap;
      gap: ${theme.spacing(1)};
      align-items: center;
    `,
    search: css`
      max-width: 320px;
    `,
    details: css`
      display: flex;
      flex-direction: column;
      gap: ${theme.spacing(1)};
      padding: ${theme.spacing(2, 2, 2, 6)};
      background: ${theme.colors.background.secondary};
    `,
  };
}
