import {SceneDataQuery, SceneQueryRunner} from '@grafana/scenes';
import {DataSourceRef} from '@grafana/schema';

import {ExplorablePanel} from 'scenes/ExplorablePanel';
import {FieldColorModeId} from "@grafana/data";

function getQueryRunner(metrics: DataSourceRef, queries: SceneDataQuery[]) {
  return new SceneQueryRunner({
    datasource: metrics,
    queries: queries,
  });
}

export function getInsightsMetric(
    metrics: DataSourceRef,
    title: string,
    description: string,
    queries: SceneDataQuery[]
) {
  return new ExplorablePanel({
      $data: getQueryRunner(metrics, queries),
      options: {
        instant: false,
      },
      title: title,
      description: description,
      pluginId: 'timeseries',
      fieldConfig: {
          defaults: {
              unit: 's',
              custom: {
                drawStyle: 'line',
                fillOpacity: 0,
              },
              color: {
                fixedColor: 'red',
                mode: FieldColorModeId.Fixed,
              },
          },
          overrides: [
              {
                  matcher: {
                      id: 'byName',
                      options: 'k6-insights - 30d',
                  },
                  properties: [
                      {
                          id: 'custom.lineStyle',
                          value: {
                              fill: 'dash',
                          },
                      },
                  ],
              },
              {
                  matcher: {
                      id: 'byName',
                      options: 'Oregon - 7d',
                  },
                  properties: [
                      {
                          id: 'custom.lineStyle',
                          value: {
                              fill: 'dash',
                          },
                      },
                  ],
              },
          ],
      },
    });
}
