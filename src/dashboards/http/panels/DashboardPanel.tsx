import React, { useMemo } from 'react';
import { useDashboardAnnotationFrames } from 'dashboards/annotations/DashboardAnnotationsProvider';
import { PanelRendererShell } from 'dashboards/components/PanelRendererShell';
import { DashboardPanelDefinition, useDashboardPanelQuery } from 'dashboards/hooks/useDashboardPanelQuery';

interface DashboardPanelProps {
  definition: DashboardPanelDefinition;
  height?: number | string;
  headerActions?: React.ReactNode;
}

export function DashboardPanel({ definition, height, headerActions }: DashboardPanelProps) {
  const { panelData, menuItems, title } = useDashboardPanelQuery(definition);
  const annotationFrames = useDashboardAnnotationFrames();
  const data = useMemo(
    () => {
      const series = panelData.series ?? [];

      if (annotationFrames.length === 0) {
        return {
          ...panelData,
          series,
        };
      }

      return {
        ...panelData,
        series,
        annotations: annotationFrames.filter((frame) => Array.isArray(frame.fields) && frame.fields.length > 0),
      };
    },
    [annotationFrames, panelData]
  );

  return (
    <PanelRendererShell
      title={title ?? definition.id}
      description={definition.description}
      pluginId={definition.pluginId}
      fieldConfig={definition.fieldConfig}
      options={definition.options}
      data={data}
      menuItems={menuItems}
      headerActions={headerActions}
      height={height}
    />
  );
}
