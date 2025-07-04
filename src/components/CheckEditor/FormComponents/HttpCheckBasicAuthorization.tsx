import React from 'react';
import { useFormContext } from 'react-hook-form';
import { Field, Input, Stack } from '@grafana/ui';

import { CheckFormValuesHttp } from 'types';
import { PasswordField } from 'components/PasswordField/PasswordField';

export const HttpCheckBasicAuthorization = ({ disabled }: { disabled?: boolean }) => {
  const { formState, register } = useFormContext<CheckFormValuesHttp>();
  const userNameId = 'basicAuthUsername';
  const passwordId = 'basicAuthPassword';

  return (
    <Stack direction={`column`}>
      <Field
        htmlFor={userNameId}
        label="Username"
        invalid={Boolean(formState.errors.settings?.http?.basicAuth?.username)}
        error={formState.errors.settings?.http?.basicAuth?.username?.message}
        required
      >
        <Input
          {...register('settings.http.basicAuth.username')}
          data-fs-element="Basic auth username input"
          disabled={disabled}
          id={userNameId}
          type="text"
        />
      </Field>

      <PasswordField
        {...register('settings.http.basicAuth.password')}
        data-fs-element="Basic auth password input"
        disabled={disabled}
        error={formState.errors.settings?.http?.basicAuth?.password?.message}
        id={passwordId}
        invalid={Boolean(formState.errors.settings?.http?.basicAuth?.password)}
        label="Password"
        required
      />
    </Stack>
  );
};
