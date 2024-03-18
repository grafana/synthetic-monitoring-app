import React from 'react';
import { useFormContext } from 'react-hook-form';
import { OrgRole } from '@grafana/data';
import { Field, Input } from '@grafana/ui';

import { CheckFormValuesHttp } from 'types';
import { hasRole } from 'utils';
import { OptionalInput } from 'components/OptionalInput/OptionalInput';

export const HttpCheckBearerToken = () => {
  const isEditor = hasRole(OrgRole.Editor);
  const { formState, register } = useFormContext<CheckFormValuesHttp>();
  const id = 'bearerToken';

  return (
    <OptionalInput label="Include bearer authorization header in request">
      <Field
        htmlFor={id}
        disabled={!isEditor}
        invalid={Boolean(formState.errors.settings?.http?.bearerToken)}
        error={formState.errors.settings?.http?.bearerToken?.message}
      >
        <Input
          {...register('settings.http.bearerToken')}
          type="password"
          placeholder="Bearer token"
          disabled={!isEditor}
        />
      </Field>
    </OptionalInput>
  );
};
