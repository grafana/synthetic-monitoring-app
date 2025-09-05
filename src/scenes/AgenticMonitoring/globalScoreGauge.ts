import { SceneFlexItem, SceneQueryRunner } from '@grafana/scenes';
import { ThresholdsMode } from '@grafana/schema';

import { ExplorablePanel } from 'scenes/ExplorablePanel';

import { INFINITY_DS_UID } from './constants';

function getQueryRunner() {
  return new SceneQueryRunner({
    datasource: {
      type: 'yesoreyeram-infinity-datasource',
      uid: INFINITY_DS_UID,
    },
    queries: [
      {
        columns: [
          {
            selector: 'score',
            text: '',
            type: 'number',
          },
        ],
        data: 'score,time\n82,1751182089\n80,1751268489\n87,1751362089',
        format: 'table',
        parser: 'backend',
        refId: 'A',
        source: 'inline',
        type: 'csv',
      },
    ],
  });
}

export function getGlobalScoreGaugePanel() {
  return new SceneFlexItem({
    width: 500,
    body: new ExplorablePanel({
      pluginId: 'gauge',
      title: 'Global score',
      description: 'Latest aggregated score for the check',
      $data: getQueryRunner(),
      fieldConfig: {
        defaults: {
          color: {
            mode: 'thresholds',
          },
          fieldMinMax: false,
          mappings: [],
          max: 100,
          min: 0,
          thresholds: {
            mode: ThresholdsMode.Absolute,
            steps: [
              {
                color: 'red',
                value: 0,
              },
              {
                color: 'orange',
                value: 50,
              },
              {
                color: 'green',
                value: 90,
              },
            ],
          },
          unit: 'none',
        },
        overrides: [],
      },
      options: {
        minVizHeight: 75,
        minVizWidth: 75,
        orientation: 'auto',
        reduceOptions: {
          calcs: ['lastNotNull'],
          fields: '/^score$/',
          values: false,
        },
        showThresholdMarkers: true,
        sizing: 'auto',
        text: {},
      },
    }),
  });
}
