import React from 'react';
import { DataTransformerID } from '@grafana/data';
import { VizConfigBuilders } from '@grafana/scenes';
import { useDataTransformer, useQueryRunner, VizPanel } from '@grafana/scenes-react';
import { TableCellDisplayMode } from '@grafana/ui';

import { useLogsDS } from 'hooks/useLogsDS';
import { useVizPanelMenu } from 'scenes/Common/useVizPanelMenu';

export const CommonHosts = () => {
  const logsDS = useLogsDS();

  const query = {
    expr: 'sum by (Hosts) (count_over_time({check_name="traceroute", job="$job", instance="$instance", probe=~"$probe"} | logfmt | Hosts != "" [$__range]))',
    instant: true,
    refId: 'A',
  };

  const dataProvider = useQueryRunner({
    queries: [query],
    datasource: logsDS,
  });

  const dataTransformer = useDataTransformer({
    data: dataProvider,
    transformations: [
      {
        id: DataTransformerID.organize,
        options: {
          excludeByName: {
            Time: true,
          },
          indexByName: {},
          renameByName: {},
        },
      },
    ],
  });

  const menu = useVizPanelMenu({
    data: dataProvider.useState(),
    viz,
  });

  return (
    <VizPanel
      dataProvider={dataTransformer}
      description={`Shows the common hosts traversed in a single traceroute`}
      menu={menu}
      title={`Common hosts`}
      viz={viz}
    />
  );
};

const viz = VizConfigBuilders.table()
  .setOverrides((b) => {
    return b.matchFieldsWithName(`Value #A`).overrideDisplayName(`Times Transited`).build();
  })
  .setCustomFieldConfig(`cellOptions`, {
    type: TableCellDisplayMode.Auto,
  })
  .setCustomFieldConfig(`filterable`, true)
  .setOption(`sortBy`, [
    {
      desc: true,
      displayName: `Times Transited`,
    },
    {
      desc: false,
      displayName: `Hosts`,
    },
  ])
  .build();
