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
          id={userNameId}
          type="text"
          disabled={disabled}
          data-fs-element="Basic auth username input"
        />
      </Field>

      <PasswordField
        {...register('settings.http.basicAuth.password')}
        label="Password"
        disabled={disabled}
        invalid={Boolean(formState.errors.settings?.http?.basicAuth?.password)}
        error={formState.errors.settings?.http?.basicAuth?.password?.message}
        id={passwordId}
        required={true}
        data-fs-element="Basic auth password input"
      />
    </Stack>
  );
};
