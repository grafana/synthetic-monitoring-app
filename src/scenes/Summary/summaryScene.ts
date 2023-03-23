import {
  EmbeddedScene,
  QueryVariable,
  SceneControlsSpacer,
  SceneFlexLayout,
  SceneRefreshPicker,
  SceneTimePicker,
  SceneTimeRange,
  SceneVariableSet,
  VariableValueSelectors,
} from '@grafana/scenes';
import { CheckType, DashboardSceneAppConfig } from 'types';
import { getErrorPctgTimeseriesPanel } from './errorPctTimeseries';
import { getErrorRateMapPanel } from './errorRateMap';
import { getLatencyTimeseriesPanel } from './latencyTimeseries';
import { getSummaryTable } from './summaryTable';

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
    const checkTypes = [CheckType.DNS, CheckType.HTTP, CheckType.PING, CheckType.TCP, CheckType.Traceroute];

    const children = checkTypes.map((checkType) => {
      const mapPanel = getErrorRateMapPanel(checkType, metrics);
      const errorPercentagePanel = getErrorPctgTimeseriesPanel(checkType, metrics);
      const latencyPanel = getLatencyTimeseriesPanel(checkType, metrics);
      const tablePanel = getSummaryTable(checkType, metrics);

      const flexed = new SceneFlexLayout({
        direction: 'column',
        placement: {
          height: 500,
          width: 500,
          minHeight: 500,
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

      return flexRow;
    });

    return new EmbeddedScene({
      $timeRange: timeRange,
      $variables: new SceneVariableSet({ variables: [region] }),
      // $data: queryRunner,
      body: new SceneFlexLayout({
        direction: 'column',
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
