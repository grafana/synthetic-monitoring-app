import React from 'react';
import { useFormContext } from 'react-hook-form';
import { GrafanaTheme2 } from '@grafana/data';
import { Field, Input, useStyles2 } from '@grafana/ui';
import { css } from '@emotion/css';

import { CheckFormValuesHttp } from 'types';

export const HttpCheckCacheBuster = () => {
  const styles = useStyles2(getStyles);
  const { register, formState } = useFormContext<CheckFormValuesHttp>();
  const id = 'https-settings-cache-busting-query';

  return (
    <Field
      label="Cache busting query parameter name"
      description="The name of the query parameter used to prevent the server from using a cached response. Each probe will assign a random value to this parameter each time a request is made."
      htmlFor={id}
    >
      <Input
        {...register('settings.http.cacheBustingQueryParamName')}
        className={styles.input}
        data-fs-element="Cache busting query parameter name input"
        disabled={formState.disabled}
        id={id}
        placeholder="cache-bust"
      />
    </Field>
  );
};

const getStyles = (theme: GrafanaTheme2) => {
  return {
    input: css({
      marginTop: theme.spacing(1),
    }),
  };
};
