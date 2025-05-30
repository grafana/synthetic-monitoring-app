import { ALERTING_RULES, GRAFANA_ALERTING_RULES } from 'test/fixtures/alerting';
import { METRICS_DATASOURCE } from 'test/fixtures/datasources';

import { ApiEntry } from 'test/handlers/types';
import { AlertGroupResponse, ListPrometheusAlertsResponse } from 'datasource/responses.types';

export const getAlertRules: ApiEntry<AlertGroupResponse> = {
  route: `/api/ruler/${METRICS_DATASOURCE.uid}/api/v1/rules/synthetic_monitoring/default`,
  method: `get`,
  result: () => {
    return {
      json: {
        name: `default`,
        rules: [
          {
            record: 'instance_job_severity:probe_success:mean5m',
            expr: '(sum without(probe, config_version) (rate(probe_all_success_sum[5m]) *\non(instance, job, probe) group_left(alert_sensitivity) max by(instance, job,\nprobe, alert_sensitivity) (sm_check_info{alert_sensitivity!=""})) / sum\nwithout(probe, config_version) (rate(probe_all_success_count[5m]) *\non(instance, job, probe) group_left(alert_sensitivity) max by(instance, job,\nprobe, alert_sensitivity) (sm_check_info{alert_sensitivity!=""}))) * 100',
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
  route: `/api/prometheus/${METRICS_DATASOURCE.uid}/api/v1/rules`,
  method: `get`,
  result: () => {
    return {
      json: ALERTING_RULES,
    };
  },
};

export const getGrafanaAlertRules: ApiEntry<ListPrometheusAlertsResponse> = {
  route: `/api/prometheus/grafana/api/v1/rules`,
  method: `get`,
  result: () => {
    return {
      json: GRAFANA_ALERTING_RULES,
    };
  },
};
