import { ThresholdsMode } from '@grafana/data';
import {
  EmbeddedScene,
  SceneControlsSpacer,
  SceneDataTransformer,
  SceneFlexItem,
  SceneFlexLayout,
  SceneQueryRunner,
  SceneReactObject,
  SceneRefreshPicker,
  SceneTimePicker,
  SceneTimeRange,
  VariableValueSelectors,
} from '@grafana/scenes';
import { Spinner } from '@grafana/ui';
import { InstanceContext } from 'contexts/InstanceContext';
import React, { useContext, useMemo } from 'react';
import { CheckListViewType, DashboardSceneAppConfig } from 'types';
import { CheckListViewSwitcher } from './CheckListViewSwitcher';
import { AddNewCheckButton } from './AddNewCheckButton';
import { ChecksContext } from 'contexts/ChecksContext';
import { ExplorablePanel } from 'scenes/ExplorablePanel';

function getVizDimensions(checkCount: number) {
  const rowSize = Math.min(Math.ceil(Math.sqrt(checkCount)), 20);
  const colSize = Math.ceil(checkCount / rowSize);
  const rowPixels = Math.max(rowSize * 40, 400);
  return { width: `${rowPixels}px`, height: `${colSize * 60}px` };
}

function getCheckListScene(config: DashboardSceneAppConfig & Props, checkCount: number) {
  const queryRunner = new SceneQueryRunner({
    datasource: config.metrics,
    queries: [
      {
        editorMode: 'code',
        expr: `sum by (check_name, instance, job) (
              rate(probe_all_success_sum[$__range])
              * 
              on (instance, job)
              group_left(check_name)
              max by (check_name, instance, job)
              (sm_check_info)
        ) 
        /
        sum by (check_name, instance, job) (
              rate(probe_all_success_count[$__range])
              * 
              on (instance, job)
              group_left(check_name)
              max by (check_name, instance, job)
              (sm_check_info)
        ) 
        `,
        legendFormat: '{{job}}',
        format: 'table',
        range: false,
        instant: true,
        refId: 'A',
      },
    ],
  });

  const transformed = new SceneDataTransformer({
    $data: queryRunner,
    transformations: [
      {
        id: 'sortBy',
        options: {
          sort: [
            {
              desc: false,
              field: 'Value',
            },
          ],
        },
      },
      {
        id: 'organize',
        options: {
          excludeByName: {
            check_name: false,
            instance: false,
          },
          indexByName: {
            Time: 4,
            Value: 3,
            check_name: 2,
            instance: 1,
            job: 0,
          },
          renameByName: {},
        },
      },
    ],
  });

  const timeRange = new SceneTimeRange({
    to: 'now',
    from: 'now - 6h',
  });

  const { width, height } = getVizDimensions(checkCount);

  return new EmbeddedScene({
    $timeRange: timeRange,
    controls: [
      new SceneReactObject({
        reactNode: (
          <CheckListViewSwitcher
            viewType={CheckListViewType.Viz}
            setViewType={config.setViewType}
            setCurrentPage={config.setCurrentPage}
          />
        ),
      }),
      new VariableValueSelectors({}),
      new SceneControlsSpacer(),
      new SceneTimePicker({ isOnCanvas: true }),
      new SceneRefreshPicker({
        intervals: ['1m', '5m', '15m', '1h'],
        isOnCanvas: true,
        refresh: '1m',
      }),
      new SceneReactObject({
        component: AddNewCheckButton,
      }),
    ],
    body: new SceneFlexLayout({
      direction: 'row',
      maxWidth: width,
      children: [
        new SceneFlexItem({ body: new SceneReactObject({}) }),
        new SceneFlexItem({
          width,
          height,
          body: new ExplorablePanel({
            pluginId: 'stat',
            title: 'Success Rate',
            $data: transformed,
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
                    url: '/a/grafana-synthetic-monitoring-app/scene/${__data.fields.check_name}?var-job=${__data.fields.job}&var-instance=${__data.fields.instance}',
                  },
                ],

                unit: 'percentunit',
              },
            },
            options: {
              reduceOptions: {
                values: true,
                calcs: ['uniqueValues'],
                fields: '',
              },
              orientation: 'auto',
              textMode: 'none',
              colorMode: 'background',
              graphMode: 'none',
              justifyMode: 'auto',
            },
          }),
        }),
        new SceneFlexItem({ body: new SceneReactObject({}) }),
      ],
    }),
  });
}

interface Props {
  setViewType: (viewType: CheckListViewType) => void;
  setCurrentPage: (pageNumber: number) => void;
}

export function CheckListScene({ setViewType, setCurrentPage }: Props) {
  const { instance } = useContext(InstanceContext);
  const { checks, loading } = useContext(ChecksContext);

  const { api, logs, metrics } = useMemo(
    () => ({ api: instance.api, logs: instance.logs, metrics: instance.metrics }),
    [instance.api, instance.logs, instance.metrics]
  );

  const scene = useMemo(() => {
    if (!metrics || !logs || !api) {
      return undefined;
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
    return getCheckListScene(
      { metrics: metricsDef, logs: logsDef, sm: smDef, setViewType, setCurrentPage },
      checks.length
    );
  }, [setViewType, setCurrentPage, api, logs, metrics, checks.length]);

  if (!scene || loading) {
    return <Spinner />;
  }

  return <scene.Component model={scene} />;
}
