import React from 'react';
import { Controller, useFormContext } from 'react-hook-form';
import { SelectableValue } from '@grafana/data';
import { Field, Select } from '@grafana/ui';

import { CheckFormValuesHttp } from 'types';
import { HTTP_COMPRESSION_ALGO_OPTIONS } from 'components/constants';

export const HttpCheckCompressionOption = () => {
  const compressionId = 'http-settings-compression';
  const { control, formState } = useFormContext<CheckFormValuesHttp>();

  return (
    <Field
      label="Compression option"
      description="The compression algorithm to expect in the response body"
      htmlFor={compressionId}
      data-fs-element="Check compression select"
    >
      <Controller
        control={control}
        name="settings.http.compression"
        render={({ field }) => {
          const { ref, ...rest } = field;
          const handleChange = (value: SelectableValue<string>) => {
            field.onChange(value.value);
          };

          return (
            // eslint-disable-next-line @typescript-eslint/no-deprecated
            <Select
              {...rest}
              disabled={formState.disabled}
              inputId={compressionId}
              options={HTTP_COMPRESSION_ALGO_OPTIONS}
              onChange={handleChange}
            />
          );
        }}
      />
    </Field>
  );
};
