import React from 'react';
import { IconButton, LinkButton, Stack } from '@grafana/ui';

import { StatelessTimepoint } from 'scenes/components/TimepointExplorer/TimepointExplorer.types';
import { useTimepointViewerActions } from 'scenes/components/TimepointExplorer/TimepointViewerActions.hooks';

export const TimepointViewerActions = ({ timepoint }: { timepoint: StatelessTimepoint }) => {
  const actions = useTimepointViewerActions(timepoint);

  return (
    <Stack direction={`row`} gap={1}>
      {actions.map((action) => {
        const props = {
          tooltip: action.label,
          size: 'md',
          disabled: action.disabled,
          onClick: action.onClick,
        } as const;

        if (action.href) {
          return <LinkButton fill="text" key={action.label} href={action.href} icon={action.icon} {...props} />;
        }

        return <IconButton key={action.label} name={action.icon} {...props} size="xl" />;
      })}
    </Stack>
  );
};
