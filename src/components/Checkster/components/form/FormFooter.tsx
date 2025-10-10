import React from 'react';
import { Button, Icon, Stack, useTheme2 } from '@grafana/ui';
import { css } from '@emotion/css';

import { useChecksterContext } from '../../contexts/ChecksterContext';

export function FormFooter() {
  const theme = useTheme2();
  const {
    formNavigation: {
      stepActions: { previous, next },
      setSectionActive,
      isStepsComplete,
    },
  } = useChecksterContext();

  return (
    <div
      className={css`
        position: relative;
        padding: ${theme.spacing(2)};
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: ${theme.spacing(1)};
        border-top: 1px solid ${theme.colors.border.medium};
      `}
    >
      <div>
        {previous && (
          <Button type="button" icon="arrow-left" variant="secondary" onClick={() => setSectionActive(previous.name)}>
            {previous.label}
          </Button>
        )}
      </div>

      <div
        className={css`
          display: flex;
          gap: ${theme.spacing(1)};
        `}
      >
        {next && (
          <Button
            type="button"
            variant={isStepsComplete ? 'secondary' : 'primary'}
            onClick={() => setSectionActive(next.name)}
          >
            {/* since Button.iconPosition=right does nothing */}
            <Stack alignItems="center">
              <span>{next.label}</span>
              <Icon size="lg" name="arrow-right" />
            </Stack>
          </Button>
        )}
        <Button type="submit" variant={isStepsComplete || !next ? 'primary' : 'secondary'}>
          Save
        </Button>
      </div>
    </div>
  );
}
