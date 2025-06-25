import React from 'react';
import { useDataTransformer, useQueryRunner } from '@grafana/scenes-react';

import { Check, CheckType } from 'types';
import { useLogsDS } from 'hooks/useLogsDS';
import { QUERY_FAILURE_COUNT, QUERY_SUCCESS_COUNT, QUERY_SUCCESS_RATE } from 'scenes/Common/AssertionsTable.constants';
import { AssertionsTableView } from 'scenes/Common/AssertionsTableView';

export const AssertionsTable = ({ checkType, check }: { checkType: CheckType; check: Check }) => {
  const logsDs = useLogsDS();

  const dataProvider = useQueryRunner({
    queries: [
      {
        expr: QUERY_SUCCESS_RATE,
        refId: 'successRate',
        queryType: 'instant',
      },
      {
        expr: QUERY_SUCCESS_COUNT,
        refId: 'successCount',
        queryType: 'instant',
      },
      {
        expr: QUERY_FAILURE_COUNT,
        refId: 'failureCount',
        queryType: 'instant',
      },
    ],
    datasource: logsDs,
  });

  const dataTransformer = useDataTransformer({
    data: dataProvider,
    transformations: [
      {
        id: 'joinByField',
        options: {
          byField: 'check',
          mode: 'outer',
        },
      },
      {
        id: 'organize',
        options: {
          excludeByName: {
            'Time 1': true,
            'Time 2': true,
            'Time 3': true,
          },
          indexByName: {},
          renameByName: {
            'Value #successRate': 'Success rate',
            'Value #successCount': 'Success count',
            'Value #failureCount': 'Failure count',
          },
        },
      },
    ],
  });

  const { data } = dataTransformer.useState();

  return <AssertionsTableView data={data} checkType={checkType} check={check} />;
};
