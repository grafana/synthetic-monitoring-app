import { VariableHide } from '@grafana/data';
import {
  CustomVariable,
  EmbeddedScene,
  SceneControlsSpacer,
  SceneFlexItem,
  SceneFlexLayout,
  SceneQueryRunner,
  SceneRefreshPicker,
  SceneTimePicker,
  SceneTimeRange,
  SceneVariableSet,
  VariableValueSelectors,
} from '@grafana/scenes';

import { Check, CheckType, DashboardSceneAppConfig, SceneBuilder } from 'types';
import { getReachabilityStat, getUptimeStat, getVariables } from 'scenes/Common';
import { getAllLogs } from 'scenes/Common/allLogs';
import { getEditButton } from 'scenes/Common/editButton';
import { getEmptyScene } from 'scenes/Common/emptyScene';

import { getAssertionLogsPanel } from './assertionLogs';
import { getAssertionTable } from './assertionTable';
import { getDistinctTargets } from './distinctTargets';
import { getErrorRateByUrl } from './errorRateByUrl';
import { getLatencyByPhasePanel } from './latencyByPhase';
import { getLatencyByUrlPanel } from './latencyByUrl';
import { getProbeDuration } from './probeDuration';
import { MultiHttpStepsScene } from './StepPickerScene';

export function getMultiHttpScene({ metrics, logs }: DashboardSceneAppConfig, checks: Check[]): SceneBuilder {
  return () => {
    if (checks.length === 0) {
      return getEmptyScene(CheckType.MULTI_HTTP);
    }
    const timeRange = new SceneTimeRange({
      from: 'now-6h',
      to: 'now',
    });
    const { probe, job, instance } = getVariables(CheckType.MULTI_HTTP, metrics, checks);
    const stepUrl = new CustomVariable({
      name: 'stepUrl',
      hide: VariableHide.hideVariable,
    });
    const stepMethod = new CustomVariable({
      name: 'stepMethod',
      hide: VariableHide.hideVariable,
    });
    const activeStepIndex = new CustomVariable({
      name: 'activeStepIndex',
      hide: VariableHide.hideVariable,
    });
    const variables = new SceneVariableSet({
      variables: [probe, job, instance, stepUrl, stepMethod, activeStepIndex],
    });

    const resultsByUrl = new SceneQueryRunner({
      datasource: metrics,
      queries: [
        {
          refId: 'A',
          expr: `sum by (name) (
						probe_http_requests_failed_total{job="$job", instance="$instance"}
					)
					/
					sum by (name) (
						probe_http_requests_total{job="$job", instance="$instance"}
					)`,
          range: false,
          instant: true,
          editorMode: 'code',
          exemplar: false,
          format: 'table',
        },
      ],
    });

    const sidebar = new MultiHttpStepsScene({
      job: '',
      target: '',
      stepUrl: '',
      $data: resultsByUrl,
    });

    const latencyByPhase = getLatencyByPhasePanel(metrics);
    const latencyByUrl = getLatencyByUrlPanel(metrics);

    const body = new EmbeddedScene({
      body: new SceneFlexLayout({
        direction: 'column',
        children: [
          new SceneFlexLayout({
            direction: 'row',
            minHeight: 200,
            children: [latencyByUrl, latencyByPhase],
          }),
          getErrorRateByUrl(metrics),
        ],
      }),
    });

    sidebar.subscribeToState(
      ({ stepUrl: stepUrlVal, stepMethod: stepMethodVal, activeStepIndex: activeStepIndexVal }) => {
        if (stepUrlVal && stepUrlVal !== stepUrl.getValue()) {
          stepUrl.changeValueTo(stepUrlVal);
        }
        if (stepMethodVal && stepMethodVal !== stepMethod.getValue()) {
          stepMethod.changeValueTo(stepMethodVal);
        }
        if (activeStepIndexVal && activeStepIndexVal !== activeStepIndex.getValue()) {
          activeStepIndex.changeValueTo(activeStepIndexVal);
        }
      }
    );

    const reachability = getReachabilityStat(metrics);
    const uptime = getUptimeStat(metrics);
    const distinctTargets = getDistinctTargets(metrics);
    const probeDuration = getProbeDuration(metrics);

    const editButton = getEditButton({ job, instance });

    return new EmbeddedScene({
      $timeRange: timeRange,
      $variables: variables,
      controls: [
        new VariableValueSelectors({}),
        new SceneControlsSpacer(),
        editButton,
        new SceneTimePicker({ isOnCanvas: true }),
        new SceneRefreshPicker({
          intervals: ['5s', '1m', '1h'],
          isOnCanvas: true,
          refresh: '1m',
        }),
      ],
      body: new SceneFlexLayout({
        direction: 'column',
        children: [
          new SceneFlexLayout({
            direction: 'row',
            height: 150,
            children: [
              new SceneFlexItem({ body: uptime, width: 200 }),
              new SceneFlexItem({ body: reachability, width: 200 }),
              distinctTargets,
              probeDuration,
            ],
          }),
          new SceneFlexLayout({
            direction: 'row',
            minHeight: 300,
            children: [sidebar, body],
          }),
          new SceneFlexLayout({
            direction: 'row',
            minHeight: 300,
            children: [getAssertionTable(logs), getAssertionLogsPanel(logs)],
          }),
          new SceneFlexLayout({
            direction: 'row',
            minHeight: 300,
            children: [getAllLogs(logs)],
          }),
        ],
      }),
    });
  };
}
