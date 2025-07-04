import React from 'react';
import { useFormContext } from 'react-hook-form';

import { CheckFormValuesHttp } from 'types';
import { PasswordField } from 'components/PasswordField/PasswordField';

export const HttpCheckBearerToken = ({ disabled }: { disabled?: boolean }) => {
  const { formState, register } = useFormContext<CheckFormValuesHttp>();
  const id = 'bearerToken';

  return (
    <PasswordField
      {...register('settings.http.bearerToken')}
      data-fs-element="Bearer token input"
      disabled={disabled}
      error={formState.errors.settings?.http?.bearerToken?.message}
      id={id}
      invalid={Boolean(formState.errors.settings?.http?.bearerToken)}
      label="Bearer Authorization"
      placeholder="Bearer token"
      required
    />
  );
};
