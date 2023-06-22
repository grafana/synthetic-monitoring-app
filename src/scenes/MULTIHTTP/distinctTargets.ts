import { SceneFlexItem, SceneQueryRunner, VizPanel } from '@grafana/scenes';
import { DataSourceRef } from '@grafana/schema';

function getQueryRunner(metrics: DataSourceRef) {
  return new SceneQueryRunner({
    datasource: metrics,
    queries: [
      {
        expr: `count by (job, target) (
          count by (url, method) (
            probe_http_info{probe=~"\${probe}", job="\${job}", instance="\${instance}"}
          )
        )`,
        instant: false,
        legendFormat: '__auto',
        range: true,
        refId: 'A',
      },
    ],
  });
}

export function getDistinctTargets(metrics: DataSourceRef) {
  return new SceneFlexItem({
    width: 200,
    body: new VizPanel({
      $data: getQueryRunner(metrics),
      pluginId: 'stat',
      title: 'Number of distinct targets',
    }),
  });
}

// {
//   "datasource": {
//     "type": "datasource",
//     "uid": "-- Mixed --"
//   },
//   "fieldConfig": {
//     "defaults": {
//       "mappings": [],
//       "thresholds": {
//         "mode": "absolute",
//         "steps": [
//           {
//             "color": "green",
//             "value": null
//           },
//           {
//             "color": "red",
//             "value": 80
//           }
//         ]
//       },
//       "color": {
//         "mode": "thresholds"
//       }
//     },
//     "overrides": []
//   },
//   "gridPos": {
//     "h": 8,
//     "w": 12,
//     "x": 0,
//     "y": 8
//   },
//   "id": 1,
//   "options": {
//     "reduceOptions": {
//       "values": false,
//       "calcs": [
//         "lastNotNull"
//       ],
//       "fields": ""
//     },
//     "orientation": "auto",
//     "textMode": "auto",
//     "colorMode": "value",
//     "graphMode": "area",
//     "justifyMode": "auto"
//   },
//   "targets": [
//     {
//       "datasource": {
//         "type": "prometheus",
//         "uid": "grafanacloud-prom"
//       },
//       "editorMode": "code",
//       "expr": "count by (job, target) (count by (url, method) (probe_http_info{job=\"homepage\", instance=\"https://grafana.com/\"}))",
//       "instant": false,
//       "legendFormat": "__auto",
//       "range": true,
//       "refId": "A"
//     }
//   ],
//   "title": "Number of distinct targets",
//   "type": "stat",
//   "description": "",
//   "pluginVersion": "10.1.0-57200pre"
// }
