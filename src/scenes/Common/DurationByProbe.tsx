import React from 'react';
import { VizConfigBuilders } from '@grafana/scenes';
import { useQueryRunner, VizPanel } from '@grafana/scenes-react';

import { NamedQueryRequest } from 'datasource/types';
import { useMetricsDS } from 'hooks/useMetricsDS';
import { useSMDS } from 'hooks/useSMDS';
import { useVizPanelMenu } from 'scenes/Common/useVizPanelMenu';

export const DurationByProbe = ({ query, unit }: { query: NamedQueryRequest; unit: string }) => {
  const smDS = useSMDS();
  // only so "Explore" opens against the datasource that holds the data
  const metricsDS = useMetricsDS();

  const dataProvider = useQueryRunner({
    queries: [{ refId: 'A', ...query }],
    datasource: smDS.instanceSettings,
  });

  const viz = VizConfigBuilders.timeseries().setUnit(unit).build();
  const data = dataProvider.useState();
  const menu = useVizPanelMenu({ data, viz, exploreDatasourceUid: metricsDS?.uid });

  return <VizPanel title="Duration by probe" viz={viz} dataProvider={dataProvider} menu={menu} />;
};
