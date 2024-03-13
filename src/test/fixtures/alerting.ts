import { ListPrometheusAlertsResponse } from 'datasource/responses.types';
import {
  ALERT_PROBE_SUCCESS_RECORDING_EXPR,
  ALERT_PROBE_SUCCESS_RECORDING_METRIC,
  DEFAULT_ALERT_LABELS,
  getDefaultAlertAnnotations,
  SM_ALERTING_NAMESPACE,
} from 'components/constants';

export const ALERTING_RULES: ListPrometheusAlertsResponse = {
  data: {
    groups: [
      {
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
