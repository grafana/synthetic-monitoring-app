import { SceneDataTransformer, SceneQueryRunner } from '@grafana/scenes';
import { DataSourceRef, ThresholdsMode } from '@grafana/schema';

import { ExplorablePanel } from 'scenes/ExplorablePanel';

function getErrorMapQueries() {
  return [
    {
      expr: `
      sum by (probe, geohash)
      (
        rate(probe_all_success_sum{instance="$instance", job="$job"}[$__rate_interval])
        *
        on (instance, job, probe, config_version)
        group_left(geohash)
        max by (instance, job, probe, config_version, geohash)
        (
          sm_check_info{instance="$instance", job="$job"}
        )
      )`,
      format: 'table',
      instant: false,
      legendFormat: 'numerator',
      refId: 'A',
      range: true,
    },
    {
      refId: 'B',
      expr: `sum by (probe, geohash)
      (
        rate(probe_all_success_count{instance="$instance", job="$job"}[$__rate_interval])
          *
        on (instance, job, probe, config_version)
        group_left(geohash)
        max by (instance, job, probe, config_version, geohash)
        (
          sm_check_info{instance="$instance", job="$job"}
        )
      )`,
      range: true,
      instant: false,
      hide: false,
      legendFormat: 'denominator',
      format: 'table',
    },
  ];
}

function getMapQueryRunner(metrics: DataSourceRef) {
  const queryRunner = new SceneQueryRunner({
    datasource: metrics,
    minInterval: '1m',
    maxDataPoints: 10,
    queries: getErrorMapQueries(),
  });

  return new SceneDataTransformer({
    $data: queryRunner,
    transformations: [
      {
        id: 'joinByField',
        options: {
          byField: 'geohash',
          mode: 'outer',
        },
      },
      {
        id: 'groupBy',
        options: {
          fields: {
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
              operation: 'groupby',
            },
            'Value #A': {
              aggregations: ['sum'],
              operation: 'aggregate',
            },
            'Value #B': {
              aggregations: ['sum'],
              operation: 'aggregate',
            },
          },
        },
      },
      {
        id: 'calculateField',
        options: {
          mode: 'binary',
          reduce: {
            reducer: 'sum',
          },
          binary: {
            left: 'Value #A (sum)',
            operator: '/',
            right: 'Value #B (sum)',
          },
          alias: 'success rate',
        },
      },
      {
        id: 'calculateField',
        options: {
          mode: 'binary',
          binary: {
            left: '1.00',
            operator: '-',
            right: 'success rate',
          },
          alias: 'Error rate',
        },
      },
      {
        id: 'organize',
        options: {
          excludeByName: {
            geohash: false,
            'probe 2': true,
            'Value #A (sum)': true,
            'Value #B (sum)': true,
            'success rate': true,
          },
          indexByName: {},
          renameByName: {
            geohash: '',
            'probe 1': 'Probe',
            'error rate': '',
          },
          includeByName: {},
        },
      },
    ],
  });
}

export function getErrorRateMapPanel(metrics: DataSourceRef) {
  const mapPanel = new ExplorablePanel({
    pluginId: 'geomap',
    title: 'Error rate by probe',

    $data: getMapQueryRunner(metrics),
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
