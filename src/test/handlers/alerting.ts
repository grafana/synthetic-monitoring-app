import { ApiEntry } from 'test/handlers/types';
import { ListAlertsResponse } from 'datasource/responses.types';

export const getAlertRules: ApiEntry<ListAlertsResponse> = {
  route: `/api/ruler/1/api/v1/rules/synthetic_monitoring/default`,
  method: `get`,
  result: () => {
    return {
      json: {
        name: `default`,
        rules: [
          // {
          //   record: 'instance_job_severity:probe_success:mean5m',
          //   expr: '(sum without(probe, config_version) (rate(probe_all_success_sum[5m]) *\non(instance, job, probe) group_left(alert_sensitivity) max by(instance, job,\nprobe, alert_sensitivity) (sm_check_info{alert_sensitivity!=""})) / sum\nwithout(probe, config_version) (rate(probe_all_success_count[5m]) *\non(instance, job, probe) group_left(alert_sensitivity) max by(instance, job,\nprobe, alert_sensitivity) (sm_check_info{alert_sensitivity!=""}))) * 100',
          // },
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
