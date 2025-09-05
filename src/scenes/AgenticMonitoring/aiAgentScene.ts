// import {
//   behaviors,
//   EmbeddedScene,
//   SceneControlsSpacer,
//   SceneDataLayerControls,
//   SceneFlexLayout,
//   SceneRefreshPicker,
//   SceneTimePicker,
//   SceneVariableSet,
//   VariableValueSelectors,
// } from '@grafana/scenes';
// import { DashboardCursorSync } from '@grafana/schema';
//
// import { Check, CheckType, DashboardSceneAppConfig } from 'types';
// import { getVariables } from 'scenes/Common';
// import { getEditButton } from 'scenes/Common/editButton';
// import { getTimeRange } from 'scenes/Common/timeRange';
//
// import { getExploredNodesGraph } from './ExploredNodesGraph';
// import { getGlobalScoreGaugePanel } from './globalScoreGauge';
// import { getGlobalScoreTimeseriesPanel } from './globalScoreTimeseries';
// import { getPageInsightsTable } from './PageInsightsTable';
// import { getUserJourneysTable } from './UserJourneyTable';
//
// export function getAiAgentScene({ metrics }: DashboardSceneAppConfig, check: Check) {
//   return () => {
//     const timeRange = getTimeRange();
//     const { job, instance } = getVariables(CheckType.AiAgent, metrics, check);
//
//     const editButton = getEditButton({ id: check.id });
//     const variables = new SceneVariableSet({
//       variables: [job, instance],
//     });
//
//     return new EmbeddedScene({
//       $timeRange: timeRange,
//       $variables: variables,
//       $behaviors: [new behaviors.CursorSync({ key: 'sync', sync: DashboardCursorSync.Crosshair })],
//       controls: [
//         new VariableValueSelectors({}),
//         new SceneDataLayerControls(),
//         new SceneControlsSpacer(),
//         editButton,
//         new SceneTimePicker({ isOnCanvas: true }),
//         new SceneRefreshPicker({
//           intervals: ['5s', '1m', '1h'],
//           isOnCanvas: true,
//           refresh: '1m',
//         }),
//       ],
//       body: new SceneFlexLayout({
//         direction: 'column',
//         children: [
//           new SceneFlexLayout({
//             direction: 'row',
//             height: 200,
//             children: [getGlobalScoreGaugePanel(), getGlobalScoreTimeseriesPanel()],
//           }),
//           new SceneFlexLayout({
//             direction: 'row',
//             children: [getExploredNodesGraph(check.id || 0)],
//           }),
//           new SceneFlexLayout({
//             direction: 'row',
//             children: [getUserJourneysTable()],
//           }),
//           new SceneFlexLayout({
//             direction: 'row',
//             children: [getPageInsightsTable('accessibility')],
//           }),
//           new SceneFlexLayout({
//             direction: 'row',
//             children: [getPageInsightsTable('content')],
//           }),
//           new SceneFlexLayout({
//             direction: 'row',
//             children: [getPageInsightsTable('reliability')],
//           }),
//         ],
//       }),
//     });
//   };
// }
