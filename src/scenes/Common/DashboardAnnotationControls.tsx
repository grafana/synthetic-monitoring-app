import React from 'react';
import { AnnotationQuery } from '@grafana/data';
import { DataLayerControl } from '@grafana/scenes-react';
import { Stack } from '@grafana/ui';

interface DashboardAnnotationControlsProps {
  annotations: AnnotationQuery[];
}

export const DashboardAnnotationControls = ({ annotations }: DashboardAnnotationControlsProps) => {
  return (
    <Stack gap={2}>
      {annotations.map((annotation) => (
        <DataLayerControl key={annotation.name} name={annotation.name} />
      ))}
    </Stack>
  );
};
