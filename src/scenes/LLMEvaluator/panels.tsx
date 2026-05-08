import React from 'react';
import { VizConfigBuilders } from '@grafana/scenes';
import { useQueryRunner, useTimeRange, VizPanel } from '@grafana/scenes-react';
import { BigValueGraphMode, GraphDrawStyle, LegendDisplayMode, ThresholdsMode } from '@grafana/schema';

import { useMetricsDS } from 'hooks/useMetricsDS';
import { useVizPanelMenu } from 'scenes/Common/useVizPanelMenu';

const TENANT_FILTER = `probe=~"$probe", instance="$instance", job="$job"`;

function useLLMVizMenu(viz: ReturnType<typeof VizConfigBuilders.timeseries>['build'] extends () => infer T ? T : never, dataProvider: ReturnType<typeof useQueryRunner>) {
  const data = dataProvider.useState();
  const [currentTimeRange] = useTimeRange();
  return useVizPanelMenu({ data, viz, currentTimeRange, variables: ['job', 'probe', 'instance'] });
}

export const EvalScore = () => {
  const metricsDS = useMetricsDS();

  const dataProvider = useQueryRunner({
    maxDataPoints: 200,
    queries: [
      {
        expr: `avg(probe_llm_eval_score{${TENANT_FILTER}})`,
        instant: false,
        legendFormat: 'eval score',
        refId: 'A',
      },
    ],
    datasource: metricsDS,
  });

  const viz = VizConfigBuilders.timeseries()
    .setUnit('percentunit')
    .setMin(0)
    .setMax(1)
    .setOption('legend', {
      showLegend: true,
      displayMode: LegendDisplayMode.List,
      placement: 'bottom',
    })
    .setCustomFieldConfig('drawStyle', GraphDrawStyle.Line)
    .setCustomFieldConfig('lineWidth', 2)
    .setCustomFieldConfig('fillOpacity', 10)
    .setColor({ mode: 'palette-classic' })
    .setThresholds({
      mode: ThresholdsMode.Absolute,
      steps: [
        { value: 0, color: 'red' },
        { value: 0.5, color: 'yellow' },
        { value: 0.9, color: 'green' },
      ],
    })
    .build();

  const menu = useLLMVizMenu(viz, dataProvider);

  return (
    <VizPanel
      title="Evaluation score"
      description="Fraction of criteria satisfied (0-1)."
      viz={viz}
      dataProvider={dataProvider}
      menu={menu}
    />
  );
};

export const CriterionPassFail = () => {
  const metricsDS = useMetricsDS();

  const dataProvider = useQueryRunner({
    maxDataPoints: 200,
    queries: [
      {
        expr: `avg by (criterion_index) (probe_llm_eval_criterion_passed{${TENANT_FILTER}})`,
        instant: false,
        legendFormat: 'criterion {{criterion_index}}',
        refId: 'A',
      },
    ],
    datasource: metricsDS,
  });

  const viz = VizConfigBuilders.timeseries()
    .setMin(0)
    .setMax(1)
    .setOption('legend', {
      showLegend: true,
      displayMode: LegendDisplayMode.Table,
      placement: 'right',
      calcs: ['mean', 'lastNotNull'],
    })
    .setCustomFieldConfig('drawStyle', GraphDrawStyle.Line)
    .setCustomFieldConfig('lineWidth', 2)
    .setColor({ mode: 'palette-classic' })
    .build();

  const menu = useLLMVizMenu(viz, dataProvider);

  return (
    <VizPanel
      title="Pass/fail per criterion"
      description="One series per criterion_index. 1 = passed, 0 = failed."
      viz={viz}
      dataProvider={dataProvider}
      menu={menu}
    />
  );
};

export const CriteriaPassRate = () => {
  const metricsDS = useMetricsDS();

  const dataProvider = useQueryRunner({
    maxDataPoints: 1,
    queries: [
      {
        expr: `avg(probe_llm_eval_criteria_passed{${TENANT_FILTER}}) / avg(probe_llm_eval_criteria_total{${TENANT_FILTER}})`,
        instant: false,
        legendFormat: 'pass rate',
        refId: 'A',
      },
    ],
    datasource: metricsDS,
  });

  const viz = VizConfigBuilders.stat()
    .setOption('graphMode', BigValueGraphMode.Area)
    .setUnit('percentunit')
    .setDecimals(0)
    .setMin(0)
    .setMax(1)
    .setNoValue('No data')
    .setThresholds({
      mode: ThresholdsMode.Absolute,
      steps: [
        { value: 0, color: 'red' },
        { value: 0.5, color: 'yellow' },
        { value: 0.9, color: 'green' },
      ],
    })
    .build();

  const menu = useLLMVizMenu(viz, dataProvider);

  return (
    <VizPanel
      title="Criteria pass rate"
      description="Average passed / total across the time range."
      viz={viz}
      dataProvider={dataProvider}
      menu={menu}
    />
  );
};

export const TargetLatency = () => {
  const metricsDS = useMetricsDS();

  const dataProvider = useQueryRunner({
    maxDataPoints: 200,
    queries: [
      {
        expr: `avg(probe_llm_target_response_seconds{${TENANT_FILTER}})`,
        instant: false,
        legendFormat: 'target LLM',
        refId: 'A',
      },
      {
        expr: `avg(probe_llm_judge_seconds{${TENANT_FILTER}})`,
        instant: false,
        legendFormat: 'judge LLM',
        refId: 'B',
      },
    ],
    datasource: metricsDS,
  });

  const viz = VizConfigBuilders.timeseries()
    .setUnit('s')
    .setOption('legend', {
      showLegend: true,
      displayMode: LegendDisplayMode.List,
      placement: 'bottom',
    })
    .setCustomFieldConfig('drawStyle', GraphDrawStyle.Line)
    .setCustomFieldConfig('lineWidth', 2)
    .setColor({ mode: 'palette-classic' })
    .build();

  const menu = useLLMVizMenu(viz, dataProvider);

  return (
    <VizPanel
      title="Target & judge latency"
      description="Time spent calling the target LLM vs the judge proxy."
      viz={viz}
      dataProvider={dataProvider}
      menu={menu}
    />
  );
};

export const JudgeTokens = () => {
  const metricsDS = useMetricsDS();

  const dataProvider = useQueryRunner({
    maxDataPoints: 200,
    queries: [
      {
        expr: `sum(rate(probe_llm_judge_input_tokens{${TENANT_FILTER}}[$__rate_interval]))`,
        instant: false,
        legendFormat: 'input tokens/s',
        refId: 'A',
      },
      {
        expr: `sum(rate(probe_llm_judge_output_tokens{${TENANT_FILTER}}[$__rate_interval]))`,
        instant: false,
        legendFormat: 'output tokens/s',
        refId: 'B',
      },
    ],
    datasource: metricsDS,
  });

  const viz = VizConfigBuilders.timeseries()
    .setUnit('short')
    .setOption('legend', {
      showLegend: true,
      displayMode: LegendDisplayMode.List,
      placement: 'bottom',
    })
    .setCustomFieldConfig('drawStyle', GraphDrawStyle.Line)
    .setCustomFieldConfig('lineWidth', 2)
    .setCustomFieldConfig('fillOpacity', 10)
    .setColor({ mode: 'palette-classic' })
    .build();

  const menu = useLLMVizMenu(viz, dataProvider);

  return (
    <VizPanel
      title="Judge token usage"
      description="Per-second input/output tokens consumed by the judge LLM. Cost proxy."
      viz={viz}
      dataProvider={dataProvider}
      menu={menu}
    />
  );
};
