import { SceneQueryRunner } from '@grafana/scenes';
import { DataSourceRef } from '@grafana/schema';

import { CheckType } from 'types';

import { RESULTS_BY_TARGET_TABLE_REF_ID } from './utils';

export function getQueryRunner(metrics: DataSourceRef, checkType: CheckType) {
  const label = checkType === CheckType.Scripted ? 'name' : 'url';
  return new SceneQueryRunner({
    queries: [
      {
        datasource: metrics,
        editorMode: 'code',
        exemplar: false,
        expr: `
          avg_over_time(
            (
              sum by (${label}, method) (probe_http_requests_failed_total{job="$job", instance="$instance"})
              /
              sum by (${label}, method) (probe_http_requests_total{job="$job", instance="$instance"})
            )[$__range:]
          )
          `,
        format: 'table',
        instant: true,
        legendFormat: '__auto',
        range: false,
        refId: RESULTS_BY_TARGET_TABLE_REF_ID.SUCCESS_RATE,
      },
      {
        datasource: metrics,
        editorMode: 'code',
        exemplar: false,
        expr: `
          avg_over_time(
            (
              sum by (${label}, method) (probe_http_got_expected_response{job="$job", instance="$instance"})
              /
              count by (${label}, method)(probe_http_got_expected_response{job="$job", instance="$instance"})
            )[$__range:]
          )`,
        format: 'table',
        instant: true,
        legendFormat: '__auto',
        range: false,
        refId: RESULTS_BY_TARGET_TABLE_REF_ID.EXPECTED_RESPONSE,
      },
      {
        datasource: metrics,
        editorMode: 'code',
        exemplar: false,
        expr: `
          avg_over_time(
            (
              sum by (${label}, method)(probe_http_duration_seconds{job="$job", instance="$instance"})
            )[$__range:]
          )`,
        format: 'table',
        instant: true,
        refId: RESULTS_BY_TARGET_TABLE_REF_ID.LATENCY,
      },
    ],
  });
}
