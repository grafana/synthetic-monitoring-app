import { SceneQueryRunner, VizPanel } from '@grafana/scenes';
import { DataSourceRef, ThresholdsMode } from '@grafana/schema';

// {
//   "datasource": {
//     "uid": "grafanacloud-prom",
//     "type": "prometheus"
//   },
//
//   "gridPos": {
//     "h": 7,
//     "w": 12,
//     "x": 12,
//     "y": 9
//   },
//   "id": 12,
//   "maxDataPoints": "100",
//
//   "pluginVersion": "9.4.7",
//   "targets": [
//     {
//       "expr": "avg(probe_dns_answer_rrs{probe=~\"$probe\", instance=\"$instance\", job=\"$job\"})",
//       "instant": false,
//       "interval": "",
//       "intervalFactor": 1,
//       "legendFormat": "Answer Records",
//       "refId": "A",
//       "datasource": {
//         "uid": "grafanacloud-prom",
//         "type": "prometheus"
//       }
//     },
//     {
//       "expr": "avg(probe_dns_authority_rrs{probe=~\"$probe\", instance=\"$instance\", job=\"$job\"})",
//       "instant": false,
//       "interval": "",
//       "intervalFactor": 1,
//       "legendFormat": "Authority Records",
//       "refId": "B",
//       "datasource": {
//         "uid": "grafanacloud-prom",
//         "type": "prometheus"
//       }
//     },
//     {
//       "expr": "avg(probe_dns_additional_rrs{probe=~\"$probe\", instance=\"$instance\", job=\"$job\"})",
//       "instant": false,
//       "interval": "",
//       "intervalFactor": 1,
//       "legendFormat": "Additional Records",
//       "refId": "C",
//       "datasource": {
//         "uid": "grafanacloud-prom",
//         "type": "prometheus"
//       }
//     }
//   ],
//   "title": "Resource records",
//   "transformations": [],
//   "type": "timeseries",
//   "repeatDirection": null,
//   "timeFrom": null,
//   "timeShift": null
// }

function getQueryRunner(metrics: DataSourceRef) {
  return new SceneQueryRunner({
    datasource: metrics,
    queries: [
      {
        expr: 'avg(probe_dns_answer_rrs{probe=~"$probe", instance="$instance", job="$job"})',
        instant: false,
        interval: '',
        intervalFactor: 1,
        legendFormat: 'Answer Records',
        refId: 'A',
      },
      {
        expr: 'avg(probe_dns_authority_rrs{probe=~"$probe", instance="$instance", job="$job"})',
        instant: false,
        interval: '',
        intervalFactor: 1,
        legendFormat: 'Authority Records',
        refId: 'B',
      },
      {
        expr: 'avg(probe_dns_additional_rrs{probe=~"$probe", instance="$instance", job="$job"})',
        instant: false,
        interval: '',
        intervalFactor: 1,
        legendFormat: 'Additional Records',
        refId: 'C',
      },
    ],
  });
}

export function getResourcesRecordsPanel(metrics: DataSourceRef) {
  return new VizPanel({
    pluginId: 'timeseries',
    $data: getQueryRunner(metrics),
    title: 'Resource records',
    fieldConfig: {
      defaults: {
        custom: {
          drawStyle: 'line',
          lineInterpolation: 'linear',
          barAlignment: 0,
          lineWidth: 2,
          fillOpacity: 0,
          gradientMode: 'none',
          spanNulls: false,
          showPoints: 'never',
          pointSize: 5,
          stacking: {
            mode: 'none',
            group: 'A',
          },
          axisPlacement: 'auto',
          axisLabel: '',
          axisColorMode: 'text',
          scaleDistribution: {
            type: 'linear',
          },
          axisCenteredZero: false,
          hideFrom: {
            tooltip: false,
            viz: false,
            legend: false,
          },
          thresholdsStyle: {
            mode: 'off',
          },
        },
        color: {
          mode: 'palette-classic',
        },
        mappings: [],
        thresholds: {
          mode: ThresholdsMode.Absolute,
          steps: [
            {
              value: 0,
              color: 'green',
            },
            {
              value: 80,
              color: 'red',
            },
          ],
        },
        links: [],
        unit: 'none',
        decimals: 0,
      },
      overrides: [],
    },
    options: {
      tooltip: {
        mode: 'multi',
        sort: 'none',
      },
      legend: {
        showLegend: true,
        displayMode: 'table',
        placement: 'right',
        calcs: ['mean', 'lastNotNull'],
      },
    },
  });
}
