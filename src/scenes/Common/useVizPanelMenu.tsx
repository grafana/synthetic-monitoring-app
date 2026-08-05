import { DataFrame, PanelMenuItem, TimeRange } from '@grafana/data';
import { QueryRunnerState, SceneDataQuery, VizConfig, VizPanelMenu } from '@grafana/scenes';
import { useTimeRange, useVariableInterpolator } from '@grafana/scenes-react';

import { correctSceneVariableInterpolation } from 'scenes/utils';

interface UseVizPanelMenuProps {
  data: QueryRunnerState;
  viz: VizConfig;
  currentTimeRange?: TimeRange;
  variables?: string[]; // Variables to interpolate (e.g., ['job', 'probe', 'instance'])
  /**
   * Where "Explore" should send the user, when that is not the datasource the
   * panel queried.
   *
   * A panel asking the Synthetic Monitoring datasource for a named query has no
   * expression in its target and its datasource cannot render one, so Explore has
   * to be pointed at the Prometheus or Loki datasource that actually holds the
   * data. Omit it and the panel's own datasource is used, as before.
   */
  exploreDatasourceUid?: string;
}

/**
 * The expression a named query resolved to, as reported by the datasource that ran
 * it. Both datasources put this in frame metadata:
 *
 *   Prometheus: 'Expr: max by () (max_over_time(probe_success{...}[60s]))\nStep: 1m0s'
 *   Loki:       'Expr: {probe=~".*", job="test"} | logfmt'
 *
 * so the expression runs to the end of the string or to the next `Detail:` line.
 *
 * Exported for testing.
 */
export function executedExpr(series: DataFrame[] | undefined, refId: string | undefined): string | undefined {
  const frame = series?.find((f) => f.refId === refId);
  const executed = frame?.meta?.executedQueryString;

  if (!executed) {
    return undefined;
  }

  const [, expr] = executed.match(/^Expr:\s*([\s\S]*?)(?:\n[A-Z][a-zA-Z ]*:|$)/) ?? [];

  return expr?.trim() || undefined;
}

export function useVizPanelMenu({
  data,
  viz,
  currentTimeRange,
  variables,
  exploreDatasourceUid,
}: UseVizPanelMenuProps): VizPanelMenu {
  const [timeRange] = useTimeRange();
  const vars = variables || ['job', 'probe', 'instance'];
  const { from, to } = currentTimeRange || timeRange;

  const interpolator = useVariableInterpolator({ variables: vars, timeRange: true });

  const datasource = exploreDatasourceUid ?? data.datasource?.uid;

  // A named query carries parameters rather than an expression, so recover the
  // expression the datasource actually ran. Panels still sending `expr` keep
  // interpolating it themselves.
  const queries = data.queries.map((q: SceneDataQuery) => {
    const expr = q.expr
      ? correctSceneVariableInterpolation(interpolator(q.expr))
      : executedExpr(data.data?.series, q.refId);

    // drop the named-query fields: they mean nothing to the datasource Explore opens
    const { queryType, ...rest } = q;

    return expr ? { ...rest, expr } : q;
  });

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
