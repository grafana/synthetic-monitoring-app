import React from 'react';
import { PanelRendererShell } from 'dashboards/components/PanelRendererShell';
import { DashboardPanelDefinition, useDashboardPanelQuery } from 'dashboards/hooks/useDashboardPanelQuery';

interface DashboardPanelProps {
  definition: DashboardPanelDefinition;
  height?: number | string;
  headerActions?: React.ReactNode;
}

export function DashboardPanel({ definition, height, headerActions }: DashboardPanelProps) {
  const { panelData, menuItems } = useDashboardPanelQuery(definition);

  return (
    <PanelRendererShell
      title={definition.title ?? definition.id}
      description={definition.description}
      pluginId={definition.pluginId}
      fieldConfig={definition.fieldConfig}
      options={definition.options}
      data={panelData}
      menuItems={menuItems}
      headerActions={headerActions}
      height={height}
    />
  );
}
