import React from 'react';
import { useFormContext } from 'react-hook-form';
import { Button, useTheme2 } from '@grafana/ui';
import { css } from '@emotion/css';
import { CHECKSTER_TEST_ID } from 'test/dataTestIds';

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

  const {
    formState: { disabled, isDirty, isSubmitting },
  } = useFormContext();

  const disableSubmit = disabled || !isDirty || isSubmitting;

  return (
    <div
      className={css`
        position: sticky;
        bottom: 0;
        background-color: ${theme.colors.background.primary};
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
          data-testid={CHECKSTER_TEST_ID.form.submitButton}
          variant={isStepsComplete || !next ? 'primary' : 'secondary'}
          disabled={disableSubmit}
        >
          Save
        </Button>
      </div>
    </div>
  );
}
