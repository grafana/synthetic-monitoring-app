import {
  ConstantVariable,
  CustomVariable,
  EmbeddedScene,
  QueryVariable,
  SceneControlsSpacer,
  SceneDataTransformer,
  SceneFlexLayout,
  SceneGridLayout,
  SceneGridRow,
  SceneQueryRunner,
  SceneRefreshPicker,
  SceneTimePicker,
  SceneTimeRange,
  SceneVariableSet,
  VariableValueSelectors,
  VizPanel,
} from '@grafana/scenes';
import { ThresholdsMode } from '@grafana/schema';
import { VizRepeater } from '@grafana/ui';
import { DashboardSceneAppConfig } from 'types';

export function getSummaryScene({ metrics, logs }: DashboardSceneAppConfig) {
  return () => {
    const timeRange = new SceneTimeRange({
      from: 'now-6h',
      to: 'now',
    });

    // Variable definition
    const region = new QueryVariable({
      includeAll: true,
      allValue: '.*',
      name: 'region',
      query: { query: 'label_values(sm_check_info, region)' },
      datasource: metrics,
    });

    // const checkType = new QueryVariable({
    //   datasource: metrics,
    //   includeAll: true,
    //   label: 'Check Type',
    //   name: 'check_type',
    //   query: {
    //     query: 'label_values(sm_check_info, check_name)',
    //     refId: '${DS_SM_METRICS}-check_type-Variable-Query',
    //   },
    //   refresh: 1,
    // });

    // Query runner definition
    // console.log('hellllo', metrics);
    const checkTypes = ['dns', 'http', 'ping', 'tcp', 'traceroute'];

    function getErrorPercentageQueryRunner(checkType: string) {
      const queryRunner = new SceneQueryRunner({
        datasource: metrics,
        queries: [
          {
            exemplar: true,
            expr: `1 - (  sum( rate(probe_all_success_sum[$__range]) * on (instance, job, probe, config_version) group_left(geohash) max by (instance, job, probe, config_version, check_name, geohash) (sm_check_info{check_name="${checkType}", region=~"$region"})) /  sum( rate(probe_all_success_count[$__range]) * on (instance, job, probe, config_version) group_left(geohash) max by (instance, job, probe, config_version, check_name, geohash) (sm_check_info{check_name="${checkType}", region=~"$region"})))`,
            hide: false,
            interval: '1m',
            tor: 1,
            legendFormat: '% Errors',
            refId: 'A',
          },
        ],
        // maxDataPoints: 100,
      });
      return queryRunner;
    }

    function getLatencyQueryRunner(checkType: string) {
      const queryRunner = new SceneQueryRunner({
        datasource: metrics,
        queries: [
          {
            expr: `sum(rate(probe_all_duration_seconds_sum[5m]) * on (instance, job, probe, config_version) group_left max(sm_check_info{check_name="${checkType}", region=~"$region"}) by (instance, job, probe, config_version))  by (job, instance) / sum(rate(probe_all_duration_seconds_count[5m]) * on (instance, job, probe, config_version) group_left max(sm_check_info{check_name="${checkType}", region=~"$region"}) by (instance, job, probe, config_version)) by (job, instance)`,
            hide: false,
            interval: '',
            legendFormat: '{{job}}/{{ instance }}',
            refId: 'A',
          },
        ],
        // maxDataPoints: 100,
      });
      return queryRunner;
    }

    function getMapQueryRunner(checkType: string) {
      const queryRunner = new SceneQueryRunner({
        datasource: metrics,
        queries: [
          {
            expr: `100 * (1 - (sum by (probe, geohash)\n (\n rate(probe_all_success_sum[$__range])\n *\n on (instance, job, probe, config_version)\n group_left(geohash)\n max\n by (instance, job, probe, config_version, check_name, geohash)\n (sm_check_info{check_name="${checkType}", region=~"$region"})\n) \n / \n sum by (probe, geohash)\n (\n rate(probe_all_success_count[$__range])\n *\n on (instance, job, probe, config_version)\n group_left(geohash)\n max\n by (instance, job, probe, config_version, check_name, geohash)\n (sm_check_info{check_name="${checkType}", region=~"$region"})\n)\n))`,
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

    function getSummaryTableQueryRunner(checkType: string) {
      const queryRunner = new SceneQueryRunner({
        datasource: metrics,
        queries: [
          {
            exemplar: false,
            expr: `sum by (instance, job, check_name)\n(\n  rate(probe_all_success_sum[$__range])\n  *\n  on (instance, job, probe, config_version)\n  group_left(check_name)\n  max\n  by (instance, job, probe, config_version, check_name)\n  (sm_check_info{check_name="${checkType}", region=~"$region"})\n)\n/\nsum by (instance, check_name, job)\n(\n  rate(probe_all_success_count[$__range])\n  *\n  on (instance, job, probe, config_version)\n  group_left(check_name)\n  max\n  by (instance, job, probe, config_version, check_name)\n  (sm_check_info{check_name="${checkType}", region=~"$region"})\n)`,
            format: 'table',
            instant: true,
            interval: '',
            legendFormat: '{{check_name}}-{{instance}}-uptime',
            refId: 'reachability',
          },
          {
            exemplar: false,
            expr: `sum by (instance, job, check_name)\n(\n  rate(probe_all_duration_seconds_sum[$__range])\n  * \n  on (instance, job, probe, config_version)\n  group_left(check_name)\n  max by (instance, job, probe, config_version, check_name)\n  (sm_check_info{check_name="${checkType}", region=~"$region"})\n)\n/\nsum by (instance, job, check_name)\n(\n  rate(probe_all_duration_seconds_count[$__range])\n  *\n  on (instance, job, probe, config_version)\n  group_left(check_name)\n  max by (instance, job, probe, config_version, check_name)\n  (sm_check_info{check_name="${checkType}", region=~"$region"})\n)`,
            format: 'table',
            instant: true,
            interval: '',
            legendFormat: '{{check_name}}-{{instance}}-latency',
            refId: 'latency',
          },
          {
            exemplar: false,
            expr: `ceil(\n  sum by (instance, job, check_name)\n  (\n  rate(probe_all_success_sum[5m])\n  *\n  on (instance, job, probe, config_version)\n    group_left(check_name)\n    max\n    by (instance, job, probe, config_version, check_name)\n    (sm_check_info{check_name="${checkType}", region=~"$region"})\n  )\n  /\n  sum by (instance, check_name, job)\n  (\n    rate(probe_all_success_count[5m])\n  *\n    on (instance, job, probe, config_version)\n    group_left(check_name)\n    max\n    by (instance, job, probe, config_version, check_name)\n    (sm_check_info{check_name="${checkType}", region=~"$region"})\n  )\n)`,
            format: 'table',
            hide: false,
            instant: true,
            interval: '',
            legendFormat: '{{check_name}}-{{instance}}-uptime',
            refId: 'state',
          },
          {
            exemplar: false,
            expr: `# find the average uptime over the entire time range evaluating \'up\' in 5 minute windows\navg_over_time(\n  (\n    # the inner query is going to produce a non-zero value if there was at least one successful check during the 5 minute window\n    # so make it a 1 if there was at least one success and a 0 otherwise\n    ceil(\n      # the number of successes across all probes\n      sum by (instance, job) (increase(probe_all_success_sum{}[5m]) * on (instance, job, probe, config_version) sm_check_info{check_name="${checkType}"})\n      /\n      # the total number of times we checked across all probes\n      (sum by (instance, job) (increase(probe_all_success_count[5m])) + 1) # + 1 because we want to make sure it goes to 1, not 2\n    )\n  )\n  [$__range:5m]\n)`,
            format: 'table',
            hide: false,
            instant: true,
            interval: '',
            legendFormat: '',
            refId: 'uptime',
          },
        ],
      });

      const transformed = new SceneDataTransformer({
        $data: queryRunner,
        transformations: [
          {
            id: 'merge',
            options: {},
          },
          {
            id: 'organize',
            options: {
              excludeByName: {
                Time: true,
                check_name: true,
              },
              indexByName: {},
              renameByName: {},
            },
          },
        ],
      });
      return transformed;
    }

    const children = checkTypes.map((checkType, index) => {
      const mapPanel = new VizPanel({
        pluginId: 'geomap',
        title: `${checkType} error rate`,
        placement: {
          height: 500,
          width: 500,
          // minHeight: '100%',
        },
        $data: getMapQueryRunner(checkType),
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

      const errorPercentagePanel = new VizPanel({
        pluginId: 'timeseries',
        title: `${checkType} check error percentage`,
        // placement: {
        //   height: 200,
        //   width: 500,
        //   minHeight: 200,
        // },
        fieldConfig: {
          defaults: {
            min: 0,
            max: 1,
          },
          overrides: [],
        },
        $data: getErrorPercentageQueryRunner(checkType),
        $variables: new SceneVariableSet({
          variables: [new ConstantVariable({ value: checkType, name: 'check_type' })],
        }),
      });

      const latencyPanel = new VizPanel({
        pluginId: 'timeseries',
        // Title is using variable value
        title: `${checkType} latency`,
        // placement: {
        //   height: 250,
        //   width: 500,
        //   minHeight: 250,
        // },
        $data: getLatencyQueryRunner(checkType),
        $variables: new SceneVariableSet({
          variables: [new ConstantVariable({ value: checkType, name: 'check_type' })],
        }),
      });

      const tablePanel = new VizPanel({
        pluginId: 'table',
        $data: getSummaryTableQueryRunner(checkType),
        fieldConfig: {
          defaults: {
            color: {
              mode: 'thresholds',
            },
            custom: {
              align: null,
              displayMode: 'auto',
              filterable: false,
            },
            mappings: [],

            // thresholds: [],
            // thresholds: {
            //   mode: ThresholdsMode.Absolute,
            //   steps: [
            //     {
            //       color: 'red',
            //       value: 0,
            //     },
            //     {
            //       color: '#EAB839',
            //       value: 0.5,
            //     },
            //     {
            //       color: 'green',
            //       value: 1,
            //     },
            //   ],
            // },
          },
          overrides: [
            {
              matcher: {
                id: 'byName',
                options: 'Value #reachability',
              },
              properties: [
                {
                  id: 'custom.displayMode',
                  value: 'color-background',
                },
                {
                  id: 'unit',
                  value: 'percentunit',
                },
                {
                  id: 'displayName',
                  value: 'reachability',
                },
              ],
            },
            {
              matcher: {
                id: 'byName',
                options: 'Value #latency',
              },
              properties: [
                {
                  id: 'custom.displayMode',
                  value: 'color-background',
                },
                {
                  id: 'displayName',
                  value: 'latency',
                },
                {
                  id: 'thresholds',
                  value: {
                    mode: ThresholdsMode.Absolute,
                    steps: [
                      {
                        color: 'green',
                        value: 0,
                      },
                      {
                        color: 'yellow',
                        value: 0.5,
                      },
                      {
                        color: 'red',
                        value: 1,
                      },
                    ],
                  },
                },
                {
                  id: 'unit',
                  value: 's',
                },
                {
                  id: 'color',
                  value: {
                    mode: 'thresholds',
                  },
                },
              ],
            },
            {
              matcher: {
                id: 'byName',
                options: 'Value #state',
              },
              properties: [
                {
                  id: 'displayName',
                  value: 'state',
                },
                {
                  id: 'mappings',
                  value: [
                    {
                      options: {
                        '0': {
                          text: 'down',
                        },
                        '1': {
                          text: 'up',
                        },
                      },
                      type: 'value',
                    },
                  ],
                },
                {
                  id: 'custom.displayMode',
                  value: 'color-background',
                },
                {
                  id: 'thresholds',
                  value: {
                    mode: ThresholdsMode.Absolute,
                    steps: [
                      {
                        color: 'red',
                        value: 0,
                      },
                      {
                        color: 'green',
                        value: 1,
                      },
                    ],
                  },
                },
                {
                  id: 'color',
                },
              ],
            },
            {
              matcher: {
                id: 'byName',
                options: 'Value #uptime',
              },
              properties: [
                {
                  id: 'displayName',
                  value: 'uptime',
                },
                {
                  id: 'unit',
                  value: 'percentunit',
                },
                {
                  id: 'custom.displayMode',
                  value: 'color-background',
                },
              ],
            },
            {
              matcher: {
                id: 'byName',
                options: 'instance',
              },
              properties: [
                {
                  id: 'links',
                  value: [
                    {
                      title: 'Show details...',
                      url: '/a/grafana-synthetic-monitoring-app/redirect?dashboard=$check_type&var-probe=All&var-instance=${__data.fields.instance}&var-job=${__data.fields.job}&from=${__from}&to=${__to}',
                    },
                  ],
                },
              ],
            },
            {
              matcher: {
                id: 'byName',
                options: 'job',
              },
              properties: [
                {
                  id: 'links',
                  value: [
                    {
                      title: 'Show details...',
                      url: '/a/grafana-synthetic-monitoring-app/redirect?dashboard=${__data.fields[1]}&var-probe=All&var-instance=${__data.fields.instance}&var-job=${__data.fields.job}&from=${__from}&to=${__to}',
                    },
                  ],
                },
              ],
            },
          ],
        },
      });

      const flexed = new SceneFlexLayout({
        direction: 'column',
        placement: {
          height: 500,
          width: 500,
          minHeight: 500,
          // x: 1,
          // y: 0,
        },
        children: [errorPercentagePanel, latencyPanel],
      });

      const flexRow = new SceneFlexLayout({
        direction: 'row',
        placement: {
          height: 200,
          width: '100%',
          minHeight: 500,
          x: 0,
          y: 0,
        },
        children: [mapPanel, flexed, tablePanel],
      });

      // const row = new SceneGridRow({
      //   placement: {
      //     height: '100%',
      //     minHeight: 500,
      //     minWidth: '100%',
      //     width: '100%',
      //     x: 0,
      //     y: index,
      //   },
      //   isCollapsed: false,
      //   isCollapsible: true,
      //   title: checkType,
      //   // children: [
      //   //   new SceneFlexLayout({
      //   //     direction: 'column',
      //   //     placement: {
      //   //       height: 2,
      //   //       minHeight: 2,
      //   //       width: 100,
      //   //     },
      //   //     children: [errorPercentagePanel, latencyPanel],
      //   //   }),
      //   // ],
      //   children: [flexRow],
      // });
      return flexRow;
    });

    return new EmbeddedScene({
      $timeRange: timeRange,
      $variables: new SceneVariableSet({ variables: [region] }),
      // $data: queryRunner,
      body: new SceneFlexLayout({
        direction: 'column',
        // placement: {
        //   height: '100%',
        //   width: '100%',
        // },
        children,
      }),
      controls: [
        new VariableValueSelectors({}),
        new SceneControlsSpacer(),
        // customObject,
        new SceneTimePicker({ isOnCanvas: true }),
        new SceneRefreshPicker({
          intervals: ['5s', '1m', '1h'],
          isOnCanvas: true,
        }),
      ],
    });
  };
}
