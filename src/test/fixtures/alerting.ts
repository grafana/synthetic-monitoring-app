import { ListPrometheusAlertsResponse } from 'datasource/responses.types';

import {
  ALERT_PROBE_SUCCESS_RECORDING_EXPR,
  ALERT_PROBE_SUCCESS_RECORDING_METRIC,
  DEFAULT_ALERT_LABELS,
  getDefaultAlertAnnotations,
  SM_ALERTING_NAMESPACE,
} from './CONSTANTS_TEMP';

export const ALERTING_RULES: ListPrometheusAlertsResponse = {
  data: {
    groups: [
      {
        folderUid: 'default',
        evaulationTime: 0.01,
        file: SM_ALERTING_NAMESPACE,
        interval: 300,
        lastEvaluation: new Date().toISOString(),
        name: 'default',
        totals: null,
        rules: [
          {
            evaluationTime: 0.01,
            health: 'ok',
            lastEvaluation: new Date().toISOString(),
            name: `instance_job_severity:probe_success:mean5m`,
            query: ALERT_PROBE_SUCCESS_RECORDING_EXPR,
            type: `recording`,
          },
          {
            annotations: getDefaultAlertAnnotations(95),
            duration: 300,
            evaluationTime: 0.01,
            labels: DEFAULT_ALERT_LABELS,
            health: 'ok',
            lastEvaluation: new Date().toISOString(),
            name: `SyntheticMonitoringCheckFailureAtHighSensitivity`,
            query: `${ALERT_PROBE_SUCCESS_RECORDING_METRIC}{alert_sensitivity="high"} < 95`,
            state: 'inactive',
            type: `alerting`,
          },
          {
            annotations: getDefaultAlertAnnotations(90),
            duration: 300,
            evaluationTime: 0.01,
            labels: DEFAULT_ALERT_LABELS,
            health: 'ok',
            lastEvaluation: new Date().toISOString(),
            name: `SyntheticMonitoringCheckFailureAtMediumSensitivity`,
            query: `${ALERT_PROBE_SUCCESS_RECORDING_METRIC}{alert_sensitivity="medium"} < 90`,
            state: 'inactive',
            type: `alerting`,
          },
          {
            annotations: getDefaultAlertAnnotations(75),
            duration: 300,
            evaluationTime: 0.01,
            labels: DEFAULT_ALERT_LABELS,
            health: 'ok',
            lastEvaluation: new Date().toISOString(),
            name: `SyntheticMonitoringCheckFailureAtLowSensitivity`,
            query: `${ALERT_PROBE_SUCCESS_RECORDING_METRIC}{alert_sensitivity="low"} < 75`,
            state: 'inactive',
            type: `alerting`,
          },
        ],
      },
    ],
  },
  status: `success`,
};

export const GRAFANA_ALERTING_RULES: ListPrometheusAlertsResponse = {
  data: {
    groups: [
      {
        name: 'Failed Checks [5m]',
        file: 'Grafana Synthetic Monitoring',
        folderUid: 'grafana-synthetic-monitoring-app',
        rules: [
          {
            state: 'inactive',
            name: 'ProbeFailedExecutionsTooHigh [5m]',
            query:
              '(sum by(instance, job) (floor(increase(probe_all_success_count[5m]) - increase(probe_all_success_sum[5m]))) >= sum by (instance, job) (sm_alerts_threshold_probe_failed_executions_too_high{period="5m"})) * on (instance, job) group_right() max without(probe, region, geohash) (sm_check_info)',
            labels: {
              __grafana_origin: 'plugin/grafana-synthetic-monitoring-app',
              namespace: 'synthetic_monitoring',
            },
            health: 'ok',
            type: 'alerting',
            lastEvaluation: '2025-05-09T20:10:50Z',
            evaluationTime: 0.410487404,
            annotations: {
              description: 'Alert for failed probe executions',
              summary: 'Probe failed executions too high.',
            },
            duration: 300,
          },
        ],
        totals: null,
        interval: 60,
        lastEvaluation: '2025-05-09T20:10:50Z',
        evaulationTime: 0.410487404,
      },
      {
        name: 'TLS Certificate',
        file: 'Grafana Synthetic Monitoring',
        folderUid: 'grafana-synthetic-monitoring-app',
        rules: [
          {
            annotations: {
              description: 'TLS certificate close to expiring',
              summary:
                'The TLS certificate for job:{{ $labels.job }} and instance:{{ $labels.instance }} will expire in {{ printf "%.0f" $values.A.Value }} days.',
            },
            labels: {
              __grafana_origin: 'plugin/grafana-synthetic-monitoring-app',
              namespace: 'synthetic_monitoring',
            },
            health: 'ok',
            type: 'alerting',
            lastEvaluation: '2025-05-09T20:10:30Z',
            evaluationTime: 0.480036517,
            state: 'inactive',
            name: 'TLSTargetCertificateCloseToExpiring',
            query:
              '((min by(instance, job) (probe_ssl_earliest_cert_expiry) - time()) / (60 * 60 * 24) < sum by(instance, job) (sm_alerts_threshold_tls_target_certificate_close_to_expiring)) * on (instance, job) group_right() max without(probe, region, geohash) (sm_check_info)',
            duration: 300,
          },
        ],
        totals: null,
        interval: 60,
        lastEvaluation: '2025-05-09T20:10:30Z',
        evaulationTime: 0.480036517,
      },
    ],
  },
  status: `success`,
};
