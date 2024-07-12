import React, { useId } from 'react';
import { Controller, FieldPath, useFormContext } from 'react-hook-form';
import { Field, Select } from '@grafana/ui';

import { CheckFormValues } from 'types';
import { IP_OPTIONS } from 'components/constants';

type CheckIpVersionProps = {
  description: string;
  disabled?: boolean;
  name: FieldPath<CheckFormValues>;
};

export const CheckIpVersion = ({ description, disabled, name }: CheckIpVersionProps) => {
  const { control } = useFormContext<CheckFormValues>();
  const id = useId().replace(/:/g, '_');

  return (
    <Field label="IP version" description={description} htmlFor={id} data-fs-element="IP version select">
      <Controller
        control={control}
        render={({ field }) => {
          const { ref, onChange, ...rest } = field;
          return (
            <Select
              {...rest}
              disabled={disabled}
              options={IP_OPTIONS}
              inputId={id}
              value={rest.value}
              onChange={({ value }) => {
                onChange(value);
              }}
            />
          );
        }}
        name={name}
      />
    </Field>
  );
};
