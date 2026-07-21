import React from 'react';
import { AnnotationQuery } from '@grafana/data';
import { InlineSwitch, Stack } from '@grafana/ui';

import { useDashboardAnnotationsOptional } from './DashboardAnnotationsProvider';

export function DashboardAnnotationControls({ annotations }: { annotations: AnnotationQuery[] }) {
  const context = useDashboardAnnotationsOptional();

  if (!context) {
    return null;
  }

  return (
    <Stack gap={2}>
      {annotations.map((annotation) => {
        const name = annotation.name!;

        return (
          <InlineSwitch
            key={name}
            label={name}
            transparent
            showLabel
            value={context.enabledByName[name] !== false}
            onChange={(event) => context.setEnabled(name, event.currentTarget.checked)}
          />
        );
      })}
    </Stack>
  );
}
