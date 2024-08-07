import React from 'react';
import { Controller, useFormContext } from 'react-hook-form';
import { Field, MultiSelect } from '@grafana/ui';

import { CheckFormValues, HttpVersion } from 'types';
import { useCheckFormContext } from 'components/CheckForm/CheckFormContext/CheckFormContext';

const httpVersionOptions = [
  {
    label: 'HTTP/1.0',
    value: HttpVersion.HTTP1_0,
  },
  {
    label: 'HTTP/1.1',
    value: HttpVersion.HTTP1_1,
  },
  {
    label: 'HTTP/2',
    value: HttpVersion.HTTP2_0,
  },
];

export const HttpCheckValidHttpVersions = () => {
  const { control } = useFormContext<CheckFormValues>();
  const { isFormDisabled } = useCheckFormContext();
  const id = 'http-settings-valid-http-versions';

  return (
    <Field
      label="Valid HTTP versions"
      description="Accepted HTTP versions for this probe"
      htmlFor={id}
      data-fs-element="Valid http versions select"
    >
      <Controller
        control={control}
        name="settings.http.validHTTPVersions"
        render={({ field }) => {
          const { ref, onChange, ...rest } = field;

          return (
            <MultiSelect
              {...rest}
              disabled={isFormDisabled}
              inputId={id}
              onChange={(values) => onChange(values.map((v) => v.value))}
              options={httpVersionOptions}
            />
          );
        }}
      />
    </Field>
  );
};
