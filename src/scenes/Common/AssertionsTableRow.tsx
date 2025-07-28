import React from 'react';
import { ExpanderComponentProps } from 'react-data-table-component';
import { VizConfigBuilders } from '@grafana/scenes';
import { useQueryRunner, VizPanel } from '@grafana/scenes-react';
import { Box } from '@grafana/ui';

import { Check } from 'types';
import { useLogsDS } from 'hooks/useLogsDS';
import { DataRow } from 'scenes/Common/AssertionsTable.types';
import { useVizPanelMenu } from 'scenes/Common/useVizPanelMenu';
import { getMinStepFromFrequency } from 'scenes/utils';

interface AssertionTableRowProps extends ExpanderComponentProps<DataRow> {
  check: Check;
}

export function AssertionTableRow({ check, data }: AssertionTableRowProps) {
  const logsDS = useLogsDS();
  const minStep = getMinStepFromFrequency(check.frequency);
  const escaped = data.name.replace(/\\/g, '\\\\').replace(/"/g, '\\"');

  const queries = [
    {
      expr: `
        count_over_time (
          {job="$job", instance="$instance", probe=~"$probe"}
          | logfmt check, value, msg, probe
          | __error__ = ""
          | msg = "check result"
          | value = "1"
          | check = "${escaped}"
          | keep probe
          [${minStep}]
        )
        / 
        count_over_time  (
            {job="$job", instance="$instance", probe=~"$probe"}
            | logfmt check, msg, probe
            | __error__ = ""
            | msg = "check result"
            | check = "${escaped}"
            | keep probe
            [${minStep}]
          )
      `,
      refId: 'A',
      queryType: 'range',
      hide: false,
      legendFormat: '{{ probe }}',
    },
  ];

  const dataProvider = useQueryRunner({
    queries,
    datasource: logsDS,
  });

  const viz = VizConfigBuilders.timeseries().setUnit('percentunit').setMax(1).build();

  const menu = useVizPanelMenu({
    data: dataProvider.useState(),
    viz,
  });

  return (
    <Box padding={2} height={`300px`}>
      <VizPanel menu={menu} title={`Success rate by probe for ${data.name}`} viz={viz} dataProvider={dataProvider} />
    </Box>
  );
}
