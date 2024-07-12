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
      label="Bearer Authorization"
      disabled={disabled}
      invalid={Boolean(formState.errors.settings?.http?.bearerToken)}
      error={formState.errors.settings?.http?.bearerToken?.message}
      placeholder="Bearer token"
      id={id}
      required={true}
      data-fs-element="Bearer token input"
    />
  );
};
