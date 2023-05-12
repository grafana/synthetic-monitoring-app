import {
  EmbeddedScene,
  SceneFlexItem,
  SceneFlexLayout,
  SceneQueryRunner,
  SceneTimeRange,
  VizPanel,
} from '@grafana/scenes';
import { Spinner } from '@grafana/ui';
import { InstanceContext } from 'contexts/InstanceContext';
import React, { useContext } from 'react';
import { DashboardSceneAppConfig } from 'types';

function getCheckListScene(config: DashboardSceneAppConfig) {
  const queryRunner = new SceneQueryRunner({
    datasource: config.metrics,
    queries: [
      {
        editorMode: 'code',
        expr: 'sum(rate(probe_all_success_sum[3h])) by (job, instance) / sum(rate(probe_all_success_count[3h])) by (job, instance)',
        legendFormat: '{{instance}}',
        range: true,
        refId: 'A',
      },
    ],
  });

  const timeRange = new SceneTimeRange({
    to: 'now',
    from: 'now - 6h',
  });

  return new EmbeddedScene({
    $timeRange: timeRange,
    // $variables: new SceneVariableSet({ variables: [region] }),
    $data: queryRunner,
    body: new SceneFlexLayout({
      children: [
        new SceneFlexItem({
          width: '100%',
          height: '100%',
          body: new VizPanel({
            pluginId: 'grafana-polystat-panel',
            title: '',
            $data: queryRunner,
            fieldConfig: {
              defaults: {
                mappings: [],
              },
              overrides: [],
            },
            options: {
              autoSizeColumns: true,
              autoSizePolygons: true,
              autoSizeRows: true,
              compositeConfig: {
                animationSpeed: '1500',
                composites: [],
                enabled: true,
              },
              ellipseCharacters: 18,
              ellipseEnabled: false,
              globalAutoScaleFonts: true,
              globalClickthrough: '',
              globalClickthroughNewTabEnabled: false,
              globalClickthroughSanitizedEnabled: false,
              globalDecimals: 2,
              globalDisplayMode: 'all',
              globalDisplayTextTriggeredEmpty: 'OK',
              globalFillColor: 'rgba(10, 85, 161, 1)',
              globalFontSize: 12,
              globalGradientsEnabled: false,
              globalOperator: 'mean',
              globalPolygonBorderColor: 'rgba(0, 0, 0, 0)',
              globalPolygonBorderSize: 4,
              globalPolygonSize: 25,
              globalRegexPattern: '',
              globalShape: 'hexagon_pointed_top',
              globalShowTooltipColumnHeadersEnabled: true,
              globalShowValueEnabled: true,
              globalTextFontAutoColorEnabled: true,
              globalTextFontColor: '#000000',
              globalTextFontFamily: 'Roboto',
              globalThresholdsConfig: [
                {
                  color: '#C4162A',
                  state: 2,
                  value: 0,
                },
                {
                  color: '#FF9830',
                  state: 1,
                  value: 0.95,
                },
                {
                  color: '#37872D',
                  state: 0,
                  value: 0.99,
                },
              ],
              globalTooltipsEnabled: true,
              globalTooltipsFontFamily: 'Helvetica',
              globalTooltipsShowTimestampEnabled: false,
              globalUnitFormat: 'percentunit',
              layoutDisplayLimit: 100,
              layoutNumColumns: 8,
              layoutNumRows: 8,
              overrideConfig: {
                overrides: [],
              },
              sortByDirection: 3,
              sortByField: 'value',
              tooltipDisplayMode: 'triggered',
              tooltipDisplayTextTriggeredEmpty: 'OK',
              tooltipPrimarySortByField: 'thresholdLevel',
              tooltipPrimarySortDirection: 4,
              tooltipSecondarySortByField: 'value',
              tooltipSecondarySortDirection: 1,
            },
          }),
        }),
      ],
    }),
  });
}

export function CheckListScene() {
  const { instance } = useContext(InstanceContext);

  if (!instance.metrics || !instance.logs || !instance.api) {
    return <Spinner />;
  }

  const metricsDef = {
    uid: instance.metrics.uid,
    type: instance.metrics.type,
  };
  const logsDef = {
    uid: instance.logs.uid,
    type: instance.logs.type,
  };
  const smDef = {
    uid: instance.api.uid,
    type: instance.api.type,
  };

  const scene = getCheckListScene({ metrics: metricsDef, logs: logsDef, sm: smDef });
  return <scene.Component model={scene} />;
}

// "panels": [
//   {
//     "datasource": {
//       "type": "prometheus",
//       "uid": "PD2497CD8F1EF91F1"
//     },
//     "fieldConfig": {
//       "defaults": {
//         "mappings": []
//       },
//       "overrides": []
//     },
//     "gridPos": {
//       "h": 8,
//       "w": 12,
//       "x": 0,
//       "y": 0
//     },
//     "id": 1,
//     "options": {
//       "autoSizeColumns": true,
//       "autoSizePolygons": true,
//       "autoSizeRows": true,
//       "compositeConfig": {
//         "animationSpeed": "1500",
//         "composites": [],
//         "enabled": true
//       },
//       "ellipseCharacters": 18,
//       "ellipseEnabled": false,
//       "globalAutoScaleFonts": true,
//       "globalClickthrough": "",
//       "globalClickthroughNewTabEnabled": false,
//       "globalClickthroughSanitizedEnabled": false,
//       "globalDecimals": 2,
//       "globalDisplayMode": "all",
//       "globalDisplayTextTriggeredEmpty": "OK",
//       "globalFillColor": "rgba(10, 85, 161, 1)",
//       "globalFontSize": 12,
//       "globalGradientsEnabled": false,
//       "globalOperator": "mean",
//       "globalPolygonBorderColor": "rgba(0, 0, 0, 0)",
//       "globalPolygonBorderSize": 4,
//       "globalPolygonSize": 25,
//       "globalRegexPattern": "",
//       "globalShape": "hexagon_pointed_top",
//       "globalShowTooltipColumnHeadersEnabled": true,
//       "globalShowValueEnabled": true,
//       "globalTextFontAutoColorEnabled": true,
//       "globalTextFontColor": "#000000",
//       "globalTextFontFamily": "Roboto",
//       "globalThresholdsConfig": [
//         {
//           "color": "#C4162A",
//           "state": 2,
//           "value": 0
//         },
//         {
//           "color": "#FF9830",
//           "state": 1,
//           "value": 0.95
//         },
//         {
//           "color": "#37872D",
//           "state": 0,
//           "value": 0.99
//         }
//       ],
//       "globalTooltipsEnabled": true,
//       "globalTooltipsFontFamily": "Helvetica",
//       "globalTooltipsShowTimestampEnabled": false,
//       "globalUnitFormat": "percentunit",
//       "layoutDisplayLimit": 100,
//       "layoutNumColumns": 8,
//       "layoutNumRows": 8,
//       "overrideConfig": {
//         "overrides": []
//       },
//       "sortByDirection": 3,
//       "sortByField": "value",
//       "tooltipDisplayMode": "triggered",
//       "tooltipDisplayTextTriggeredEmpty": "OK",
//       "tooltipPrimarySortByField": "thresholdLevel",
//       "tooltipPrimarySortDirection": 4,
//       "tooltipSecondarySortByField": "value",
//       "tooltipSecondarySortDirection": 1
//     },
//     "pluginVersion": "2.0.7",
//     "targets": [
//       {
//         "datasource": {
//           "type": "prometheus",
//           "uid": "PD2497CD8F1EF91F1"
//         },
//         "editorMode": "code",
//         "expr": "sum(rate(probe_all_success_sum[3h])) by (job, instance) / sum(rate(probe_all_success_count[3h])) by (job, instance)",
//         "legendFormat": "{{instance}}",
//         "range": true,
//         "refId": "A"
//       }
//     ],
//     "title": "Panel Title",
//     "transparent": true,
//     "type": "grafana-polystat-panel"
//   }
// ],
