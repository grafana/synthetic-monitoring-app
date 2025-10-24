import { type InstanceMatchResult } from '@grafana/alerting';

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
            uid: 'sm-failed-executions-5m-2dfe8c9a',
          },
        ],
        totals: null,
        interval: 60,
        lastEvaluation: '2025-05-09T20:10:50Z',
        evaulationTime: 0.410487404,
      },
      /*{
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
            uid: 'sm-certificate-expiry-2dfe8c9a',
          },
        ],
        totals: null,
        interval: 60,
        lastEvaluation: '2025-05-09T20:10:30Z',
        evaulationTime: 0.480036517,
      },*/
    ],
  },
  status: `success`,
};

export const MOCK_PROBE_FAILED_ROUTE_MATCH: InstanceMatchResult = {
  labels: [
    ['job', 'test_http'],
    ['instance', 'http://example.com'],
    ['check_name', 'http'],
    ['frequency', '10000'],
    ['namespace', 'synthetic_monitoring'],
    ['grafana_folder', 'Grafana Synthetic Monitoring'],
    ['label_per_check_alerts', 'true'],
    ['alertname', 'ProbeFailedExecutionsTooHigh'],
    ['label_notification', 'email'],
  ],
  matchedRoutes: [
    {
      route: {
        id: 'route-6',
        matchers: [{ type: '=', label: 'label_per_check_alerts', value: 'true' }],
        continue: true,
        routes: [],
        receiver: 'Email contact point',
      },
      routeTree: { metadata: { name: 'user-defined' }, expandedSpec: { id: 'route-3' } },
      matchDetails: {
        route: { id: 'route-6' },
        labels: [
          ['job', 'test_http'],
          ['instance', 'http://example.com'],
          ['check_name', 'http'],
          ['frequency', '10000'],
          ['namespace', 'synthetic_monitoring'],
          ['grafana_folder', 'Grafana Synthetic Monitoring'],
          ['label_per_check_alerts', 'true'],
          ['alertname', 'ProbeFailedExecutionsTooHigh'],
          ['label_notification', 'email'],
        ],
        matchingJourney: [
          {
            route: {
              id: 'route-3',
              receiver: 'grafana-default-email',
              continue: false,
              matchers: [],
              routes: [
                {
                  id: 'route-4',
                  receiver: 'Email contact point',
                  matchers: [{ type: '=', label: 'alertname', value: 'ProbeFailedExecutionsTooHigh' }],
                  continue: false,
                  routes: [
                    {
                      id: 'route-5',
                      receiver: 'Email contact point',
                      matchers: [{ type: '=', label: 'label_notification', value: 'email' }],
                      continue: false,
                      routes: [
                        {
                          id: 'route-6',
                          matchers: [{ type: '=', label: 'label_per_check_alerts', value: 'true' }],
                          continue: true,
                          receiver: 'Email contact point',
                        },
                        {
                          id: 'route-7',
                          matchers: [{ type: '=', label: 'check_name', value: 'http' }],
                          continue: true,
                          receiver: 'Email contact point',
                        },
                      ],
                    },
                  ],
                },
              ],
            },
            matchDetails: [],
            matched: true,
          },
          {
            route: {
              id: 'route-4',
              receiver: 'Email contact point',
              matchers: [{ type: '=', label: 'alertname', value: 'ProbeFailedExecutionsTooHigh' }],
              continue: false,
            },
            matchDetails: [],
            matched: true,
          },
          {
            route: {
              id: 'route-5',
              receiver: 'Email contact point',
              matchers: [{ type: '=', label: 'label_notification', value: 'email' }],
              continue: false,
            },
            matchDetails: [],
            matched: true,
          },
          {
            route: {
              id: 'route-6',
              matchers: [{ type: '=', label: 'label_per_check_alerts', value: 'true' }],
              continue: true,
              receiver: 'Email contact point',
            },
            matchDetails: [],
            matched: true,
          },
          {
            route: {
              id: 'route-7',
              matchers: [{ type: '=', label: 'check_name', value: 'http' }],
              continue: true,
              receiver: 'Email contact point',
            },
            matchDetails: [],
            matched: true,
          },
        ],
      },
    },
  ],
} as unknown as InstanceMatchResult;

export const MOCK_HTTP_DURATION_ROUTE_MATCH: InstanceMatchResult = {
  "labels": [
    ["job", "test_http"], ["instance", "http://example.com"], ["check_name", "http"], ["frequency", "10000"],
    ["namespace", "synthetic_monitoring"], ["grafana_folder", "Grafana Synthetic Monitoring"],
    ["label_per_check_alerts", "true"], ["alertname", "HTTPRequestDurationTooHighAvg"], ["label_notification", "email"]
  ],
  "matchedRoutes": [
    {
      "route": {"id": "route-8", "receiver": "Grafana Alerting ❤️", "continue": true},
      "routeTree": {"metadata": {"name": "user-defined"}, "expandedSpec": {"id": "route-3"}},
      "matchDetails": {
        "route": {"id": "route-8", "receiver": "Grafana Alerting ❤️", "continue": true},
        "labels": [
          ["job", "test_http"], ["instance", "http://example.com"], ["check_name", "http"], ["frequency", "10000"],
          ["namespace", "synthetic_monitoring"], ["grafana_folder", "Grafana Synthetic Monitoring"],
          ["label_per_check_alerts", "true"], ["alertname", "HTTPRequestDurationTooHighAvg"], ["label_notification", "email"]
        ],
        "matchingJourney": [
          {"route": {"id": "route-3", "receiver": "grafana-default-email", "continue": false, "matchers": [], "routes": [
            {"id": "route-8", "receiver": "Grafana Alerting ❤️", "continue": true},
            {"id": "route-9", "receiver": "Grafana Alerting 👻", "continue": true},
            {"id": "route-10", "receiver": "Grafana Alerting Name change 2 😊", "continue": true},
            {"id": "route-12", "matchers": [{"type": "=", "label": "label_notification", "value": "email"}], "continue": true, "receiver": "grafana-default-email"}
          ]}, "matchDetails": [], "matched": true},
          {"route": {"id": "route-8", "receiver": "Grafana Alerting ❤️", "continue": true}, "matchDetails": [], "matched": true}
        ]
      }
    },
    {
      "route": {"id": "route-9", "receiver": "Grafana Alerting 👻", "continue": true},
      "routeTree": {"metadata": {"name": "user-defined"}, "expandedSpec": {"id": "route-3"}},
      "matchDetails": {
        "matchingJourney": [
          {"route": {"id": "route-3", "receiver": "grafana-default-email", "continue": false, "matchers": []}, "matchDetails": [], "matched": true},
          {"route": {"id": "route-9", "receiver": "Grafana Alerting 👻", "continue": true}, "matchDetails": [], "matched": true}
        ]
      }
    },
    {
      "route": {"id": "route-10", "receiver": "Grafana Alerting Name change 2 😊", "continue": true},
      "routeTree": {"metadata": {"name": "user-defined"}, "expandedSpec": {"id": "route-3"}},
      "matchDetails": {
        "matchingJourney": [
          {"route": {"id": "route-3", "receiver": "grafana-default-email", "continue": false, "matchers": []}, "matchDetails": [], "matched": true},
          {"route": {"id": "route-10", "receiver": "Grafana Alerting Name change 2 😊", "continue": true}, "matchDetails": [], "matched": true}
        ]
      }
    },
    {
      "route": {"id": "route-12", "matchers": [{"type": "=", "label": "label_notification", "value": "email"}], "continue": true, "receiver": "grafana-default-email"},
      "routeTree": {"metadata": {"name": "user-defined"}, "expandedSpec": {"id": "route-3"}},
      "matchDetails": {
        "matchingJourney": [
          {"route": {"id": "route-3", "receiver": "grafana-default-email", "continue": false, "matchers": []}, "matchDetails": [], "matched": true},
          {"route": {"id": "route-12", "matchers": [{"type": "=", "label": "label_notification", "value": "email"}], "continue": true, "receiver": "grafana-default-email"}, "matchDetails": [], "matched": true}
        ]
      }
    }
  ]
} as unknown as InstanceMatchResult;
