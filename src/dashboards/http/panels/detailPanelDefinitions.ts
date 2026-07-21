import {
  GraphDrawStyle,
  GraphGradientMode,
  GraphThresholdsStyleMode,
  LegendDisplayMode,
  LineInterpolation,
  ScaleDistribution,
  SortOrder,
  StackingMode,
  ThresholdsMode,
  TooltipDisplayMode,
  VisibilityMode,
} from '@grafana/schema';
import { DashboardPanelDefinition } from 'dashboards/hooks/useDashboardPanelQuery';

export function createErrorRatePanelDefinition(minStep: string): DashboardPanelDefinition {
  return {
    id: 'http-error-rate',
    pluginId: 'timeseries',
    title: 'Error Rate : $probe ⮕ $job / $instance',
    targets: [
      {
        exemplar: true,
        expr: `
  1 - (
    sum by (probe) (
      rate(probe_all_success_sum{probe=~"$probe", instance="$instance", job="$job"}[$__rate_interval])
    )
    /
    sum by (probe) (
      rate(probe_all_success_count{probe=~"$probe", instance="$instance", job="$job"}[$__rate_interval])
    )
  )
`,
        hide: false,
        interval: minStep,
        intervalFactor: 1,
        legendFormat: '{{ probe }}',
        refId: 'errorRate',
      },
    ],
    fieldConfig: {
      defaults: {
        unit: 'percentunit',
        max: 1,
        custom: {
          drawStyle: GraphDrawStyle.Line,
          lineInterpolation: LineInterpolation.Linear,
          barAlignment: 0,
          lineWidth: 3,
          fillOpacity: 16,
          gradientMode: GraphGradientMode.None,
          spanNulls: true,
          insertNulls: false,
          showPoints: VisibilityMode.Always,
          pointSize: 5,
          stacking: { mode: StackingMode.None, group: 'A' },
          axisPlacement: 'auto',
          axisLabel: '',
          axisColorMode: 'text',
          axisBorderShow: false,
          scaleDistribution: { type: ScaleDistribution.Linear },
          axisCenteredZero: false,
          hideFrom: { tooltip: false, viz: false, legend: false },
          thresholdsStyle: { mode: GraphThresholdsStyleMode.Off },
        },
      },
      overrides: [],
    },
    options: {},
  };
}

export function createResponseLatencyByPhasePanelDefinition(
  metric: 'probe_http_duration_seconds' | 'probe_icmp_duration_seconds'
): DashboardPanelDefinition {
  return {
    id: `http-response-latency-phase-${metric}`,
    pluginId: 'timeseries',
    title: `Response latency by phase: ${metric}`,
    maxDataPoints: 100,
    targets: [
      {
        expr: `avg(${metric}{probe=~"$probe", instance="$instance", job="$job"}) by (phase)`,
        instant: false,
        interval: '',
        intervalFactor: 1,
        legendFormat: '{{phase}}',
        refId: 'F',
      },
    ],
    fieldConfig: {
      defaults: {
        unit: 's',
        custom: {
          drawStyle: GraphDrawStyle.Bars,
          fillOpacity: 100,
          stacking: { mode: StackingMode.Normal, group: 'A' },
        },
        color: { mode: 'palette-classic' },
        thresholds: {
          mode: ThresholdsMode.Absolute,
          steps: [
            { value: 0, color: 'green' },
            { value: 1, color: 'yellow' },
            { value: 2, color: 'red' },
          ],
        },
      },
      overrides: [],
    },
    options: {
      legend: {
        showLegend: true,
        displayMode: LegendDisplayMode.Table,
        placement: 'right',
        calcs: ['mean', 'lastNotNull'],
      },
    },
  };
}

export function createResponseLatencyByProbePanelDefinition(): DashboardPanelDefinition {
  return {
    id: 'http-response-latency-probe',
    pluginId: 'timeseries',
    title: 'Response latency by probe',
    maxDataPoints: 100,
    targets: [
      {
        expr: 'avg(probe_duration_seconds{probe=~"$probe", instance="$instance", job="$job"} * on (instance, job,probe,config_version) group_left probe_success{probe=~"$probe",instance="$instance", job="$job"} > 0) by (probe)',
        instant: false,
        interval: '',
        intervalFactor: 1,
        legendFormat: '{{probe}}',
        refId: 'A',
      },
    ],
    fieldConfig: {
      defaults: {
        unit: 's',
        custom: {
          drawStyle: GraphDrawStyle.Points,
          lineWidth: 0,
          fillOpacity: 100,
          showPoints: VisibilityMode.Always,
          pointSize: 4,
          stacking: { mode: StackingMode.None, group: 'A' },
        },
        color: { mode: 'palette-classic' },
        thresholds: {
          mode: ThresholdsMode.Absolute,
          steps: [
            { value: 0, color: 'green' },
            { value: 80, color: 'red' },
          ],
        },
      },
      overrides: [],
    },
    options: {
      tooltip: { mode: TooltipDisplayMode.Multi, sort: SortOrder.None },
      legend: {
        showLegend: true,
        displayMode: LegendDisplayMode.Table,
        placement: 'right',
        calcs: ['mean', 'lastNotNull'],
      },
    },
  };
}

export function createErrorRateMapPanelDefinition(minStep: string): DashboardPanelDefinition {
  return {
    id: 'http-error-rate-map',
    pluginId: 'geomap',
    title: 'Error rate by probe',
    targets: [
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
    ],
    transforms: [
      {
        id: 'groupBy',
        options: {
          fields: {
            Value: { aggregations: ['sum'], operation: 'aggregate' },
            'Value #A': { aggregations: ['sum'], operation: 'aggregate' },
            'Value #B': { aggregations: ['sum'], operation: 'aggregate' },
            geohash: { aggregations: [], operation: 'groupby' },
            probe: { aggregations: [], operation: 'groupby' },
            'probe 1': { aggregations: [], operation: null },
            'probe 2': { aggregations: [], operation: null },
          },
        },
      },
      { id: 'joinByField', options: { byField: 'probe', mode: 'outerTabular' } },
      {
        id: 'calculateField',
        options: {
          alias: 'success rate',
          binary: { left: 'Value #A (sum)', operator: '/', right: 'Value #B (sum)' },
          mode: 'binary',
          reduce: { reducer: 'sum' },
        },
      },
      {
        id: 'calculateField',
        options: {
          alias: 'Error rate',
          binary: { left: '1.00', operator: '-', right: 'success rate' },
          mode: 'binary',
          reduce: { reducer: 'sum' },
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
    fieldConfig: {
      defaults: {
        unit: 'percentunit',
        decimals: 2,
        min: 0,
        max: 0.1,
        thresholds: {
          mode: ThresholdsMode.Absolute,
          steps: [
            { color: 'green', value: 0 },
            { color: '#EAB839', value: 0.01 },
            { color: 'red', value: 0.015 },
          ],
        },
      },
      overrides: [],
    },
    options: {
      basemap: { name: 'Basemap', type: 'default' },
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
              color: { field: 'Error rate', fixed: 'dark-green' },
              opacity: 0.4,
              rotation: { fixed: 0, max: 360, min: -360, mode: 'mod' },
              size: { field: 'Error rate', fixed: 5, max: 10, min: 4 },
              symbol: { fixed: 'img/icons/marker/circle.svg', mode: 'fixed' },
              textConfig: { fontSize: 12, offsetX: 0, offsetY: 0, textAlign: 'center', textBaseline: 'middle' },
            },
          },
          location: { geohash: 'geohash', mode: 'geohash', latitude: 'Value', longitude: 'Value' },
          name: 'Error rate',
          type: 'markers',
        },
      ],
      view: { id: 'zero', lat: 0, lon: 0, zoom: 1 },
    },
  };
}
