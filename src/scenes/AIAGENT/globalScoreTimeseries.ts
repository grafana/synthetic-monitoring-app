import { SceneQueryRunner } from '@grafana/scenes';

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
            text: 'Score',
            type: 'number',
          },
          {
            selector: 'time',
            text: 'date',
            type: 'timestamp_epoch_s',
          },
        ],
        data: 'score,time\n82,1751182089\n80,1751268489\n87,1751362089\n84,1751537638\n85,1751534038\n85,1751541238\n86,1751544838\n87,1751548438',
        format: 'table',
        parser: 'backend',
        refId: 'A',
        source: 'inline',
        type: 'csv',
      },
    ],
  });
}

export function getGlobalScoreTimeseriesPanel() {
  return new ExplorablePanel({
    pluginId: 'timeseries',
    title: 'Global score trend',
    description: 'Trend of the global score for the last 7 days',
    $data: getQueryRunner(),
    fieldConfig: {
      defaults: {
        color: {
          mode: 'palette-classic',
        },
      },
      overrides: [],
    },
    options: {
      legend: {
        calcs: [],
        displayMode: 'list',
        placement: 'bottom',
        showLegend: true,
      },
      tooltip: {
        hideZeros: false,
        mode: 'single',
        sort: 'none',
      },
    },
  });
}
