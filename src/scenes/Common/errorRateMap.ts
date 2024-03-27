import { SceneDataTransformer, SceneQueryRunner } from '@grafana/scenes';
import { DataSourceRef, ThresholdsMode } from '@grafana/schema';

import { ExplorablePanel } from 'scenes/ExplorablePanel';

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

function getMapQueryRunner(metrics: DataSourceRef, minStep: string) {
  const queryRunner = new SceneQueryRunner({
    datasource: metrics,
    queries: getErrorMapQueries(minStep),
  });

  return new SceneDataTransformer({
    $data: queryRunner,
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
  });
}

export function getErrorRateMapPanel(metrics: DataSourceRef, minStep: string) {
  const mapPanel = new ExplorablePanel({
    pluginId: 'geomap',
    title: 'Error rate by probe',

    $data: getMapQueryRunner(metrics, minStep),
    options: {
      basemap: {
        name: 'Basemap',
        type: 'default',
      },
      controls: {
        mouseWheelZoom: false,
        showAttribution: true,
        showDebug: false,
        showScale: false,
        showZoom: true,
      },
      layers: [
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
            mode: 'geohash',
            latitude: 'Value',
            longitude: 'Value',
          },
          name: 'Error rate',
          type: 'markers',
        },
      ],
      view: {
        id: 'zero',
        lat: 0,
        lon: 0,
        zoom: 1,
      },
    },
    fieldConfig: {
      defaults: {
        color: {
          mode: 'thresholds',
        },
        decimals: 2,
        mappings: [],
        max: 0.1,
        min: 0,
        thresholds: {
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
        },
        unit: 'percentunit',
      },
      overrides: [],
    },
  });
  return mapPanel;
}
