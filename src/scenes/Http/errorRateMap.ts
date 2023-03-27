import { SceneQueryRunner, SceneVariableSet, VizPanel } from '@grafana/scenes';
import { DataSourceRef, ThresholdsMode } from '@grafana/schema';

function getErrorMapQuery() {
  return `
    100 * (
      1 - (
        sum by (probe, geohash) (
          rate(probe_all_success_sum{instance="$instance", job="$job"}[$__range])
          *
          on (instance, job, probe, config_version)
          group_left(geohash)
          max by (instance, job, probe, config_version, geohash)
          (
            sm_check_info{instance="$instance", job="$job"}
          )
        )
      /
        sum by (probe, geohash) (
          rate(probe_all_success_count{instance="$instance", job="$job"}[$__range])
          *
          on (instance, job, probe, config_version)
          group_left(geohash)
          max by (instance, job, probe, config_version, geohash) (
            sm_check_info{instance="$instance", job="$job"}
          )
        )
      )
    )
  `;
}

function getMapQueryRunner(variableSet: SceneVariableSet, metrics: DataSourceRef) {
  const queryRunner = new SceneQueryRunner({
    datasource: metrics,
    $variables: variableSet,
    queries: [
      {
        expr: getErrorMapQuery(),
        format: 'table',
        hide: false,
        instant: true,
        interval: '',
        legendFormat: '',
        refId: 'A',
      },
    ],
  });
  return queryRunner;
}

export function getHttpErrorRateMapPanel(variableSet: SceneVariableSet, metrics: DataSourceRef) {
  const mapPanel = new VizPanel({
    pluginId: 'geomap',
    title: 'Error rate by probe',
    placement: {
      height: 500,
      width: 500,
    },
    $data: getMapQueryRunner(variableSet, metrics),
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
            showLegend: true,
            style: {
              color: {
                field: 'Value',
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
                field: 'Value',
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
          },
          name: 'Layer 1',
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
        max: 1,
        min: 0,
        thresholds: {
          mode: ThresholdsMode.Absolute,
          steps: [
            {
              color: 'dark-green',
              value: 0,
            },
            {
              color: 'dark-orange',
              value: 0.5,
            },
            {
              color: 'dark-red',
              value: 1,
            },
          ],
        },
        unit: 'percent',
      },
      overrides: [
        {
          matcher: {
            id: 'byName',
            options: 'Value',
          },
          properties: [
            {
              id: 'displayName',
              value: 'Error rate',
            },
          ],
        },
      ],
    },
  });
  return mapPanel;
}
