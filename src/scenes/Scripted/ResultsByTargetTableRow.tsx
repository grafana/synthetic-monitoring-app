import React from 'react';
import { ExpanderComponentProps } from 'react-data-table-component';
import { VizConfigBuilders } from '@grafana/scenes';
import { useQueryRunner, VizPanel } from '@grafana/scenes-react';
import { AxisColorMode, GraphGradientMode, TooltipDisplayMode } from '@grafana/schema';
import { AxisPlacement, Box, Grid, Stack, StackingMode } from '@grafana/ui';
import { getScriptedHTTPRequestsErrorRateQuery } from 'queries/scriptedHTTPRequestsErrorRate';

import { CheckType } from 'types';
import { useMetricsDS } from 'hooks/useMetricsDS';
import { useVizPanelMenu } from 'scenes/Common/useVizPanelMenu';

interface DataRow {
  name: string;
  method: string;
  expectedResponse: number;
  successRate: number;
  latency: number;
}

interface ResultsByTargetTableRowProps extends ExpanderComponentProps<DataRow> {
  checkType: CheckType;
}

export function ResultsByTargetTableRow({ data, checkType }: ResultsByTargetTableRowProps) {
  const labelName = checkType === CheckType.MULTI_HTTP ? 'url' : 'name';
  const labelValue = data.name;
  const method = data.method;

  const props = {
    labelValue,
    labelName,
    method,
  };

  return (
    <Box padding={1} marginBottom={1}>
      <Stack direction="column" gap={1}>
        <Grid columns={2} gap={1}>
          <ErrorRateByTargetProbe {...props} />
          <ExpectedResponse {...props} />
          <DurationByTargetProbe {...props} />
          <LatencyByPhaseTarget {...props} />
        </Grid>
      </Stack>
    </Box>
  );
}

interface ChildProps {
  labelValue: string;
  labelName: string;
  method: string;
}

const ErrorRateByTargetProbe = ({ labelValue, labelName, method }: ChildProps) => {
  const metricsDS = useMetricsDS();
  const query = getScriptedHTTPRequestsErrorRateQuery({ labelName, labelValue, method });
  const dataProvider = useQueryRunner({
    queries: [
      {
        ...query,
        refId: `A`,
        legendFormat: '{{probe}}',
        range: true,
      },
    ],
    datasource: metricsDS,
  });

  const viz = VizConfigBuilders.timeseries().setUnit('percentunit').setMax(1).build();
  const menu = useVizPanelMenu({
    data: dataProvider.useState(),
    viz,
  });

  return (
    <Box height={`300px`}>
      <VizPanel menu={menu} title={`Error Rate for ${labelValue} ${method}`} viz={viz} dataProvider={dataProvider} />
    </Box>
  );
};

const ExpectedResponse = ({ labelValue, labelName, method }: ChildProps) => {
  const metricsDS = useMetricsDS();
  const dataProvider = useQueryRunner({
    queries: [
      {
        expr: `
          sum by (probe) (probe_http_got_expected_response{job="$job", instance="$instance", ${labelName}="${labelValue}", probe=~"$probe", method="${method}"})
          / 
          count by (probe) (probe_http_got_expected_response{job="$job", instance="$instance", ${labelName}="${labelValue}", probe=~"$probe", method="${method}"})`,
        legendFormat: '{{probe}}',
        range: false,
        refId: 'B',
      },
    ],
    datasource: metricsDS,
  });

  const viz = VizConfigBuilders.timeseries().setUnit('percentunit').setMax(1).build();
  const menu = useVizPanelMenu({
    data: dataProvider.useState(),
    viz,
  });

  return (
    <Box height={`300px`}>
      <VizPanel
        menu={menu}
        title={`Expected Response for ${labelValue} ${method}`}
        viz={viz}
        dataProvider={dataProvider}
      />
    </Box>
  );
};

const DurationByTargetProbe = ({ labelValue, labelName, method }: ChildProps) => {
  const metricsDS = useMetricsDS();
  const dataProvider = useQueryRunner({
    queries: [
      {
        expr: `sum by (probe) (probe_http_total_duration_seconds{probe=~"$probe", job="$job", instance="$instance", ${labelName}="${labelValue}", method="${method}"})`,
        refId: 'C',
        legendFormat: '{{probe}}',
      },
    ],
    datasource: metricsDS,
  });

  const viz = VizConfigBuilders.timeseries().setUnit('s').build();
  const menu = useVizPanelMenu({
    data: dataProvider.useState(),
    viz,
  });

  return (
    <Box height={`300px`}>
      <VizPanel
        menu={menu}
        title={`Duration by probe for ${labelValue} ${method}`}
        viz={viz}
        dataProvider={dataProvider}
      />
    </Box>
  );
};

const LatencyByPhaseTarget = ({ labelValue, labelName, method }: ChildProps) => {
  const metricsDS = useMetricsDS();
  const dataProvider = useQueryRunner({
    queries: [
      {
        refId: 'A',
        expr: `sum by (phase) (probe_http_duration_seconds{job="$job", instance="$instance", ${labelName}="${labelValue}", probe=~"$probe", method="${method}"})`,
        legendFormat: '__auto',
        range: true,
      },
    ],
    datasource: metricsDS,
  });

  const viz = VizConfigBuilders.barchart()
    .setUnit('s')
    .setCustomFieldConfig(`lineWidth`, 1)
    .setCustomFieldConfig(`fillOpacity`, 80)
    .setCustomFieldConfig(`gradientMode`, GraphGradientMode.None)
    .setCustomFieldConfig(`axisPlacement`, AxisPlacement.Auto)
    .setCustomFieldConfig(`axisLabel`, '')
    .setCustomFieldConfig(`axisColorMode`, AxisColorMode.Text)
    .setCustomFieldConfig(`axisBorderShow`, false)
    .setOption('stacking', StackingMode.Normal)
    .setOption('xTickLabelSpacing', 75)
    .setOption('tooltip', {
      mode: TooltipDisplayMode.Multi,
      hideZeros: false,
    })
    .setOption('barWidth', 0.97)
    .setOption(`groupWidth`, 0.7)
    .build();

  const menu = useVizPanelMenu({
    data: dataProvider.useState(),
    viz,
  });

  return (
    <Box height={`300px`}>
      <VizPanel
        menu={menu}
        title={`Latency by phase for ${labelValue} ${method}`}
        viz={viz}
        dataProvider={dataProvider}
      />
    </Box>
  );
};
