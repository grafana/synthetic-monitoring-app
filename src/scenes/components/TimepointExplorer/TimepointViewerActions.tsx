import React from 'react';
import { GrafanaTheme2 } from '@grafana/data';
import { IconButton, LinkButton, Stack, useStyles2 } from '@grafana/ui';
import { css } from '@emotion/css';

import { StatelessTimepoint } from 'scenes/components/TimepointExplorer/TimepointExplorer.types';
import { useTimepointViewerActions } from 'scenes/components/TimepointExplorer/TimepointViewerActions.hooks';

export const TimepointViewerActions = ({ timepoint }: { timepoint: StatelessTimepoint }) => {
  const { actions, faroAction } = useTimepointViewerActions(timepoint);
  const styles = useStyles2(getStyles);

  return (
    <Stack direction={`row`} gap={1} alignItems="center">
      {faroAction && (
        <>
          {/* Frontend Observability gets its own slot, always rendered as a labelled,
              outlined button so it stays discoverable even when it has to degrade
              (loading, or no session found for this execution). */}
          <LinkButton
            key="frontend-observability"
            icon="frontend-observability"
            href={faroAction.href}
            disabled={faroAction.status !== 'available'}
            tooltip={faroAction.tooltip}
            onClick={faroAction.onClick}
            variant={faroAction.status === 'available' ? 'primary' : 'secondary'}
            fill="outline"
            size="md"
          >
            Frontend Observability
          </LinkButton>
          <div className={styles.divider} />
        </>
      )}
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

const getStyles = (theme: GrafanaTheme2) => ({
  divider: css`
    align-self: stretch;
    border-left: 1px solid ${theme.colors.border.weak};
    margin: ${theme.spacing(0.5)} 0;
  `,
});
