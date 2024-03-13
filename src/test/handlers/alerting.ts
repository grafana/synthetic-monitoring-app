import { ALERTING_RULES } from 'test/fixtures/alerting';

import { ApiEntry } from 'test/handlers/types';
import { AlertGroupResponse, ListPrometheusAlertsResponse } from 'datasource/responses.types';
import { ALERT_PROBE_SUCCESS_RECORDING_EXPR } from 'components/constants';

export const getAlertRules: ApiEntry<AlertGroupResponse> = {
  route: `/api/ruler/1/api/v1/rules/synthetic_monitoring/default`,
  method: `get`,
  result: () => {
    return {
      json: {
        name: `default`,
        rules: [
          {
            record: 'instance_job_severity:probe_success:mean5m',
            expr: ALERT_PROBE_SUCCESS_RECORDING_EXPR,
          },
          {
            alert: 'SyntheticMonitoringCheckFailureAtHighSensitivity',
            expr: 'instance_job_severity:probe_success:mean5m{alert_sensitivity="high"} < 95',
            for: '5m',
            labels: {
              namespace: 'synthetic_monitoring',
            },
            annotations: {
              description:
                'check job {{ $labels.job }} instance {{ $labels.instance }} has a success rate of {{ printf "%.1f" $value }}%.',
              summary: 'check success below 95%',
            },
          },
          {
            alert: 'SyntheticMonitoringCheckFailureAtMediumSensitivity',
            expr: 'instance_job_severity:probe_success:mean5m{alert_sensitivity="medium"} < 90',
            for: '5m',
            labels: {
              namespace: 'synthetic_monitoring',
            },
            annotations: {
              description:
                'check job {{ $labels.job }} instance {{ $labels.instance }} has a success rate of {{ printf "%.1f" $value }}%.',
              summary: 'check success below 90%',
            },
          },
          {
            alert: 'SyntheticMonitoringCheckFailureAtLowSensitivity',
            expr: 'instance_job_severity:probe_success:mean5m{alert_sensitivity="low"} < 75',
            for: '5m',
            labels: {
              namespace: 'synthetic_monitoring',
            },
            annotations: {
              description:
                'check job {{ $labels.job }} instance {{ $labels.instance }} has a success rate of {{ printf "%.1f" $value }}%.',
              summary: 'check success below 75%',
            },
          },
        ],
      },
    };
  },
};

export const getPromAlertRules: ApiEntry<ListPrometheusAlertsResponse> = {
  route: `/api/prometheus/uid-1/api/v1/rules`,
  method: `get`,
  result: () => {
    return {
      json: ALERTING_RULES,
    };
  },
};
