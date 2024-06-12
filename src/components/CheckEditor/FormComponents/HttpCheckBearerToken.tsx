import React from 'react';
import { useFormContext } from 'react-hook-form';
import { OrgRole } from '@grafana/data';

import { CheckFormValuesHttp } from 'types';
import { hasRole } from 'utils';
import { PasswordField } from 'components/PasswordField/PasswordField';

export const HttpCheckBearerToken = () => {
  const isEditor = hasRole(OrgRole.Editor);
  const { formState, register } = useFormContext<CheckFormValuesHttp>();
  const id = 'bearerToken';

  return (
    <PasswordField
      {...register('settings.http.bearerToken')}
      label="Include bearer authorization header in request"
      disabled={!isEditor}
      invalid={Boolean(formState.errors.settings?.http?.bearerToken)}
      error={formState.errors.settings?.http?.bearerToken?.message}
      placeholder="Bearer token"
      id={id}
      required={true}
      data-fs-element="Bearer token input"
    />
  );
};
