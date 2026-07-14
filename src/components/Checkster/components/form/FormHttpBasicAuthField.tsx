import React from 'react';
import { useFormContext } from 'react-hook-form';
import { GrafanaTheme2 } from '@grafana/data';
import { Input, Stack, useStyles2 } from '@grafana/ui';
import { css } from '@emotion/css';

import { CheckFormFieldPath } from '../../types';
import { CheckFormValues } from 'types';
import { useDOMId } from 'hooks/useDOMId';

import { getFieldErrorProps } from '../../utils/form';
import { StyledField } from '../ui/StyledField';
import { FormSecretOrPlaintextField, useSecretsFieldEnabled } from './FormSecretOrPlaintextField';

interface FormHttpBasicAuthFieldProps {
  field: CheckFormFieldPath;
}

export function FormHttpBasicAuthField({ field }: FormHttpBasicAuthFieldProps) {
  const usernameInputId = useDOMId();
  const styles = useStyles2(getStyles);

  const {
    register,
    formState: { errors, disabled },
  } = useFormContext<CheckFormValues>();
  const usernameField = `${field}.username` as any; // TODO: Fix `any` usage
  const passwordField = `${field}.password` as any;

  // When the Password field shows the Value/Secret toggle, its label row is
  // taller than a plain label. Reserve the same height on the Username label so
  // the two inputs stay top-aligned regardless of any error/hint below either.
  const secretsEnabled = useSecretsFieldEnabled(true);

  return (
    <Stack direction="row" gap={1} alignItems="flex-start">
      {/* TODO: Seems to be required if one of the other is not empty? */}
      <StyledField
        grow
        label="Username"
        required
        htmlFor={usernameInputId}
        className={secretsEnabled ? styles.matchToggleLabelHeight : undefined}
        {...getFieldErrorProps(errors, usernameField)}
      >
        <Input id={usernameInputId} {...register(usernameField)} disabled={disabled} />
      </StyledField>
      {/* Only the password is resolved by the agent, so only it can reference a secret. */}
      <FormSecretOrPlaintextField grow field={passwordField} label="Password" required variant="password" allowSecrets />
    </Stack>
  );
}

const getStyles = (theme: GrafanaTheme2) => ({
  // Match FormSecretOrPlaintextField's label-row height (the sm RadioButtonGroup)
  // so the Username input lines up with the Password input beside it.
  matchToggleLabelHeight: css({
    '& > div:first-child': {
      minHeight: theme.spacing(3),
    },
  }),
});
