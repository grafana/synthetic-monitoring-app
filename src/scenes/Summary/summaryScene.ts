import {
  EmbeddedScene,
  QueryVariable,
  SceneControlsSpacer,
  SceneFlexItem,
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

    // Query runner definition
    const checkTypes = [CheckType.DNS, CheckType.HTTP, CheckType.PING, CheckType.TCP, CheckType.Traceroute];

    const children = checkTypes.map((checkType) => {
      const mapPanel = new SceneFlexItem({ height: 350, body: getErrorRateMapPanel(checkType, metrics) });
      const errorPercentagePanel = getErrorPctgTimeseriesPanel(checkType, metrics);
      const latencyPanel = getLatencyTimeseriesPanel(checkType, metrics);

      const flexed = new SceneFlexItem({
        height: 350,
        width: 500,
        body: new SceneFlexLayout({
          direction: 'column',
          children: [errorPercentagePanel, latencyPanel].map(
            (panel) => new SceneFlexItem({ height: 500, body: panel })
          ),
        }),
      });
      const tablePanel = new SceneFlexItem({ height: 350, body: getSummaryTable(checkType, metrics) });

      const flexRow = new SceneFlexLayout({
        direction: 'row',
        children: [mapPanel, flexed, tablePanel],
      });

      return new SceneFlexItem({ body: flexRow });
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
