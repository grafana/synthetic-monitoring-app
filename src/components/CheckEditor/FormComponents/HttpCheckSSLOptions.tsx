import React from 'react';
import { Controller, useFormContext } from 'react-hook-form';
import { Field, Select } from '@grafana/ui';

import { CheckFormValuesHttp } from 'types';
import { HTTP_SSL_OPTIONS } from 'components/constants';

export const HttpCheckSSLOptions = () => {
  const { control, formState } = useFormContext<CheckFormValuesHttp>();

  const id = 'http-settings-ssl-options';

  return (
    <Field
      label="SSL options"
      description="Choose whether probe fails if SSL is present or not present"
      htmlFor={id}
      data-fs-element="SSL options select"
    >
      <Controller<CheckFormValuesHttp>
        name="settings.http.sslOptions"
        control={control}
        render={({ field }) => {
          const { ref, onChange, ...rest } = field;
          return (
            <Select
              {...rest}
              disabled={formState.disabled}
              inputId={id}
              onChange={({ value }) => {
                onChange(value);
              }}
              options={HTTP_SSL_OPTIONS}
            />
          );
        }}
      />
    </Field>
  );
};
