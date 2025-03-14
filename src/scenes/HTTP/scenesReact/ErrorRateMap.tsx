import React from 'react';
import { VizConfigBuilders } from '@grafana/scenes';
import { useDataTransformer, useQueryRunner, useTimeRange, VizPanel } from '@grafana/scenes-react';
import { FrameGeometrySourceMode, ThresholdsMode } from '@grafana/schema';

import { useMetricsDS } from 'hooks/useMetricsDS';

import { useVizPanelMenu } from './useVizPanelMenu';

export const ErrorRateMap = ({ minStep }: { minStep: string }) => {
  const metricsDS = useMetricsDS();

  function getErrorMapQueries(minStep: string) {
    return [
      {
        expr: `sum by (probe, geohash)
        (
          rate(probe_all_success_sum{instance="$instance", job="$job", probe=~"$probe"}[$__rate_interval])
          *
          on (instance, job, probe, config_version)
          group_left(geohash)
          max by (instance, job, probe, config_version, geohash)
          (
            sm_check_info{instance="$instance", job="$job"}
          )
        )`,
        format: 'table',
        interval: minStep,
        instant: false,
        legendFormat: 'numerator',
        refId: 'A',
        range: true,
      },
      {
        refId: 'B',
        expr: `sum by (probe, geohash)
        (
          rate(probe_all_success_count{instance="$instance", job="$job", probe=~"$probe"}[$__rate_interval])
            *
          on (instance, job, probe, config_version)
          group_left(geohash)
          max by (instance, job, probe, config_version, geohash)
          (
            sm_check_info{instance="$instance", job="$job"}
          )
        )`,
        range: true,
        interval: minStep,
        instant: false,
        hide: false,
        legendFormat: 'denominator',
        format: 'table',
      },
    ];
  }

  const dataProvider = useQueryRunner({
    queries: getErrorMapQueries(minStep),
    datasource: metricsDS,
  });

  const dataTransformer = useDataTransformer({
    transformations: [
      {
        id: 'groupBy',
        options: {
          fields: {
            Value: {
              aggregations: ['sum'],
              operation: 'aggregate',
            },
            'Value #A': {
              aggregations: ['sum'],
              operation: 'aggregate',
            },
            'Value #B': {
              aggregations: ['sum'],
              operation: 'aggregate',
            },
            geohash: {
              aggregations: [],
              operation: 'groupby',
            },
            probe: {
              aggregations: [],
              operation: 'groupby',
            },
            'probe 1': {
              aggregations: [],
              operation: null,
            },
            'probe 2': {
              aggregations: [],
              operation: null,
            },
          },
        },
      },
      {
        id: 'joinByField',
        options: {
          byField: 'probe',
          mode: 'outerTabular',
        },
      },
      {
        id: 'calculateField',
        options: {
          alias: 'success rate',
          binary: {
            left: 'Value #A (sum)',
            operator: '/',
            right: 'Value #B (sum)',
          },
          mode: 'binary',
          reduce: {
            reducer: 'sum',
          },
        },
      },
      {
        id: 'calculateField',
        options: {
          alias: 'Error rate',
          binary: {
            left: '1.00',
            operator: '-',
            right: 'success rate',
          },
          mode: 'binary',
          reduce: {
            reducer: 'sum',
          },
        },
      },
      {
        id: 'organize',
        options: {
          excludeByName: {
            'Value #A (sum)': true,
            'Value #B (sum)': true,
            geohash: false,
            'probe 2': true,
            'success rate': true,
            'geohash 2': true,
          },
          indexByName: {},
          renameByName: {
            'error rate': '',
            geohash: '',
            'probe 1': 'Probe',
            'geohash 1': 'geohash',
          },
          includeByName: {},
        },
      },
    ],
    data: dataProvider,
  });

  const viz = VizConfigBuilders.geomap()
    .setUnit('percentunit')
    .setOption('basemap', {
      name: 'Basemap',
      type: 'default',
    })
    .setOption('controls', {
      mouseWheelZoom: false,
      showAttribution: true,
      showDebug: false,
      showScale: false,
      showZoom: true,
    })
    .setOption('layers', [
      {
        config: {
          showLegend: false,
          style: {
            color: {
              field: 'Error rate',
              fixed: 'dark-green',
            },
            opacity: 0.4,
            rotation: {
              fixed: 0,
              max: 360,
              min: -360,
              mode: 'mod',
            },
            size: {
              field: 'Error rate',
              fixed: 5,
              max: 10,
              min: 4,
            },
            symbol: {
              fixed: 'img/icons/marker/circle.svg',
              mode: 'fixed',
            },
            textConfig: {
              fontSize: 12,
              offsetX: 0,
              offsetY: 0,
              textAlign: 'center',
              textBaseline: 'middle',
            },
          },
        },
        location: {
          geohash: 'geohash',
          mode: FrameGeometrySourceMode.Geohash,
          latitude: 'Value',
          longitude: 'Value',
        },
        name: 'Error rate',
        type: 'markers',
      },
    ])
    .setOption('view', {
      id: 'zero',
      lat: 0,
      lon: 0,
      zoom: 1,
    })
    .setColor({
      mode: 'thresholds',
    })
    .setDecimals(2)
    .setMin(0)
    .setMax(0.1)
    .setThresholds({
      mode: ThresholdsMode.Absolute,
      steps: [
        {
          color: 'green',
          value: 0,
        },
        {
          color: '#EAB839',
          value: 0.01,
        },
        {
          color: 'red',
          value: 0.015,
        },
      ],
    })
    .build();

  const data = dataProvider.useState();
  const [currentTimeRange] = useTimeRange();

  const menu = useVizPanelMenu({
    //@ts-ignore
    data,
    viz,
    currentTimeRange,
    variables: ['job', 'probe', 'instance'],
  });

  return (
    <VizPanel
      //@ts-ignore
      menu={menu}
      title="Error rate by probe"
      viz={viz}
      dataProvider={dataTransformer}
    />
  );
};
