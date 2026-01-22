import React from 'react';
import { Controller, useFormContext } from 'react-hook-form';
import { Combobox, ComboboxOption, Field } from '@grafana/ui';

import { CheckFormValuesHttp, HttpSslOption } from 'types';
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
            <Combobox
              {...rest}
              disabled={formState.disabled}
              id={id}
              value={field.value as ComboboxOption<HttpSslOption>}
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
