import {
  AdHocFiltersVariable,
  EmbeddedScene,
  QueryVariable,
  SceneControlsSpacer,
  SceneDataLayerControls,
  SceneFlexItem,
  SceneFlexLayout,
  SceneReactObject,
  SceneRefreshPicker,
  SceneTimePicker,
  SceneTimeRange,
  SceneVariableSet,
  VariableValueSelectors,
} from '@grafana/scenes';
import { VariableRefresh } from '@grafana/schema';

import { Check, DashboardSceneAppConfig } from 'types';
import { AddNewCheckButton } from 'components/CheckList/AddNewCheckButton';
import { getSummaryAlertAnnotations } from 'scenes/Common/alertAnnotations';
import { getEmptyScene } from 'scenes/Common/emptyScene';

import { getErrorPctgTimeseriesPanel } from './errorPctTimeseries';
import { getErrorRateMapPanel } from './errorRateMap';
import { getLatencyTimeseriesPanel } from './latencyTimeseries';
import { getSummaryTable } from './summaryTable';
import { getSummaryTable as getSummaryTable_DEPRECATED } from './summaryTable_DEPRECATED';

export function getSummaryScene({ metrics, sm }: DashboardSceneAppConfig, checks: Check[], singleCheckNav: boolean) {
  const summaryTable = singleCheckNav ? getSummaryTable(metrics, sm) : getSummaryTable_DEPRECATED(metrics);
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
      from: 'now-1h',
      to: 'now',
    });

    // Variable definition
    const probe = new QueryVariable({
      includeAll: true,
      allValue: '.*',
      defaultToAll: true,
      isMulti: true,
      name: 'probe',
      query: `label_values(sm_check_info{},probe)`,
      refresh: VariableRefresh.onDashboardLoad,
      datasource: metrics,
    });

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

    const tablePanel = new SceneFlexItem({ height: 400, body: summaryTable });

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

    const annotations = getSummaryAlertAnnotations(metrics);

    return new EmbeddedScene({
      $timeRange: timeRange,
      $variables: new SceneVariableSet({ variables: [region, probe, checkTypeVar, filters] }),
      $data: annotations,
      body: new SceneFlexLayout({
        direction: 'column',
        children: [tableRow, mapRow, latencyRow],
      }),
      controls: [
        new VariableValueSelectors({}),
        new SceneDataLayerControls(),
        new SceneControlsSpacer(),
        new SceneReactObject({
          component: AddNewCheckButton,
        }),
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
