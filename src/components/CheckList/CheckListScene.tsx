import React, { useContext, useMemo } from 'react';
import { DataTransformerConfig, ThresholdsMode } from '@grafana/data';
import {
  CustomTransformOperator,
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

import { CheckFiltersType, CheckListViewType, VizViewSceneAppConfig } from 'types';
import { InstanceContext } from 'contexts/InstanceContext';
import { useChecks } from 'data/useChecks';
import { CheckFilters } from 'components/CheckFilters';
import { ExplorablePanel } from 'scenes/ExplorablePanel';

import { AddNewCheckButton } from './AddNewCheckButton';
import { CheckListViewSwitcher } from './CheckListViewSwitcher';

function getVizDimensions(checkCount: number) {
  const rowSize = Math.min(Math.ceil(Math.sqrt(checkCount)), 20);
  const colSize = Math.ceil(checkCount / rowSize);
  const rowPixels = Math.max(rowSize * 40, 400);
  return { width: `${rowPixels}px`, height: `${colSize * 60}px` };
}

function getCheckListScene(config: VizViewSceneAppConfig & Props, checkCount: number) {
  const probeQuery = config.checkFilters.probes.map(({ label }) => label).join('|') || '.*';
  const checkInfo = config.checkFilters.labels.map((labelStr) => {
    const [labelName, labelVal] = labelStr.split(':').map((val) => val.trim());
    return {
      name: `label_${labelName}`,
      value: labelVal,
    };
  });
  let customLabelFilters = '';
  let customLabelNames = '';
  if (checkInfo.length) {
    customLabelFilters = `{${checkInfo.map(({ name, value }) => `${name}="${value}"`).join(',')}}`;
    customLabelNames = `,${checkInfo.map(({ name }) => name).join(',')}`;
  }
  const queryRunner = new SceneQueryRunner({
    datasource: config.metrics,
    maxDataPoints: 2000,
    queries: [
      {
        editorMode: 'code',
        expr: `sum by (check_name, instance, job) (
              rate(probe_all_success_sum{probe=~"${probeQuery}"}[$__range])
              * 
              on (instance, job)
              group_left(check_name${customLabelNames})
              max by (check_name, instance, job)
              (sm_check_info${customLabelFilters})
        ) 
        /
        sum by (check_name, instance, job) (
              rate(probe_all_success_count{probe=~"${probeQuery}"}[$__range])
              * 
              on (instance, job)
              group_left(check_name${customLabelNames})
              max by (check_name, instance, job)
              (sm_check_info${customLabelFilters})
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

  const transformations: Array<DataTransformerConfig<any> | CustomTransformOperator> = [
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
  ];

  const filterByValueTransformation: DataTransformerConfig = {
    id: 'filterByValue',
    options: {
      filters: [],
      match: 'any',
      type: 'include',
    },
  };

  if (config.checkFilters.search) {
    filterByValueTransformation.options.filters.push(
      {
        config: {
          id: 'regex',
          options: {
            value: config.checkFilters.search,
          },
        },
        fieldName: 'job',
      },
      {
        config: {
          id: 'regex',
          options: {
            value: config.checkFilters.search,
          },
        },
        fieldName: 'instance',
      }
    );
  }

  if (config.checkFilters.type !== 'all') {
    filterByValueTransformation.options.filters.push({
      config: {
        id: 'regex',
        options: {
          value: config.checkFilters.type,
        },
      },
      fieldName: 'check_name',
    });
  }

  if (filterByValueTransformation.options.filters.length > 0) {
    transformations.push(filterByValueTransformation);
  }

  const transformed = new SceneDataTransformer({
    $data: queryRunner,
    transformations,
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
      new SceneReactObject({
        reactNode: (
          <CheckFilters
            checkFilters={config.checkFilters}
            checks={config.checks}
            handleResetFilters={config.handleResetFilters}
            onChange={config.onFilterChange}
            includeStatus={false}
          />
        ),
      }),
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
  checkFilters: CheckFiltersType;
  handleResetFilters: () => void;
  onFilterChange: (filters: CheckFiltersType) => void;
}

export function CheckListScene({
  setViewType,
  setCurrentPage,
  checkFilters,
  handleResetFilters,
  onFilterChange,
}: Props) {
  const { instance } = useContext(InstanceContext);
  const { data: checks, isLoading } = useChecks();

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
      {
        metrics: metricsDef,
        logs: logsDef,
        sm: smDef,
        setViewType,
        setCurrentPage,
        checkFilters,
        checks,
        handleResetFilters,
        onFilterChange,
      },
      checks.length
    );
  }, [setViewType, setCurrentPage, api, logs, metrics, checks, checkFilters, handleResetFilters, onFilterChange]);

  if (!scene || isLoading) {
    return <Spinner />;
  }

  return <scene.Component model={scene} />;
}
