import React from 'react';
import { Button, useTheme2 } from '@grafana/ui';
import { css } from '@emotion/css';

import { DataTestIds } from '../../../../test/dataTestIds';
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
            iconPlacement="right"
            icon="arrow-right"
          >
            {next.label}
          </Button>
        )}
        <Button
          type="submit"
          data-testid={DataTestIds.CHECK_FORM_SUBMIT_BUTTON}
          variant={isStepsComplete || !next ? 'primary' : 'secondary'}
        >
          Save
        </Button>
      </div>
    </div>
  );
}
