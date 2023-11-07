import {
  AdHocFiltersVariable,
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

import { Check, DashboardSceneAppConfig } from 'types';
import { getEmptyScene } from 'scenes/Common/emptyScene';

import { getErrorPctgTimeseriesPanel } from './errorPctTimeseries';
import { getErrorRateMapPanel } from './errorRateMap';
import { getLatencyTimeseriesPanel } from './latencyTimeseries';
import { getSummaryTable } from './summaryTable';

export function getSummaryScene({ metrics }: DashboardSceneAppConfig, checks: Check[]) {
  return () => {
    if (checks.length === 0) {
      return getEmptyScene();
    }
    const labelKeys = checks.reduce<Set<string>>((acc, check) => {
      check.labels.forEach(({ name }) => {
        acc.add(name);
      });
      return acc;
    }, new Set<string>());

    const timeRange = new SceneTimeRange({
      from: 'now-6h',
      to: 'now',
    });

    // Variable definition
    const region = new QueryVariable({
      includeAll: true,
      allValue: '.*',
      name: 'region',
      defaultToAll: true,
      query: 'label_values(sm_check_info, region)',
      datasource: metrics,
    });
    const checkTypeVar = new QueryVariable({
      includeAll: true,
      allValue: '.*',
      name: 'check_type',
      label: 'check type',
      defaultToAll: true,
      query: 'label_values(sm_check_info, check_name)',
      datasource: metrics,
    });
    const filters = AdHocFiltersVariable.create({
      datasource: metrics,
      filters: [],
      getTagKeysProvider: () => {
        return Promise.resolve({
          replace: true,
          values: Array.from(labelKeys).map((key) => ({ text: key, value: `label_${key}` })),
        });
      },
    });

    const tablePanel = new SceneFlexItem({ height: 400, body: getSummaryTable(metrics) });

    const tableRow = new SceneFlexLayout({
      direction: 'row',
      children: [tablePanel],
    });

    const mapPanel = new SceneFlexItem({ height: 350, body: getErrorRateMapPanel(metrics) });
    const errorPercentagePanel = new SceneFlexItem({ height: 350, body: getErrorPctgTimeseriesPanel(metrics) });
    const mapRow = new SceneFlexLayout({
      direction: 'row',
      children: [mapPanel, errorPercentagePanel],
    });

    const latencyPanel = new SceneFlexItem({ height: 350, body: getLatencyTimeseriesPanel(metrics) });

    const latencyRow = new SceneFlexLayout({
      direction: 'row',
      children: [latencyPanel],
    });

    return new EmbeddedScene({
      $timeRange: timeRange,
      $variables: new SceneVariableSet({ variables: [region, checkTypeVar, filters] }),
      body: new SceneFlexLayout({
        direction: 'column',
        children: [tableRow, mapRow, latencyRow],
      }),
      controls: [
        new VariableValueSelectors({}),
        new SceneControlsSpacer(),
        new SceneTimePicker({ isOnCanvas: true }),
        new SceneRefreshPicker({
          intervals: ['5s', '1m', '1h'],
          isOnCanvas: true,
          refresh: '1m',
        }),
      ],
    });
  };
}
