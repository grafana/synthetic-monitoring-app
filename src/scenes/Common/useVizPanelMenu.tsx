import { PanelMenuItem, TimeRange } from '@grafana/data';
import { QueryRunnerState, SceneDataQuery, VizConfig, VizPanelMenu } from '@grafana/scenes';
import { useTimeRange, useVariableInterpolator } from '@grafana/scenes-react';

import { correctSceneVariableInterpolation } from 'scenes/utils';

interface UseVizPanelMenuProps {
  data: QueryRunnerState;
  viz: VizConfig;
  currentTimeRange?: TimeRange;
  variables?: string[]; // Variables to interpolate (e.g., ['job', 'probe', 'instance'])
}

export function useVizPanelMenu({ data, viz, currentTimeRange, variables }: UseVizPanelMenuProps): VizPanelMenu {
  const [timeRange] = useTimeRange();
  const vars = variables || ['job', 'probe', 'instance'];
  const { from, to } = currentTimeRange || timeRange;

  const interpolator = useVariableInterpolator({ variables: vars, timeRange: true });

  let queries = data.queries;
  queries = queries.map((q: SceneDataQuery) => ({
    ...q,
    expr: correctSceneVariableInterpolation(interpolator(q.expr)),
  }));
  const datasource = data.datasource?.uid;

  const jsonDef = {
    fieldConfig: viz.fieldConfig,
    description: '',
    options: viz.options,
    type: viz.pluginId,
    datasource: { uid: datasource },
    targets: queries,
  };

  const left = encodeURIComponent(
    JSON.stringify({
      datasource,
      queries,
      range: {
        from,
        to,
      },
    })
  );

  const menuItems: PanelMenuItem[] = [
    {
      type: 'submenu',
      iconClassName: 'compass',
      text: 'Explore',
      href: `/explore?left=${left}`,
    },
    {
      type: 'submenu',
      iconClassName: 'copy',
      text: 'Copy JSON',
      onClick: () => {
        navigator.clipboard.writeText(JSON.stringify(jsonDef, null, 2));
      },
    },
  ];

  return new VizPanelMenu({
    items: menuItems,
  });
}
