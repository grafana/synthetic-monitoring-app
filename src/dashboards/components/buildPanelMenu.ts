import { PanelMenuItem, TimeRange } from '@grafana/data';

import { DashboardQueryTarget } from 'dashboards/query/types';

export type PanelMenuDefinition = {
  pluginId: string;
  fieldConfig: Record<string, unknown>;
  options: Record<string, unknown>;
  targets: DashboardQueryTarget[];
  datasourceUid?: string;
};

export function buildPanelMenu({
  definition,
  timeRange,
  datasourceUid,
}: {
  definition: PanelMenuDefinition;
  timeRange: TimeRange;
  datasourceUid: string;
}): PanelMenuItem[] {
  const { from, to } = timeRange;
  const queries = definition.targets.map((target) => ({
    ...target,
    datasource: { uid: datasourceUid },
  }));

  const left = encodeURIComponent(
    JSON.stringify({
      datasource: datasourceUid,
      queries,
      range: { from, to },
    })
  );

  const jsonDef = {
    fieldConfig: definition.fieldConfig,
    description: '',
    options: definition.options,
    type: definition.pluginId,
    datasource: { uid: datasourceUid },
    targets: queries,
  };

  return [
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
        void navigator.clipboard.writeText(JSON.stringify(jsonDef, null, 2));
      },
    },
  ];
}
