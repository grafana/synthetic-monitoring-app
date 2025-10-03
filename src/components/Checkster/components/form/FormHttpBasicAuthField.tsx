import React from 'react';
import { useFormContext } from 'react-hook-form';
import { Input, Stack } from '@grafana/ui';

import { CheckFormFieldPath } from '../../types';
import { CheckFormValues } from 'types';
import { useDOMId } from 'hooks/useDOMId';

import { getFieldErrorProps } from '../../utils/form';
import { PasswordInput } from '../PasswordInput';
import { StyledField } from '../ui/StyledField';

interface FormHttpBasicAuthFieldProps {
  field: CheckFormFieldPath;
}

export function FormHttpBasicAuthField({ field }: FormHttpBasicAuthFieldProps) {
  const usernameInputId = useDOMId();
  const passwordInputId = useDOMId();

  const {
    register,
    formState: { errors, disabled },
  } = useFormContext<CheckFormValues>();
  const usernameField = `${field}.username` as any; // TODO: Fix `any` usage
  const passwordField = `${field}.password` as any;
  return (
    <Stack direction="row" gap={1}>
      {/* TODO: Seems to be required if one of the other is not empty? */}
      <StyledField
        grow
        label="Username"
        required
        htmlFor={usernameInputId}
        {...getFieldErrorProps(errors, usernameField)}
      >
        <Input id={usernameInputId} {...register(usernameField)} disabled={disabled} />
      </StyledField>
      <StyledField
        grow
        htmlFor={passwordInputId}
        label="Password"
        required
        {...getFieldErrorProps(errors, passwordField)}
      >
        <PasswordInput id={passwordInputId} {...register(passwordField)} disabled={disabled} />
      </StyledField>
    </Stack>
  );
}
