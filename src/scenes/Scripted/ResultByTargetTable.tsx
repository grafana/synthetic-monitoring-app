import React, { useEffect, useMemo, useState } from 'react';
import { TableColumn } from 'react-data-table-component';
import { DataQueryError, dateTimeParse, GrafanaTheme2, LoadingState, PanelData } from '@grafana/data';
import { config } from '@grafana/runtime';
import { useQueryRunner, useTimeRange } from '@grafana/scenes-react';
import { Alert, LinkButton, LoadingPlaceholder, useStyles2 } from '@grafana/ui';
import { css } from '@emotion/css';
import { getAvgRequestExpectedResponseQuery } from 'queries/avgRequestExpectedResponse';
import { getAvgRequestLatencyQuery } from 'queries/avgRequestLatency';
import { getAvgRequestSuccessRateQuery } from 'queries/avgRequestSuccessRate';

import { CheckType } from 'types';
import { useMetricsDS } from 'hooks/useMetricsDS';
import { Table } from 'components/Table';

import { findValueByName, getValueFieldName, ResultsByTargetTableRefId } from './ResultByTargetTable.utils';
import { ResultsByTargetTableRow } from './ResultsByTargetTableRow';

export interface DataRow {
  name: string;
  method: string;
  expectedResponse: number;
  successRate: number;
  latency: number;
}

export const ResultsByTargetTable = ({ checkType }: { checkType: CheckType }) => {
  const metricsDS = useMetricsDS();
  const label = checkType === CheckType.Scripted ? 'name' : 'url';

  const avgRequestSuccessRateQuery = getAvgRequestSuccessRateQuery(label);
  const expectedResponseQuery = getAvgRequestExpectedResponseQuery(label);
  const latencyQuery = getAvgRequestLatencyQuery(label);

  const dataProvider = useQueryRunner({
    queries: [
      {
        expr: avgRequestSuccessRateQuery.expr,
        refId: ResultsByTargetTableRefId.SUCCESS_RATE,
        instant: avgRequestSuccessRateQuery.queryType === `instant`,
        legendFormat: '__auto',
        format: 'table',
        editorMode: 'code',
      },
      {
        expr: expectedResponseQuery.expr,
        refId: ResultsByTargetTableRefId.EXPECTED_RESPONSE,
        instant: expectedResponseQuery.queryType === `instant`,
        legendFormat: '__auto',
        format: 'table',
        editorMode: 'code',
      },
      {
        expr: latencyQuery.expr,
        refId: ResultsByTargetTableRefId.LATENCY,
        instant: latencyQuery.queryType === `instant`,
        format: 'table',
        editorMode: 'code',
      },
    ],
    datasource: metricsDS,
  });

  const { data } = dataProvider.useState();

  return <ResultsByTargetTableView data={data} checkType={checkType} />;
};

const ResultsByTargetTableView = ({ data, checkType }: { data?: PanelData; checkType: CheckType }) => {
  const [hasLoaded, setHasLoaded] = useState(false);
  const [hasStartedLoading, setHasStartedLoading] = useState(false);
  const [logTimeLimitExceeded, setLogTimeLimitExceeded] = useState(false);
  const styles = useStyles2(getStyles);
  const [currentTimeRange] = useTimeRange();

  useEffect(() => {
    const logQueryLimit = new Date().setDate(new Date().getDate() - 31);
    const from = dateTimeParse(currentTimeRange.from);
    if (from.valueOf() < logQueryLimit) {
      setLogTimeLimitExceeded(true);
    } else if (logTimeLimitExceeded) {
      setLogTimeLimitExceeded(false);
    }
  }, [currentTimeRange.from, logTimeLimitExceeded]);

  useEffect(() => {
    // This is a hack because the data Loading state initializes as "Done", then goes to "Loading", and then goes back to "Done"
    if (data?.state === LoadingState.Loading) {
      setHasStartedLoading(true);
    }
    if (data?.state === LoadingState.Done && hasStartedLoading && !hasLoaded) {
      setHasLoaded(true);
    }
  }, [data, hasLoaded, hasStartedLoading]);

  const columns = useMemo<Array<TableColumn<DataRow>>>(() => {
    return [
      { name: 'URL', selector: (row) => row.name },
      { name: 'Method', selector: (row) => row.method },
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
      {
        name: 'Expected response',
        selector: (row) => {
          let expectedResponse;
          if (isNaN(row.expectedResponse)) {
            expectedResponse = 'N/A';
          } else if (row.expectedResponse === 0) {
            expectedResponse = '0%';
          } else if (row.expectedResponse === 100) {
            expectedResponse = '100%';
          } else {
            expectedResponse = row.expectedResponse.toFixed(2) + '%';
          }
          return expectedResponse;
        },
      },
      {
        name: 'Latency',
        selector: (row) => {
          if (isNaN(row.latency)) {
            return 'N/A';
          }
          return (row.latency * 1000).toFixed(0) + 'ms';
        },
      },
    ];
  }, []);

  const tableData = useMemo(() => {
    if (!data || (data.errors && data.errors.length > 0) || !data.series?.[0]) {
      return [];
    }

    const expectedResponseSeries = data.series.find(
      (series) => series.refId === ResultsByTargetTableRefId.EXPECTED_RESPONSE
    );
    const latencySeries = data.series.find((series) => series.refId === ResultsByTargetTableRefId.LATENCY);
    const successRateSeries = data.series.find((series) => series.refId === ResultsByTargetTableRefId.SUCCESS_RATE);
    if (!successRateSeries || !expectedResponseSeries || !latencySeries) {
      return [];
    }
    const namesIndex = successRateSeries.fields?.findIndex((field) => field.name === 'name' || field.name === 'url');
    const successRateNamesField = successRateSeries?.fields?.[namesIndex];
    const methodIndex = successRateSeries.fields?.findIndex((field) => field.name === 'method');
    const successRateMethodField = successRateSeries.fields?.[methodIndex];

    if (!successRateNamesField || !successRateMethodField) {
      return [];
    }

    return (
      successRateNamesField.values.reduce<DataRow[]>((acc, name, index) => {
        const method = successRateMethodField.values?.[index] ?? '';
        const successRate =
          (1 -
            findValueByName(
              name,
              method,
              getValueFieldName(ResultsByTargetTableRefId.SUCCESS_RATE),
              successRateSeries?.fields ?? []
            )) *
          100;
        const expectedResponse =
          findValueByName(
            name,
            method,
            getValueFieldName(ResultsByTargetTableRefId.EXPECTED_RESPONSE),
            expectedResponseSeries?.fields ?? []
          ) * 100;
        const latency = findValueByName(
          name,
          method,
          getValueFieldName(ResultsByTargetTableRefId.LATENCY),
          latencySeries?.fields ?? []
        );

        acc.push({ name, method, successRate, latency, expectedResponse });
        return acc;
      }, []) ?? []
    );
  }, [data]);

  return (
    <div className={styles.container}>
      <div className={styles.headerContainer}>
        <h6 title="Results by URL" className={styles.title}>
          Results by URL
        </h6>
      </div>
      {logTimeLimitExceeded ? (
        <div className={styles.noDataContainer}>
          <Alert severity="warning" title="Time range beyond retention">
            The query that powers this panel is based on logs and the time range selected is beyond the retention period
            of logs. In order to see data, select a time range less than 31 days.
          </Alert>
        </div>
      ) : (
        <Table<DataRow>
          columns={columns}
          data={tableData}
          className={styles.table}
          expandableRows
          expandableComponent={({ data }) => <ResultsByTargetTableRow data={data} checkType={checkType} />}
          //@ts-ignore - noDataText expects a string, but we want to render a component and it works
          noDataText={<Placeholder state={data?.state} errors={data?.errors} hasLoaded={hasLoaded} />}
          pagination={false}
          id="assertion-table"
          name="Assertions"
          config={config}
        />
      )}
    </div>
  );
};

const Placeholder = ({
  state,
  errors,
  hasLoaded,
}: {
  state: LoadingState;
  errors?: DataQueryError[];
  hasLoaded: boolean;
}) => {
  const styles = useStyles2(getStyles);

  if (!hasLoaded) {
    return <LoadingPlaceholder text="Loading results by URL..." />;
  }

  if (state === LoadingState.Error) {
    return (
      <div className={styles.noDataContainer}>
        <Alert severity="error" title="Error loading URL results">
          {errors?.map((error) => error.message + '\n') ?? 'Unknown error'}
        </Alert>
      </div>
    );
  }

  return (
    <div className={styles.noDataContainer}>
      <p>There were no requests made in this script.</p>
      <LinkButton
        variant="primary"
        href="https://k6.io/docs/using-k6/http-requests/"
        target="_blank"
        rel="noopener noreferrer"
      >
        Learn more about making requests
      </LinkButton>
    </div>
  );
};

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
