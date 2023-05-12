import { ThresholdsMode } from '@grafana/data';
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
import React, { useContext, useMemo } from 'react';
import { DashboardSceneAppConfig } from 'types';

function getCheckListScene(config: DashboardSceneAppConfig) {
  const queryRunner = new SceneQueryRunner({
    datasource: config.metrics,
    queries: [
      {
        editorMode: 'code',
        expr: `sum by (instance, job, check_name) (
              rate(probe_all_success_sum[$__range])
              * 
              on (instance, job)
              group_left(check_name)
              max by (instance, job, check_name)
              (sm_check_info)
        ) 
        /
        sum by (instance, job, check_name) (
              rate(probe_all_success_count[$__range])
              * 
              on (instance, job)
              group_left(check_name)
              max by (instance, job, check_name)
              (sm_check_info)
        ) 
        `,
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
    $data: queryRunner,
    body: new SceneFlexLayout({
      children: [
        new SceneFlexItem({
          width: '100%',
          height: '100%',
          body: new VizPanel({
            pluginId: 'stat',
            title: '',
            $data: queryRunner,
            fieldConfig: {
              overrides: [],
              defaults: {
                thresholds: {
                  mode: ThresholdsMode.Percentage,
                  steps: [
                    {
                      color: 'red',
                      value: 0,
                    },
                    {
                      color: 'red',
                      value: 95,
                    },
                    {
                      color: '#EAB839',
                      value: 99,
                    },
                    {
                      color: 'green',
                      value: 99.75,
                    },
                  ],
                },
                links: [
                  {
                    title: 'dashboard link',
                    url: '/a/grafana-synthetic-monitoring-app/scene/${__field.labels.check_name}﻿﻿?var-job=${__field.labels.job}&${__field.labels.instance}',
                  },
                ],

                unit: 'percentunit',
              },
            },
            options: {
              reduceOptions: {
                values: false,
                calcs: ['lastNotNull'],
                fields: '',
              },
              orientation: 'auto',
              textMode: 'auto',
              colorMode: 'background',
              graphMode: 'none',
              justifyMode: 'auto',
            },
          }),
        }),
      ],
    }),
  });
}

export function CheckListScene() {
  const { instance } = useContext(InstanceContext);
  const { api, logs, metrics } = useMemo(
    () => ({ api: instance.api, logs: instance.logs, metrics: instance.metrics }),
    [instance.api, instance.logs, instance.metrics]
  );
  if (!metrics || !logs || !api) {
    return <Spinner />;
  }

  const metricsDef = {
    uid: metrics.uid,
    type: metrics.type,
  };
  const logsDef = {
    uid: logs.uid,
    type: logs.type,
  };
  const smDef = {
    uid: api.uid,
    type: api.type,
  };

  const scene = getCheckListScene({ metrics: metricsDef, logs: logsDef, sm: smDef });
  return <scene.Component model={scene} />;
}
