import React, { useEffect, useMemo, useState } from 'react';
import { TableColumn } from 'react-data-table-component';
import { DataQueryError, GrafanaTheme2, LoadingState, PanelData } from '@grafana/data';
import { Alert, LinkButton, LoadingPlaceholder, useStyles2 } from '@grafana/ui';
import { css } from '@emotion/css';

import { Check, CheckType } from 'types';
import { Table } from 'components/Table';
import { DataRow } from 'scenes/Common/AssertionsTable.types';
import { AssertionTableRow } from 'scenes/Common/AssertionsTableRow';

export const AssertionsTableView = ({
  checkType,
  check,
  data,
}: {
  checkType: CheckType;
  check: Check;
  data?: PanelData;
}) => {
  const [hasLoaded, setHasLoaded] = useState(false);
  const [hasStartedLoading, setHasStartedLoading] = useState(false);
  const [logTimeLimitExceeded, setLogTimeLimitExceeded] = useState(false);
  const [logRetentionLimit, setLogRetentionLimit] = useState<string>();
  const styles = useStyles2(getStyles);

  useEffect(() => {
    // This is a hack because the data Loading state initializes as "Done", then goes to "Loading", and then goes back to "Done"
    if (data?.state === LoadingState.Loading) {
      setHasStartedLoading(true);
      setLogTimeLimitExceeded(false);
    }
    if (data?.state === LoadingState.Done && hasStartedLoading && !hasLoaded) {
      setHasLoaded(true);
    }
    // Detect if the time range is beyond the retention period of logs
    if (data?.state === LoadingState.Error && hasLimitExceededError(data.errors)) {
      const limit = getLogRetentionLimit(data.errors);
      setLogRetentionLimit(limit);
      setLogTimeLimitExceeded(true);
      setHasLoaded(true);
    }
  }, [data, hasLoaded, hasStartedLoading]);

  const columns = useMemo<Array<TableColumn<DataRow>>>(() => {
    return [
      { name: 'Assertion', selector: (row) => row.name },
      {
        name: 'Success',
        selector: (row) => {
          let successRate;
          if (isNaN(row.successRate) || row.successRate === 0) {
            successRate = '0%';
          } else if (row.successRate === 100) {
            successRate = '100%';
          } else {
            successRate = row.successRate.toFixed(2) + '%';
          }
          return successRate;
        },
      },
      { name: 'Success count', selector: (row) => row.successCount },
      { name: 'Failure count', selector: (row) => row.failureCount },
    ];
  }, []);

  const tableData = useMemo(() => {
    if (!data || (data.errors && data.errors.length > 0)) {
      return [];
    }
    const fields = data.series[0]?.fields;
    const name = fields?.find((field) => field.name === 'check');
    const successRateField = fields?.find((field) => field.config.displayName === 'Success rate');
    const successCountField = fields?.find((field) => field.config.displayName === 'Success count');
    const failureCountField = fields?.find((field) => field.config.displayName === 'Failure count');
    if (!name) {
      return [];
    }
    return (
      name.values.reduce<DataRow[]>((acc, name, index) => {
        const successRate = successRateField?.values?.[index] * 100;
        const successCount = successCountField?.values?.[index] ?? 0;
        const failureCount = failureCountField?.values?.[index] ?? 0;
        acc.push({ name, successRate, successCount, failureCount });
        return acc;
      }, []) ?? []
    );
  }, [data]);

  return (
    <div className={styles.container}>
      <div className={styles.headerContainer}>
        <h6 title="Assertions" className={styles.title}>
          Assertions
        </h6>
      </div>
      {logTimeLimitExceeded ? (
        <div className={styles.noDataContainer}>
          <Alert severity="warning" title="Time range beyond retention">
            The query that powers this panel is based on logs and the time range selected is beyond the retention period
            of logs. In order to see data, select a time range less than {logRetentionLimit ?? '31 days'}
          </Alert>
        </div>
      ) : (
        <Table<DataRow>
          columns={columns}
          data={tableData}
          expandableRows
          expandableComponent={({ data }) => <AssertionTableRow check={check} data={data} />}
          //@ts-ignore - noDataText expects a string, but we want to render a component and it works
          noDataText={<Placeholder checkType={checkType} state={data?.state} errors={data?.errors} />}
          pagination={false}
          id="assertion-table"
          name="Assertions"
        />
      )}
    </div>
  );
};

const Placeholder = ({
  checkType,
  state,
  errors,
}: {
  checkType: CheckType;
  state: LoadingState;
  errors?: DataQueryError[];
}) => {
  const styles = useStyles2(getPlaceholderStyles);

  if (state === LoadingState.Loading) {
    return <LoadingPlaceholder text="Loading assertions..." />;
  }
  if (state === LoadingState.Error) {
    return (
      <div className={styles.noDataContainer}>
        <Alert severity="error" title="Error loading assertions">
          {errors?.map((error) => error.message + '\n') ?? 'Unknown error'}
        </Alert>
      </div>
    );
  }
  return (
    <div className={styles.noDataContainer}>
      {checkType === CheckType.Scripted || checkType === CheckType.Browser ? (
        <p>There are no assertions in this script. You can use k6 Checks to validate conditions in your script.</p>
      ) : (
        <p>There are no assertions in the check. You can use assertions to validate conditions in your check</p>
      )}

      <LinkButton
        variant="primary"
        href={
          checkType === CheckType.Scripted || checkType === CheckType.Browser
            ? 'https://grafana.com/docs/k6/latest/using-k6/checks/'
            : 'https://grafana.com/docs/grafana-cloud/testing/synthetic-monitoring/create-checks/checks/multihttp/#assertions'
        }
        target="_blank"
        rel="noopener noreferrer"
      >
        Learn more about Checks
      </LinkButton>
    </div>
  );
};

function getLogRetentionLimit(errors?: DataQueryError[]) {
  if (errors) {
    for (const error of errors) {
      if (error.message?.includes('max_query_lookback')) {
        const limit = error.message.split('max_query_lookback ')?.[1]?.replace(/\(|\)/g, '');
        return limit;
      }
    }
  }
  return;
}

function hasLimitExceededError(errors?: DataQueryError[]) {
  return errors?.some((error) =>
    error.message?.includes('this data is no longer available, it is past now - max_query_lookback')
  );
}

function getStyles(theme: GrafanaTheme2) {
  return {
    container: css({
      border: `1px solid ${theme.components.panel.borderColor}`,
      width: '100%',
      borderRadius: theme.shape.radius.default,
    }),
    title: css({
      label: 'panel-title',
      display: 'block',
      marginBottom: 0, // override default h6 margin-bottom
      padding: theme.spacing(theme.components.panel.padding),
      textOverflow: 'ellipsis',
      overflow: 'hidden',
      whiteSpace: 'nowrap',
      fontSize: theme.typography.h6.fontSize,
      fontWeight: theme.typography.h6.fontWeight,
    }),
    headerContainer: css({
      label: 'panel-header',
      display: 'flex',
      alignItems: 'center',
    }),
    noDataContainer: css({
      padding: theme.spacing(4),
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
    }),
    table: css({
      '& > div': {
        display: 'flex',
      },
    }),
  };
}

function getPlaceholderStyles(theme: GrafanaTheme2) {
  return {
    noDataContainer: css({
      padding: theme.spacing(4),
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
    }),
  };
}
