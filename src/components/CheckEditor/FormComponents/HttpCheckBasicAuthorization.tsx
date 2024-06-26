import React from 'react';
import { useFormContext } from 'react-hook-form';
import { GrafanaTheme2, OrgRole } from '@grafana/data';
import { Field, Input, Label, useStyles2 } from '@grafana/ui';
import { css } from '@emotion/css';

import { CheckFormValuesHttp } from 'types';
import { hasRole } from 'utils';
import { PasswordField } from 'components/PasswordField/PasswordField';

export const HttpCheckBasicAuthorization = () => {
  const isEditor = hasRole(OrgRole.Editor);
  const { formState, register } = useFormContext<CheckFormValuesHttp>();
  const userNameId = 'basicAuthUsername';
  const passwordId = 'basicAuthPassword';
  const styles = useStyles2(getStyles);

  return (
    <div className={styles.stack}>
      <Label className={styles.stack}>Include basic authorization header in request</Label>
      <Field
        htmlFor={userNameId}
        disabled={!isEditor}
        label="Username"
        invalid={Boolean(formState.errors.settings?.http?.basicAuth?.username)}
        error={formState.errors.settings?.http?.basicAuth?.username?.message}
        required
      >
        <Input
          {...register('settings.http.basicAuth.username')}
          id={userNameId}
          type="text"
          disabled={!isEditor}
          data-fs-element="Basic auth username input"
        />
      </Field>

      <PasswordField
        {...register('settings.http.basicAuth.password')}
        label="Password"
        disabled={!isEditor}
        invalid={Boolean(formState.errors.settings?.http?.basicAuth?.password)}
        error={formState.errors.settings?.http?.basicAuth?.password?.message}
        id={passwordId}
        required={true}
        data-fs-element="Basic auth password input"
      />
    </div>
  );
};

const getStyles = (theme: GrafanaTheme2) => ({
  stack: css({
    display: `flex`,
    gap: theme.spacing(1),
    flexDirection: `column`,
  }),
});
